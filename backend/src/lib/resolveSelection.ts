import {
  ContactVariant,
  EducationEntry,
  ExperienceEntry,
  InvolvementEntry,
  ProjectEntry,
  ResearchEntry,
  ResumeProfileData,
  SkillCategory,
} from "./resumeSchemas";
import { IndexListOrAll, SelectionDescriptor } from "./selectionDescriptor";

export class ResolveSelectionError extends Error {}

export interface TemplateJob {
  contact: ContactVariant;
  summary: string;
  skills: SkillCategory[];
  experience: ExperienceEntry[];
  research: ResearchEntry[];
  projects: ProjectEntry[];
  involvement: InvolvementEntry[];
  education: EducationEntry[];
}

// Resolves "all" | number[] against an array length, preserving the given
// order (never sort — the LLM's ordering, e.g. [3,0,1], is a deliberate
// "most relevant first" choice). Out-of-range indices are dropped with a
// warning rather than throwing, so a stale/invalid selection degrades
// gracefully instead of failing the whole generation.
function resolveIndices(
  indices: IndexListOrAll,
  length: number,
  label: string,
  warnings: string[],
): number[] {
  if (indices === "all") {
    return Array.from({ length }, (_, i) => i);
  }
  const resolved: number[] = [];
  for (const i of indices) {
    if (i >= 0 && i < length) {
      resolved.push(i);
    } else {
      warnings.push(`${label} index ${i} out of range (0-${length - 1}) — skipped`);
    }
  }
  return resolved;
}

export function resolveSelection(
  profile: ResumeProfileData,
  descriptor: SelectionDescriptor,
): { job: TemplateJob; warnings: string[] } {
  const warnings: string[] = [];

  let contact = profile.contact.find((c) => c.key === descriptor.contactKey);
  if (!contact) {
    if (profile.contact.length === 0) {
      throw new ResolveSelectionError("Profile has no contact information — add at least one contact variant before generating a resume.");
    }
    warnings.push(`contactKey "${descriptor.contactKey}" did not match any contact variant — using "${profile.contact[0].key}" instead`);
    contact = profile.contact[0];
  }

  const skills: SkillCategory[] = [];
  descriptor.skillSelections.forEach((sel, i) => {
    if (sel.categoryIndex < 0 || sel.categoryIndex >= profile.skills.length) {
      warnings.push(`skillSelections[${i}].categoryIndex ${sel.categoryIndex} out of range — skipped`);
      return;
    }
    const category = profile.skills[sel.categoryIndex];
    const itemIndices = resolveIndices(sel.itemIndices, category.items.length, `skillSelections[${i}].itemIndices`, warnings);
    if (itemIndices.length === 0) return;
    skills.push({ category: category.category, items: itemIndices.map((idx) => category.items[idx]) });
  });

  const experience: ExperienceEntry[] = [];
  descriptor.experienceSelections.forEach((sel, i) => {
    if (sel.index < 0 || sel.index >= profile.experience.length) {
      warnings.push(`experienceSelections[${i}].index ${sel.index} out of range — skipped`);
      return;
    }
    const entry = profile.experience[sel.index];
    const bulletIndices = resolveIndices(sel.bulletIndices, entry.bullets.length, `experienceSelections[${i}].bulletIndices`, warnings);
    experience.push({ ...entry, bullets: bulletIndices.map((idx) => entry.bullets[idx]) });
  });

  const research = resolveIndices(descriptor.researchIndices, profile.research.length, "researchIndices", warnings)
    .map((i) => profile.research[i]);
  const projects = resolveIndices(descriptor.projectIndices, profile.projects.length, "projectIndices", warnings)
    .map((i) => profile.projects[i]);
  const involvement = resolveIndices(descriptor.involvementIndices, profile.involvement.length, "involvementIndices", warnings)
    .map((i) => profile.involvement[i]);
  const education = resolveIndices(descriptor.educationIndices, profile.education.length, "educationIndices", warnings)
    .map((i) => profile.education[i]);

  const job: TemplateJob = {
    contact,
    summary: descriptor.summary,
    skills,
    experience,
    research,
    projects,
    involvement,
    education,
  };

  return { job, warnings };
}
