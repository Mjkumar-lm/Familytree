import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { FamilyTree } from "./components/FamilyTree";
import { MemberDetails } from "./components/MemberDetails";
import { Toolbar } from "./components/Toolbar";
import type { FamilyMember, MemberDraft } from "./types";
import { loadMembers, resetMembers, saveMembers } from "./utils/storage";
import {
  buildTree,
  collectDescendantIds,
  createMemberId,
  filterMembersBySearch,
  findMember,
  validateMembers,
} from "./utils/tree";

type PendingAction =
  | { type: "delete"; member: FamilyMember; descendantCount: number }
  | { type: "reset" }
  | null;

export const App = () => {
  const [members, setMembers] = useState<FamilyMember[]>(() => loadMembers());
  const [selectedId, setSelectedId] = useState<string | null>(() => members[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [expandedGeneration, setExpandedGeneration] = useState<number>(1);
  const [status, setStatus] = useState("Your family tree is saved in this browser.");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  const selectedMember = useMemo(() => findMember(members, selectedId), [members, selectedId]);
  const visibleMembers = useMemo(() => filterMembersBySearch(members, query), [members, query]);
  const tree = useMemo(() => buildTree(visibleMembers), [visibleMembers]);
  const archiveStats = useMemo(() => {
    const directLineCount = members.filter((member) => member.relationship === "Direct Line").length;
    const generations = members.map((member) => member.generation);
    const firstGeneration = Math.min(...generations);
    const lastGeneration = Math.max(...generations);

    return {
      directLineCount,
      firstGeneration,
      lastGeneration,
      selectedGeneration: selectedMember?.generation ?? null,
    };
  }, [members, selectedMember]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setStatus("Member selected.");
  };

  const handleToggleCollapse = (id: string) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;

    setExpandedGeneration((current) => {
      if (current === member.generation) {
        return current + 1;
      }
      return member.generation;
    });
  };

  const handleSaveMember = (id: string, draft: MemberDraft) => {
    setMembers((current) =>
      current.map((member) => (member.id === id ? { ...member, ...draft } : member)),
    );
    setStatus(`${draft.name} was updated.`);
  };

  const handleAddMember = (parentId: string, draft: MemberDraft) => {
    const newMember: FamilyMember = {
      id: createMemberId(draft.name),
      parentId,
      ...draft,
    };

    setMembers((current) => [...current, newMember]);
    setSelectedId(newMember.id);
    setStatus(`${draft.name} was added.`);
  };

  const requestDelete = (member: FamilyMember) => {
    const descendantCount = collectDescendantIds(members, member.id).length;
    setPendingAction({ type: "delete", member, descendantCount });
  };

  const handleDeleteConfirmed = (member: FamilyMember) => {
    const idsToDelete = new Set([member.id, ...collectDescendantIds(members, member.id)]);
    setMembers((current) => current.filter((item) => !idsToDelete.has(item.id)));
    setSelectedId((current) => {
      if (current && !idsToDelete.has(current)) {
        return current;
      }
      return member.parentId ?? members.find((item) => !idsToDelete.has(item.id))?.id ?? null;
    });
    setStatus(`${member.name} and ${idsToDelete.size - 1} descendant(s) were removed.`);
  };

  const handleResetConfirmed = () => {
    const restored = resetMembers();
    setMembers(restored);
    setSelectedId(restored[0]?.id ?? null);
    setExpandedGeneration(1);
    setQuery("");
    setStatus("Original hierarchy restored.");
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const imported = validateMembers(JSON.parse(text));
      setMembers(imported);
      setSelectedId(imported[0]?.id ?? null);
      setExpandedGeneration(1);
      setStatus("Imported family tree successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import this file.");
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(members, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "family-tree-archive.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Exported current family tree as JSON.");
  };

  const confirmPendingAction = () => {
    if (pendingAction?.type === "delete") {
      handleDeleteConfirmed(pendingAction.member);
    }
    if (pendingAction?.type === "reset") {
      handleResetConfirmed();
    }
    setPendingAction(null);
  };

  return (
    <main className="app-shell">
      <Toolbar
        query={query}
        status={status}
        stats={archiveStats}
        totalMembers={members.length}
        visibleMembers={visibleMembers.length}
        onQueryChange={setQuery}
        onImport={handleImport}
        onExport={handleExport}
        onReset={() => setPendingAction({ type: "reset" })}
      />

      <section className="workspace" aria-label="Family tree workspace">
        <FamilyTree
          expandedGeneration={expandedGeneration}
          members={tree}
          selectedId={selectedId}
          onSelect={handleSelect}
          onToggleCollapse={handleToggleCollapse}
        />

        <MemberDetails
          key={selectedMember?.id ?? "empty"}
          member={selectedMember}
          onAdd={handleAddMember}
          onDelete={requestDelete}
          onSave={handleSaveMember}
        />
      </section>

      {pendingAction && (
        <ConfirmDialog
          title={pendingAction.type === "reset" ? "Reset family tree?" : "Delete member?"}
          message={
            pendingAction.type === "reset"
              ? "This will replace your local edits with the original hierarchy."
              : `${pendingAction.member.name} will be removed${pendingAction.descendantCount
                ? ` with ${pendingAction.descendantCount} descendant(s)`
                : ""
              }.`
          }
          confirmLabel={pendingAction.type === "reset" ? "Reset" : "Delete"}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmPendingAction}
        />
      )}
    </main>
  );
};
