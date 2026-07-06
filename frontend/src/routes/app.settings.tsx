import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Mono } from "@/components/mono";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
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

        <Section title="Change password">
          <Row label="Current password">
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); }}
              placeholder="••••••••"
            />
          </Row>
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
              onClick={() => changePassword.mutate({ currentPassword, newPassword })}
              disabled={changePassword.isPending || !currentPassword || !newPassword}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-border-strong disabled:opacity-40"
            >
              {changePassword.isPending ? "Updating…" : passwordSaved ? "Password updated!" : "Update password"}
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
              </div>
            </div>
            {user?.gmailConnected ? (
              <button
                onClick={() => disconnectGmail.mutate()}
                disabled={disconnectGmail.isPending}
                className="rounded-md px-3 py-1.5 text-xs text-text-secondary hover:text-foreground disabled:opacity-50"
              >
                {disconnectGmail.isPending ? "Disconnecting…" : "Disconnect"}
              </button>
            ) : (
              <a
                href={api.gmail.connectUrl()}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-border-strong"
              >
                Connect Gmail
              </a>
            )}
          </div>
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
