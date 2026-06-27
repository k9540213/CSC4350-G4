import type { Stage } from "@/lib/mock-data";

const styles: Record<Stage, { color: string; bg: string; label: string }> = {
  applied:   { color: "#9CA3AF", bg: "rgba(107,114,128,0.14)", label: "Applied" },
  oa:        { color: "#4F8EF7", bg: "rgba(79,142,247,0.12)", label: "OA" },
  interview: { color: "#F5A623", bg: "rgba(245,166,35,0.12)", label: "Interview" },
  offer:     { color: "#34D399", bg: "rgba(52,211,153,0.12)", label: "Offer" },
  rejected:  { color: "#9B98A8", bg: "rgba(107,107,118,0.14)", label: "Rejected" },
  ghosted:   { color: "#F76C6C", bg: "rgba(247,108,108,0.12)", label: "Ghosted" },
};

export function StagePill({ stage, size = "sm" }: { stage: Stage; size?: "sm" | "xs" }) {
  const s = styles[stage];
  return (
    <span
      className="inline-flex items-center rounded-md font-mono"
      style={{
        color: s.color,
        background: s.bg,
        padding: size === "xs" ? "2px 6px" : "3px 8px",
        fontSize: size === "xs" ? "10px" : "11px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontWeight: 500,
      }}
    >
      {s.label}
    </span>
  );
}

export function StageDot({ stage }: { stage: Stage }) {
  const s = styles[stage];
  return <span className="inline-block size-1.5 rounded-full" style={{ background: s.color }} />;
}
