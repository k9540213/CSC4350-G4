import { createFileRoute, Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, BarChart3, FileText, Settings as SettingsIcon, LogOut, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/resume", label: "Resume Workshop", icon: FileText },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
] as const;

function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: api.auth.me,
    staleTime: 5 * 60 * 1000,
  });

  const logout = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.clear();
      router.navigate({ to: "/auth" });
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "…";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" rx="5" stroke="#8366F0" strokeWidth="1.5" />
            <path d="M5 13L9 7L11 11L15 5" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-semibold tracking-tight">Pathway</span>
        </div>

        <nav className="flex-1 px-2 py-3">
          {nav.map((item) => {
            const active = path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-text-secondary hover:text-foreground"
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-px bg-primary" />}
                <Icon className={`size-4 ${active ? "text-primary-muted" : ""}`} />
                <span className={active ? "text-foreground" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-border p-3" ref={menuRef}>
          {menuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
              <div className="border-b border-border px-3 py-2.5">
                <div className="truncate text-xs font-medium">{user?.name ?? "…"}</div>
                <div className="truncate text-[11px] text-text-tertiary">{user?.email ?? "…"}</div>
              </div>
              <div className="p-1">
                <Link
                  to="/app/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-text-secondary hover:bg-background hover:text-foreground"
                >
                  <User className="size-3.5" /> Account settings
                </Link>
                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-text-secondary hover:bg-background hover:text-foreground disabled:opacity-50"
                >
                  <LogOut className="size-3.5" />
                  {logout.isPending ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex w-full items-center gap-2.5 rounded-md px-1 py-1 hover:bg-background"
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/20 text-xs font-medium text-primary-muted">
              {initials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-xs font-medium">{user?.name ?? "…"}</div>
              <div className="truncate text-[11px] text-text-tertiary">{user?.email ?? "…"}</div>
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  );
}
