import { seedMembers } from "../data/seedData";
import type { FamilyMember } from "../types";
import { validateMembers } from "./tree";

const STORAGE_KEY = "family-tree-archive:v1";

export const cloneSeedMembers = (): FamilyMember[] =>
  seedMembers.map((member) => ({ ...member }));

export const loadMembers = (): FamilyMember[] => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return cloneSeedMembers();
  }

  try {
    const parsed = JSON.parse(stored);
    return validateMembers(parsed);
  } catch {
    return cloneSeedMembers();
  }
};

export const saveMembers = (members: FamilyMember[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
};

export const resetMembers = (): FamilyMember[] => {
  const members = cloneSeedMembers();
  saveMembers(members);
  return members;
};
