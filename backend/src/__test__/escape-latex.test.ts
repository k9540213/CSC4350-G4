import { describe, it, expect } from "vitest";
import { escapeLatex, escapeDeep } from "../lib/latexEscape.ts";

describe("escapeLatex", () => {
  it("escapes special characters", () => {
    expect(escapeLatex("100% done")).toBe("100\\% done");
    expect(escapeLatex("cost & benefit")).toBe("cost \\& benefit");
    expect(escapeLatex("price: $5")).toBe("price: \\$5");
  });

  it("leaves normal text alone", () => {
    expect(escapeLatex("Software Engineer")).toBe("Software Engineer");
  });

  it("does not touch a string that already contains LaTeX", () => {
    const alreadyLatex = "\\textbf{bold text} & more";

    const result = escapeLatex(alreadyLatex);

    expect(result).toBe(alreadyLatex);
  });
});

describe("escapeDeep", () => {
  it("escapes strings nested inside an object", () => {
    const input = { role: "R&D Engineer", company: "Acme" };

    const result = escapeDeep(input);

    expect(result).toEqual({ role: "R\\&D Engineer", company: "Acme" });
  });

  it("escapes strings nested inside an array", () => {
    const input = ["50% faster", "no special chars here"];

    const result = escapeDeep(input);

    expect(result).toEqual(["50\\% faster", "no special chars here"]);
  });

  it("leaves numbers and booleans untouched", () => {
    const input = { gpa: 3.9, active: true };

    const result = escapeDeep(input);

    expect(result).toEqual({ gpa: 3.9, active: true });
  });
});
