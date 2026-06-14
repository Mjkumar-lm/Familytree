import type { FamilyMember, Relationship, TreeMember } from "../types";

const relationships: Relationship[] = ["Direct Line", "Brother", "Member"];

export const buildTree = (members: FamilyMember[]): TreeMember[] => {
  const map = new Map<string, TreeMember>();
  const roots: TreeMember[] = [];

  members.forEach((member) => {
    map.set(member.id, { ...member, children: [] });
  });

  map.forEach((member) => {
    if (member.parentId && map.has(member.parentId)) {
      map.get(member.parentId)?.children.push(member);
    } else {
      roots.push(member);
    }
  });

  const sortTree = (items: TreeMember[]) => {
    items.sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name));
    items.forEach((item) => sortTree(item.children));
  };

  sortTree(roots);
  return roots;
};

export const findMember = (members: FamilyMember[], id: string | null) =>
  members.find((member) => member.id === id) ?? null;

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const createMemberId = (name: string) => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "member"}-${Date.now().toString(36)}`;
};

export const collectDescendantIds = (members: FamilyMember[], parentId: string): string[] => {
  const children = members.filter((member) => member.parentId === parentId);
  return children.flatMap((child) => [child.id, ...collectDescendantIds(members, child.id)]);
};

export const filterMembersBySearch = (members: FamilyMember[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return members;
  }

  const matchingIds = new Set(
    members
      .filter((member) => {
        const haystack = `${member.name} ${member.relationship} ${member.generation} ${member.notes}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .map((member) => member.id),
  );

  let changed = true;
  while (changed) {
    changed = false;
    members.forEach((member) => {
      if (member.parentId && matchingIds.has(member.id) && !matchingIds.has(member.parentId)) {
        matchingIds.add(member.parentId);
        changed = true;
      }
    });
  }

  return members.filter((member) => matchingIds.has(member.id));
};

export const validateMembers = (value: unknown): FamilyMember[] => {
  if (!Array.isArray(value)) {
    throw new Error("Imported data must be an array.");
  }

  const ids = new Set<string>();
  const members = value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Member ${index + 1} is not valid.`);
    }

    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : "";
    const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "";
    const generation = Number(raw.generation);
    const relationship = relationships.includes(raw.relationship as Relationship)
      ? (raw.relationship as Relationship)
      : "Member";
    const parentId = typeof raw.parentId === "string" ? raw.parentId : null;

    if (!id || !name || !Number.isFinite(generation)) {
      throw new Error(`Member ${index + 1} is missing id, name, or generation.`);
    }
    if (ids.has(id)) {
      throw new Error(`Duplicate member id: ${id}`);
    }
    ids.add(id);

    return {
      id,
      name,
      generation,
      relationship,
      parentId,
      notes: typeof raw.notes === "string" ? raw.notes : "",
      birth: typeof raw.birth === "string" ? raw.birth : "",
      death: typeof raw.death === "string" ? raw.death : "",
      image: typeof raw.image === "string" ? raw.image : "",
    };
  });

  members.forEach((member) => {
    if (member.parentId && !ids.has(member.parentId)) {
      throw new Error(`${member.name} references a missing parent.`);
    }
  });

  return members;
};
