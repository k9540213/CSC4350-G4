import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Send, ChevronDown, UserCog, Code2, Save } from "lucide-react";
import { Application } from "@/lib/mock-data";
import { api, ResumeVersion } from "@/lib/api";
import { Mono } from "@/components/mono";

type ChatMessage = { role: "user" | "assistant"; content: string; pending?: boolean };

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Paste a job description below and I'll draft a resume tailored to it — pulling only from what's in your Resume Profile (use \"Edit profile\" above if you haven't filled it out yet). Nothing gets invented; I only select and reorder your real experience, skills, and projects to match the role.",
};

export function Resume() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [tailorOpen, setTailorOpen] = useState(false);
  const [tailorTo, setTailorTo] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editedLatex, setEditedLatex] = useState("");
  const [isSavingLatex, setIsSavingLatex] = useState(false);
  const [latexSaved, setLatexSaved] = useState(false);

  const activeVersionData = versions.find((v) => v.id === activeVersion) ?? null;

  useEffect(() => {
    api.applications.list().then(setApplications).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadVersions() {
      setVersionsLoading(true);
      setVersionsError(null);
      try {
        const fetched = await api.resume.list();
        if (cancelled) return;
        setVersions(fetched);
        if (fetched.length > 0) setActiveVersion(fetched[fetched.length - 1].id);
      } catch (err) {
        if (!cancelled) {
          setVersionsError(err instanceof Error ? err.message : "Failed to load resume versions");
        }
      } finally {
        if (!cancelled) setVersionsLoading(false);
      }
    }

    loadVersions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeVersionData) setEditedLatex(activeVersionData.latexSource);
  }, [activeVersionData]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function doRender() {
      if (!activeVersionData) {
        setPdfUrl(null);
        return;
      }

      setIsRendering(true);
      setRenderError(null);
      try {
        const blob = await api.resume.renderPdf(activeVersionData.latexSource);
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

    doRender();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeVersionData]);

  const replaceLastMessage = (content: string) => {
    setMessages((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { role: "assistant", content };
      return copy;
    });
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const jobDescription = input;
    setInput("");
    setIsGenerating(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: jobDescription },
      {
        role: "assistant",
        content: "Reading your profile and this job description, then selecting the experience, skills, and projects that match — this takes a few seconds…",
        pending: true,
      },
    ]);

    try {
      const { warnings, ...version } = await api.resume.generate({
        jobDescription,
        targetRole: tailorTo ?? undefined,
      });
      setVersions((prev) => [...prev, version]);
      setActiveVersion(version.id);
      const warningNote =
        warnings.length > 0
          ? ` Heads up — ${warnings.length} selection${warnings.length > 1 ? "s" : ""} needed adjusting: ${warnings.join("; ")}.`
          : "";
      replaceLastMessage(
        `Done — drafted ${version.label}. Check the preview on the right; download it once it looks good, or click "Edit LaTeX" to fine-tune anything by hand.${warningNote}`,
      );
    } catch (err) {
      replaceLastMessage(`Couldn't draft a new version: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl || !activeVersion) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `resume-${activeVersion}.pdf`;
    a.click();
  };

  const handleReRender = async () => {
    setIsRendering(true);
    setRenderError(null);
    try {
      const blob = await api.resume.renderPdf(editedLatex);
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : "Failed to render PDF");
    } finally {
      setIsRendering(false);
    }
  };

  const handleSaveLatex = async () => {
    if (!activeVersion) return;
    setIsSavingLatex(true);
    try {
      const updated = await api.resume.update(activeVersion, { latexSource: editedLatex });
      setVersions((prev) => prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)));
      setLatexSaved(true);
      setTimeout(() => setLatexSaved(false), 2000);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : "Failed to save edits");
    } finally {
      setIsSavingLatex(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border px-5">
        <h1 className="text-base font-semibold tracking-tight">Resume Workshop</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/app/resume/profile"
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:border-border-strong"
          >
            <UserCog className="size-3.5 text-text-tertiary" /> Edit profile
          </Link>
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
              {applications.length === 0 && (
                <div className="px-3 py-2 text-xs text-text-tertiary">No applications yet</div>
              )}
              {applications.slice(0, 6).map((a) => (
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
                    <div className={`mt-1 text-sm leading-relaxed ${m.pending ? "animate-pulse text-text-tertiary" : "text-text-primary"}`}>
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
                placeholder="Paste the job description…"
                rows={2}
                disabled={isGenerating}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-text-tertiary disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isGenerating || !input.trim()}
                className="rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2 overflow-auto">
              {versions.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVersion(v.id)}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs ${activeVersion === v.id ? "border-primary bg-primary/10" : "border-border hover:border-border-strong"}`}
                >
                  <Mono>v{i + 1}</Mono>
                  <span className="text-text-secondary">{v.label.split("—")[1]?.trim() ?? v.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorOpen((o) => !o)}
                disabled={!activeVersion}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs disabled:opacity-40 ${editorOpen ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-border-strong"}`}
              >
                <Code2 className="size-3.5" /> Edit LaTeX
              </button>
              <button
                onClick={handleDownload}
                disabled={!pdfUrl}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:border-border-strong disabled:opacity-40"
              >
                <Download className="size-3.5" /> Download PDF
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-hidden ${editorOpen ? "grid grid-cols-2" : "flex"}`}>
            {editorOpen && (
              <div className="flex flex-col border-r border-border">
                <textarea
                  value={editedLatex}
                  onChange={(e) => setEditedLatex(e.target.value)}
                  spellCheck={false}
                  className="flex-1 resize-none bg-background p-4 font-mono text-xs leading-relaxed outline-none"
                />
                <div className="flex items-center gap-2 border-t border-border p-3">
                  <button
                    onClick={handleReRender}
                    disabled={isRendering}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:border-border-strong disabled:opacity-40"
                  >
                    {isRendering ? "Rendering…" : "Re-render"}
                  </button>
                  <button
                    onClick={handleSaveLatex}
                    disabled={isSavingLatex}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                  >
                    <Save className="size-3.5" /> {isSavingLatex ? "Saving…" : latexSaved ? "Saved!" : "Save"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto bg-background/40 p-8">
              {versionsLoading && (
                <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
                  Loading resume versions…
                </div>
              )}
              {!versionsLoading && versionsError && (
                <div className="flex h-full items-center justify-center text-sm text-red-500">
                  {versionsError}
                </div>
              )}
              {!versionsLoading && !versionsError && versions.length === 0 && (
                <div className="flex h-full items-center justify-center text-center text-sm text-text-tertiary">
                  No resume versions yet. Paste a job description in the chat to draft your first one.
                </div>
              )}
              {!versionsLoading && !versionsError && versions.length > 0 && isRendering && (
                <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
                  Rendering…
                </div>
              )}
              {!versionsLoading && renderError && (
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
    </div>
  );
}
