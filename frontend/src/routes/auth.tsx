import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mono } from "@/components/mono";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Pathway" }] }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setEmailError("Enter a valid email"); return; }
    if (mode === "signup") navigate({ to: "/onboarding" });
    else navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">Pathway</span>
        </Link>
      </div>
      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <h1 className="text-2xl tracking-tight">
          {mode === "signin" ? "Welcome back." : "Create your account."}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {mode === "signin" ? "Pick up where your inbox left off." : "Two minutes. No credit card."}
        </p>

        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          <button className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-sm font-medium hover:border-border-strong">
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <Mono dim>or</Mono>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Email" error={emailError}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="you@gmail.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <button type="submit" className="mt-2 w-full rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            {mode === "signin" ? "New to Pathway?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary-muted hover:underline">
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <Mono dim>{label}</Mono>
        {error && <span className="text-[11px] text-destructive">{error}</span>}
      </div>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path fill="#4285F4" d="M15.68 8.18c0-.57-.05-1.12-.15-1.64H8v3.1h4.3a3.67 3.67 0 01-1.6 2.4v2h2.58c1.51-1.4 2.4-3.45 2.4-5.86z"/>
      <path fill="#34A853" d="M8 16c2.16 0 3.97-.72 5.28-1.95l-2.58-2c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H.87v2.07A8 8 0 008 16z"/>
      <path fill="#FBBC05" d="M3.53 9.53A4.8 4.8 0 013.27 8c0-.53.1-1.05.26-1.53V4.4H.87A8 8 0 000 8c0 1.29.31 2.51.87 3.6l2.66-2.07z"/>
      <path fill="#EA4335" d="M8 3.18c1.17 0 2.23.4 3.06 1.2L13.36 2.1A8 8 0 00.87 4.4l2.66 2.07C4.16 4.58 5.92 3.18 8 3.18z"/>
    </svg>
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
