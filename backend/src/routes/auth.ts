import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken, COOKIE_NAME, MAX_AGE } from "../lib/jwt";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";

export const authRouter = Router();

function makeClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function setAuthCookie(res: Response, userId: string) {
  res.cookie(COOKIE_NAME, signToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE * 1000,
  });
}

function safeUser(user: { id: string; email: string; name: string; passwordHash: string | null; gmailConnected: boolean; ghostedThresholdDays: number; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    hasPassword: Boolean(user.passwordHash),
    gmailConnected: user.gmailConnected,
    ghostedThresholdDays: user.ghostedThresholdDays,
    createdAt: user.createdAt,
  };
}

export const createAccountSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1, "Name is required"),
});

authRouter.post("/register", async (req: Request, res: Response) => {
  const parsed = createAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  setAuthCookie(res, user.id);
  res.status(201).json({ user: safeUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "This account uses Google sign-in. Continue with Google, or set a password in Settings once you're signed in." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  setAuthCookie(res, user.id);
  res.json({ user: safeUser(user) });
});

authRouter.post("/logout", requireAuth, (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(safeUser(user));
});

authRouter.get("/google", (_req: Request, res: Response) => {
  const url = makeClient().generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
  });
  res.redirect(url);
});

authRouter.get("/google/callback", async (req: Request, res: Response) => {
  const CLIENT_URL = process.env.CLIENT_URL?.split(",")[0] ?? "http://localhost:5173";
  const code = req.query.code as string;
  if (!code) {
    res.redirect(`${CLIENT_URL}/auth?error=google_failed`);
    return;
  }

  try {
    const client = makeClient();
    const { tokens } = await client.getToken(code);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload()!;

    const googleId = payload.sub;
    const email = payload.email!;
    const name = payload.name ?? email;

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      }
    } else {
      user = await prisma.user.create({
        data: { email, name, googleId },
      });
    }

    setAuthCookie(res, user.id);
    res.redirect(`${CLIENT_URL}/app/dashboard`);
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    res.redirect(`${CLIENT_URL}/auth?error=google_failed`);
  }
});
