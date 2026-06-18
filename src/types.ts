export type Relationship = "Son" | "Daughter" | "Brother" | "Sister";

export interface FamilyMember {
  id: string;
  name: string;
  generation: number;
  relationship: Relationship;
  parentId: string | null;
  notes: string;
  birth: string;
  death: string;
}

export interface TreeMember extends FamilyMember {
  children: TreeMember[];
}

export interface MemberDraft {
  name: string;
  generation: number;
  relationship: Relationship;
  notes: string;
  birth: string;
  death: string;
}
