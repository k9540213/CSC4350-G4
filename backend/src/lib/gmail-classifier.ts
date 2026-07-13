import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import type { EmailMetadata } from "./gmail-client";

const CLASSIFY_MODEL = "claude-haiku-4-5-20251001";
const CLASSIFY_BATCH_SIZE = 25;

const stageValues = ["applied", "oa", "interview", "offer", "rejected"] as const;

export interface EmailClassification {
  messageId: string;
  isJobRelated: boolean;
  company: string | null;
  position: string | null;
  stage: (typeof stageValues)[number] | null;
  confidence: number;
}

const classificationSchema = z.array(
  z.object({
    messageId: z.string(),
    isJobRelated: z.boolean(),
    company: z.string().nullable(),
    position: z.string().nullable(),
    stage: z.enum(stageValues).nullable(),
    confidence: z.number().min(0).max(1),
  })
);

// Tool use (function calling), not free-text JSON: Claude returns an
// already-structured tool_use.input object matching this schema, instead of
// text we then have to scrape for a JSON blob. This eliminates the "wrapped
// in a markdown fence" / "trailing commentary" failure mode entirely, rather
// than just working around it after the fact.
const CLASSIFY_TOOL: Anthropic.Tool = {
  name: "submit_classifications",
  description: "Submit a job-application classification for each input email, in the same order given.",
  input_schema: {
    type: "object",
    properties: {
      classifications: {
        type: "array",
        items: {
          type: "object",
          properties: {
            messageId: { type: "string" },
            isJobRelated: { type: "boolean" },
            company: { type: ["string", "null"] },
            position: { type: ["string", "null"] },
            stage: { type: ["string", "null"], enum: [...stageValues, null] },
            confidence: { type: "number" },
          },
          required: ["messageId", "isJobRelated", "company", "position", "stage", "confidence"],
        },
      },
    },
    required: ["classifications"],
  },
};

// Static across every call — this is exactly the kind of fixed prefix prompt
// caching is for. The example also grounds the model the same way a
// few-shot example would for plain-text prompting.
const SYSTEM_PROMPT = `You are classifying emails as job-application-related or not, for a job application tracker.

For each email, decide:
- isJobRelated: true only if this email is genuinely about a specific job application (a submitted application, an online assessment, an interview invite/scheduling, an offer, or a rejection). Newsletters, job alerts/listings, promotions, and unrelated personal email are NOT job-related.
- company: the hiring company's name, or null if not job-related or not determinable.
- position: the job title/position, or null if not job-related or not determinable.
- stage: one of "applied", "oa", "interview", "offer", "rejected" if determinable, otherwise null. Use "oa" for online assessments/coding challenges/take-home tests.
- confidence: a number from 0 to 1.

If isJobRelated is false, company/position/stage must all be null.

Call the submit_classifications tool exactly once, with one classification object per input email, in the same order as given.

Example: given an email with subject "Your interview with Acme Corp", from "recruiting@acme.com", snippet "We're excited to move you to the onsite interview stage for the Software Engineer role.", the correct classification is {"messageId": "<its id>", "isJobRelated": true, "company": "Acme Corp", "position": "Software Engineer", "stage": "interview", "confidence": 0.95}.`;

function buildUserPrompt(emails: EmailMetadata[]): string {
  const numbered = emails.map((e, i) => ({
    index: i,
    messageId: e.id,
    subject: e.subject,
    from: e.from,
    date: e.date.toISOString(),
    snippet: e.snippet,
  }));
  return `Classify these ${emails.length} emails:\n\n${JSON.stringify(numbered, null, 2)}`;
}

function failOpenBatch(emails: EmailMetadata[]): EmailClassification[] {
  return emails.map((e) => ({
    messageId: e.id,
    isJobRelated: false,
    company: null,
    position: null,
    stage: null,
    confidence: 0,
  }));
}

export interface BatchResult {
  classifications: EmailClassification[];
  // true only when the Claude call itself errored (auth, network, malformed
  // response) — distinct from a normal isJobRelated:false classification.
  // classifyAllEmails uses this to tell "occasional bad batch" (fine, fail
  // that batch open) apart from "every batch is failing" (a systemic problem
  // like a bad API key, which should surface as a real scan failure instead
  // of silently completing with zero results).
  failed: boolean;
}

export async function classifyEmailBatch(
  client: Anthropic,
  emails: EmailMetadata[]
): Promise<BatchResult> {
  if (emails.length === 0) return { classifications: [], failed: false };

  console.log(`[gmail-classifier] classifying batch of ${emails.length} email(s) with ${CLASSIFY_MODEL}`);

  try {
    const response = await client.messages.create({
      model: CLASSIFY_MODEL,
      max_tokens: 2048,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [CLASSIFY_TOOL],
      tool_choice: { type: "tool", name: "submit_classifications" },
      messages: [{ role: "user", content: buildUserPrompt(emails) }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Claude did not return a tool_use block");
    }

    const parsed = classificationSchema.parse((toolUse.input as { classifications: unknown }).classifications);

    // Defensive: make sure every input email got a classification back, even
    // if Claude dropped or reordered one — fail that single email open rather
    // than the whole batch.
    const byId = new Map(parsed.map((c) => [c.messageId, c]));
    const classifications = emails.map((e) => byId.get(e.id) ?? failOpenBatch([e])[0]);
    console.log(`[gmail-classifier] batch succeeded: ${classifications.filter((c) => c.isJobRelated).length}/${classifications.length} job-related`);
    return { classifications, failed: false };
  } catch (err) {
    console.error("[gmail-classifier] batch call failed, failing this batch open:", err);
    return { classifications: failOpenBatch(emails), failed: true };
  }
}

export async function classifyAllEmails(
  client: Anthropic,
  emails: EmailMetadata[],
  onProgress?: (processed: number, total: number) => Promise<void>
): Promise<EmailClassification[]> {
  const results: EmailClassification[] = [];
  let totalBatches = 0;
  let failedBatches = 0;

  for (let i = 0; i < emails.length; i += CLASSIFY_BATCH_SIZE) {
    const batch = emails.slice(i, i + CLASSIFY_BATCH_SIZE);
    totalBatches++;
    const { classifications, failed } = await classifyEmailBatch(client, batch);
    if (failed) failedBatches++;
    results.push(...classifications);

    if (onProgress) {
      await onProgress(results.length, emails.length);
    }
  }

  if (totalBatches > 0 && failedBatches === totalBatches) {
    throw new Error(
      `All ${totalBatches} classification batch(es) failed — check ANTHROPIC_API_KEY and Claude API connectivity rather than trusting the "0 results" this would otherwise silently report.`
    );
  }

  if (failedBatches > 0) {
    console.warn(`[gmail-classifier] ${failedBatches}/${totalBatches} batches failed and were skipped (failed open)`);
  }

  return results;
}
