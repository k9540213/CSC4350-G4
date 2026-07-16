import { createFileRoute } from "@tanstack/react-router";
import { ResumeProfileEditor } from "@/views/resume/profile.tsx";

export const Route = createFileRoute("/app/resume_/profile")({
  head: () => ({ meta: [{ title: "Resume Profile — Pathway" }] }),
  component: ResumeProfileEditor,
});
