import { useEffect, useState } from "react";
import { Download, Send, ChevronDown } from "lucide-react";
import { APPLICATIONS, CHAT_HISTORY } from "@/lib/mock-data";
import { Mono } from "@/components/mono";

export const RESUME_VERSIONS = [
  {
    id: "v4",
    label: "v4 — Stripe (Payments)",
    latex: `\\documentclass{article}
\\begin{document}
Hello World.
\\end{document}`,
  },
  {
    id: "v3",
    label: "v3 — General SWE",
    latex: `\\documentclass{article}
\\begin{document}
Placeholder resume v3.
\\end{document}`,
  },
];

export function Resume() {
  const [messages, setMessages] = useState(CHAT_HISTORY);
  const [input, setInput] = useState("");
  const [tailorOpen, setTailorOpen] = useState(false);
  const [tailorTo, setTailorTo] = useState<string | null>("Stripe — Software Engineer, Payments");
  const [activeVersion, setActiveVersion] = useState("v4");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function renderPdf() {
      setIsRendering(true);
      setRenderError(null);
      try {
        const version = RESUME_VERSIONS.find((v) => v.id === activeVersion);
        if (!version) throw new Error("No resume version selected");

        const res = await fetch("http://localhost:3000/api/resume/render-pdf", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versionId: version.id, latex: version.latex }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Render failed (${res.status}): ${text || res.statusText}`);
        }

        const blob = await res.blob();
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : "Failed to render PDF");
        }
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeVersion]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([
      ...messages,
      { role: "user", content: input },
      { role: "assistant", content: "Got it — drafting a new version now." },
    ]);
    setInput("");
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `resume-${activeVersion}.pdf`;
    a.click();
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border px-5">
        <h1 className="text-base font-semibold tracking-tight">Resume Workshop</h1>
        <div className="relative">
          <button
            onClick={() => setTailorOpen(!tailorOpen)}
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs"
          >
            <span className="text-text-secondary">Tailor to:</span>
            <span>{tailorTo ?? "Select application"}</span>
            <ChevronDown className="size-3.5 text-text-tertiary" />
          </button>
          {tailorOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-72 overflow-hidden rounded-md border border-border bg-surface">
              {APPLICATIONS.slice(0, 6).map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setTailorTo(`${a.company} — ${a.position}`);
                    setTailorOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-xs hover:bg-background"
                >
                  <div className="font-medium">{a.company}</div>
                  <div className="text-text-tertiary">{a.position}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[380px_1fr] overflow-hidden">
        <div className="flex flex-col border-r border-border">
          <div className="flex-1 space-y-4 overflow-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-md bg-primary/15 px-3 py-2 text-sm">
                    {m.content}
                  </div>
                ) : (
                  <div>
                    <Mono dim>Copilot</Mono>
                    <div className="mt-1 text-sm leading-relaxed text-text-primary">
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={send} className="border-t border-border p-3">
            <div className="flex items-end gap-2 rounded-md border border-border bg-surface p-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the role or paste a JD…"
                rows={2}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-text-tertiary"
              />
              <button
                type="submit"
                className="rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90"
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2 overflow-auto">
              {RESUME_VERSIONS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVersion(v.id)}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs ${activeVersion === v.id ? "border-primary bg-primary/10" : "border-border hover:border-border-strong"}`}
                >
                  <Mono>{v.id}</Mono>
                  <span className="text-text-secondary">{v.label.split("—")[1]?.trim()}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleDownload}
              disabled={!pdfUrl}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:border-border-strong disabled:opacity-40"
            >
              <Download className="size-3.5" /> Download PDF
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-background/40 p-8">
            {isRendering && (
              <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
                Rendering…
              </div>
            )}
            {renderError && (
              <div className="flex h-full items-center justify-center text-sm text-red-500">
                {renderError}
              </div>
            )}
            {!isRendering && !renderError && pdfUrl && (
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                title="Resume preview"
                className="h-full w-full"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Job({
  title,
  company,
  dates,
  bullets,
}: {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold">
          {title} · <span className="font-normal">{company}</span>
        </div>
        <div className="text-[11px] text-[#555]">{dates}</div>
      </div>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px] leading-snug">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
}
