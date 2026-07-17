import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import {
  api,
  ContactVariant,
  EducationEntry,
  ExperienceEntry,
  InvolvementEntry,
  ProjectEntry,
  ResearchEntry,
  ResumeProfile,
  SkillCategory,
  SummaryVariant,
} from "@/lib/api";
import { Mono } from "@/components/mono";

type ProfileForm = Omit<ResumeProfile, "id" | "updatedAt">;

function updateAt<T>(arr: T[], i: number, value: T): T[] {
  const copy = [...arr];
  copy[i] = value;
  return copy;
}

function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

export function ResumeProfileEditor() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["resumeProfile"],
    queryFn: api.resumeProfile.get,
  });

  const [form, setForm] = useState<ProfileForm | null>(null);
  const loadedRef = useRef(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data && !loadedRef.current) {
      const { id: _id, updatedAt: _updatedAt, ...rest } = data;
      setForm(rest);
      loadedRef.current = true;
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (body: ProfileForm) => api.resumeProfile.update(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumeProfile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading || !form) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Mono dim>Loading…</Mono>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-3">
          <Link to="/app/resume" className="text-text-secondary hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-base font-semibold tracking-tight">Resume Profile</h1>
        </div>
        <button
          onClick={() => save.mutate(form)}
          disabled={save.isPending}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {save.isPending ? "Saving…" : saved ? "Saved!" : "Save changes"}
        </button>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <p className="text-xs text-text-secondary">
          This is the master list of everything you might put on a resume. When you tailor a resume
          to a specific role, it draws only from what's here — content is never invented, only
          selected and reordered.
        </p>

        <Section title="Contact">
          <ContactVariantsEditor contact={form.contact} onChange={(contact) => setForm({ ...form, contact })} />
        </Section>

        <Section title="Summary">
          <SummaryVariantsEditor summary={form.summary} onChange={(summary) => setForm({ ...form, summary })} />
        </Section>

        <Section title="Skills">
          <SkillsEditor skills={form.skills} onChange={(skills) => setForm({ ...form, skills })} />
        </Section>

        <ExperienceEditor experience={form.experience} onChange={(experience) => setForm({ ...form, experience })} />

        <ResearchEditor research={form.research} onChange={(research) => setForm({ ...form, research })} />

        <NameDescriptionEditor
          title="Projects"
          entryLabel="project"
          entries={form.projects}
          onChange={(projects) => setForm({ ...form, projects })}
        />

        <NameDescriptionEditor
          title="Involvement"
          entryLabel="activity"
          entries={form.involvement}
          onChange={(involvement) => setForm({ ...form, involvement })}
        />

        <EducationEditor education={form.education} onChange={(education) => setForm({ ...form, education })} />
      </div>

      <style>{`.input { background: var(--background); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; font-size: 13px; outline: none; color: var(--foreground); }
      .input:focus { border-color: var(--border-strong); }
      .chip { display: inline-flex; align-items: center; gap: 4px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 2px 8px; font-size: 12px; }
      .chip button { color: var(--text-tertiary); display: flex; }
      .chip button:hover { color: var(--foreground); }
      .icon-btn { color: var(--text-tertiary); padding: 4px; border-radius: 6px; }
      .icon-btn:hover { color: var(--foreground); background: var(--surface); }
      .add-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-secondary); border: 1px dashed var(--border); border-radius: 6px; padding: 6px 10px; }
      .add-btn:hover { color: var(--foreground); border-color: var(--border-strong); }`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function TagInput({ onAdd, placeholder }: { onAdd: (value: string) => void; placeholder: string }) {
  const [value, setValue] = useState("");
  return (
    <input
      className="input mt-2 w-full"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (value.trim()) {
            onAdd(value.trim());
            setValue("");
          }
        }
      }}
    />
  );
}

