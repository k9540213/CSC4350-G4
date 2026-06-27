import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { Mono } from "@/components/mono";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — Pathway" }] }),
  component: Settings,
});

function Settings() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [freq, setFreq] = useState("15min");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center border-b border-border px-5">
        <h1 className="text-base font-semibold tracking-tight">Settings</h1>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <Section title="Profile">
          <Row label="Name"><input defaultValue="Alex Chen" className="input" /></Row>
          <Row label="Email"><input defaultValue="alex@gmail.com" className="input" /></Row>
          <Row label="Password"><button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:border-border-strong">Change password</button></Row>
        </Section>

        <Section title="Connected accounts">
          <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-border">
              <Mail className="size-4 text-primary-muted" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Gmail</div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-[#34D399]"><Check className="size-3" />Connected</span>
                <span className="text-text-tertiary">·</span>
                <Mono dim>last synced 4m ago</Mono>
              </div>
            </div>
            <button className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-border-strong">Reconnect</button>
            <button className="rounded-md px-3 py-1.5 text-xs text-text-secondary hover:text-foreground">Disconnect</button>
          </div>
          <Row label="Scan frequency">
            <select value={freq} onChange={(e) => setFreq(e.target.value)} className="input">
              <option value="5min">Every 5 minutes</option>
              <option value="15min">Every 15 minutes</option>
              <option value="hourly">Hourly</option>
              <option value="manual">Manual only</option>
            </select>
          </Row>
        </Section>

        <Section title="Appearance">
          <Row label="Theme">
            <div className="flex gap-1 rounded-md border border-border bg-background p-0.5">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded px-3 py-1 text-xs capitalize ${theme === t ? "bg-surface text-foreground" : "text-text-secondary"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <div className="border-t border-border pt-6">
          <div className="rounded-md border border-border p-4">
            <Mono dim>Danger zone</Mono>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Delete account</div>
                <div className="mt-0.5 text-xs text-text-secondary">Removes all applications, resume versions, and revokes Gmail access.</div>
              </div>
              <button
                onClick={() => setConfirmDelete(!confirmDelete)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${confirmDelete ? "border-[#F76C6C] bg-[rgba(247,108,108,0.12)] text-[#F76C6C]" : "border-border text-text-secondary hover:border-[rgba(247,108,108,0.4)] hover:text-[#F76C6C]"}`}
              >
                {confirmDelete ? "Confirm delete" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`.input { background: var(--background); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; font-size: 13px; outline: none; min-width: 240px; color: var(--foreground); }
      .input:focus { border-color: var(--border-strong); }`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-text-secondary">{label}</div>
      {children}
    </div>
  );
}
