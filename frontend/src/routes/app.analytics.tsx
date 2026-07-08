import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { STAGES } from "@/lib/mock-data";
import { Mono } from "@/components/mono";
import { useApplications } from "@/hooks/use-applications";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Pathway" }] }),
  component: Analytics,
});

function Analytics() {
  const [range, setRange] = useState("30d");
  const { applications, loading } = useApplications();

  const stats = useMemo(() => {
    if (!applications.length) return null;

    const now = Date.now();
    const MS_DAY  = 1000 * 60 * 60 * 24;
    const MS_WEEK = MS_DAY * 7;

    // filter by selected range
    const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : Infinity;
    const inRange = applications.filter(
      (a) => (now - new Date(a.appliedAt).getTime()) / MS_DAY <= rangeDays
    );

    const total        = inRange.length;
    const ghostedCount = inRange.filter((a) => a.ghosted).length;

    // response rate = apps that moved past "applied"
    const responded    = inRange.filter((a) => a.stage !== "applied");
    const responseRate = total > 0 ? Math.round((responded.length / total) * 100) : 0;

    // avg days from applied → last update (for apps that got a response)
    const avgFirstResponse =
      responded.length > 0
        ? responded.reduce((sum, a) =>
            sum + (new Date(a.lastUpdate).getTime() - new Date(a.appliedAt).getTime()) / MS_DAY, 0
          ) / responded.length
        : 0;

    // funnel: count per stage
    const funnel = STAGES.map((s) => ({
      stage: s.label,
      count: inRange.filter((a) => a.stage === s.id).length,
    }));

    // applications over time — last 7 weeks
    const weekMap: Record<number, number> = {};
    inRange.forEach((a) => {
      const weeksAgo = Math.floor((now - new Date(a.appliedAt).getTime()) / MS_WEEK);
      if (weeksAgo < 7) weekMap[weeksAgo] = (weekMap[weeksAgo] || 0) + 1;
    });
    const overTime = Array.from({ length: 7 }, (_, i) => ({
      week: i === 0 ? "This wk" : `${i}w ago`,
      applications: weekMap[i] || 0,
    })).reverse();

    // avg days spent in each stage (appliedAt → lastUpdate)
    const avgTimeInStage = STAGES.map((s) => {
      const stageApps = inRange.filter((a) => a.stage === s.id);
      if (!stageApps.length) return { stage: s.label, days: 0 };
      const avg =
        stageApps.reduce(
          (sum, a) =>
            sum + (new Date(a.lastUpdate).getTime() - new Date(a.appliedAt).getTime()) / MS_DAY,
          0
        ) / stageApps.length;
      return { stage: s.label, days: Math.round(avg * 10) / 10 };
    }).filter((s) => s.days > 0);

    return { total, ghostedCount, responseRate, avgFirstResponse, funnel, overTime, avgTimeInStage };
  }, [applications, range]);

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between border-b border-border px-5">
        <h1 className="text-base font-semibold tracking-tight">Analytics</h1>
        <div className="flex gap-1 rounded-md border border-border bg-surface p-0.5">
          {["7d", "30d", "90d", "All"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-2.5 py-1 text-xs ${range === r ? "bg-background text-foreground" : "text-text-secondary"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-text-tertiary">
          Loading…
        </div>
      ) : !stats ? (
        <div className="flex h-64 items-center justify-center text-sm text-text-tertiary">
          No applications yet — add one from the dashboard.
        </div>
      ) : (
        <div className="space-y-5 p-5">
          {/* stat cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total applications"      value={String(stats.total)}                       delta={`in selected range`} />
            <Stat label="Response rate"           value={`${stats.responseRate}%`}                  delta="moved past applied" />
            <Stat label="Avg days to response"    value={`${stats.avgFirstResponse.toFixed(1)}d`}   delta="applied → last update" />
            <Stat label="Ghosted"                 value={String(stats.ghostedCount)}                delta="marked as ghosted" muted />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* funnel */}
            <Card title="Funnel">
              <div className="space-y-3 pt-2">
                {stats.funnel.map((f, i) => {
                  const max = stats.funnel[0]?.count || 1;
                  const pct = (f.count / max) * 100;
                  return (
                    <div key={f.stage}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm">{f.stage}</span>
                        <Mono dim>{f.count}</Mono>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: ["#6B7280", "#4F8EF7", "#F5A623", "#34D399"][i],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* applications over time */}
            <Card title="Applications over time">
              <div className="h-48 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.overTime}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="week" stroke="#5F5D6B" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#5F5D6B" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#15151C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontSize: 12 }} />
                    <Line type="monotone" dataKey="applications" stroke="#8366F0" strokeWidth={2} dot={{ r: 3, fill: "#8366F0" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* avg time in stage */}
          {stats.avgTimeInStage.length > 0 && (
            <Card title="Average days in each stage">
              <div className="h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.avgTimeInStage} layout="vertical">
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" stroke="#5F5D6B" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="stage" stroke="#5F5D6B" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={{ background: "#15151C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="days" fill="#C4B5FD" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, delta, muted }: { label: string; value: string; delta: string; muted?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <Mono dim>{label}</Mono>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className={`mt-1 text-xs ${muted ? "text-text-tertiary" : "text-text-secondary"}`}>{delta}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}