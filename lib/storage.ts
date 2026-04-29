/**
 * Save & resume drafts via localStorage.
 * Keyed list of named drafts so a single educator can keep multiple in flight.
 */

const KEY = "sovereign-learning-designer:drafts:v1";

export type DesignerDraft = {
  id: string;
  name: string;
  savedAt: string;
  context: any;
  lens: string;
  outcomes: any[];
  brief: any;
  integrity: any;
  rubric: any;
  alignmentReport: any;
  patoisMode: boolean;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadAllDrafts(): DesignerDraft[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDraft(draft: DesignerDraft) {
  if (!isBrowser()) return;
  const all = loadAllDrafts();
  const idx = all.findIndex((d) => d.id === draft.id);
  if (idx >= 0) {
    all[idx] = draft;
  } else {
    all.push(draft);
  }
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteDraft(id: string) {
  if (!isBrowser()) return;
  const next = loadAllDrafts().filter((d) => d.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function newDraftId(): string {
  return "draft_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
