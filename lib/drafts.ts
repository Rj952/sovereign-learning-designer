"use client";

/**
 * Hybrid drafts store.
 *
 * - If Supabase env vars are set AND anon sign-in succeeded → use Supabase.
 *   Drafts sync across every device that signs into the same browser session
 *   (Supabase persists the JWT in localStorage by default).
 *
 * - Otherwise → fall back to plain localStorage. The app still works.
 *
 * The first successful Supabase sync also migrates any existing localStorage
 * drafts so the educator doesn't lose work.
 */

import { ensureAnonSession, getSupabase } from "./supabase";
import * as legacy from "./storage";

export type DesignerDraft = legacy.DesignerDraft;

const TABLE = "sld_drafts";

let _backendPromise: Promise<"supabase" | "local"> | null = null;

async function backend(): Promise<"supabase" | "local"> {
  if (_backendPromise) return _backendPromise;
  _backendPromise = (async () => {
    const sb = getSupabase();
    if (!sb) return "local" as const;
    const userId = await ensureAnonSession();
    if (!userId) return "local" as const;
    // Best-effort: migrate any local drafts that aren't yet in Supabase.
    try {
      await migrateLocalToSupabase(userId);
    } catch (e) {
      // Non-fatal — continue with Supabase.
      console.warn("[sld] Local→Supabase migration skipped:", (e as Error).message);
    }
    return "supabase" as const;
  })();
  return _backendPromise;
}

async function migrateLocalToSupabase(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const local = legacy.loadAllDrafts();
  if (!local.length) return;
  const rows = local.map((d) => ({
    id: d.id.startsWith("draft_") ? undefined : d.id, // let DB generate uuid for legacy ids
    user_id: userId,
    name: d.name,
    saved_at: d.savedAt,
    payload: stripIdAndName(d),
  }));
  // Upsert by id (only valid ids); insert the rest
  const withId = rows.filter((r) => r.id);
  const withoutId = rows.filter((r) => !r.id);
  if (withId.length) {
    await sb.from(TABLE).upsert(withId, { onConflict: "id" });
  }
  if (withoutId.length) {
    await sb.from(TABLE).insert(withoutId);
  }
}

function stripIdAndName(d: DesignerDraft) {
  const { id: _i, name: _n, savedAt: _s, ...rest } = d;
  return rest;
}

function rowToDraft(row: any): DesignerDraft {
  const p = row.payload || {};
  return {
    id: row.id,
    name: row.name,
    savedAt: row.saved_at || row.updated_at || new Date().toISOString(),
    context: p.context || {},
    lens: p.lens || "",
    outcomes: p.outcomes || [],
    brief: p.brief || null,
    integrity: p.integrity || null,
    rubric: p.rubric || null,
    alignmentReport: p.alignmentReport || null,
    patoisMode: !!p.patoisMode,
  };
}

export async function loadAllDrafts(): Promise<DesignerDraft[]> {
  const b = await backend();
  if (b === "local") return legacy.loadAllDrafts();
  const sb = getSupabase();
  if (!sb) return legacy.loadAllDrafts();
  const { data, error } = await sb
    .from(TABLE)
    .select("id, name, saved_at, updated_at, payload")
    .order("updated_at", { ascending: false });
  if (error) {
    console.warn("[sld] loadAllDrafts: Supabase error, falling back:", error.message);
    return legacy.loadAllDrafts();
  }
  return (data || []).map(rowToDraft);
}

export async function saveDraft(draft: DesignerDraft): Promise<DesignerDraft> {
  // Always mirror to local for offline resilience.
  legacy.saveDraft(draft);

  const b = await backend();
  if (b === "local") return draft;
  const sb = getSupabase();
  if (!sb) return draft;

  const { data: sess } = await sb.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) return draft;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draft.id);
  const row = {
    ...(isUuid ? { id: draft.id } : {}), // let DB generate a uuid for legacy local ids
    user_id: userId,
    name: draft.name,
    saved_at: draft.savedAt,
    payload: stripIdAndName(draft),
  };

  const { data, error } = isUuid
    ? await sb.from(TABLE).upsert(row, { onConflict: "id" }).select().single()
    : await sb.from(TABLE).insert(row).select().single();

  if (error || !data) {
    console.warn("[sld] saveDraft: Supabase error, kept local copy:", error?.message);
    return draft;
  }

  // If the DB issued a new id, persist it back to local storage so the next
  // save updates the same row instead of inserting a duplicate.
  if (data.id !== draft.id) {
    legacy.deleteDraft(draft.id);
    const updated = { ...draft, id: data.id };
    legacy.saveDraft(updated);
    return updated;
  }
  return draft;
}

export async function deleteDraft(id: string): Promise<void> {
  legacy.deleteDraft(id);
  const b = await backend();
  if (b === "local") return;
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from(TABLE).delete().eq("id", id);
  if (error) {
    console.warn("[sld] deleteDraft: Supabase error:", error.message);
  }
}

export function newDraftId(): string {
  // Crypto UUID when available (we want Supabase-compatible uuids by default)
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return legacy.newDraftId();
}

export async function activeBackend(): Promise<"supabase" | "local"> {
  return backend();
}
