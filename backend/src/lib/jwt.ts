import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-prod";
const COOKIE_NAME = "token";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function signToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as { userId: string };
}

export { COOKIE_NAME, MAX_AGE };
