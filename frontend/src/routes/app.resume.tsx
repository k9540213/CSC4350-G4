import { createFileRoute } from "@tanstack/react-router";
import { Resume } from "@/views/resume/preview.tsx";

export const Route = createFileRoute("/app/resume")({
  head: () => ({ meta: [{ title: "Resume Workshop — Pathway" }] }),
  component: Resume,
});
