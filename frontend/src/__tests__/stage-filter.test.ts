import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";

describe("Scenario 2: filter applications by stage", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;
  });

  it("includes the stage in the query when selected", async () => {
    await api.applications.list({ stage: "interview" });
    const url = (global.fetch as any).mock.calls[0][0];
    expect(url).toContain("stage=interview");
  });

  it("omits the stage param when set to all", async () => {
    await api.applications.list({ stage: "all" });
    const url = (global.fetch as any).mock.calls[0][0];
    expect(url).not.toContain("stage=");
  });
});