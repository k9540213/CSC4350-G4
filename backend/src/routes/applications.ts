import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);

const stageEnum = z.enum(["applied", "oa", "interview", "offer", "rejected", "ghosted"]);

const createSchema = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  location: z.string().optional(),
  stage: stageEnum.default("applied"),
  appliedAt: z.string().datetime().optional(),
  salary: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  company: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  location: z.string().optional(),
  stage: stageEnum.optional(),
  salary: z.string().optional(),
  notes: z.string().optional(),
});

applicationsRouter.get("/", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const { search, stage, source } = req.query;

  const applications = await prisma.application.findMany({
    where: {
      userId,
      ...(stage ? { stage: stage as any } : {}),
      ...(source ? { source: source as any } : {}),
      ...(search
        ? {
            OR: [
              { company: { contains: search as string, mode: "insensitive" } },
              { position: { contains: search as string, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { lastUpdate: "desc" },
    select: {
      id: true,
      company: true,
      position: true,
      location: true,
      stage: true,
      source: true,
      appliedAt: true,
      lastUpdate: true,
      salary: true,
      ghosted: true,
    },
  });

  res.json(applications);
});

applicationsRouter.post("/", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { company, position, location, stage, appliedAt, salary, notes } = parsed.data;

  const application = await prisma.application.create({
    data: {
      userId,
      company,
      position,
      location,
      stage,
      source: "manual",
      appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
      salary,
      notes,
      statusEvents: {
        create: {
          type: "applied",
          label: "Applied",
          source: "manual",
        },
      },
    },
    include: { statusEvents: true },
  });

  res.status(201).json(application);
});

applicationsRouter.get("/:id", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: { statusEvents: { orderBy: { createdAt: "asc" } } },
  });

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (application.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(application);
});

applicationsRouter.patch("/:id", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const existing = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (existing.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const application = await prisma.application.update({
    where: { id: req.params.id },
    data: { ...parsed.data, lastUpdate: new Date() },
    include: { statusEvents: { orderBy: { createdAt: "asc" } } },
  });

  res.json(application);
});

applicationsRouter.delete("/:id", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;

  const existing = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (existing.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await prisma.application.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
