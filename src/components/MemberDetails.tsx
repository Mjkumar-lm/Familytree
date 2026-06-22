import { GitBranch, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { FamilyMember, MemberDraft, Relationship } from "../types";
import { getInitials } from "../utils/tree";

interface MemberDetailsProps {
  member: FamilyMember | null;
  readOnly?: boolean;
  onSave: (id: string, draft: MemberDraft) => void;
  onAdd: (parentId: string, draft: MemberDraft) => void;
  onAddFather: (name: string) => void;
  onDelete: (member: FamilyMember) => void;
}

const RELATIONSHIP_OPTIONS: Relationship[] = ["Son", "Daughter"];

export const MemberDetails = ({ member, readOnly = false, onSave, onAdd, onAddFather, onDelete }: MemberDetailsProps) => {
  const [newName, setNewName]           = useState("");
  const [showAdd, setShowAdd]           = useState(false);
  const [addName, setAddName]           = useState("");
  const [addRel, setAddRel]             = useState<Relationship>("Son");
  const [showFather, setShowFather]     = useState(false);
  const [fatherName, setFatherName]     = useState("");

  // Reset local state when member changes
  const memberId = member?.id ?? null;
  const [lastId, setLastId] = useState(memberId);
  if (memberId !== lastId) {
    setLastId(memberId);
    setNewName("");
    setShowAdd(false);
    setAddName("");
    setAddRel("Son");
    setShowFather(false);
    setFatherName("");
  }

  if (!member) {
    return (
      <aside className="details-panel empty-panel">
        <p>Select a member to view or edit details.</p>
      </aside>
    );
  }

  const handleSaveName = () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === member.name) return;
    onSave(member.id, {
      name: trimmed,
      generation: member.generation,
      relationship: member.relationship,
      notes: member.notes,
      birth: member.birth,
      death: member.death,
    });
    setNewName("");
  };

  const handleAdd = () => {
    const trimmed = addName.trim();
    if (!trimmed) return;
    onAdd(member.id, {
      name: trimmed,
      generation: member.generation + 1,
      relationship: addRel,
      notes: "",
      birth: "",
      death: "",
    });
    setAddName("");
    setAddRel("Son");
    setShowAdd(false);
  };

  const handleAddFather = () => {
    const trimmed = fatherName.trim();
    if (!trimmed) return;
    onAddFather(trimmed);
    setFatherName("");
    setShowFather(false);
  };

  const nameChanged = newName.trim() !== "" && newName.trim() !== member.name;
  const isRoot = member.parentId === null;

  return (
    <aside className="details-panel panel-enter" aria-label="Member details">
      {/* ── Profile header ── */}
      <div className="profile-hero">
        <div className="profile-glow" aria-hidden="true" />
        <div className="details-avatar">
          <span>{getInitials(member.name)}</span>
        </div>
        <div className="details-heading">
          <p className="eyebrow">Selected Member</p>
          <h2>{member.name}</h2>
          <div className="quick-facts">
            <span><GitBranch size={14} aria-hidden="true" /> Gen {member.generation}</span>
          </div>
        </div>
      </div>

      {readOnly && (
        <p className="readonly-note">You are viewing the family archive in read-only mode.</p>
      )}

      {!readOnly && (<>
      {/* ── Change name ── */}
      <div className="panel-section-title"><span>Change Name</span></div>
      <div className="simple-field-row">
        <input
          className="simple-input"
          placeholder={member.name}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSaveName()}
        />
        <button
          type="button"
          className="primary-button"
          disabled={!nameChanged}
          onClick={handleSaveName}
          title="Save name"
        >
          <Save size={16} />
        </button>
      </div>

      {/* ── Add member ── */}
      <div className="panel-section-title"><span>Add Member</span></div>

      {!showAdd ? (
        <div className="details-actions">
          <button type="button" className="primary-button" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add under {member.name}
          </button>
        </div>
      ) : (
        <div className="add-member-form">
          <input
            className="simple-input"
            placeholder="Name"
            value={addName}
            autoFocus
            onChange={e => setAddName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          <select
            className="simple-select"
            value={addRel}
            onChange={e => setAddRel(e.target.value as Relationship)}
          >
            {RELATIONSHIP_OPTIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <div className="add-form-actions">
            <button type="button" className="primary-button" disabled={!addName.trim()} onClick={handleAdd}>
              <Save size={16} /> Save
            </button>
            <button type="button" className="secondary-button" onClick={() => { setShowAdd(false); setAddName(""); setAddRel("Son"); }}>
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Add father (root only) ── */}
      {isRoot && (
        <>
          <div className="panel-section-title"><span>Add Father</span></div>
          {!showFather ? (
            <div className="details-actions">
              <button type="button" className="primary-button" onClick={() => setShowFather(true)}>
                <Plus size={16} /> Add father above {member.name}
              </button>
            </div>
          ) : (
            <div className="add-member-form">
              <input
                className="simple-input"
                placeholder="Father's name"
                value={fatherName}
                autoFocus
                onChange={e => setFatherName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddFather()}
              />
              <div className="add-form-actions">
                <button type="button" className="primary-button" disabled={!fatherName.trim()} onClick={handleAddFather}>
                  <Save size={16} /> Save
                </button>
                <button type="button" className="secondary-button" onClick={() => { setShowFather(false); setFatherName(""); }}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Delete ── */}
      <div className="details-actions" style={{ marginTop: "auto", paddingTop: "16px" }}>
        <button type="button" className="danger-soft danger-button" onClick={() => onDelete(member)}>
          <Trash2 size={16} /> Delete {member.name}
        </button>
      </div>
      </>)}
    </aside>
  );
};
