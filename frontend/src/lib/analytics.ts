import type { Application } from "@/lib/mock-data";

export function computeStats(apps: Application[]) {
  const total = apps.length;
  const responded = apps.filter((a) => a.stage !== "applied");
  const responseRate =
    total > 0 ? Math.round((responded.length / total) * 100) : 0;
  const ghosted = apps.filter((a) => a.ghosted).length;
  return { total, responseRate, ghosted };
}