import { z } from "zod";

export const contactVariantSchema = z.object({
  key: z.string().min(1),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  link: z.string().nullable().default(null),
  linkDisplay: z.string().default(""),
  location: z.string(),
  title: z.string(),
});

export const summaryVariantSchema = z.object({
  key: z.string().min(1),
  label: z.string().default(""),
  text: z.string(),
});

export const skillCategorySchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
});

export const experienceEntrySchema = z.object({
  org: z.string(),
  location: z.string(),
  role: z.string(),
  date: z.string(),
  bullets: z.array(z.string()),
});

// Single description, no bullets — matches base.tex's Research section.
export const researchEntrySchema = z.object({
  org: z.string(),
  location: z.string(),
  role: z.string(),
  title: z.string(),
  description: z.string(),
});

// No dates/org/location — matches base.tex's Projects section.
export const projectEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
});

// Same minimal shape as projects.
export const involvementEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const educationEntrySchema = z.object({
  school: z.string(),
  location: z.string(),
  degree: z.string(),
  date: z.string(),
  gpa: z.string().optional().default(""),
  honors: z.string().optional().default(""),
  coursework: z.string().optional().default(""),
});

export const profileSchema = z.object({
  contact: z.array(contactVariantSchema).default([]),
  summary: z.array(summaryVariantSchema).default([]),
  skills: z.array(skillCategorySchema).default([]),
  experience: z.array(experienceEntrySchema).default([]),
  research: z.array(researchEntrySchema).default([]),
  projects: z.array(projectEntrySchema).default([]),
  involvement: z.array(involvementEntrySchema).default([]),
  education: z.array(educationEntrySchema).default([]),
});

export type ContactVariant = z.infer<typeof contactVariantSchema>;
export type SummaryVariant = z.infer<typeof summaryVariantSchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type ResearchEntry = z.infer<typeof researchEntrySchema>;
export type ProjectEntry = z.infer<typeof projectEntrySchema>;
export type InvolvementEntry = z.infer<typeof involvementEntrySchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type ResumeProfileData = z.infer<typeof profileSchema>;
