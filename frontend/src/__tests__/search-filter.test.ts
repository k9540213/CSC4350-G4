import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";

describe("Scenario 1: search applications by company", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: "1", company: "Stripe", position: "SWE" },
        ]),
      })
    ) as unknown as typeof fetch;
  });

  it("sends the search term as a query param", async () => {
    await api.applications.list({ search: "Stripe" });

    expect(global.fetch).toHaveBeenCalledOnce();
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain("search=Stripe");
  });

  it("returns only the matching application", async () => {
    const result = await api.applications.list({ search: "Stripe" });
    expect(result).toHaveLength(1);
    expect(result[0].company).toBe("Stripe");
  });
});