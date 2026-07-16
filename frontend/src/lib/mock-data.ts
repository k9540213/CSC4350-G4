// Mock data for Pathway. Replace with real API calls.
export type Stage = "applied" | "oa" | "interview" | "offer" | "rejected" | "ghosted";

export const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "applied", label: "Applied", color: "var(--color-stage-applied)" },
  { id: "oa", label: "OA", color: "var(--color-stage-oa)" },
  { id: "interview", label: "Interview", color: "var(--color-stage-interview)" },
  { id: "offer", label: "Offer", color: "var(--color-stage-offer)" },
  { id: "rejected", label: "Rejected", color: "var(--color-stage-rejected)" },
];

export interface TimelineEvent {
  id: string;
  type: "applied" | "oa" | "interview" | "offer" | "rejected" | "note" | "email";
  label: string;
  at: string; // ISO
  source: "manual" | "email";
  detail?: string;
}

export interface Application {
  id: string;
  company: string;
  position: string;
  location: string;
  stage: Stage;
  appliedAt: string;
  lastUpdate: string;
  source: "manual" | "email";
  salary?: string;
  notes?: string;
  timeline: TimelineEvent[];
  ghosted?: boolean;
}

const days = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const APPLICATIONS: Application[] = [
  {
    id: "1",
    company: "Stripe",
    position: "Software Engineer, Payments",
    location: "San Francisco, CA",
    stage: "interview",
    appliedAt: days(24),
    lastUpdate: days(2),
    source: "email",
    salary: "$185k – $230k",
    notes: "Recruiter Maya scheduled onsite for next week. Prep system design.",
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(24), source: "manual" },
      { id: "t2", type: "email", label: "Auto-reply received", at: days(24), source: "email", detail: "from no-reply@stripe.com" },
      { id: "t3", type: "oa", label: "OnlineAssessment invitation", at: days(18), source: "email", detail: "HackerRank link" },
      { id: "t4", type: "interview", label: "Phone screen scheduled", at: days(9), source: "email" },
      { id: "t5", type: "interview", label: "Onsite scheduled", at: days(2), source: "email" },
    ],
  },
  {
    id: "2",
    company: "Linear",
    position: "Frontend Engineer",
    location: "Remote",
    stage: "oa",
    appliedAt: days(11),
    lastUpdate: days(4),
    source: "email",
    salary: "$160k – $200k",
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(11), source: "manual" },
      { id: "t2", type: "oa", label: "Take-home assignment sent", at: days(4), source: "email" },
    ],
  },
  {
    id: "3",
    company: "Vercel",
    position: "Product Engineer",
    location: "Remote",
    stage: "applied",
    appliedAt: days(5),
    lastUpdate: days(5),
    source: "manual",
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(5), source: "manual" },
    ],
  },
  {
    id: "4",
    company: "Ramp",
    position: "Full Stack Engineer",
    location: "New York, NY",
    stage: "offer",
    appliedAt: days(45),
    lastUpdate: days(1),
    source: "email",
    salary: "$210k + equity",
    notes: "Offer received. Negotiating signing bonus.",
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(45), source: "manual" },
      { id: "t2", type: "oa", label: "Coding challenge completed", at: days(38), source: "manual" },
      { id: "t3", type: "interview", label: "Final round complete", at: days(7), source: "email" },
      { id: "t4", type: "offer", label: "Offer letter received", at: days(1), source: "email" },
    ],
  },
  {
    id: "5",
    company: "Notion",
    position: "Software Engineer, Editor",
    location: "San Francisco, CA",
    stage: "rejected",
    appliedAt: days(32),
    lastUpdate: days(6),
    source: "email",
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(32), source: "manual" },
      { id: "t2", type: "interview", label: "Phone screen", at: days(20), source: "email" },
      { id: "t3", type: "rejected", label: "Position closed", at: days(6), source: "email" },
    ],
  },
  {
    id: "6",
    company: "Figma",
    position: "Senior Frontend Engineer",
    location: "San Francisco, CA",
    stage: "interview",
    appliedAt: days(19),
    lastUpdate: days(3),
    source: "email",
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(19), source: "manual" },
      { id: "t2", type: "interview", label: "Recruiter screen", at: days(12), source: "email" },
      { id: "t3", type: "interview", label: "Technical round 1", at: days(3), source: "email" },
    ],
  },
  {
    id: "7",
    company: "Anthropic",
    position: "Member of Technical Staff",
    location: "San Francisco, CA",
    stage: "applied",
    appliedAt: days(8),
    lastUpdate: days(8),
    source: "manual",
    ghosted: true,
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(8), source: "manual" },
    ],
  },
  {
    id: "8",
    company: "Datadog",
    position: "Backend Engineer",
    location: "New York, NY",
    stage: "oa",
    appliedAt: days(14),
    lastUpdate: days(6),
    source: "email",
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(14), source: "manual" },
      { id: "t2", type: "oa", label: "CodeSignal assessment sent", at: days(6), source: "email" },
    ],
  },
  {
    id: "9",
    company: "Plaid",
    position: "Software Engineer",
    location: "Remote",
    stage: "applied",
    appliedAt: days(3),
    lastUpdate: days(3),
    source: "email",
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(3), source: "email" },
    ],
  },
  {
    id: "10",
    company: "Airbnb",
    position: "Frontend Engineer, Growth",
    location: "Remote",
    stage: "rejected",
    appliedAt: days(40),
    lastUpdate: days(15),
    source: "email",
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(40), source: "manual" },
      { id: "t2", type: "rejected", label: "Not moving forward", at: days(15), source: "email" },
    ],
  },
  {
    id: "11",
    company: "Discord",
    position: "Software Engineer, Platform",
    location: "San Francisco, CA",
    stage: "interview",
    appliedAt: days(22),
    lastUpdate: days(5),
    source: "email",
    timeline: [
      { id: "t1", type: "applied", label: "Application submitted", at: days(22), source: "manual" },
      { id: "t2", type: "oa", label: "Take-home completed", at: days(14), source: "manual" },
      { id: "t3", type: "interview", label: "Hiring manager call", at: days(5), source: "email" },
    ],
  },
];

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export const ANALYTICS = {
  total: APPLICATIONS.length,
  responseRate: 0.64,
  avgFirstResponseDays: 5.2,
  ghostedCount: APPLICATIONS.filter((a) => a.ghosted).length,
  funnel: [
    { stage: "Applied", count: 47 },
    { stage: "OA", count: 22 },
    { stage: "Interview", count: 11 },
    { stage: "Offer", count: 3 },
  ],
  overTime: [
    { week: "W1", applications: 4 },
    { week: "W2", applications: 7 },
    { week: "W3", applications: 6 },
    { week: "W4", applications: 9 },
    { week: "W5", applications: 12 },
    { week: "W6", applications: 5 },
    { week: "W7", applications: 4 },
  ],
  avgTimeInStage: [
    { stage: "Applied", days: 6.4 },
    { stage: "OA", days: 4.1 },
    { stage: "Interview", days: 9.7 },
    { stage: "Offer", days: 5.2 },
  ],
};

