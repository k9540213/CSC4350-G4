import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";

describe("change password", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      })
    ) as unknown as typeof fetch;
  });

  it("includes currentPassword when updating an existing password", async () => {
    await api.users.changePassword({ currentPassword: "old-pass", newPassword: "new-pass" });

    const [url, options] = (global.fetch as any).mock.calls[0];
    expect(url).toContain("/api/users/me/password");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ currentPassword: "old-pass", newPassword: "new-pass" });
  });

  it("omits currentPassword when setting a first password on a Google-only account", async () => {
    await api.users.changePassword({ newPassword: "new-pass" });

    const [url, options] = (global.fetch as any).mock.calls[0];
    expect(url).toContain("/api/users/me/password");
    expect(options.method).toBe("PATCH");
    const body = JSON.parse(options.body);
    expect(body).toEqual({ newPassword: "new-pass" });
    expect(body.currentPassword).toBeUndefined();
  });
});
