import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { encrypt } from "../lib/encrypt";

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