function SkillsEditor({
  skills,
  onChange,
}: {
  skills: SkillCategory[];
  onChange: (skills: SkillCategory[]) => void;
}) {
  const addCategory = () => onChange([...skills, { category: "", items: [] }]);
  const updateCategory = (i: number, category: string) =>
    onChange(updateAt(skills, i, { ...skills[i], category }));
  const removeCategory = (i: number) => onChange(removeAt(skills, i));
  const addItem = (i: number, item: string) =>
    onChange(updateAt(skills, i, { ...skills[i], items: [...skills[i].items, item] }));
  const removeItem = (i: number, j: number) =>
    onChange(updateAt(skills, i, { ...skills[i], items: skills[i].items.filter((_, idx) => idx !== j) }));

  return (
    <div className="space-y-3">
      {skills.map((cat, i) => (
        <div key={i} className="rounded-md border border-border bg-background p-3">
          <div className="flex items-center gap-2">
            <input
              className="input flex-1"
              placeholder="Category (e.g. Languages)"
              value={cat.category}
              onChange={(e) => updateCategory(i, e.target.value)}
            />
            <button onClick={() => removeCategory(i)} className="icon-btn">
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cat.items.map((item, j) => (
              <span key={j} className="chip">
                {item}
                <button onClick={() => removeItem(i, j)}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <TagInput onAdd={(v) => addItem(i, v)} placeholder="Add skill, press Enter" />
        </div>
      ))}
      <button onClick={addCategory} className="add-btn">
        <Plus className="size-3.5" /> Add category
      </button>
    </div>
  );
}

function ContactVariantsEditor({
  contact,
  onChange,
}: {
  contact: ContactVariant[];
  onChange: (contact: ContactVariant[]) => void;
}) {
  const addVariant = () =>
    onChange([
      ...contact,
      { key: "", name: "", email: "", phone: "", link: null, linkDisplay: "", location: "", title: "" },
    ]);
  const updateVariant = (i: number, patch: Partial<ContactVariant>) =>
    onChange(updateAt(contact, i, { ...contact[i], ...patch }));
  const removeVariant = (i: number) => onChange(removeAt(contact, i));

  return (
    <div className="space-y-4">
      {contact.map((c, i) => (
        <div key={i} className="rounded-md border border-border bg-background p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="grid flex-1 grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="Variant key (e.g. tech, research, ops)"
                value={c.key}
                onChange={(e) => updateVariant(i, { key: e.target.value })}
              />
              <input
                className="input"
                placeholder="Title (e.g. Software Engineer)"
                value={c.title}
                onChange={(e) => updateVariant(i, { title: e.target.value })}
              />
              <input
                className="input"
                placeholder="Name"
                value={c.name}
                onChange={(e) => updateVariant(i, { name: e.target.value })}
              />
              <input
                className="input"
                placeholder="Email"
                value={c.email}
                onChange={(e) => updateVariant(i, { email: e.target.value })}
              />
              <input
                className="input"
                placeholder="Phone"
                value={c.phone}
                onChange={(e) => updateVariant(i, { phone: e.target.value })}
              />
              <input
                className="input"
                placeholder="Location"
                value={c.location}
                onChange={(e) => updateVariant(i, { location: e.target.value })}
              />
              <input
                className="input"
                placeholder="Link (optional, e.g. https://github.com/you)"
                value={c.link ?? ""}
                onChange={(e) => updateVariant(i, { link: e.target.value || null })}
              />
              <input
                className="input"
                placeholder="Link display text (e.g. github.com/you)"
                value={c.linkDisplay}
                onChange={(e) => updateVariant(i, { linkDisplay: e.target.value })}
              />
            </div>
            <button onClick={() => removeVariant(i)} className="icon-btn">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button onClick={addVariant} className="add-btn">
        <Plus className="size-3.5" /> Add contact variant
      </button>
    </div>
  );
}

function SummaryVariantsEditor({
  summary,
  onChange,
}: {
  summary: SummaryVariant[];
  onChange: (summary: SummaryVariant[]) => void;
}) {
  const addVariant = () => onChange([...summary, { key: "", label: "", text: "" }]);
  const updateVariant = (i: number, patch: Partial<SummaryVariant>) =>
    onChange(updateAt(summary, i, { ...summary[i], ...patch }));
  const removeVariant = (i: number) => onChange(removeAt(summary, i));

  return (
    <div className="space-y-4">
      {summary.map((s, i) => (
        <div key={i} className="rounded-md border border-border bg-background p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="Variant key (e.g. tech, ops)"
                  value={s.key}
                  onChange={(e) => updateVariant(i, { key: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Label (for your own reference)"
                  value={s.label}
                  onChange={(e) => updateVariant(i, { label: e.target.value })}
                />
              </div>
              <textarea
                className="input w-full"
                rows={2}
                placeholder="Summary text — a starting point the AI can riff on, not a strict source of truth"
                value={s.text}
                onChange={(e) => updateVariant(i, { text: e.target.value })}
              />
            </div>
            <button onClick={() => removeVariant(i)} className="icon-btn">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button onClick={addVariant} className="add-btn">
        <Plus className="size-3.5" /> Add summary variant
      </button>
    </div>
  );
}

function ExperienceEditor({
  experience,
  onChange,
}: {
  experience: ExperienceEntry[];
  onChange: (experience: ExperienceEntry[]) => void;
}) {
  const addEntry = () => onChange([...experience, { org: "", location: "", role: "", date: "", bullets: [] }]);
  const updateEntry = (i: number, patch: Partial<ExperienceEntry>) =>
    onChange(updateAt(experience, i, { ...experience[i], ...patch }));
  const removeEntry = (i: number) => onChange(removeAt(experience, i));
  const addBullet = (i: number) => updateEntry(i, { bullets: [...experience[i].bullets, ""] });
  const updateBullet = (i: number, j: number, value: string) =>
    updateEntry(i, { bullets: updateAt(experience[i].bullets, j, value) });
  const removeBullet = (i: number, j: number) =>
    updateEntry(i, { bullets: experience[i].bullets.filter((_, idx) => idx !== j) });

  return (
    <Section title="Experience">
      <div className="space-y-4">
        {experience.map((entry, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="Role"
                  value={entry.role}
                  onChange={(e) => updateEntry(i, { role: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Organization"
                  value={entry.org}
                  onChange={(e) => updateEntry(i, { org: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Location"
                  value={entry.location}
                  onChange={(e) => updateEntry(i, { location: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Dates (e.g. 2023 – Present)"
                  value={entry.date}
                  onChange={(e) => updateEntry(i, { date: e.target.value })}
                />
              </div>
              <button onClick={() => removeEntry(i)} className="icon-btn">
                <Trash2 className="size-3.5" />
              </button>
            </div>

            <div className="mt-2 space-y-1.5">
              {entry.bullets.map((b, j) => (
                <div key={j} className="flex items-center gap-1.5">
                  <input
                    className="input flex-1"
                    placeholder="Bullet"
                    value={b}
                    onChange={(e) => updateBullet(i, j, e.target.value)}
                  />
                  <button onClick={() => removeBullet(i, j)} className="icon-btn">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => addBullet(i)} className="add-btn">
                <Plus className="size-3" /> Add bullet
              </button>
            </div>
          </div>
        ))}
        <button onClick={addEntry} className="add-btn">
          <Plus className="size-3.5" /> Add role
        </button>
      </div>
    </Section>
  );
}

function ResearchEditor({
  research,
  onChange,
}: {
  research: ResearchEntry[];
  onChange: (research: ResearchEntry[]) => void;
}) {
  const addEntry = () => onChange([...research, { org: "", location: "", role: "", title: "", description: "" }]);
  const updateEntry = (i: number, patch: Partial<ResearchEntry>) =>
    onChange(updateAt(research, i, { ...research[i], ...patch }));
  const removeEntry = (i: number) => onChange(removeAt(research, i));

  return (
    <Section title="Research & Publications">
      <div className="space-y-4">
        {research.map((entry, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="Title (e.g. talk / paper title)"
                  value={entry.title}
                  onChange={(e) => updateEntry(i, { title: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Role (e.g. Speaker)"
                  value={entry.role}
                  onChange={(e) => updateEntry(i, { role: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Organization / venue"
                  value={entry.org}
                  onChange={(e) => updateEntry(i, { org: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Location"
                  value={entry.location}
                  onChange={(e) => updateEntry(i, { location: e.target.value })}
                />
              </div>
              <button onClick={() => removeEntry(i)} className="icon-btn">
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <textarea
              className="input mt-2 w-full"
              rows={2}
              placeholder="Description"
              value={entry.description}
              onChange={(e) => updateEntry(i, { description: e.target.value })}
            />
          </div>
        ))}
        <button onClick={addEntry} className="add-btn">
          <Plus className="size-3.5" /> Add publication
        </button>
      </div>
    </Section>
  );
}

function NameDescriptionEditor({
  title,
  entryLabel,
  entries,
  onChange,
}: {
  title: string;
  entryLabel: string;
  entries: (ProjectEntry | InvolvementEntry)[];
  onChange: (entries: (ProjectEntry | InvolvementEntry)[]) => void;
}) {
  const addEntry = () => onChange([...entries, { name: "", description: "" }]);
  const updateEntry = (i: number, patch: Partial<ProjectEntry>) =>
    onChange(updateAt(entries, i, { ...entries[i], ...patch }));
  const removeEntry = (i: number) => onChange(removeAt(entries, i));

  return (
    <Section title={title}>
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-2">
              <input
                className="input flex-1"
                placeholder="Name"
                value={entry.name}
                onChange={(e) => updateEntry(i, { name: e.target.value })}
              />
              <button onClick={() => removeEntry(i)} className="icon-btn">
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <textarea
              className="input mt-2 w-full"
              rows={2}
              placeholder="Description"
              value={entry.description}
              onChange={(e) => updateEntry(i, { description: e.target.value })}
            />
          </div>
        ))}
        <button onClick={addEntry} className="add-btn">
          <Plus className="size-3.5" /> Add {entryLabel}
        </button>
      </div>
    </Section>
  );
}

function EducationEditor({
  education,
  onChange,
}: {
  education: EducationEntry[];
  onChange: (education: EducationEntry[]) => void;
}) {
  const addEntry = () =>
    onChange([...education, { school: "", location: "", degree: "", date: "", gpa: "", honors: "", coursework: "" }]);
  const updateEntry = (i: number, patch: Partial<EducationEntry>) =>
    onChange(updateAt(education, i, { ...education[i], ...patch }));
  const removeEntry = (i: number) => onChange(removeAt(education, i));

  return (
    <Section title="Education">
      <div className="space-y-4">
        {education.map((entry, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="School"
                  value={entry.school}
                  onChange={(e) => updateEntry(i, { school: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Location"
                  value={entry.location}
                  onChange={(e) => updateEntry(i, { location: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Degree"
                  value={entry.degree}
                  onChange={(e) => updateEntry(i, { degree: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Dates (e.g. 2024 – 2026)"
                  value={entry.date}
                  onChange={(e) => updateEntry(i, { date: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="GPA (optional)"
                  value={entry.gpa}
                  onChange={(e) => updateEntry(i, { gpa: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Honors (optional)"
                  value={entry.honors}
                  onChange={(e) => updateEntry(i, { honors: e.target.value })}
                />
                <input
                  className="input col-span-2"
                  placeholder="Coursework (optional)"
                  value={entry.coursework}
                  onChange={(e) => updateEntry(i, { coursework: e.target.value })}
                />
              </div>
              <button onClick={() => removeEntry(i)} className="icon-btn">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        <button onClick={addEntry} className="add-btn">
          <Plus className="size-3.5" /> Add education
        </button>
      </div>
    </Section>
  );
}
