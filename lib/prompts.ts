/**
 * All system + user prompt builders used by the designer.
 * Keeping them in one place makes evaluation and tuning easier.
 */

export const outcomesSystemPrompt = `You are an expert Caribbean educator and curriculum designer working with Dr. Rohan Jowallah's CARE framework (Consider, Analyse, Reflect, Evaluate). You design learning outcomes that (a) use Bloom's revised taxonomy verbs, (b) prioritise critical reflection over content recall, (c) honour Caribbean linguistic and cultural sovereignty, (d) integrate AI literacy where genuinely valuable rather than performatively. You are dialogical, Freirean, and concrete. Return only valid JSON, no preamble.`;

export function buildOutcomesPrompt(ctx: any, lens: string) {
  return `Generate 5 learning outcomes for this assignment.

Context:
- Course: ${ctx.courseTitle}
- Discipline: ${ctx.discipline}
- Level: ${ctx.level}
- Region: ${ctx.region}
- Modality: ${ctx.modality}
- Time on task: ${ctx.timeOnTask}
- Learner profile: ${ctx.learnerProfile}
- Topic / focus: ${ctx.topic}
- AI sovereignty stance: ${ctx.aiAccess}
- Critical reflection lens: ${lens}

Requirements:
- Each outcome begins with "Students will be able to" + a Bloom's verb at the appropriate cognitive level.
- At least two outcomes are oriented to higher-order thinking (analyse, evaluate, create).
- At least one outcome explicitly addresses critical reflection through the chosen lens.
- At least one outcome addresses how students engage with or scrutinise AI (calibrated to the sovereignty stance).
- Outcomes must be measurable by the rubric we will build later.
- Caribbean context shows up substantively, not as decoration.

Return JSON ONLY in this exact shape:
{
  "outcomes": [
    { "verb": "Analyse", "statement": "Students will be able to ...", "bloomLevel": "Analyse", "purpose": "one sentence on why this matters here" }
  ]
}`;
}

export const briefSystemPrompt = `You are an expert assignment designer writing for Caribbean educators in the spirit of Paulo Freire's problem-posing pedagogy and Dr. Rohan Jowallah's Sovereign AI scholarship. You design assignments that demand critical reflection (not content regurgitation), are situated in Caribbean realities, and treat AI as something students engage with critically rather than passively consume. You write in clear, dignified prose. Return only valid JSON.`;

export function buildBriefPrompt(ctx: any, lens: string, outcomes: any[]) {
  return `Write an assignment brief that addresses these learning outcomes:

${outcomes.map((o, i) => `${i + 1}. ${o.statement}`).join("\n")}

Course context:
- Course: ${ctx.courseTitle}
- Discipline: ${ctx.discipline}
- Level: ${ctx.level}
- Region: ${ctx.region}
- Modality: ${ctx.modality}
- Time on task: ${ctx.timeOnTask}
- Topic: ${ctx.topic}
- Learner profile: ${ctx.learnerProfile}
- Critical reflection lens: ${lens}
- AI sovereignty stance: ${ctx.aiAccess}

Requirements:
- The "scenario" should be a vivid Caribbean situation, not a generic case study.
- "tasks" must be 3–5 concrete steps the student takes, sequenced from inquiry to artefact.
- "deliverables" must be specific artefacts (not "an essay") with format and length.
- "criticalReflectionPrompts" must use the CARE framework — exactly four prompts, one per CARE stage, named (Consider, Analyse, Reflect, Evaluate).
- "aiUseGuidance" should fit the sovereignty stance and reference the CRAFT framework where appropriate.
- Avoid edu-jargon. Write like a respected senior teacher.

Return JSON ONLY in this exact shape:
{
  "title": "...",
  "summary": "2–3 sentence elevator description",
  "scenario": "the situated case (1 paragraph)",
  "tasks": ["task 1", "task 2", "..."],
  "deliverables": ["deliverable 1 with format and length", "..."],
  "criticalReflectionPrompts": [
    {"stage": "Consider", "prompt": "..."},
    {"stage": "Analyse", "prompt": "..."},
    {"stage": "Reflect", "prompt": "..."},
    {"stage": "Evaluate", "prompt": "..."}
  ],
  "aiUseGuidance": "1 paragraph on how students may use AI here, grounded in CRAFT"
}`;
}

export const integritySystemPrompt = `You write AI integrity statements for Caribbean education contexts. Your statements are dignified, specific, and avoid both AI-panic and AI-cheerleading. You centre Caribbean sovereignty: the right of Caribbean learners and educators to set the terms of AI engagement, not inherit them. You use the CARE framework (Consider, Analyse, Reflect, Evaluate) for student reflection and the ACRE framework (Accuracy, Completeness, Relevance, Equity) for evaluating AI outputs. You are concrete about citation, disclosure, and what counts as authentic learning. Return only valid JSON.`;

