import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, LayoutGrid, Rows3, X } from "lucide-react";

// ← changed: no longer importing APPLICATIONS directly
import { STAGES, daysSince, type Application, type Stage } from "@/lib/mock-data";
import { StagePill } from "@/components/stage-pill";
import { Mono } from "@/components/mono";
import { useApplications } from "@/hooks/use-applications"; // ← new
import { api } from "@/lib/api";                            // ← new
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";                           // ← new

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Pathway" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all"); // ← new
  const [selected, setSelected] = useState<Application | null>(null);
  const [isAdding, setIsAdding] = useState(false);       // ← new

  // ← changed: hook replaces APPLICATIONS + useMemo
  const { applications, loading, refetch } = useApplications({
    search: query,
    stage: stageFilter,
  });

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center gap-3 border-b border-border px-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications…"
            className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-sm outline-none focus:border-border-strong"
          />
        </div>

        {/* ← new: stage filter */}
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-border-strong"
        >
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        <div className="flex-1" />
        <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs ${view === "kanban" ? "bg-background text-foreground" : "text-text-secondary"}`}
          >
            <LayoutGrid className="size-3.5" /> Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs ${view === "table" ? "bg-background text-foreground" : "text-text-secondary"}`}
          >
            <Rows3 className="size-3.5" /> Table
          </button>
        </div>

        {/* ← changed: button now opens the form */}
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" /> Add application
        </button>
      </header>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
            Loading…
          </div>
        ) : view === "kanban" ? (
          <Kanban apps={applications} onSelect={setSelected} />
        ) : (
          <Table apps={applications} onSelect={setSelected} />
        )}
      </div>

      {selected && <Drawer app={selected} onClose={() => setSelected(null)} />}

      {/* ← new: add application dialog */}
      <AddApplicationDialog
        open={isAdding}
        onClose={() => setIsAdding(false)}
        onAdded={refetch}
      />
    </div>
  );
}

// ← new component
function AddApplicationDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    company: "",
    position: "",
    location: "",
    stage: "applied" as Stage,
    salary: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.applications.create(form);
      onAdded();
      onClose();
      setForm({ company: "", position: "", location: "", stage: "applied", salary: "", notes: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: "Company", field: "company", required: true },
            { label: "Position", field: "position", required: true },
            { label: "Location", field: "location" },
            { label: "Salary", field: "salary", placeholder: "e.g. $120k – $150k" },
          ].map(({ label, field, required, placeholder }) => (
            <div key={field}>
              <label className="text-xs text-text-secondary">{label}{required && " *"}</label>
              <input
                required={required}
                value={form[field as keyof typeof form]}
                onChange={(e) => update(field, e.target.value)}
                placeholder={placeholder}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-border-strong"
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-text-secondary">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => update("stage", e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-border-strong"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-border-strong"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add application"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function Kanban({ apps, onSelect }: { apps: Application[]; onSelect: (a: Application) => void }) {
  return (
    <div className="grid h-full grid-cols-5 gap-3 p-5">
      {STAGES.map((s) => {
        const col = apps.filter((a) => a.stage === s.id);
        return (
          <div key={s.id} className="flex min-w-0 flex-col rounded-lg border border-border bg-surface/40">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <StagePill stage={s.id as Stage} size="xs" />
              <Mono dim>{col.length}</Mono>
            </div>
            <div className="flex-1 space-y-2 overflow-auto p-2">
              {col.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong"
                  draggable
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{a.company}</div>
                      <div className="mt-0.5 truncate text-xs text-text-secondary">{a.position}</div>
                    </div>
                    {a.ghosted && <span className="size-1.5 shrink-0 rounded-full bg-stage-ghosted" title="Ghosted" />}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Mono dim>{daysSince(a.lastUpdate)}d</Mono>
                    <span className="rounded border border-border px-1.5 py-px text-[10px] uppercase tracking-wider text-text-tertiary">
                      {a.source === "email" ? "email" : "manual"}
                    </span>
                  </div>
                </button>
              ))}
              {col.length === 0 && (
                <div className="rounded-md border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-text-tertiary">Nothing here yet.</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Table({ apps, onSelect }: { apps: Application[]; onSelect: (a: Application) => void }) {
  return (
    <div className="p-5">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left">
              {["Company", "Position", "Stage", "Source", "Applied", "Last update"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} onClick={() => onSelect(a)} className="cursor-pointer border-t border-border hover:bg-surface/50">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    {a.company}
                    {a.ghosted && <span className="size-1.5 rounded-full bg-stage-ghosted" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{a.position}</td>
                <td className="px-4 py-3"><StagePill stage={a.stage} size="xs" /></td>
                <td className="px-4 py-3"><Mono dim>{a.source}</Mono></td>
                <td className="px-4 py-3"><Mono dim>{daysSince(a.appliedAt)}d ago</Mono></td>
                <td className="px-4 py-3"><Mono dim>{daysSince(a.lastUpdate)}d ago</Mono></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Drawer({ app, onClose }: { app: Application; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="flex w-[480px] flex-col border-l border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-base font-semibold">{app.company}</div>
            <div className="text-xs text-text-secondary">{app.position}</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage"><StagePill stage={app.stage} /></Field>
            <Field label="Location"><span className="text-sm">{app.location}</span></Field>
            <Field label="Salary"><span className="text-sm">{app.salary ?? "—"}</span></Field>
            <Field label="Source"><Mono dim>{app.source}</Mono></Field>
          </div>

          <div>
            <Mono dim>Timeline</Mono>
            <div className="mt-3 space-y-3 border-l border-border pl-4">
              {[...(app.timeline ?? [])].reverse().map((e) => (
                <div key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2 rounded-full border border-border bg-background" />
                  <div className="text-sm">{e.label}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Mono dim>{daysSince(e.at)}d ago</Mono>
                    <span className="text-[10px] uppercase tracking-wider text-text-tertiary">·</span>
                    <Mono dim>{e.source}</Mono>
                  </div>
                  {e.detail && <div className="mt-1 text-xs text-text-secondary">{e.detail}</div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Mono dim>Notes</Mono>
            <textarea
              defaultValue={app.notes}
              placeholder="Add notes…"
              className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-border-strong"
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1"><Mono dim>{label}</Mono></div>
      {children}
    </div>
  );
}
