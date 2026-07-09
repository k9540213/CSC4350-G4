import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";

describe("Scenario 3: add a new application", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: "99", company: "Google", position: "SWE Intern",
          stage: "applied",
        }),
      })
    ) as unknown as typeof fetch;
  });

  it("posts the new application payload", async () => {
    const payload = {
      company: "Google",
      position: "SWE Intern",
      stage: "applied",
    };
    const created = await api.applications.create(payload);

    const [url, options] = (global.fetch as any).mock.calls[0];
    expect(url).toContain("/api/applications");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toMatchObject(payload);
    expect(created.id).toBe("99");
  });
});