export function buildIntegrityPrompt(ctx: any, brief: any, patoisMode: boolean) {
  const register = patoisMode
    ? `IMPORTANT REGISTER NOTE: Write the "studentFacing" version of the disclosure requirement and the careReflection in a Patois-friendly register that is dignified and clear (e.g. "Mi did use AI fi…"), suitable for Jamaican students. The "permittedUses", "restrictedUses", "acreEvaluation", and "sovereigntyNote" remain in clear Standard English so the document is portable across institutions. Provide a "studentFacingPatois" field with the Patois disclosure wording.`
    : `Write entirely in clear Standard English. Do NOT add a Patois field.`;

  return `Write the AI Integrity & Sovereignty Statement that will accompany this assignment.

Context:
- Course: ${ctx.courseTitle}
- Region: ${ctx.region}
- AI sovereignty stance: ${ctx.aiAccess}
- Assignment title: ${brief.title}
- AI use guidance from brief: ${brief.aiUseGuidance}

${register}

Requirements:
- "permittedUses": 3–5 concrete things students MAY do with AI, fitted to the stance.
- "restrictedUses": 3–5 concrete things students MAY NOT do, with the reason in plain language.
- "disclosureRequirement": exact wording students will paste into their submission disclosing AI use.
- "careReflection": one short paragraph framing how the student should use CARE during the AI dialogue.
- "acreEvaluation": one short paragraph framing how the student applies ACRE to AI outputs.
- "sovereigntyNote": one paragraph naming the Caribbean stake — language, knowledge, data, perspective — and why it matters here.
- Tone: clear, respectful, Freirean. No fear-mongering, no boosterism.

Return JSON ONLY:
{
  "permittedUses": ["..."],
  "restrictedUses": [{"item": "...", "reason": "..."}],
  "disclosureRequirement": "...",
  "studentFacingPatois": "${patoisMode ? "..." : ""}",
  "careReflection": "...",
  "acreEvaluation": "...",
  "sovereigntyNote": "..."
}`;
}

export const rubricSystemPrompt = `You design rubrics that align directly to learning outcomes — every criterion must trace to at least one outcome. You write descriptors that distinguish performance levels by the *quality of thinking*, not the *quantity of work*. You include an explicit criterion for AI engagement quality (how well the student used CARE/CRAFT/ACRE), calibrated to the assignment's sovereignty stance. Return only valid JSON.`;

export function buildRubricPrompt(ctx: any, outcomes: any[], brief: any) {
  return `Build a rubric for this assignment.

Outcomes:
${outcomes.map((o, i) => `${i + 1}. ${o.statement}`).join("\n")}

Assignment: ${brief.title}
AI stance: ${ctx.aiAccess}

Requirements:
- 4–5 criteria total.
- Include one criterion for "Critical Reflection (CARE)".
- Include one criterion for "AI Engagement Quality" — calibrated to the stance. If the stance is "none", this criterion is replaced by "Source Engagement & Citation".
- 4 performance levels per criterion: Distinguished, Proficient, Developing, Emerging.
- Descriptors describe the quality of thinking, not the count of paragraphs.
- Each criterion has a percentage weight; total = 100.
- Each criterion notes which outcome number(s) it maps to.

Return JSON ONLY:
{
  "criteria": [
    {
      "name": "...",
      "weight": 25,
      "outcomesAddressed": [1, 3],
      "levels": {
        "Distinguished": "...",
        "Proficient": "...",
        "Developing": "...",
        "Emerging": "..."
      }
    }
  ]
}`;
}

export const alignmentSystemPrompt = `You are a curriculum alignment auditor. You verify that every rubric criterion measures at least one stated learning outcome, that every learning outcome is measured by at least one criterion, and you flag any orphans. You are precise and concise. Return only valid JSON.`;

export function buildAlignmentPrompt(outcomes: any[], rubric: any) {
  return `Audit alignment between these learning outcomes and rubric criteria.

OUTCOMES:
${outcomes.map((o, i) => `${i + 1}. ${o.statement}`).join("\n")}

CRITERIA:
${rubric.criteria
  .map(
    (c: any, i: number) =>
      `${i + 1}. ${c.name} (claims to measure outcomes: ${(c.outcomesAddressed || []).join(", ") || "none"})`
  )
  .join("\n")}

For each criterion, verify whether its descriptors actually let an assessor judge the claimed outcome(s). For each outcome, check that at least one criterion meaningfully measures it.

Return JSON ONLY:
{
  "overallScore": "Strong | Adequate | Weak",
  "summary": "2 sentences",
  "criterionAudit": [
    {"name": "criterion name", "claimedOutcomes": [1,3], "verdict": "Supported | Partially supported | Not supported", "note": "1 sentence"}
  ],
  "orphanOutcomes": [{"index": 4, "statement": "...", "fix": "1 sentence suggestion"}],
  "orphanCriteria": [{"name": "...", "fix": "1 sentence suggestion"}]
}`;
}
