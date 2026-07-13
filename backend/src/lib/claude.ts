import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

export function getClaudeClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Claude has no native JSON-mode, so responses sometimes come wrapped in a
// markdown code fence or have leading/trailing prose. Pull out the first
// JSON array/object found in the text rather than assuming an exact match.
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error("No JSON found in Claude response");
  return JSON.parse(candidate.slice(start).trim());
}
