import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateAt, removeAt } from "./array-helpers";

describe("updateAt", () => {
  it("replaces the item at that index", () => {
    const skills = ["Python", "Java", "Go"];

    const result = updateAt(skills, 1, "TypeScript");

    expect(result).toEqual(["Python", "TypeScript", "Go"]);
  });

  it("does not change the original array", () => {
    const skills = ["Python", "Java", "Go"];

    updateAt(skills, 1, "TypeScript");

    expect(skills).toEqual(["Python", "Java", "Go"]);
  });
});

describe("removeAt", () => {
  it("removes the item at that index", () => {
    const skills = ["Python", "Java", "Go"];

    const result = removeAt(skills, 1);

    expect(result).toEqual(["Python", "Go"]);
  });
});
