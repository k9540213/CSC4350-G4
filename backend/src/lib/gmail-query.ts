// Stage A of the Gmail scan pipeline: a free, deterministic Gmail-side search
// query that narrows the inbox down to likely job-related candidates before
// anything reaches an LLM. Pure string-building, no network calls, so it's
// unit-testable on its own.

// Known ATS/recruiting platforms. A supplementary booster, not the primary
// signal — most direct-apply companies use their own domain, which can't be
// enumerated here.
export const ATS_SENDER_DOMAINS = [
  "greenhouse.io",
  "lever.co",
  "myworkday.com",
  "icims.com",
  "smartrecruiters.com",
  "ashbyhq.com",
  "jobvite.com",
  "workable.com",
  "breezy.hr",
  "linkedin.com",
  "indeed.com",
  "hackerrank.com",
  "codesignal.com",
  "karat.com",
  "hirevue.com",
  "calendly.com",
];

// Gmail's `from:` operator matches substrings anywhere in the From header
// (address or display name), not just exact domains, so this generalizes to
// a company's own in-house hiring mailbox regardless of which domain it's on.
export const GENERIC_CAREER_SENDER_PATTERNS = [
  "careers",
  "recruiting",
  "talent",
  "jobs",
  "hr",
  "noreply",
];

// Subject/body keywords. Domain-agnostic like the sender patterns above —
// this is the signal that generalizes to arbitrary direct-apply companies.
export const JOB_KEYWORDS = [
  "application",
  "interview",
  "assessment",
  "offer",
  "recruiter",
  "position",
  "OA",
  "onsite",
  "thank you for applying",
  "next steps",
  "phone screen",
  "coding challenge",
  "take-home",
];

const EXCLUSIONS = "-category:promotions -category:social -in:spam -in:trash -in:sent -in:drafts";

function quoteIfPhrase(term: string): string {
  return term.includes(" ") ? `"${term}"` : term;
}

function formatGmailDate(date: Date): string {
  // Gmail's after:/before: operators are date-precision (YYYY/MM/DD), not
  // time-of-day precision. That means a same-day resync can occasionally
  // re-fetch a handful of already-seen messages from earlier that day —
  // gmail-matcher.ts guards against turning those into duplicate StatusEvents.
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

export function buildStageAQuery(opts?: { after?: Date }): string {
  const fromClause = `from:(${[...ATS_SENDER_DOMAINS, ...GENERIC_CAREER_SENDER_PATTERNS].join(" OR ")})`;
  const keywordClause = `(${JOB_KEYWORDS.map(quoteIfPhrase).join(" OR ")})`;

  let query = `(${fromClause} OR ${keywordClause}) ${EXCLUSIONS}`;
  if (opts?.after) {
    query += ` after:${formatGmailDate(opts.after)}`;
  }
  return query;
}
