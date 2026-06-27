import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ANALYTICS } from "@/lib/mock-data";
import { Mono } from "@/components/mono";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Pathway" }] }),
  component: Analytics,
});

function Analytics() {
  const [range, setRange] = useState("30d");

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

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total applications" value="47" delta="+8 this week" />
          <Stat label="Response rate" value="64%" delta="+4% vs last month" />
          <Stat label="Avg time to first response" value="5.2 days" delta="−1.3d" />
          <Stat label="Ghosted" value="9" delta="3 over 14 days" muted />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card title="Funnel">
            <div className="space-y-3 pt-2">
              {ANALYTICS.funnel.map((f, i) => {
                const max = ANALYTICS.funnel[0].count;
                const pct = (f.count / max) * 100;
                return (
                  <div key={f.stage}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm">{f.stage}</span>
                      <Mono dim>{f.count}</Mono>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full"
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

          <Card title="Applications over time">
            <div className="h-48 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ANALYTICS.overTime}>
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

        <Card title="Average time in each stage">
          <div className="h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ANALYTICS.avgTimeInStage} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="#5F5D6B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="stage" stroke="#5F5D6B" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: "#15151C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="days" fill="#C4B5FD" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
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
