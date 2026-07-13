import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, AlertCircle } from "lucide-react";
import { Mono } from "@/components/mono";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — Pathway" }] }),
  component: Settings,
});

function Settings() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: api.auth.me,
    staleTime: 5 * 60 * 1000,
  });

  const [name, setName] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const disconnectGmail = useMutation({
    mutationFn: api.gmail.disconnect,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  const [syncTriggerError, setSyncTriggerError] = useState("");

  const { data: scanStatus } = useQuery({
    queryKey: ["gmail-scan-status"],
    queryFn: api.gmail.scanStatus,
    enabled: user?.gmailConnected === true,
    refetchInterval: (query) => (query.state.data?.status === "running" ? 1500 : false),
  });

  const syncNow = async () => {
    setSyncTriggerError("");
    try {
      // If this account has never completed a scan (e.g. onboarding was
      // skipped), this is a first-ever scan and needs a depth; otherwise
      // the backend treats it as a resync and ignores depth entirely.
      const needsDepth = !scanStatus?.lastScannedAt;
      await api.gmail.scan(needsDepth ? 100 : undefined);
      queryClient.invalidateQueries({ queryKey: ["gmail-scan-status"] });
    } catch (err) {
      setSyncTriggerError(err instanceof Error ? err.message : "Failed to start sync.");
    }
  };

  // Sync name field once user loads
  useState(() => { if (user) setName(user.name); });

  const updateProfile = useMutation({
    mutationFn: (data: { name: string }) =>
      api.users.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    },
  });

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword?: string; newPassword: string }) =>
      api.users.changePassword(data),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setPasswordError("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    },
    onError: (err: Error) => setPasswordError(err.message),
  });

  const deleteAccount = useMutation({
    mutationFn: api.users.deleteMe,
    onSuccess: () => {
      queryClient.clear();
      router.navigate({ to: "/auth" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Mono dim>Loading…</Mono>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center border-b border-border px-5">
        <h1 className="text-base font-semibold tracking-tight">Settings</h1>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <Section title="Profile">
          <Row label="Name">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Row>
          <Row label="Email">
            <input className="input" value={user?.email ?? ""} disabled />
          </Row>
          <Row label="">
            <button
              onClick={() => updateProfile.mutate({ name })}
              disabled={updateProfile.isPending || name === user?.name}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {updateProfile.isPending ? "Saving…" : profileSaved ? "Saved!" : "Save changes"}
            </button>
          </Row>
        </Section>

        <Section title={user?.hasPassword ? "Change password" : "Set a password"}>
          {!user?.hasPassword && (
            <p className="text-xs text-text-secondary">
              Your account currently signs in with Google only. Set a password below to also be able to sign in with email and password.
            </p>
          )}
          {user?.hasPassword && (
            <Row label="Current password">
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); }}
                placeholder="••••••••"
              />
            </Row>
          )}
          <Row label="New password">
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
              placeholder="••••••••"
            />
          </Row>
          {passwordError && (
            <p className="text-xs text-destructive">{passwordError}</p>
          )}
          <Row label="">
            <button
              onClick={() =>
                changePassword.mutate(
                  user?.hasPassword ? { currentPassword, newPassword } : { newPassword }
                )
              }
              disabled={changePassword.isPending || (user?.hasPassword && !currentPassword) || !newPassword}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-border-strong disabled:opacity-40"
            >
              {changePassword.isPending
                ? "Saving…"
                : passwordSaved
                ? "Password saved!"
                : user?.hasPassword
                ? "Update password"
                : "Set password"}
            </button>
          </Row>
        </Section>

        <Section title="Connected accounts">
          <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-border">
              <Mail className="size-4 text-primary-muted" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Gmail</div>
              <div className="mt-0.5 text-[11px] text-text-secondary">
                {user?.gmailConnected ? (
                  <span className="text-[#34D399]">Connected</span>
                ) : (
                  <span className="text-text-tertiary">Not connected</span>
                )}
                {user?.gmailConnected && scanStatus?.lastScannedAt && (
                  <span> · last synced {timeAgo(scanStatus.lastScannedAt)}</span>
                )}
              </div>
            </div>
            {user?.gmailConnected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={syncNow}
                  disabled={scanStatus?.status === "running"}
                  className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-border-strong disabled:opacity-50"
                >
                  {scanStatus?.status === "running" ? "Syncing…" : "Sync now"}
                </button>
                <button
                  onClick={() => disconnectGmail.mutate()}
                  disabled={disconnectGmail.isPending}
                  className="rounded-md px-3 py-1.5 text-xs text-text-secondary hover:text-foreground disabled:opacity-50"
                >
                  {disconnectGmail.isPending ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            ) : (
              <a
                href={api.gmail.connectUrl()}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-border-strong"
              >
                Connect Gmail
              </a>
            )}
          </div>

          {user?.gmailConnected && scanStatus?.status === "running" && (
            <div className="rounded-md border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Scanning your inbox…</span>
                <Mono dim>{scanStatus.processed} / {scanStatus.total || "…"}</Mono>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: scanStatus.total ? `${(scanStatus.processed / scanStatus.total) * 100}%` : "10%" }}
                />
              </div>
            </div>
          )}

          {user?.gmailConnected && scanStatus?.status === "completed" && (
            <p className="text-xs text-text-secondary">
              Last sync found {scanStatus.created} new application{scanStatus.created === 1 ? "" : "s"} and updated {scanStatus.updated}.
            </p>
          )}

          {user?.gmailConnected && scanStatus?.status === "failed" && (
            <div className="flex items-center gap-2 rounded-md border border-[rgba(247,108,108,0.3)] bg-[rgba(247,108,108,0.08)] px-3 py-2.5 text-sm text-[#F76C6C]">
              <AlertCircle className="size-4 shrink-0" />
              {scanStatus.error ?? "The last sync failed."}
            </div>
          )}

          {syncTriggerError && (
            <div className="flex items-center gap-2 rounded-md border border-[rgba(247,108,108,0.3)] bg-[rgba(247,108,108,0.08)] px-3 py-2.5 text-sm text-[#F76C6C]">
              <AlertCircle className="size-4 shrink-0" />
              {syncTriggerError}
            </div>
          )}
        </Section>

        <div className="border-t border-border pt-6">
          <div className="rounded-md border border-border p-4">
            <Mono dim>Danger zone</Mono>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Delete account</div>
                <div className="mt-0.5 text-xs text-text-secondary">
                  Removes all applications, resume versions, and revokes Gmail access.
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirmDelete) deleteAccount.mutate();
                  else setConfirmDelete(true);
                }}
                disabled={deleteAccount.isPending}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                  confirmDelete
                    ? "border-[#F76C6C] bg-[rgba(247,108,108,0.12)] text-[#F76C6C]"
                    : "border-border text-text-secondary hover:border-[rgba(247,108,108,0.4)] hover:text-[#F76C6C]"
                }`}
              >
                {deleteAccount.isPending ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`.input { background: var(--background); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; font-size: 13px; outline: none; min-width: 240px; color: var(--foreground); }
      .input:focus { border-color: var(--border-strong); }
      .input:disabled { opacity: 0.5; cursor: not-allowed; }`}</style>
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
