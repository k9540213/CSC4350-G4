import { describe, it, expect } from "vitest";
import { computeStats } from "@/lib/analytics";

const sample = [
  { id: "1", stage: "applied",   ghosted: false },
  { id: "2", stage: "interview", ghosted: false },
  { id: "3", stage: "offer",     ghosted: false },
  { id: "4", stage: "applied",   ghosted: true  },
] as any;

describe("Scenario 4: analytics computation", () => {
  it("counts total applications", () => {
    expect(computeStats(sample).total).toBe(4);
  });

  it("computes response rate (past applied)", () => {
    expect(computeStats(sample).responseRate).toBe(50);
  });

  it("counts ghosted applications", () => {
    expect(computeStats(sample).ghosted).toBe(1);
  });

  it("handles an empty list without dividing by zero", () => {
    expect(computeStats([]).responseRate).toBe(0);
  });
});