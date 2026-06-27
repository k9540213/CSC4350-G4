import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, BarChart3, FileText, Settings as SettingsIcon } from "lucide-react";

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

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/20 text-xs font-medium text-primary-muted">
              AC
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">Alex Chen</div>
              <div className="truncate text-[11px] text-text-tertiary">alex@gmail.com</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  );
}

