import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail, BarChart3, FileText } from "lucide-react";
import { StagePill } from "@/components/stage-pill";
import { Mono } from "@/components/mono";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pathway — Your job search, on autopilot" },
      { name: "description", content: "Pathway watches your Gmail and tracks every application from submitted to offer. Plus an AI resume workshop." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">Pathway</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/auth" className="px-3 py-1.5 text-text-secondary hover:text-foreground">Sign in</Link>
          <Link to="/auth" search={{ mode: "signup" }} className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:bg-primary/90">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1">
            <span className="size-1.5 rounded-full bg-primary-muted" />
            <Mono>Gmail-aware · Free during beta</Mono>
          </div>
          <h1 className="text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Your job search,<br />
            <span className="text-text-secondary">on autopilot.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-text-secondary">
            Pathway reads your inbox the way you wish a recruiter would — quietly logging every
            thank-you, OA invite, and interview email so you never lose track of where you stand.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Get started <ArrowRight className="size-4" />
            </Link>
            <Link to="/auth" className="inline-flex items-center rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:border-border-strong">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-20 rounded-lg border border-border bg-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <Mono dim>Pipeline preview</Mono>
            <Mono dim>11 applications</Mono>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { stage: "applied" as const, items: ["Vercel", "Plaid", "Anthropic"] },
              { stage: "oa" as const, items: ["Linear", "Datadog"] },
              { stage: "interview" as const, items: ["Stripe", "Figma", "Discord"] },
              { stage: "offer" as const, items: ["Ramp"] },
            ].map((col) => (
              <div key={col.stage} className="rounded-md bg-background/40 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <StagePill stage={col.stage} size="xs" />
                  <Mono dim>{col.items.length}</Mono>
                </div>
                <div className="space-y-2">
                  {col.items.map((c) => (
                    <div key={c} className="rounded-md border border-border bg-surface px-3 py-2.5">
                      <div className="text-sm font-medium">{c}</div>
                      <div className="mt-1"><Mono dim>2d ago</Mono></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-2xl tracking-tight">What's inside.</h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          <Feature icon={<Mail className="size-4" />} title="Automatic email tracking" body="Connect Gmail once. We detect application replies, OA invites, scheduling emails, offers, and rejections — and slot each into the right stage." />
          <Feature icon={<BarChart3 className="size-4" />} title="Analytics that matter" body="Response rate, time-to-first-response, funnel conversion. See which companies ghosted and how long each stage actually takes." />
          <Feature icon={<FileText className="size-4" />} title="AI resume workshop" body="Tailor a clean LaTeX resume to a specific application in seconds. Version history, downloadable PDFs, copilot chat." />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl border-t border-border px-6 py-8">
        <div className="flex flex-col items-start justify-between gap-3 text-sm text-text-tertiary md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Logo />
            <span>Pathway</span>
          </div>
          <Mono dim>© 2026 — Built for job seekers</Mono>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-background p-6">
      <div className="mb-4 inline-flex size-8 items-center justify-center rounded-md border border-border text-primary-muted">{icon}</div>
      <h3 className="mb-2 text-base font-medium">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{body}</p>
    </div>
  );
}

function Logo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="18" height="18" rx="5" stroke="#8366F0" strokeWidth="1.5" />
      <path d="M5 13L9 7L11 11L15 5" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
