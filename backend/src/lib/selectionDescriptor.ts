// zod/v4, not the top-level "zod" (v3) used elsewhere in this codebase:
// @anthropic-ai/sdk's zodOutputFormat() calls the v4-only z.toJSONSchema()
// internally and throws on a v3 schema object (verified directly — v3
// throws "Cannot read properties of undefined (reading 'def')", v4 works).
// This file's only job is being the LLM structured-output contract, so it's
// scoped to v4 in isolation rather than migrating the whole app.
import { z } from "zod/v4";

const indexListOrAll = z.union([z.literal("all"), z.array(z.number().int().nonnegative())]);

export const skillSelectionSchema = z.object({
  categoryIndex: z.number().int().nonnegative(),
  itemIndices: indexListOrAll,
});

export const experienceSelectionSchema = z.object({
  index: z.number().int().nonnegative(),
  bulletIndices: indexListOrAll,
});

// Every field except contactKey (a lookup key), summary, and jobTitle (free
// text) is an index, an array of indices, or "all" — the LLM has no channel
// to inject literal factual content through this schema. jobTitle describes
// the target JOB (extracted from the job description the user provided),
// not the user's own resume content, so it carries no hallucination risk —
// it's used only to label the generated resume version consistently.
export const selectionDescriptorSchema = z.object({
  contactKey: z.string().min(1),
  summary: z.string().min(1),
  jobTitle: z.string().min(1),
  skillSelections: z.array(skillSelectionSchema).default([]),
  experienceSelections: z.array(experienceSelectionSchema).default([]),
  researchIndices: indexListOrAll.default([]),
  projectIndices: indexListOrAll.default([]),
  involvementIndices: indexListOrAll.default([]),
  educationIndices: indexListOrAll.default("all"),
});

export type IndexListOrAll = z.infer<typeof indexListOrAll>;
export type SkillSelection = z.infer<typeof skillSelectionSchema>;
export type ExperienceSelection = z.infer<typeof experienceSelectionSchema>;
export type SelectionDescriptor = z.infer<typeof selectionDescriptorSchema>;
