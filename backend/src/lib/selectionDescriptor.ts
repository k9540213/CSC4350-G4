import { z } from "zod";

const indexListOrAll = z.union([z.literal("all"), z.array(z.number().int().nonnegative())]);

export const skillSelectionSchema = z.object({
  categoryIndex: z.number().int().nonnegative(),
  itemIndices: indexListOrAll,
});

export const experienceSelectionSchema = z.object({
  index: z.number().int().nonnegative(),
  bulletIndices: indexListOrAll,
});

// Every field except contactKey (a lookup key) and summary (free text) is an
// index, an array of indices, or "all" — the LLM has no channel to inject
// literal factual content through this schema.
export const selectionDescriptorSchema = z.object({
  contactKey: z.string().min(1),
  summary: z.string().min(1),
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
