import { seedMembers } from "../data/seedData";
import { hasSupabase, supabase } from "../lib/supabase";
import type { FamilyMember } from "../types";
import { validateMembers } from "./tree";

const STORAGE_KEY = "family-tree-archive:v3";
const TABLE = "members";

export const cloneSeedMembers = (): FamilyMember[] =>
  seedMembers.map((member) => ({ ...member }));

/**
 * Synchronous boot load — returns the localStorage cache or seed.
 * Supabase data overwrites this once `loadMembersFromCloud()` resolves.
 */
export const loadMembers = (): FamilyMember[] => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return cloneSeedMembers();
  }
  try {
    return validateMembers(JSON.parse(stored));
  } catch {
    return cloneSeedMembers();
  }
};

const writeLocal = (members: FamilyMember[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
};

type Row = {
  id: string;
  name: string;
  generation: number;
  relationship: FamilyMember["relationship"];
  parent_id: string | null;
  notes: string;
  birth: string;
  death: string;
};

const toRow = (m: FamilyMember): Row => ({
  id: m.id,
  name: m.name,
  generation: m.generation,
  relationship: m.relationship,
  parent_id: m.parentId,
  notes: m.notes,
  birth: m.birth,
  death: m.death,
});

const fromRow = (r: Row): FamilyMember => ({
  id: r.id,
  name: r.name,
  generation: r.generation,
  relationship: r.relationship,
  parentId: r.parent_id,
  notes: r.notes,
  birth: r.birth,
  death: r.death,
});

let lastSyncedIds: Set<string> = new Set();

/**
 * Fetch the full member list from Supabase.
 * Returns null if Supabase is not configured or the request fails.
 */
export const loadMembersFromCloud = async (): Promise<FamilyMember[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,name,generation,relationship,parent_id,notes,birth,death")
    .order("generation", { ascending: true });

  if (error) {
    console.warn("[storage] cloud load failed", error.message);
    return null;
  }
  const members = (data as Row[]).map(fromRow);
  lastSyncedIds = new Set(members.map((m) => m.id));
  return members;
};

/**
 * Persist locally and (best-effort) to Supabase.
 * Local write is synchronous so the UI never blocks.
 */
export const saveMembers = (members: FamilyMember[]) => {
  writeLocal(members);
  if (hasSupabase) {
    void pushToCloud(members);
  }
};

const pushToCloud = async (members: FamilyMember[]) => {
  if (!supabase) return;

  const currentIds = new Set(members.map((m) => m.id));
  const removedIds = [...lastSyncedIds].filter((id) => !currentIds.has(id));

  // Sort by generation so parents land before children (FK constraint).
  const rows = members
    .slice()
    .sort((a, b) => a.generation - b.generation)
    .map(toRow);

  const { error: upsertErr } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: "id" });

  if (upsertErr) {
    console.warn("[storage] cloud upsert failed", upsertErr.message);
    return;
  }

  if (removedIds.length > 0) {
    const { error: delErr } = await supabase
      .from(TABLE)
      .delete()
      .in("id", removedIds);
    if (delErr) {
      console.warn("[storage] cloud delete failed", delErr.message);
      return;
    }
  }

  lastSyncedIds = currentIds;
};

export const resetMembers = (): FamilyMember[] => {
  const members = cloneSeedMembers();
  saveMembers(members);
  return members;
};
