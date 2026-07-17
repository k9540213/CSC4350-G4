import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { selectionDescriptorSchema, SelectionDescriptor } from "./selectionDescriptor";
import { ResumeProfileData } from "./resumeSchemas";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

export class LlmGenerationError extends Error {}

const SYSTEM_PROMPT = `You are a resume tailoring assistant. You will be given a user's full resume content as JSON (the "profile") and a job description.

Your job is to select what to include in a tailored resume by returning ONLY indices into the profile's arrays — never copy, paraphrase, or invent factual content. The only field you may write freely is "summary".

CRITICAL: every non-summary value in your output must be an index, an array of indices, or the literal "all" — never a literal string, number, or object copied from the data. If you find yourself typing a string that exists in the profile (a company name, a bullet, a skill), you are doing it wrong — reference it by its position in the array instead.

Selection rules:
- skills: select only categories and items relevant to the job. Drop everything else.
- experience: select only the most relevant roles. Max 4-5 entries. Trim bullets to the 2-3 most relevant per role.
- projects: pick the 2-3 most relevant.
- research: include only if the job is related to security, policy, or research.
- involvement: include only if relevant.
- education: usually include all of it ("all"), unless clearly irrelevant.
- contactKey: pick whichever contact variant's title/framing best matches the job.
- summary: write a fresh 1-3 sentence summary tailored to the job description. This is the only field where you may write new text about the candidate.
- jobTitle: a short 2-5 word label for the role being applied to (e.g. "Security Engineer" or "Backend Engineer, Stripe"), extracted or inferred from the job description. This is metadata describing the JOB, not the candidate, and is used only to name this resume version — keep it short and consistent, no punctuation beyond a comma.`;

function buildUserPrompt(input: {
  profile: ResumeProfileData;
  jobDescription: string;
  contactVariantHint?: string;
  targetRole?: string;
}): string {
  const parts = [
    `Here is the profile:\n${JSON.stringify(input.profile, null, 2)}`,
    `Here is the job description:\n${input.jobDescription}`,
  ];
  if (input.targetRole) parts.push(`Target role (for context): ${input.targetRole}`);
  if (input.contactVariantHint) {
    parts.push(`Contact variant hint (a suggestion, not a requirement — pick whichever contact key actually fits best): ${input.contactVariantHint}`);
  }
  return parts.join("\n\n");
}

export async function generateSelectionDescriptor(input: {
  profile: ResumeProfileData;
  jobDescription: string;
  contactVariantHint?: string;
  targetRole?: string;
}): Promise<SelectionDescriptor> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    output_config: { format: zodOutputFormat(selectionDescriptorSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  if (response.stop_reason === "refusal") {
    throw new LlmGenerationError("Model declined to generate a selection for this job description.");
  }
  if (!response.parsed_output) {
    throw new LlmGenerationError("Model did not return a valid selection.");
  }

  const descriptor = response.parsed_output;

  // Semantic retry (distinct from JSON-parse failure, which structured
  // outputs already rules out): a well-formed descriptor whose contactKey
  // doesn't match any stored variant. One retry naming the valid keys, then
  // let resolveSelection's own fallback-with-warning handle it.
  const validKeys = input.profile.contact.map((c) => c.key);
  if (validKeys.length > 0 && !validKeys.includes(descriptor.contactKey)) {
    const retryResponse = await client.messages.parse({
      model: MODEL,
      max_tokens: 4096,
      output_config: { format: zodOutputFormat(selectionDescriptorSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildUserPrompt(input) },
        { role: "assistant", content: JSON.stringify(descriptor) },
        {
          role: "user",
          content: `Your contactKey "${descriptor.contactKey}" did not match any of the profile's contact keys. Valid keys are: ${validKeys.join(", ")}. Return the full selection again with a valid contactKey.`,
        },
      ],
    });
    if (retryResponse.parsed_output) {
      return retryResponse.parsed_output;
    }
  }

  return descriptor;
}
