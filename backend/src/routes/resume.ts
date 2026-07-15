import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";

export const resumeRouter = Router();
resumeRouter.use(requireAuth);

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
