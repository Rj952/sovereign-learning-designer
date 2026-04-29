# Sovereign AI Learning Designer · Caribbean Edition

> Design assignments that sharpen thinking, not soften it.

A guided, integrity-centred AI assignment designer for Caribbean educators. Built on the **CARE**, **CRAFT**, and **ACRE** frameworks. Created by **Dr. Rohan Jowallah, Ed.D.**

Jamaican-themed. WCAG-AA accessible. Production-ready Next.js 14 on Vercel.

---

## What it does

Walks a Caribbean educator through a six-step design process and produces a complete assignment package:

1. **Course context** — discipline, level, region, modality, learner profile, AI sovereignty stance.
2. **Learning outcomes** — five Bloom's-aligned outcomes anchored to a critical-reflection lens.
3. **Assignment brief** — situated Caribbean scenario, tasks, deliverables, four CARE prompts, AI use guidance.
4. **AI integrity statement** — permitted/restricted uses, disclosure language (with optional Patois register), CARE & ACRE framing, sovereignty note.
5. **Aligned rubric** — 4–5 criteria, each traced to specific outcomes, four performance levels.
6. **Final package** — review and download as **Word (.docx)**, **PDF**, **plain text**, or copy as **LMS-ready Markdown**.

### Built-in add-ons

- **Save & resume drafts** — multiple drafts per browser via localStorage; named, dated, deletable.
- **Alignment audit** — runs an AI check that every rubric criterion measures at least one stated outcome and flags orphans.
- **Patois-aware mode** — student-facing disclosure renders in both Standard English and a dignified Jamaican Patois register.
- **Copy to LMS** — one-click Markdown formatted for Moodle, Canvas, Google Classroom, Notion, etc.

### Accessibility

- Skip-to-main link, semantic landmarks (`header`, `main`, `footer`, `nav`).
- ARIA labels on all icon buttons; `aria-current="step"` on the active step.
- Required fields use `required` + `aria-required` + visible asterisk.
- Focus-visible rings (jamaican gold) on every focusable element.
- WCAG-AA contrast on every text/background combination (deep green `#006B3C`, gold `#C99A00`).
- Respects `prefers-reduced-motion` and `prefers-contrast: more`.
- Print stylesheet hides nav and renders documents cleanly.

---

## Local development

Requirements: Node 18.18+ and an Anthropic API key.

```bash
npm install
cp .env.example .env.local
# edit .env.local and add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

---

## Deploy to Vercel (recommended path)

### 1. Push to GitHub

```bash
cd sovereign-learning-designer
git init
git add .
git commit -m "Sovereign AI Learning Designer — initial commit"
git branch -M main
# create the empty repo on github.com first, then:
git remote add origin git@github.com:YOUR_USERNAME/sovereign-learning-designer.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com → **Add New… → Project**.
2. Import the repo you just pushed.
3. Framework will auto-detect as **Next.js**. Build/install commands are pre-configured in `vercel.json`.
4. Before clicking **Deploy**, open **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `ANTHROPIC_API_KEY` | `sk-ant-...` (from https://console.anthropic.com) |
   | `ANTHROPIC_MODEL` | _(optional)_ e.g. `claude-sonnet-4-5` |

5. Click **Deploy**. First deploy takes ~90s.

Vercel will auto-deploy every push to `main`.

### 3. Custom domain (optional)

In **Project Settings → Domains**, add any domain you control and follow Vercel's DNS instructions.

---

## Architecture

```
sovereign-learning-designer/
├── app/
│   ├── page.tsx                       — mounts the designer
│   ├── layout.tsx                     — fonts, metadata, skip link, flag accent
│   ├── globals.css                    — Jamaican palette + a11y styles
│   └── api/generate/route.ts          — server route that holds ANTHROPIC_API_KEY
├── components/
│   └── SovereignLearningDesigner.tsx  — the main 6-step component
├── lib/
│   ├── prompts.ts                     — all system + user prompts
│   ├── exporters.ts                   — DOCX, PDF, TXT, LMS Markdown
│   └── storage.ts                     — localStorage drafts
├── tailwind.config.ts                 — `jamGreen`, `jamGold`, `jamBlack`, `cream`
├── next.config.mjs
├── tsconfig.json
├── vercel.json
└── .env.example
```

The Anthropic API key never reaches the browser. All Claude calls go through `/api/generate`.

---

## Production hardening (recommended next steps)

The app is safe to share with a closed pilot today. Before opening it to the public, add:

1. **Rate limiting** on `/api/generate` — Vercel KV or Upstash Redis with a per-IP token bucket. Without it, anyone with the URL can run up your Anthropic bill.
2. **Access gating** — a simple shared-password env var and middleware check is enough for institutional rollouts.
3. **Persistence beyond localStorage** — Supabase or similar for drafts that survive across devices/browsers.
4. **Usage analytics** — Vercel Analytics or Plausible. No PII.

---

## Credits & licence

- Created by **Dr. Rohan Jowallah, Ed.D.**
- Frameworks: **CARE** (Consider · Analyse · Reflect · Evaluate), **CRAFT** (Context · Role · Action · Format · Threshold), **ACRE** (Accuracy · Completeness · Relevance · Equity), and **Sovereign AI** — all © Dr. Rohan Jowallah.
- Code released under **CC-BY-NC-SA 4.0**. Frameworks must be credited in any derivative work.
- Built with [Next.js](https://nextjs.org), [Anthropic Claude](https://anthropic.com), [docx](https://docx.js.org), [jsPDF](https://github.com/parallax/jsPDF), and [Lucide](https://lucide.dev) icons.

---

> "Sovereignty in AI education is not refusal — it is the right to set the terms."
