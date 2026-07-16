import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { profileSchema } from "../lib/resumeSchemas";
import { generateSelectionDescriptor, LlmGenerationError } from "../lib/llm";
import { resolveSelection, ResolveSelectionError } from "../lib/resolveSelection";
import { escapeDeep } from "../lib/latexEscape";
import { renderResumeTemplate } from "../lib/latexTemplate";

export const resumeRouter = Router();
resumeRouter.use(requireAuth);

const createSchema = z.object({
  label: z.string().min(1),
  latexSource: z.string().min(1),
  targetRole: z.string().optional(),
});

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  latexSource: z.string().min(1).optional(),
  targetRole: z.string().optional(),
});

const generateSchema = z.object({
  jobDescription: z.string().min(1),
  targetRole: z.string().optional(),
  contactVariantHint: z.string().optional(),
  label: z.string().optional(),
});

const EMPTY_PROFILE = {
  id: null,
  contact: [],
  summary: [],
  skills: [],
  experience: [],
  research: [],
  projects: [],
  involvement: [],
  education: [],
  updatedAt: null,
};

resumeRouter.get("/profile", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const profile = await prisma.resumeProfile.findUnique({ where: { userId } });
  res.json(profile ?? EMPTY_PROFILE);
});

resumeRouter.put("/profile", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const profile = await prisma.resumeProfile.upsert({
    where: { userId },
    create: { userId, ...parsed.data },
    update: { ...parsed.data },
  });
  res.json(profile);
});

async function getVersionForUser(id: string, userId: string, res: Response) {
  const version = await prisma.resumeVersion.findUnique({ where: { id } });
  if (!version) {
    res.status(404).json({ error: "Resume version not found" });
    return null;
  }
  if (version.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return version;
}

resumeRouter.get("/", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const versions = await prisma.resumeVersion.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  res.json(versions);
});

resumeRouter.post("/", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const version = await prisma.resumeVersion.create({
    data: { userId, ...parsed.data },
  });
  res.status(201).json(version);
});

resumeRouter.patch("/:id", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const existing = await getVersionForUser(req.params.id, userId, res);
  if (!existing) return;

  const version = await prisma.resumeVersion.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(version);
});

resumeRouter.delete("/:id", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const existing = await getVersionForUser(req.params.id, userId, res);
  if (!existing) return;

  await prisma.resumeVersion.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

resumeRouter.post("/generate", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { jobDescription, targetRole, contactVariantHint, label } = parsed.data;

  const profileRow = await prisma.resumeProfile.findUnique({ where: { userId } });
  const profile = profileSchema.parse(profileRow ?? {});
  const isEmpty = Object.values(profile).every((section) => Array.isArray(section) && section.length === 0);
  if (isEmpty) {
    res.status(422).json({ error: "Complete your resume profile before generating a tailored resume." });
    return;
  }

  let descriptor;
  try {
    descriptor = await generateSelectionDescriptor({ profile, jobDescription, contactVariantHint, targetRole });
  } catch (err) {
    if (err instanceof LlmGenerationError) {
      res.status(502).json({ error: err.message });
      return;
    }
    throw err;
  }

  let job, warnings;
  try {
    ({ job, warnings } = resolveSelection(profile, descriptor));
  } catch (err) {
    if (err instanceof ResolveSelectionError) {
      res.status(422).json({ error: err.message });
      return;
    }
    throw err;
  }

  const escapedJob = escapeDeep(job);
  const latexSource = renderResumeTemplate(escapedJob);

  const count = await prisma.resumeVersion.count({ where: { userId } });
  const version = await prisma.resumeVersion.create({
    data: {
      userId,
      label: label ?? `v${count + 1} — ${targetRole ?? "Tailored"}`,
      latexSource,
      targetRole,
      jobDescription,
      selectionDescriptor: descriptor,
    },
  });

  res.status(201).json({ ...version, warnings });
});

const renderSchema = z.object({
  latex: z.string().min(1),
});

resumeRouter.post("/render-pdf", async (req: Request, res: Response) => {
  const parsed = renderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const compileRes = await fetch("https://latex.ytotech.com/builds/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler: "pdflatex",
        resources: [{ main: true, content: parsed.data.latex }],
      }),
    });

    if (!compileRes.ok) {
      const errText = await compileRes.text();
      console.error("LaTeX compile error:", errText);
      res.status(422).json({ error: "Failed to compile LaTeX to PDF" });
      return;
    }

    const pdfBuffer = Buffer.from(await compileRes.arrayBuffer());
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reach LaTeX compile service" });
  }
});
