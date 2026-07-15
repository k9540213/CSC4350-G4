import { vi } from "vitest";

vi.mock("@/lib/ssr-cookie", () => ({
  getIncomingCookieHeader: vi.fn(() => undefined),
}));