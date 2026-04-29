"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Compass,
  ScrollText,
  Shield,
  ListChecks,
  PackageCheck,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Pencil,
  Save,
  Plus,
  Trash2,
  FileText,
  FileType2,
  FileDown,
  Languages,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Download,
  CircleHelp,
} from "lucide-react";

import {
  outcomesSystemPrompt,
  buildOutcomesPrompt,
  briefSystemPrompt,
  buildBriefPrompt,
  integritySystemPrompt,
  buildIntegrityPrompt,
  rubricSystemPrompt,
  buildRubricPrompt,
  alignmentSystemPrompt,
  buildAlignmentPrompt,
} from "@/lib/prompts";

import {
  downloadDocx,
  downloadPdf,
  downloadTxt,
  copyLmsToClipboard,
  buildPlainText,
} from "@/lib/exporters";

import {
  loadAllDrafts,
  saveDraft,
  deleteDraft,
  newDraftId,
  activeBackend,
  type DesignerDraft,
} from "@/lib/drafts";

/* ============================================================
   Sovereign AI Learning Designer — Caribbean Edition
   Jamaican-themed · WCAG-AA · Created by Dr. Rohan Jowallah, Ed.D.
   ============================================================ */

const STEPS = [
  { id: 0, label: "Welcome", short: "Begin", icon: Compass },
  { id: 1, label: "Course Context", short: "Context", icon: BookOpen },
  { id: 2, label: "Learning Outcomes", short: "Outcomes", icon: ListChecks },
  { id: 3, label: "Assignment Brief", short: "Brief", icon: ScrollText },
  { id: 4, label: "AI Integrity", short: "Integrity", icon: Shield },
  { id: 5, label: "Aligned Rubric", short: "Rubric", icon: Sparkles },
  { id: 6, label: "Final Package", short: "Package", icon: PackageCheck },
];

const REGIONS = [
  "Jamaica",
  "Trinidad & Tobago",
  "Barbados",
  "Bahamas",
  "Guyana",
  "OECS (Eastern Caribbean)",
  "Belize",
  "Cayman Islands",
  "Pan-Caribbean",
  "Caribbean diaspora",
];

const LEVELS = [
  "Lower Secondary (Forms 1–3)",
  "Upper Secondary (Forms 4–6 / CSEC)",
  "CAPE / Sixth Form",
  "TVET / HEART",
  "Undergraduate — Year 1",
  "Undergraduate — Years 2–3",
  "Postgraduate — Taught",
  "Postgraduate — Research",
  "Professional / Workforce",
];

const MODALITIES = ["Face-to-face", "Online (asynchronous)", "Online (synchronous)", "Hybrid / blended"];

const AI_ACCESS_LEVELS = [
  { id: "none", label: "AI not used", note: "Closed assessment; AI use disallowed." },
  {
    id: "limited",
    label: "Limited & cited",
    note: "AI permitted for narrow tasks (brainstorming, structure) with disclosure.",
  },
  {
    id: "supportive",
    label: "Supportive & disclosed",
    note: "AI integral to the process; disclosure and reflection required throughout.",
  },
  {
    id: "co-creative",
    label: "Co-creative & critical",
    note: "Students interrogate AI outputs using ACRE; the AI dialogue is part of the artefact.",
  },
];

const REFLECTION_LENSES = [
  "Cultural identity & language",
  "Power & decoloniality (Freirean)",
  "Caribbean climate & sovereignty",
  "Community & informal economy",
  "Equity & accessibility",
  "Ethics & professional integrity",
];

/* ---------------- API helper ---------------- */

async function callClaude({
  system,
  user,
  maxTokens = 1400,
}: {
  system: string;
  user: string;
  maxTokens?: number;
}) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user, maxTokens }),
  });
  if (!res.ok) {
    const t = await res.text();
    let msg = t;
    try {
      const parsed = JSON.parse(t);
      msg = parsed.error || t;
    } catch {}
    throw new Error(msg.slice(0, 300));
  }
  const { text } = await res.json();
  return text as string;
}

function extractJSON(text: string): any {
  if (!text) throw new Error("Empty response from model.");
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON object found in response.");
  return JSON.parse(cleaned.slice(first, last + 1));
}

/* ---------------- UI primitives ---------------- */

const Field = ({
  label,
  hint,
  required,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) => (
  <div className="block">
    <label
      htmlFor={htmlFor}
      className="block text-xs uppercase tracking-[0.18em] mb-2 font-semibold text-jamGreen-dark"
    >
      {label}
      {required && (
        <span className="required-mark" aria-label="required">
          *
        </span>
      )}
    </label>
    {children}
    {hint && (
      <div className="mt-1.5 text-xs italic text-jamBlack-soft" id={htmlFor ? `${htmlFor}-hint` : undefined}>
        {hint}
      </div>
    )}
  </div>
);

const TextInput = ({
  id,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  required = false,
  ariaDescribedBy,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  ariaDescribedBy?: string;
}) => {
  const baseClass =
    "w-full px-4 py-3 rounded-md border-2 text-base text-jamBlack bg-white border-jamGreen-light focus:border-jamGreen focus:outline-none transition-colors";
  if (multiline) {
    return (
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        aria-required={required || undefined}
        aria-describedby={ariaDescribedBy}
        className={baseClass + " resize-y leading-relaxed"}
      />
    );
  }
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      aria-required={required || undefined}
      aria-describedby={ariaDescribedBy}
      className={baseClass}
    />
  );
};

const SelectInput = ({
  id,
  value,
  onChange,
  options,
  required = false,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { id: string; label: string })[];
  required?: boolean;
}) => (
  <select
    id={id}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required={required}
    aria-required={required || undefined}
    className="w-full px-4 py-3 rounded-md border-2 text-base text-jamBlack bg-white border-jamGreen-light focus:border-jamGreen focus:outline-none"
  >
    <option value="">Select…</option>
    {options.map((o) => (
      <option key={typeof o === "string" ? o : o.id} value={typeof o === "string" ? o : o.id}>
        {typeof o === "string" ? o : o.label}
      </option>
    ))}
  </select>
);

