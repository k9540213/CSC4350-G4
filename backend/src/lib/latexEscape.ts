// Ports the exact escape_latex/escape_dict logic from the user's own
// "most recent version" resume tool (not the older main.py variant, which
// also escapes backslash/braces — this one deliberately doesn't).
const ALREADY_LATEX = /\\[a-zA-Z]/;

const ESCAPE_MAP: Record<string, string> = {
  "&": "\\&",
  "%": "\\%",
  "$": "\\$",
  "#": "\\#",
  "_": "\\_",
  "~": "\\textasciitilde{}",
  "^": "\\^{}",
};

export function escapeLatex(value: string): string {
  if (ALREADY_LATEX.test(value)) return value;
  return value.replace(/[&%$#_~^]/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

export function escapeDeep<T>(value: T): T {
  if (typeof value === "string") return escapeLatex(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => escapeDeep(v)) as unknown as T;
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = escapeDeep(v);
    return out as T;
  }
  return value;
}
