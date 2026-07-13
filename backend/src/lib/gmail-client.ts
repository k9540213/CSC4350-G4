import { google, gmail_v1 } from "googleapis";
import { decrypt } from "./encrypt";
import { buildStageAQuery } from "./gmail-query";

export interface EmailMetadata {
  id: string;
  subject: string;
  from: string;
  date: Date;
  snippet: string;
}

export function getAuthorizedGmailClient(refreshTokenEncrypted: string): gmail_v1.Gmail {
  // Use googleapis's own bundled OAuth2 client here (not the standalone
  // google-auth-library one used elsewhere for the login/Gmail-connect
  // handshake) — googleapis vendors its own copy, and the two are not
  // structurally interchangeable for google.gmail({ auth }).
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
  auth.setCredentials({ refresh_token: decrypt(refreshTokenEncrypted) });
  return google.gmail({ version: "v1", auth });
}

export async function searchCandidateMessageIds(
  client: gmail_v1.Gmail,
  opts: { maxResults: number; after?: Date }
): Promise<string[]> {
  const q = buildStageAQuery({ after: opts.after });
  console.log(`[gmail-client] searching with query: ${q}`);
  const res = await client.users.messages.list({
    userId: "me",
    q,
    maxResults: opts.maxResults,
  });
  const ids = (res.data.messages ?? []).map((m) => m.id!).filter(Boolean);
  console.log(`[gmail-client] Gmail returned ${ids.length} message id(s)`);
  return ids;
}

function headerValue(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

async function fetchMessageMetadata(client: gmail_v1.Gmail, messageId: string): Promise<EmailMetadata> {
  const res = await client.users.messages.get({
    userId: "me",
    id: messageId,
    format: "metadata",
    metadataHeaders: ["Subject", "From", "Date"],
  });

  const headers = res.data.payload?.headers;
  const dateHeader = headerValue(headers, "Date");

  return {
    id: messageId,
    subject: headerValue(headers, "Subject"),
    from: headerValue(headers, "From"),
    date: dateHeader ? new Date(dateHeader) : new Date(),
    snippet: res.data.snippet ?? "",
  };
}

const FETCH_CONCURRENCY = 10;

// Chunked, tolerant of individual message-fetch failures — one bad message
// shouldn't sink the whole scan.
export async function fetchMessagesMetadataBatch(
  client: gmail_v1.Gmail,
  messageIds: string[]
): Promise<EmailMetadata[]> {
  const results: EmailMetadata[] = [];

  for (let i = 0; i < messageIds.length; i += FETCH_CONCURRENCY) {
    const chunk = messageIds.slice(i, i + FETCH_CONCURRENCY);
    const settled = await Promise.allSettled(chunk.map((id) => fetchMessageMetadata(client, id)));

    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
      } else {
        console.error("Gmail message fetch failed:", outcome.reason);
      }
    }
  }

  return results;
}
