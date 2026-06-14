import { Camera, GitBranch, Heart, Plus, Save, Trash2, UserRound, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { FamilyMember, MemberDraft, Relationship } from "../types";
import { getInitials } from "../utils/tree";

interface MemberDetailsProps {
  member: FamilyMember | null;
  onSave: (id: string, draft: MemberDraft) => void;
  onAdd: (parentId: string, draft: MemberDraft) => void;
  onDelete: (member: FamilyMember) => void;
}

const emptyDraft = (member?: FamilyMember | null): MemberDraft => ({
  name: member?.name ?? "",
  generation: member ? member.generation : 1,
  relationship: member?.relationship ?? "Member",
  notes: member?.notes ?? "",
  birth: member?.birth ?? "",
  death: member?.death ?? "",
  image: member?.image ?? "",
});

const relationshipOptions: Relationship[] = ["Direct Line", "Brother", "Member"];

export const MemberDetails = ({ member, onSave, onAdd, onDelete }: MemberDetailsProps) => {
  const [mode, setMode] = useState<"view" | "edit" | "add">("view");
  const [draft, setDraft] = useState<MemberDraft>(() => emptyDraft(member));
  const fileRef = useRef<HTMLInputElement>(null);

  const displayedDraft = mode === "view" ? emptyDraft(member) : draft;
  const canSubmit = displayedDraft.name.trim().length > 0 && Number.isFinite(displayedDraft.generation);

  const title = useMemo(() => {
    if (!member) {
      return "Select a member";
    }
    if (mode === "add") {
      return `Add under ${member.name}`;
    }
    if (mode === "edit") {
      return `Edit ${member.name}`;
    }
    return member.name;
  }, [member, mode]);

  if (!member) {
    return (
      <aside className="details-panel empty-panel">
        <p>Select a member to view or edit details.</p>
      </aside>
    );
  }

  const beginEdit = () => {
    setDraft(emptyDraft(member));
    setMode("edit");
  };

  const beginAdd = () => {
    setDraft({
      ...emptyDraft(null),
      generation: member.generation + 1,
      relationship: "Member",
    });
    setMode("add");
  };

  const cancel = () => {
    setDraft(emptyDraft(member));
    setMode("view");
  };

  const submit = () => {
    const cleanDraft = { ...displayedDraft, name: displayedDraft.name.trim() };
    if (!canSubmit) {
      return;
    }
    if (mode === "edit") {
      onSave(member.id, cleanDraft);
    }
    if (mode === "add") {
      onAdd(member.id, cleanDraft);
    }
    setMode("view");
  };

  const handleImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }
    if (file.size > 900_000) {
      alert("Please choose an image below 900 KB for browser storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({ ...current, image: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="details-panel" aria-label="Member details">
      <div className="profile-hero">
        <div className="profile-glow" aria-hidden="true" />
        <div className="details-avatar">
          {displayedDraft.image ? <img src={displayedDraft.image} alt="" /> : <span>{getInitials(displayedDraft.name || member.name)}</span>}
        </div>
        <div className="details-heading">
          <p className="eyebrow">Selected Member</p>
          <h2>{title}</h2>
          <div className="quick-facts" aria-label="Member quick facts">
            <span>
              <GitBranch size={14} aria-hidden="true" />
              Gen {displayedDraft.generation}
            </span>
            <span>
              <UserRound size={14} aria-hidden="true" />
              {displayedDraft.relationship === "Direct Line" ? "Direct Heir" : displayedDraft.relationship}
            </span>
            {(displayedDraft.birth || displayedDraft.death) && (
              <span>
                <Heart size={14} aria-hidden="true" />
                {displayedDraft.birth || "?"} - {displayedDraft.death || "Present"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="panel-section-title">
        <span>{mode === "view" ? "Lineage" : mode === "edit" ? "Editing Profile" : "New Family Member"}</span>
      </div>

      <div className="form-grid">
        <label>
          Name
          <input
            disabled={mode === "view"}
            value={displayedDraft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </label>

        <label>
          Generation
          <input
            disabled={mode === "view"}
            min={1}
            type="number"
            value={displayedDraft.generation}
            onChange={(event) =>
              setDraft((current) => ({ ...current, generation: Number(event.target.value) }))
            }
          />
        </label>

        <label>
          Relationship
          <select
            disabled={mode === "view"}
            value={displayedDraft.relationship}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                relationship: event.target.value as Relationship,
              }))
            }
          >
            {relationshipOptions.map((relationship) => (
              <option key={relationship}>{relationship}</option>
            ))}
          </select>
        </label>

        <label>
          Birth
          <input
            disabled={mode === "view"}
            value={displayedDraft.birth}
            placeholder="Optional"
            onChange={(event) => setDraft((current) => ({ ...current, birth: event.target.value }))}
          />
        </label>

        <label>
          Death
          <input
            disabled={mode === "view"}
            value={displayedDraft.death}
            placeholder="Optional"
            onChange={(event) => setDraft((current) => ({ ...current, death: event.target.value }))}
          />
        </label>

        <label className="wide-field">
          Notes
          <textarea
            disabled={mode === "view"}
            value={displayedDraft.notes}
            rows={5}
            placeholder="Add family details, place, stories, or corrections"
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>
      </div>

      {mode !== "view" && (
        <div className="image-actions">
          <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}>
            <Camera size={17} aria-hidden="true" />
            Image
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setDraft((current) => ({ ...current, image: "" }))}
          >
            <X size={17} aria-hidden="true" />
            Remove
          </button>
          <input
            ref={fileRef}
            className="hidden-input"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleImage(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </div>
      )}

      <div className="details-actions">
        {mode === "view" ? (
          <>
            <button type="button" className="primary-button" onClick={beginAdd}>
              <Plus size={18} aria-hidden="true" />
              Add
            </button>
            <button type="button" className="secondary-button" onClick={beginEdit}>
              Edit
            </button>
            <button type="button" className="danger-button" onClick={() => onDelete(member)}>
              <Trash2 size={18} aria-hidden="true" />
              Delete
            </button>
          </>
        ) : (
          <>
            <button type="button" className="primary-button" disabled={!canSubmit} onClick={submit}>
              <Save size={18} aria-hidden="true" />
              Save
            </button>
            <button type="button" className="secondary-button" onClick={cancel}>
              Cancel
            </button>
          </>
        )}
      </div>
    </aside>
  );
};
