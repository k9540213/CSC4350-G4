import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { Mono } from "@/components/mono";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up — Pathway" }] }),
  component: Onboarding,
});

function Onboarding() {
  const [step, setStep] = useState<1 | 2>(1);
  const [connected, setConnected] = useState(false);
  const [depth, setDepth] = useState("100");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="size-2 rounded-sm bg-primary" /> Pathway
          </Link>
          <div className="flex items-center gap-2">
            <Mono dim>Step {step} of 2</Mono>
            <div className="flex gap-1">
              <div className={`h-0.5 w-8 ${step >= 1 ? "bg-primary" : "bg-border"}`} />
              <div className={`h-0.5 w-8 ${step >= 2 ? "bg-primary" : "bg-border"}`} />
            </div>
          </div>
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-3xl tracking-tight">Connect your Gmail.</h1>
            <p className="mt-3 text-text-secondary">
              Pathway reads only application-related emails — never personal threads. You can disconnect any time.
            </p>

            <div className="mt-8 rounded-lg border border-border bg-surface p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 items-center justify-center rounded-md border border-border bg-background">
                  <Mail className="size-4 text-primary-muted" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Gmail</div>
                  <p className="mt-1 text-sm text-text-secondary">
                    We'll scan for thank-you replies, OA invites, interview scheduling, offers, and rejections.
                  </p>
                </div>
                {connected ? (
                  <div className="flex items-center gap-2 rounded-md bg-[rgba(52,211,153,0.12)] px-3 py-1.5 text-sm text-[#34D399]">
                    <Check className="size-4" /> Connected
                  </div>
                ) : (
                  <button
                    onClick={() => setConnected(true)}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => navigate({ to: "/app/dashboard" })} className="text-sm text-text-secondary hover:text-foreground">
                Skip for now
              </button>
              <button
                disabled={!connected}
                onClick={() => setStep(2)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-3xl tracking-tight">Calibrate your inbox scan.</h1>
            <p className="mt-3 text-text-secondary">
              How far back should we look on first sync? Calibration helps us learn what an "application email" looks like for you before going forward.
            </p>

            <div className="mt-8 space-y-2">
              {[
                { v: "50", label: "Last 50 emails", hint: "Fastest. Good if you just started searching." },
                { v: "100", label: "Last 100 emails", hint: "Recommended for most people." },
                { v: "200", label: "Last 200 emails", hint: "Most thorough. May take ~2 minutes." },
              ].map((o) => (
                <label key={o.v} className={`flex cursor-pointer items-start gap-3 rounded-md border bg-surface p-4 ${depth === o.v ? "border-primary" : "border-border hover:border-border-strong"}`}>
                  <input type="radio" name="d" value={o.v} checked={depth === o.v} onChange={() => setDepth(o.v)} className="mt-1 accent-[#8366F0]" />
                  <div>
                    <div className="text-sm font-medium">{o.label}</div>
                    <div className="mt-0.5 text-sm text-text-secondary">{o.hint}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-sm text-text-secondary hover:text-foreground">Back</button>
              <button onClick={() => navigate({ to: "/app/dashboard" })} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Start scanning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
