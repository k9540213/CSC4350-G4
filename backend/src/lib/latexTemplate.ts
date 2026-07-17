import nunjucks from "nunjucks";
import path from "path";
import { TemplateJob } from "./resolveSelection";

const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(path.join(__dirname, "../templates")),
  {
    // Nunjucks HTML-escapes by default (& -> &amp;), which has no Jinja2
    // equivalent and would double-mangle content already passed through
    // escapeLatex, plus corrupt raw LaTeX macros the template itself emits.
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true,
    // Default {# #} comment delimiters collide with LaTeX macro params like
    // {#1}{#2} — same reason the original tool's Jinja2 env used custom
    // "##...##" comment delimiters.
    tags: { commentStart: "##", commentEnd: "##" },
  },
);

export function renderResumeTemplate(job: TemplateJob): string {
  return env.render("resume-base.tex.njk", job);
}
