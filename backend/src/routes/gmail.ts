import { Router, Request, Response } from "express";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { encrypt } from "../lib/encrypt";
import { runGmailScan } from "../lib/gmail-scan";

export const gmailRouter = Router();
gmailRouter.use(requireAuth);

const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

function getGmailClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
}

gmailRouter.get("/connect", (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const client = getGmailClient();

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent",
    state: userId,
  });

  res.redirect(url);
});

gmailRouter.get("/callback", async (req: Request, res: Response) => {
  const { code, state: userId } = req.query as { code: string; state: string };
  const CLIENT_URL = process.env.CLIENT_URL?.split(",")[0] ?? "http://localhost:5173";

  if (!code || !userId) {
    res.redirect(`${CLIENT_URL}/onboarding?error=gmail_failed`);
    return;
  }

  try {
    const client = getGmailClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      res.redirect(`${CLIENT_URL}/onboarding?error=no_refresh_token`);
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        gmailConnected: true,
        gmailRefreshToken: encrypt(tokens.refresh_token),
      },
    });

    res.redirect(`${CLIENT_URL}/onboarding?gmailConnected=true`);
  } catch {
    res.redirect(`${CLIENT_URL}/onboarding?error=gmail_failed`);
  }
});

gmailRouter.delete("/disconnect", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;

  await prisma.user.update({
    where: { id: userId },
    data: {
      gmailConnected: false,
      gmailRefreshToken: null,
      gmailLastScannedAt: null,
    },
  });

  res.json({ ok: true });
});

const scanSchema = z.object({
  depth: z.enum(["50", "100", "150"]).transform(Number).optional(),
});

gmailRouter.post("/scan", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  console.log(`[gmail-route] POST /scan hit for user ${userId}, body=${JSON.stringify(req.body)}`);

  const parsed = scanSchema.safeParse(req.body);
  if (!parsed.success) {
    console.log(`[gmail-route] rejected: ${parsed.error.issues[0].message}`);
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.gmailConnected || !user.gmailRefreshToken) {
    console.log(`[gmail-route] rejected: Gmail not connected for ${userId}`);
    res.status(400).json({ error: "Gmail is not connected" });
    return;
  }

  const isCalibration = !user.gmailLastScannedAt;
  if (isCalibration && !parsed.data.depth) {
    console.log(`[gmail-route] rejected: depth required for initial scan (${userId})`);
    res.status(400).json({ error: "depth is required for the initial scan" });
    return;
  }

  if (user.scanStatus === "running") {
    console.log(`[gmail-route] rejected: scan already running for ${userId}`);
    res.status(409).json({ error: "A scan is already in progress" });
    return;
  }

  console.log(`[gmail-route] launching runGmailScan for ${userId} (calibration=${isCalibration}, depth=${parsed.data.depth ?? "n/a"})`);

  // Fire-and-forget: runGmailScan persists its own progress/status/errors to
  // the User row, and its own top-level try/catch already prevents an
  // unhandled rejection — this .catch is defensive belt-and-suspenders.
  runGmailScan(userId, parsed.data.depth).catch((err) => {
    console.error("[gmail-route] Unexpected error escaping runGmailScan:", err);
  });

  res.status(202).json({ status: "running" });
});

gmailRouter.get("/scan/status", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    status: user.scanStatus,
    processed: user.scanProcessed,
    total: user.scanTotal,
    created: user.scanCreated,
    updated: user.scanUpdated,
    error: user.scanError,
    lastScannedAt: user.gmailLastScannedAt,
  });
});
