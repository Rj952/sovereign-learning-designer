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

## Hardening (built-in, configurable via env vars)

Two production safeguards ship in the codebase. Both are off by default — turn them on by setting the relevant env vars in Vercel.

### 1. Per-IP rate limiting (always on)

`/api/generate` enforces an in-memory token bucket. Defaults: **30 requests per IP per hour**. Configure via:

| Env var | Default | What it does |
|---|---|---|
| `RATE_LIMIT_MAX` | `30` | Max requests per IP per window |
| `RATE_LIMIT_WINDOW_MS` | `3600000` | Window length, in milliseconds |

Cold starts and horizontal scaling reset counters per instance — for stricter, durable limits, swap the in-memory store for Vercel KV or Upstash Redis with `@upstash/ratelimit`.

### 2. Optional shared-code access gate

When `ACCESS_CODE` is set in your Vercel env vars, the entire app is locked behind `/unlock`. A correct code sets a 30-day HTTP-only cookie that lets the user back in.

| Env var | Default | What it does |
|---|---|---|
| `ACCESS_CODE` | _unset_ | When set, requires this code at `/unlock` to access any non-public route |

**To turn the gate on:** Vercel → Project Settings → Environment Variables → add `ACCESS_CODE` with a value of your choice → Redeploy.
**To turn it off:** delete the env var and redeploy.

---

## Further hardening (recommended next steps)

1. **Durable rate limiting** — replace the in-memory bucket with Vercel KV or Upstash Redis.
2. **Persistence beyond localStorage** — Supabase or similar so drafts survive across devices/browsers.
3. **Usage analytics** — Vercel Analytics or Plausible. No PII.

---

## Credits & licence

- Created by **Dr. Rohan Jowallah, Ed.D.**
- Frameworks: **CARE** (Consider · Analyse · Reflect · Evaluate), **CRAFT** (Context · Role · Action · Format · Threshold), **ACRE** (Accuracy · Completeness · Relevance · Equity), and **Sovereign AI** — all © Dr. Rohan Jowallah.
- Code released under **CC-BY-NC-SA 4.0**. Frameworks must be credited in any derivative work.
- Built with [Next.js](https://nextjs.org), [Anthropic Claude](https://anthropic.com), [docx](https://docx.js.org), [jsPDF](https://github.com/parallax/jsPDF), and [Lucide](https://lucide.dev) icons.

---

> "Sovereignty in AI education is not refusal — it is the right to set the terms."