const PrimaryButton = ({
  onClick,
  disabled,
  children,
  icon: Icon,
  ariaLabel,
  type = "button",
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: any;
  ariaLabel?: string;
  type?: "button" | "submit";
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className={
      "inline-flex items-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-sm uppercase tracking-[0.12em] border-2 " +
      (disabled
        ? "bg-jamGreen-light text-jamBlack-soft border-jamGreen-light cursor-not-allowed"
        : "bg-jamGreen text-cream border-jamGreen-dark hover:bg-jamGreen-dark hover:text-white shadow-card")
    }
  >
    {Icon && <Icon size={16} strokeWidth={2.4} aria-hidden="true" />}
    <span>{children}</span>
  </button>
);

const GhostButton = ({
  onClick,
  disabled,
  children,
  icon: Icon,
  ariaLabel,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: any;
  ariaLabel?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className={
      "inline-flex items-center gap-2 px-5 py-3 rounded-md font-semibold transition-colors text-sm uppercase tracking-[0.12em] border-2 " +
      (disabled
        ? "border-jamGreen-light text-jamBlack-soft cursor-not-allowed"
        : "border-jamGreen text-jamGreen hover:bg-jamGreen-light")
    }
  >
    {Icon && <Icon size={16} strokeWidth={2.4} aria-hidden="true" />}
    <span>{children}</span>
  </button>
);

const Card = ({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) => (
  <div
    className={
      "rounded-lg p-6 md:p-8 border-2 " +
      (accent ? "bg-jamGold-light border-jamGold-deep" : "bg-cream-warm border-jamGreen-light")
    }
  >
    {children}
  </div>
);

const SectionHeading = ({
  kicker,
  title,
  body,
}: {
  kicker?: string;
  title: string;
  body?: string;
}) => (
  <div className="mb-8">
    {kicker && (
      <div className="text-xs uppercase tracking-[0.28em] mb-3 font-bold text-jamGold-deep">
        {kicker}
      </div>
    )}
    <h2 className="text-3xl md:text-4xl mb-3 leading-tight font-serif font-medium text-jamGreen-dark">
      {title}
    </h2>
    {body && <p className="text-base md:text-lg leading-relaxed max-w-2xl text-jamBlack-soft">{body}</p>}
  </div>
);

const Stepper = ({
  current,
  onJump,
  allowJump,
}: {
  current: number;
  onJump: (id: number) => void;
  allowJump: boolean;
}) => (
  <nav aria-label="Designer steps" className="flex items-center gap-1 md:gap-2 flex-wrap">
    <ol className="flex items-center gap-1 md:gap-2 flex-wrap list-none p-0 m-0">
      {STEPS.map((s, i) => {
        const active = current === s.id;
        const done = current > s.id;
        return (
          <React.Fragment key={s.id}>
            <li>
              <button
                onClick={() => allowJump && onJump(s.id)}
                disabled={!allowJump}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${s.id + 1}: ${s.label}${active ? ", current step" : done ? ", completed" : ""}`}
                className={
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors " +
                  (active
                    ? "bg-jamGreen text-cream"
                    : done
                    ? "text-jamGreen hover:bg-jamGreen-light"
                    : "text-jamBlack-soft")
                }
                style={{ cursor: allowJump ? "pointer" : "default" }}
              >
                <s.icon size={14} strokeWidth={2.4} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.14em] font-semibold hidden md:inline">
                  {s.short}
                </span>
              </button>
            </li>
            {i < STEPS.length - 1 && (
              <li aria-hidden="true">
                <div className="w-3 md:w-5 h-px bg-jamGreen-light" />
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  </nav>
);

const ErrorBanner = ({ message, onRetry }: { message?: string; onRetry?: () => void }) =>
  message ? (
    <div role="alert" className="rounded-md p-4 flex items-start gap-3 mb-4 bg-red-50 border-2 border-red-300">
      <AlertCircle size={18} className="text-red-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <div className="text-sm font-semibold mb-1 text-red-900">Generation hit a snag.</div>
        <div className="text-sm text-red-800">{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs uppercase tracking-[0.14em] font-semibold underline text-jamGreen-dark"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  ) : null;

const SubSection = ({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) => (
  <section className={last ? "" : "mb-6"} aria-label={label}>
    <h4 className="text-xs uppercase tracking-[0.22em] mb-2 font-bold text-jamGold-deep">{label}</h4>
    {children}
  </section>
);

/* ---------------- Step 0: Welcome ---------------- */

const WelcomeStep = ({
  onBegin,
  onResume,
  drafts,
}: {
  onBegin: () => void;
  onResume: () => void;
  drafts: DesignerDraft[];
}) => (
  <section aria-labelledby="welcome-heading">
    <div className="text-xs uppercase tracking-[0.32em] mb-5 font-bold text-jamGold-deep">
      Sovereign AI · Caribbean Educator Tool
    </div>
    <h1
      id="welcome-heading"
      className="text-4xl md:text-6xl lg:text-7xl mb-6 leading-[1.05] font-serif font-medium text-jamGreen-dark"
    >
      Design assignments
      <br />
      <em className="text-jamGold-deep font-normal">that sharpen thinking,</em>
      <br />
      not soften it.
    </h1>
    <p className="text-lg md:text-xl leading-relaxed max-w-2xl mb-10 text-jamBlack-soft">
      A guided workspace for Caribbean educators to draft assignments, learning outcomes, AI
      integrity statements, and aligned rubrics — grounded in the{" "}
      <strong className="text-jamBlack">CARE</strong>,{" "}
      <strong className="text-jamBlack">CRAFT</strong>, and{" "}
      <strong className="text-jamBlack">ACRE</strong> frameworks, and shaped by sovereign principles
      for AI in education.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
      {[
        { k: "CARE", t: "Critical Reflection", d: "Consider · Analyse · Reflect · Evaluate. The reflective spine of every assignment." },
        { k: "CRAFT", t: "Prompt Architecture", d: "Context · Role · Action · Format · Threshold. How students engage AI with purpose." },
        { k: "ACRE", t: "Output Evaluation", d: "Accuracy · Completeness · Relevance · Equity. How students judge AI outputs." },
      ].map((f) => (
        <article
          key={f.k}
          className="p-5 rounded-md bg-jamGold-light border-2 border-jamGold-deep"
          aria-label={`${f.k} framework`}
        >
          <div className="text-xs uppercase tracking-[0.22em] mb-2 font-bold text-jamGold-deep">
            {f.k}
          </div>
          <h3 className="text-lg mb-1.5 font-serif font-medium text-jamGreen-dark">{f.t}</h3>
          <p className="text-sm leading-relaxed text-jamBlack-soft">{f.d}</p>
        </article>
      ))}
    </div>

    <div className="flex flex-wrap gap-3">
      <PrimaryButton onClick={onBegin} icon={ArrowRight}>
        Begin a new design
      </PrimaryButton>
      {drafts.length > 0 && (
        <GhostButton onClick={onResume} icon={FolderOpen}>
          Resume saved draft ({drafts.length})
        </GhostButton>
      )}
    </div>

    <div className="mt-10 pt-6 text-xs italic max-w-xl text-jamBlack-soft border-t-2 border-jamGreen-light">
      Frameworks &copy; Dr. Rohan Jowallah, Ed.D. · CARE · CRAFT · ACRE · Sovereign AI. Used with
      attribution in every generated package.
    </div>
  </section>
);

/* ---------------- Step 1: Course Context ---------------- */

const ContextStep = ({
  context,
  setContext,
  patoisMode,
  setPatoisMode,
}: {
  context: any;
  setContext: (c: any) => void;
  patoisMode: boolean;
  setPatoisMode: (b: boolean) => void;
}) => (
  <section aria-labelledby="context-heading">
    <SectionHeading
      kicker="Step 1 of 6"
      title="Where will this assignment live?"
      body="Tell the designer about the course, the learners, and the sovereignty stance. Every later step is anchored in your input here — fields marked * are required for the alignment to work."
    />

    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Course or unit title" required htmlFor="ctx-course">
          <TextInput
            id="ctx-course"
            value={context.courseTitle}
            onChange={(v) => setContext({ ...context, courseTitle: v })}
            placeholder="e.g. Caribbean Literature in the Digital Age"
            required
          />
        </Field>
        <Field label="Discipline / subject" required htmlFor="ctx-discipline">
          <TextInput
            id="ctx-discipline"
            value={context.discipline}
            onChange={(v) => setContext({ ...context, discipline: v })}
            placeholder="e.g. Literacy Education, Public Health, Computer Science"
            required
          />
        </Field>
        <Field label="Learner level" required htmlFor="ctx-level">
          <SelectInput
            id="ctx-level"
            value={context.level}
            onChange={(v) => setContext({ ...context, level: v })}
            options={LEVELS}
            required
          />
        </Field>
        <Field label="Region" required htmlFor="ctx-region">
          <SelectInput
            id="ctx-region"
            value={context.region}
            onChange={(v) => setContext({ ...context, region: v })}
            options={REGIONS}
            required
          />
        </Field>
        <Field label="Modality" required htmlFor="ctx-modality">
          <SelectInput
            id="ctx-modality"
            value={context.modality}
            onChange={(v) => setContext({ ...context, modality: v })}
            options={MODALITIES}
            required
          />
        </Field>
        <Field label="Time on task" hint="Approximate hours for the student." htmlFor="ctx-time">
          <TextInput
            id="ctx-time"
            value={context.timeOnTask}
            onChange={(v) => setContext({ ...context, timeOnTask: v })}
            placeholder="e.g. 8–10 hours over two weeks"
            ariaDescribedBy="ctx-time-hint"
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            label="Learner profile"
            required
            hint="A few sentences. What backgrounds, languages, technologies, and lives do these learners bring?"
            htmlFor="ctx-profile"
          >
            <TextInput
              id="ctx-profile"
              value={context.learnerProfile}
              onChange={(v) => setContext({ ...context, learnerProfile: v })}
              placeholder="e.g. Pre-service teachers in western Jamaica, mostly first-generation university entrants, multilingual (Standard English / Patois), variable home internet."
              multiline
              rows={3}
              required
              ariaDescribedBy="ctx-profile-hint"
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field
            label="Topic / focus of this assignment"
            required
            hint="What is this particular task about? One or two sentences."
            htmlFor="ctx-topic"
          >
            <TextInput
              id="ctx-topic"
              value={context.topic}
              onChange={(v) => setContext({ ...context, topic: v })}
              placeholder="e.g. Comparing how generative AI represents Caribbean climate vulnerability versus how Caribbean scholars represent it."
              multiline
              rows={2}
              required
              ariaDescribedBy="ctx-topic-hint"
            />
          </Field>
        </div>
      </div>
    </Card>

    <div className="mt-6">
      <Card accent>
        <div className="text-xs uppercase tracking-[0.22em] mb-3 font-bold text-jamGold-deep">
          AI Sovereignty Stance <span className="required-mark">*</span>
        </div>
        <p className="text-base mb-4 text-jamBlack">How will students engage with AI in this assignment?</p>
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <legend className="sr-only">AI sovereignty stance</legend>
          {AI_ACCESS_LEVELS.map((opt) => {
            const active = context.aiAccess === opt.id;
            return (
              <label
                key={opt.id}
                className={
                  "text-left p-4 rounded-md transition-colors cursor-pointer block border-2 " +
                  (active
                    ? "bg-jamGreen text-cream border-jamGreen-dark"
                    : "bg-white text-jamBlack border-jamGreen-light hover:border-jamGreen")
                }
              >
                <input
                  type="radio"
                  name="aiAccess"
                  value={opt.id}
                  checked={active}
                  onChange={() => setContext({ ...context, aiAccess: opt.id })}
                  className="sr-only"
                />
                <div className="font-bold text-sm uppercase tracking-[0.12em] mb-1.5">{opt.label}</div>
                <div className={"text-sm leading-relaxed " + (active ? "text-jamGold-light" : "text-jamBlack-soft")}>
                  {opt.note}
                </div>
              </label>
            );
          })}
        </fieldset>
      </Card>
    </div>

    {/* Patois mode toggle */}
    <div className="mt-6">
      <div className="rounded-lg p-5 border-2 border-jamGreen-light bg-cream-warm flex items-start gap-4">
        <Languages size={28} className="text-jamGreen flex-shrink-0 mt-1" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-base font-serif font-medium text-jamGreen-dark mb-1">
            Patois-aware mode
          </h3>
          <p className="text-sm text-jamBlack-soft mb-3 leading-relaxed">
            When enabled, the integrity statement and student-facing disclosure include a
            Patois-friendly register alongside Standard English. Useful for Jamaican classrooms.
          </p>
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={patoisMode}
              onChange={(e) => setPatoisMode(e.target.checked)}
              className="w-5 h-5 accent-jamGreen"
              aria-describedby="patois-mode-desc"
            />
            <span className="text-sm font-semibold text-jamBlack">
              Enable Patois-aware mode
            </span>
          </label>
          <span id="patois-mode-desc" className="sr-only">
            Toggles inclusion of Jamaican Patois in student-facing integrity statements
          </span>
        </div>
      </div>
    </div>
  </section>
);

/* ---------------- Step 2: Learning Outcomes ---------------- */

const OutcomesStep = ({
  context,
  lens,
  setLens,
  outcomes,
  setOutcomes,
  generating,
  error,
  onGenerate,
}: any) => {
  const [editIdx, setEditIdx] = useState(-1);
  return (
    <section aria-labelledby="outcomes-heading">
      <SectionHeading
        kicker="Step 2 of 6"
        title="Set the outcomes the assignment must serve."
        body="Choose a critical reflection lens, then let the designer draft outcomes you can edit. These will anchor the assignment and the rubric."
      />

      <Card>
        <Field label="Critical reflection lens" required hint="The angle this assignment will sharpen." htmlFor="lens-select">
          <SelectInput id="lens-select" value={lens} onChange={setLens} options={REFLECTION_LENSES} required />
        </Field>

        <div className="mt-5 flex flex-wrap gap-3">
          <PrimaryButton onClick={onGenerate} disabled={!lens || generating} icon={generating ? Loader2 : Sparkles}>
            <span className={generating ? "spin" : ""}>
              {generating ? "Drafting outcomes…" : outcomes.length ? "Regenerate outcomes" : "Draft outcomes"}
            </span>
          </PrimaryButton>
          {outcomes.length > 0 && (
            <GhostButton
              onClick={() =>
                setOutcomes([
                  ...outcomes,
                  {
                    verb: "Reflect",
                    statement: "Students will be able to ",
                    bloomLevel: "Evaluate",
                    purpose: "",
                  },
                ])
              }
              icon={Plus}
            >
              Add outcome
            </GhostButton>
          )}
        </div>
      </Card>

      <ErrorBanner message={error} onRetry={onGenerate} />

      {outcomes.length > 0 && (
        <ol className="mt-6 space-y-3 list-none p-0">
          {outcomes.map((o: any, i: number) => (
            <li
              key={i}
              className="rounded-md p-5 flex gap-4 items-start bg-white border-2 border-jamGreen-light"
            >
              <div
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-jamGreen text-cream font-serif"
                aria-hidden="true"
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                {editIdx === i ? (
                  <div className="space-y-2">
                    <TextInput
                      value={o.statement}
                      onChange={(v) => {
                        const next = [...outcomes];
                        next[i] = { ...next[i], statement: v };
                        setOutcomes(next);
                      }}
                      multiline
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <TextInput
                        value={o.bloomLevel}
                        onChange={(v) => {
                          const next = [...outcomes];
                          next[i] = { ...next[i], bloomLevel: v };
                          setOutcomes(next);
                        }}
                        placeholder="Bloom level"
                      />
                      <TextInput
                        value={o.purpose}
                        onChange={(v) => {
                          const next = [...outcomes];
                          next[i] = { ...next[i], purpose: v };
                          setOutcomes(next);
                        }}
                        placeholder="Why this outcome"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-base leading-relaxed mb-1.5 text-jamBlack">{o.statement}</div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="px-2 py-0.5 rounded uppercase tracking-[0.14em] font-semibold bg-cream-deep text-jamGreen-dark">
                        {o.bloomLevel}
                      </span>
                      {o.purpose && <span className="italic text-jamBlack-soft">{o.purpose}</span>}
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setEditIdx(editIdx === i ? -1 : i)}
                  className="p-1.5 rounded text-jamGreen hover:bg-jamGreen-light"
                  aria-label={editIdx === i ? `Save outcome ${i + 1}` : `Edit outcome ${i + 1}`}
                >
                  {editIdx === i ? <Save size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
                </button>
                <button
                  onClick={() => setOutcomes(outcomes.filter((_: any, j: number) => j !== i))}
                  className="p-1.5 rounded text-red-700 hover:bg-red-50"
                  aria-label={`Delete outcome ${i + 1}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

/* ---------------- Step 3: Brief ---------------- */

const BriefStep = ({ brief, setBrief, generating, error, onGenerate, hasOutcomes }: any) => {
  const [editing, setEditing] = useState(false);
  return (
    <section aria-labelledby="brief-heading">
      <SectionHeading
        kicker="Step 3 of 6"
        title="Draft the assignment itself."
        body="The designer will write the brief, the situated scenario, the tasks and deliverables, and four CARE reflection prompts. Edit anything you want to keep."
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <PrimaryButton onClick={onGenerate} disabled={!hasOutcomes || generating} icon={generating ? Loader2 : Sparkles}>
          <span className={generating ? "spin" : ""}>
            {generating ? "Drafting brief…" : brief ? "Regenerate brief" : "Draft assignment brief"}
          </span>
        </PrimaryButton>
        {brief && (
          <GhostButton onClick={() => setEditing(!editing)} icon={editing ? Save : Pencil}>
            {editing ? "Done editing" : "Edit"}
          </GhostButton>
        )}
      </div>

      <ErrorBanner message={error} onRetry={onGenerate} />

      {brief && (
        <Card>
          {editing ? (
            <div className="space-y-5">
              <Field label="Title" htmlFor="brief-title">
                <TextInput id="brief-title" value={brief.title} onChange={(v) => setBrief({ ...brief, title: v })} />
              </Field>
              <Field label="Summary" htmlFor="brief-summary">
                <TextInput id="brief-summary" value={brief.summary} onChange={(v) => setBrief({ ...brief, summary: v })} multiline rows={3} />
              </Field>
              <Field label="Scenario" htmlFor="brief-scenario">
                <TextInput id="brief-scenario" value={brief.scenario} onChange={(v) => setBrief({ ...brief, scenario: v })} multiline rows={5} />
              </Field>
              <Field label="Tasks (one per line)" htmlFor="brief-tasks">
                <TextInput
                  id="brief-tasks"
                  value={brief.tasks.join("\n")}
                  onChange={(v) => setBrief({ ...brief, tasks: v.split("\n").filter(Boolean) })}
                  multiline
                  rows={5}
                />
              </Field>
              <Field label="Deliverables (one per line)" htmlFor="brief-deliverables">
                <TextInput
                  id="brief-deliverables"
                  value={brief.deliverables.join("\n")}
                  onChange={(v) => setBrief({ ...brief, deliverables: v.split("\n").filter(Boolean) })}
                  multiline
                  rows={4}
                />
              </Field>
              <Field label="AI use guidance" htmlFor="brief-ai">
                <TextInput id="brief-ai" value={brief.aiUseGuidance} onChange={(v) => setBrief({ ...brief, aiUseGuidance: v })} multiline rows={4} />
              </Field>
              <p className="text-xs italic text-jamBlack-soft">CARE reflection prompts are best regenerated rather than edited piecemeal.</p>
            </div>
          ) : (
            <>
              <h3 className="text-2xl mb-2 font-serif font-medium text-jamGreen-dark">{brief.title}</h3>
              <p className="text-base italic mb-6 leading-relaxed text-jamBlack-soft">{brief.summary}</p>

              <SubSection label="Scenario">
                <p className="leading-relaxed text-jamBlack">{brief.scenario}</p>
              </SubSection>

              <SubSection label="Tasks">
                <ol className="list-decimal pl-5 space-y-1.5">
                  {brief.tasks.map((t: string, i: number) => (
                    <li key={i} className="text-jamBlack">{t}</li>
                  ))}
                </ol>
              </SubSection>

              <SubSection label="Deliverables">
                <ul className="list-disc pl-5 space-y-1.5">
                  {brief.deliverables.map((d: string, i: number) => (
                    <li key={i} className="text-jamBlack">{d}</li>
                  ))}
                </ul>
              </SubSection>

              <SubSection label="CARE Reflection Prompts">
                <div className="space-y-3">
                  {brief.criticalReflectionPrompts.map((p: any, i: number) => (
                    <div key={i} className="rounded p-3 bg-jamGold-light border border-jamGold-deep">
                      <div className="text-xs uppercase tracking-[0.18em] mb-1 font-bold text-jamGold-deep">{p.stage}</div>
                      <div className="text-jamBlack">{p.prompt}</div>
                    </div>
                  ))}
                </div>
              </SubSection>

              <SubSection label="AI Use Guidance" last>
                <p className="leading-relaxed text-jamBlack">{brief.aiUseGuidance}</p>
              </SubSection>
            </>
          )}
        </Card>
      )}
    </section>
  );
};

/* ---------------- Step 4: Integrity ---------------- */

const IntegrityStep = ({
  integrity,
  generating,
  error,
  onGenerate,
  hasBrief,
  patoisMode,
}: any) => (
  <section aria-labelledby="integrity-heading">
    <SectionHeading
      kicker="Step 4 of 6"
      title="State the terms of AI engagement."
      body="Every Sovereign assignment names what AI may do, what it may not do, and how the student will reflect on the dialogue. Generated using CARE, ACRE, and Caribbean sovereignty principles."
    />

    <div className="mb-5">
      <PrimaryButton onClick={onGenerate} disabled={!hasBrief || generating} icon={generating ? Loader2 : Shield}>
        <span className={generating ? "spin" : ""}>
          {generating ? "Drafting integrity statement…" : integrity ? "Regenerate statement" : "Draft integrity statement"}
        </span>
      </PrimaryButton>
    </div>

    <ErrorBanner message={error} onRetry={onGenerate} />

    {integrity && (
      <Card>
        <SubSection label="Permitted uses">
          <ul className="list-disc pl-5 space-y-1.5">
            {integrity.permittedUses.map((u: string, i: number) => (
              <li key={i} className="text-jamBlack">{u}</li>
            ))}
          </ul>
        </SubSection>

        <SubSection label="Restricted uses">
          <ul className="space-y-2 list-none p-0">
            {integrity.restrictedUses.map((u: any, i: number) => (
              <li key={i}>
                <span className="font-semibold text-jamBlack">{u.item}</span>{" "}
                <span className="italic text-jamBlack-soft">— {u.reason}</span>
              </li>
            ))}
          </ul>
        </SubSection>

        <SubSection label="Disclosure requirement">
          <div className="rounded p-4 text-sm leading-relaxed bg-jamGold-light border-2 border-dashed border-jamGold-deep text-jamBlack">
            {integrity.disclosureRequirement}
          </div>
          {patoisMode && integrity.studentFacingPatois && (
            <div className="mt-3 rounded p-4 text-sm leading-relaxed bg-jamGreen-light border-2 border-dashed border-jamGreen text-jamBlack">
              <span className="text-xs uppercase tracking-[0.18em] block mb-2 font-bold text-jamGreen-dark">
                Patois register
              </span>
              {integrity.studentFacingPatois}
            </div>
          )}
        </SubSection>

        <SubSection label="CARE reflection (Consider · Analyse · Reflect · Evaluate)">
          <p className="leading-relaxed text-jamBlack">{integrity.careReflection}</p>
        </SubSection>

        <SubSection label="ACRE evaluation (Accuracy · Completeness · Relevance · Equity)">
          <p className="leading-relaxed text-jamBlack">{integrity.acreEvaluation}</p>
        </SubSection>

        <SubSection label="Sovereignty note" last>
          <p className="leading-relaxed italic font-serif text-jamGreen-dark text-lg">{integrity.sovereigntyNote}</p>
        </SubSection>
      </Card>
    )}
  </section>
);

/* ---------------- Step 5: Rubric ---------------- */

const RubricStep = ({
  rubric,
  generating,
  error,
  onGenerate,
  ready,
  alignmentReport,
  alignmentChecking,
  alignmentError,
  onCheckAlignment,
}: any) => (
  <section aria-labelledby="rubric-heading">
    <SectionHeading
      kicker="Step 5 of 6"
      title="Build the rubric — aligned to every outcome."
      body="Each criterion traces back to specific outcomes. Performance levels distinguish thinking quality, not word count. Then run the alignment audit to confirm nothing slips through."
    />

    <div className="mb-5 flex flex-wrap gap-3">
      <PrimaryButton onClick={onGenerate} disabled={!ready || generating} icon={generating ? Loader2 : ListChecks}>
        <span className={generating ? "spin" : ""}>
          {generating ? "Building rubric…" : rubric ? "Regenerate rubric" : "Build rubric"}
        </span>
      </PrimaryButton>
      {rubric && (
        <GhostButton
          onClick={onCheckAlignment}
          disabled={alignmentChecking}
          icon={alignmentChecking ? Loader2 : CircleHelp}
        >
          <span className={alignmentChecking ? "spin" : ""}>
            {alignmentChecking ? "Auditing alignment…" : "Run alignment check"}
          </span>
        </GhostButton>
      )}
    </div>

    <ErrorBanner message={error} onRetry={onGenerate} />
    <ErrorBanner message={alignmentError} onRetry={onCheckAlignment} />

    {alignmentReport && (
      <div
        className={
          "rounded-lg p-5 mb-5 border-2 " +
          (alignmentReport.overallScore === "Strong"
            ? "bg-jamGreen-light border-jamGreen"
            : alignmentReport.overallScore === "Adequate"
            ? "bg-jamGold-light border-jamGold-deep"
            : "bg-red-50 border-red-300")
        }
      >
        <div className="flex items-start gap-3">
          {alignmentReport.overallScore === "Strong" ? (
            <CheckCircle2 size={22} className="text-jamGreen-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertTriangle size={22} className="text-jamGold-deep flex-shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="flex-1">
            <h4 className="text-sm uppercase tracking-[0.18em] font-bold mb-1 text-jamGreen-dark">
              Alignment audit · {alignmentReport.overallScore}
            </h4>
            <p className="text-sm text-jamBlack mb-3">{alignmentReport.summary}</p>
            {alignmentReport.orphanOutcomes?.length > 0 && (
              <div className="mb-2 text-sm">
                <strong className="text-jamBlack">Outcomes not measured:</strong>
                <ul className="list-disc pl-5 mt-1 text-jamBlack-soft">
                  {alignmentReport.orphanOutcomes.map((o: any, i: number) => (
                    <li key={i}>
                      Outcome {o.index}: {o.statement} — <em>Fix: {o.fix}</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {alignmentReport.orphanCriteria?.length > 0 && (
              <div className="text-sm">
                <strong className="text-jamBlack">Criteria with weak alignment:</strong>
                <ul className="list-disc pl-5 mt-1 text-jamBlack-soft">
                  {alignmentReport.orphanCriteria.map((c: any, i: number) => (
                    <li key={i}>
                      {c.name} — <em>Fix: {c.fix}</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {rubric && (
      <div className="space-y-4">
        {rubric.criteria.map((c: any, i: number) => (
          <Card key={i}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
              <h3 className="text-xl font-serif font-medium text-jamGreen-dark">{c.name}</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-0.5 rounded uppercase tracking-[0.14em] font-bold bg-jamGold-deep text-white">
                  {c.weight}%
                </span>
                <span className="text-jamBlack-soft">
                  Outcomes: {(c.outcomesAddressed || []).join(", ") || "—"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {["Distinguished", "Proficient", "Developing", "Emerging"].map((lvl) => (
                <div key={lvl} className="p-3 rounded bg-white border-2 border-jamGreen-light">
                  <div className="text-xs uppercase tracking-[0.16em] mb-1.5 font-bold text-jamGreen-dark">{lvl}</div>
                  <div className="text-sm leading-relaxed text-jamBlack">{c.levels[lvl]}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    )}
  </section>
);

/* ---------------- Step 6: Package & Downloads ---------------- */

const PackageStep = ({
  payload,
  onRestart,
  onSaveDraft,
  draftSaved,
}: {
  payload: any;
  onRestart: () => void;
  onSaveDraft: () => void;
  draftSaved: boolean;
}) => {
  const [copyState, setCopyState] = useState<"idle" | "lms-copied">("idle");
  const [busy, setBusy] = useState<string>("");

  const onDocx = async () => {
    setBusy("docx");
    try {
      await downloadDocx(payload);
    } finally {
      setBusy("");
    }
  };
  const onPdf = () => {
    setBusy("pdf");
    try {
      downloadPdf(payload);
    } finally {
      setBusy("");
    }
  };
  const onTxt = () => downloadTxt(payload);
  const onLms = async () => {
    await copyLmsToClipboard(payload);
    setCopyState("lms-copied");
    setTimeout(() => setCopyState("idle"), 1800);
  };

  return (
    <section aria-labelledby="package-heading">
      <SectionHeading
        kicker="Step 6 of 6"
        title="Your Sovereign assignment package."
        body="Review and download. Every section is editable in earlier steps. Every export carries CARE, CRAFT, ACRE, and Sovereign AI attribution."
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <PrimaryButton onClick={onDocx} disabled={busy === "docx"} icon={busy === "docx" ? Loader2 : FileType2}>
          <span className={busy === "docx" ? "spin" : ""}>
            {busy === "docx" ? "Building Word doc…" : "Download Word (.docx)"}
          </span>
        </PrimaryButton>
        <PrimaryButton onClick={onPdf} disabled={busy === "pdf"} icon={busy === "pdf" ? Loader2 : FileDown}>
          {busy === "pdf" ? "Building PDF…" : "Download PDF"}
        </PrimaryButton>
        <GhostButton onClick={onTxt} icon={FileText}>
          Download plain text (.txt)
        </GhostButton>
        <GhostButton onClick={onLms} icon={copyState === "lms-copied" ? Check : Copy}>
          {copyState === "lms-copied" ? "Copied to clipboard" : "Copy LMS-ready Markdown"}
        </GhostButton>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <GhostButton onClick={onSaveDraft} icon={draftSaved ? Check : Save}>
          {draftSaved ? "Draft saved" : "Save draft to this browser"}
        </GhostButton>
        <GhostButton onClick={onRestart} icon={RefreshCw}>
          Start a new design
        </GhostButton>
      </div>

      <Card accent>
        <h3 className="text-lg font-serif font-medium text-jamGreen-dark mb-3">Preview</h3>
        <pre
          className="whitespace-pre-wrap text-sm leading-relaxed text-jamBlack p-4 bg-white rounded border border-jamGreen-light max-h-[55vh] overflow-y-auto"
          aria-label="Generated package preview"
        >
          {buildPlainText(payload)}
        </pre>
      </Card>
    </section>
  );
};

/* ---------------- Drafts modal ---------------- */

const DraftsPanel = ({
  drafts,
  onResume,
  onDelete,
  onClose,
}: {
  drafts: DesignerDraft[];
  onResume: (d: DesignerDraft) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="drafts-title"
    className="fixed inset-0 z-50 flex items-center justify-center bg-jamBlack/60 p-4"
    onClick={onClose}
  >
    <div
      className="bg-cream rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border-2 border-jamGreen"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 id="drafts-title" className="text-xl font-serif font-medium text-jamGreen-dark">
          Saved drafts
        </h2>
        <button onClick={onClose} aria-label="Close drafts panel" className="p-2 hover:bg-jamGreen-light rounded">
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
      {drafts.length === 0 ? (
        <p className="text-jamBlack-soft italic">No saved drafts yet.</p>
      ) : (
        <ul className="space-y-3 list-none p-0">
          {drafts.map((d) => (
            <li
              key={d.id}
              className="p-4 rounded border-2 border-jamGreen-light bg-white flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-jamBlack truncate">{d.name}</div>
                <div className="text-xs text-jamBlack-soft">
                  Saved {new Date(d.savedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onResume(d)}
                  className="px-3 py-1.5 text-xs uppercase tracking-[0.12em] font-semibold bg-jamGreen text-cream rounded hover:bg-jamGreen-dark"
                >
                  Resume
                </button>
                <button
                  onClick={() => onDelete(d.id)}
                  aria-label={`Delete draft ${d.name}`}
                  className="px-3 py-1.5 text-xs uppercase tracking-[0.12em] font-semibold border-2 border-red-300 text-red-700 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

/* ---------------- Main component ---------------- */

const initialContext = {
  courseTitle: "",
  discipline: "",
  level: "",
  region: "",
  modality: "",
  timeOnTask: "",
  learnerProfile: "",
  topic: "",
  aiAccess: "",
};

export default function SovereignLearningDesigner() {
  const [step, setStep] = useState(0);
  const [context, setContext] = useState(initialContext);
  const [lens, setLens] = useState("");
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [brief, setBrief] = useState<any>(null);
  const [integrity, setIntegrity] = useState<any>(null);
  const [rubric, setRubric] = useState<any>(null);
  const [alignmentReport, setAlignmentReport] = useState<any>(null);
  const [patoisMode, setPatoisMode] = useState(false);

  const [generating, setGenerating] = useState({
    outcomes: false,
    brief: false,
    integrity: false,
    rubric: false,
    alignment: false,
  });
  const [errors, setErrors] = useState({
    outcomes: "",
    brief: "",
    integrity: "",
    rubric: "",
    alignment: "",
  });

  const [drafts, setDrafts] = useState<DesignerDraft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [draftId, setDraftId] = useState<string>("");
  const [draftSaved, setDraftSaved] = useState(false);

  const mainRef = useRef<HTMLElement>(null);

  // Load saved drafts on mount (async — works against Supabase if configured,
  // localStorage otherwise)
  useEffect(() => {
    let cancelled = false;
    loadAllDrafts()
      .then((d) => {
        if (!cancelled) setDrafts(d);
      })
      .catch((e) => console.warn("[sld] could not load drafts:", e?.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Move focus to main when step changes (a11y)
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus();
    }
  }, [step]);

  const setGen = (k: keyof typeof generating, v: boolean) => setGenerating((g) => ({ ...g, [k]: v }));
  const setErr = (k: keyof typeof errors, v: string) => setErrors((e) => ({ ...e, [k]: v }));

  const generateOutcomes = async () => {
    setErr("outcomes", "");
    setGen("outcomes", true);
    try {
      const text = await callClaude({
        system: outcomesSystemPrompt,
        user: buildOutcomesPrompt(context, lens),
      });
      const json = extractJSON(text);
      if (!json.outcomes || !Array.isArray(json.outcomes)) throw new Error("Unexpected response shape.");
      setOutcomes(json.outcomes);
    } catch (e: any) {
      setErr("outcomes", e.message || "Could not generate outcomes.");
    } finally {
      setGen("outcomes", false);
    }
  };

  const generateBrief = async () => {
    setErr("brief", "");
    setGen("brief", true);
    try {
      const text = await callClaude({
        system: briefSystemPrompt,
        user: buildBriefPrompt(context, lens, outcomes),
        maxTokens: 1800,
      });
      const json = extractJSON(text);
      if (!json.title || !json.tasks) throw new Error("Unexpected response shape.");
      setBrief(json);
    } catch (e: any) {
      setErr("brief", e.message || "Could not generate brief.");
    } finally {
      setGen("brief", false);
    }
  };

  const generateIntegrity = async () => {
    setErr("integrity", "");
    setGen("integrity", true);
    try {
      const text = await callClaude({
        system: integritySystemPrompt,
        user: buildIntegrityPrompt(context, brief, patoisMode),
        maxTokens: 1500,
      });
      const json = extractJSON(text);
      if (!json.permittedUses) throw new Error("Unexpected response shape.");
      setIntegrity(json);
    } catch (e: any) {
      setErr("integrity", e.message || "Could not generate integrity statement.");
    } finally {
      setGen("integrity", false);
    }
  };

  const generateRubric = async () => {
    setErr("rubric", "");
    setGen("rubric", true);
    try {
      const text = await callClaude({
        system: rubricSystemPrompt,
        user: buildRubricPrompt(context, outcomes, brief),
        maxTokens: 1800,
      });
      const json = extractJSON(text);
      if (!json.criteria) throw new Error("Unexpected response shape.");
      setRubric(json);
      setAlignmentReport(null); // invalidate any previous audit
    } catch (e: any) {
      setErr("rubric", e.message || "Could not generate rubric.");
    } finally {
      setGen("rubric", false);
    }
  };

  const checkAlignment = async () => {
    if (!rubric || outcomes.length === 0) return;
    setErr("alignment", "");
    setGen("alignment", true);
    try {
      const text = await callClaude({
        system: alignmentSystemPrompt,
        user: buildAlignmentPrompt(outcomes, rubric),
        maxTokens: 1200,
      });
      const json = extractJSON(text);
      setAlignmentReport(json);
    } catch (e: any) {
      setErr("alignment", e.message || "Could not run alignment audit.");
    } finally {
      setGen("alignment", false);
    }
  };

  const restart = () => {
    setStep(0);
    setContext(initialContext);
    setLens("");
    setOutcomes([]);
    setBrief(null);
    setIntegrity(null);
    setRubric(null);
    setAlignmentReport(null);
    setDraftId("");
    setDraftSaved(false);
    setErrors({ outcomes: "", brief: "", integrity: "", rubric: "", alignment: "" });
  };

  const saveDraftHandler = useCallback(async () => {
    const id = draftId || newDraftId();
    const name = brief?.title || context.courseTitle || `Draft ${new Date().toLocaleDateString()}`;
    try {
      const saved = await saveDraft({
        id,
        name,
        savedAt: new Date().toISOString(),
        context,
        lens,
        outcomes,
        brief,
        integrity,
        rubric,
        alignmentReport,
        patoisMode,
      });
      setDraftId(saved.id);
      const refreshed = await loadAllDrafts();
      setDrafts(refreshed);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2400);
    } catch (e: any) {
      console.warn("[sld] saveDraft failed:", e?.message);
    }
  }, [draftId, brief, context, lens, outcomes, integrity, rubric, alignmentReport, patoisMode]);

  const resumeDraft = (d: DesignerDraft) => {
    setContext(d.context);
    setLens(d.lens);
    setOutcomes(d.outcomes || []);
    setBrief(d.brief);
    setIntegrity(d.integrity);
    setRubric(d.rubric);
    setAlignmentReport(d.alignmentReport);
    setPatoisMode(!!d.patoisMode);
    setDraftId(d.id);
    setShowDrafts(false);
    setStep(d.brief && d.rubric ? 6 : d.outcomes?.length ? 2 : 1);
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      await deleteDraft(id);
      const refreshed = await loadAllDrafts();
      setDrafts(refreshed);
    } catch (e: any) {
      console.warn("[sld] deleteDraft failed:", e?.message);
    }
  };

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return (
          !!context.courseTitle.trim() &&
          !!context.discipline.trim() &&
          !!context.level &&
          !!context.region &&
          !!context.modality &&
          !!context.topic.trim() &&
          !!context.learnerProfile.trim() &&
          !!context.aiAccess
        );
      case 2:
        return outcomes.length >= 3 && !!lens;
      case 3:
        return !!brief;
      case 4:
        return !!integrity;
      case 5:
        return !!rubric;
      default:
        return true;
    }
  })();

  return (
    <div className="min-h-screen w-full bg-cream">
      {/* Top bar */}
      <header
        className="sticky top-0 z-20 backdrop-blur-sm bg-cream/90 border-b-2 border-jamGreen-light no-print"
        role="banner"
      >
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded flex items-center justify-center bg-jamGreen"
              aria-hidden="true"
            >
              <Sparkles size={18} className="text-jamGold" strokeWidth={2.4} />
            </div>
            <div>
              <h1 className="text-base leading-none font-serif font-semibold text-jamGreen-dark">
                Sovereign AI Learning Designer
              </h1>
              <p className="text-[10px] uppercase tracking-[0.22em] mt-1 font-medium text-jamBlack-soft">
                Caribbean educators · CARE · CRAFT · ACRE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {drafts.length > 0 && (
              <button
                onClick={() => setShowDrafts(true)}
                className="text-xs uppercase tracking-[0.12em] font-semibold text-jamGreen hover:text-jamGreen-dark inline-flex items-center gap-1.5"
                aria-label={`Open saved drafts, ${drafts.length} available`}
              >
                <FolderOpen size={14} aria-hidden="true" />
                Drafts ({drafts.length})
              </button>
            )}
            <Stepper current={step} onJump={(i) => setStep(i)} allowJump={step > 0} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14 pb-32 outline-none"
      >
        {step === 0 && (
          <WelcomeStep
            onBegin={() => setStep(1)}
            onResume={() => setShowDrafts(true)}
            drafts={drafts}
          />
        )}
        {step === 1 && (
          <ContextStep
            context={context}
            setContext={setContext}
            patoisMode={patoisMode}
            setPatoisMode={setPatoisMode}
          />
        )}
        {step === 2 && (
          <OutcomesStep
            context={context}
            lens={lens}
            setLens={setLens}
            outcomes={outcomes}
            setOutcomes={setOutcomes}
            generating={generating.outcomes}
            error={errors.outcomes}
            onGenerate={generateOutcomes}
          />
        )}
        {step === 3 && (
          <BriefStep
            brief={brief}
            setBrief={setBrief}
            generating={generating.brief}
            error={errors.brief}
            onGenerate={generateBrief}
            hasOutcomes={outcomes.length > 0}
          />
        )}
        {step === 4 && (
          <IntegrityStep
            integrity={integrity}
            generating={generating.integrity}
            error={errors.integrity}
            onGenerate={generateIntegrity}
            hasBrief={!!brief}
            patoisMode={patoisMode}
          />
        )}
        {step === 5 && (
          <RubricStep
            rubric={rubric}
            generating={generating.rubric}
            error={errors.rubric}
            onGenerate={generateRubric}
            ready={outcomes.length > 0 && !!brief}
            alignmentReport={alignmentReport}
            alignmentChecking={generating.alignment}
            alignmentError={errors.alignment}
            onCheckAlignment={checkAlignment}
          />
        )}
        {step === 6 && (
          <PackageStep
            payload={{
              context,
              lens,
              outcomes,
              brief,
              integrity,
              rubric,
              alignmentReport,
              patoisMode,
            }}
            onRestart={restart}
            onSaveDraft={saveDraftHandler}
            draftSaved={draftSaved}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        className="border-t-2 border-jamGreen-light bg-cream-warm py-6 px-5 md:px-8 no-print"
        role="contentinfo"
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-jamBlack-soft">
          <div>
            Created by <strong className="text-jamGreen-dark">Dr. Rohan Jowallah, Ed.D.</strong> — Frameworks
            CARE · CRAFT · ACRE · Sovereign AI.
          </div>
          <div className="italic">Designed for Caribbean educators · WCAG-AA accessible.</div>
        </div>
      </footer>

      {/* Bottom navigation */}
      {step > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 backdrop-blur-sm bg-cream/95 border-t-2 border-jamGreen-light no-print"
          role="navigation"
          aria-label="Step navigation"
        >
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-3 flex items-center justify-between gap-3">
            <GhostButton onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} icon={ArrowLeft}>
              Back
            </GhostButton>
            <div className="text-xs uppercase tracking-[0.18em] hidden md:block text-jamBlack-soft">
              {STEPS[step].label}
            </div>
            {step < STEPS.length - 1 ? (
              <PrimaryButton
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                disabled={!canAdvance}
                icon={ArrowRight}
                ariaLabel={
                  !canAdvance
                    ? "Complete required fields before continuing"
                    : `Continue to ${STEPS[step + 1]?.label}`
                }
              >
                Continue
              </PrimaryButton>
            ) : (
              <div style={{ width: 1 }} />
            )}
          </div>
        </div>
      )}

      {/* Drafts modal */}
      {showDrafts && (
        <DraftsPanel
          drafts={drafts}
          onResume={resumeDraft}
          onDelete={handleDeleteDraft}
          onClose={() => setShowDrafts(false)}
        />
      )}
    </div>
  );
}
