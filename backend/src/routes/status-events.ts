import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";

export const statusEventsRouter = Router();
statusEventsRouter.use(requireAuth);

const createEventSchema = z.object({
  type: z.enum(["applied", "oa", "interview", "offer", "rejected", "note", "email"]),
  label: z.string().min(1),
  detail: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

async function getApplicationForUser(appId: string, userId: string, res: Response) {
  const app = await prisma.application.findUnique({ where: { id: appId } });
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return null;
  }
  if (app.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return app;
}

statusEventsRouter.get("/:id/events", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const app = await getApplicationForUser(req.params.id, userId, res);
  if (!app) return;

  const events = await prisma.statusEvent.findMany({
    where: { applicationId: req.params.id },
    orderBy: { createdAt: "asc" },
  });

  res.json(events);
});

statusEventsRouter.post("/:id/events", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const app = await getApplicationForUser(req.params.id, userId, res);
  if (!app) return;

  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { type, label, detail, createdAt } = parsed.data;

  const [event] = await prisma.$transaction([
    prisma.statusEvent.create({
      data: {
        applicationId: req.params.id,
        type,
        label,
        source: "manual",
        detail,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      },
    }),
    prisma.application.update({
      where: { id: req.params.id },
      data: { lastUpdate: new Date() },
    }),
  ]);

  res.status(201).json(event);
});

statusEventsRouter.delete("/:id/events/:eventId", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const app = await getApplicationForUser(req.params.id, userId, res);
  if (!app) return;

  const event = await prisma.statusEvent.findUnique({ where: { id: req.params.eventId } });
  if (!event || event.applicationId !== req.params.id) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.source !== "manual") {
    res.status(403).json({ error: "Email-sourced events cannot be deleted" });
    return;
  }

  await prisma.statusEvent.delete({ where: { id: req.params.eventId } });
  res.json({ ok: true });
});
