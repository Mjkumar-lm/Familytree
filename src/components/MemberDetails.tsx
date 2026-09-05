import { CalendarDays, GitBranch, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { FamilyMember, MemberDraft, Relationship } from "../types";
import { formatLifeJourney, getInitials } from "../utils/tree";

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
  const [addBirth, setAddBirth]         = useState("");
  const [addDeath, setAddDeath]         = useState("");
  const [showFather, setShowFather]     = useState(false);
  const [fatherName, setFatherName]     = useState("");
  const [editBirth, setEditBirth]       = useState(member?.birth ?? "");
  const [editDeath, setEditDeath]       = useState(member?.death ?? "");

  // Reset local state when member changes
  const memberId = member?.id ?? null;
  const [lastId, setLastId] = useState(memberId);
  if (memberId !== lastId) {
    setLastId(memberId);
    setNewName("");
    setShowAdd(false);
    setAddName("");
    setAddRel("Son");
    setAddBirth("");
    setAddDeath("");
    setShowFather(false);
    setFatherName("");
    setEditBirth(member?.birth ?? "");
    setEditDeath(member?.death ?? "");
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

  const handleSaveLifeJourney = () => {
    const birth = editBirth.trim();
    const death = editDeath.trim();
    if (birth === member.birth && death === member.death) return;
    onSave(member.id, {
      name: member.name,
      generation: member.generation,
      relationship: member.relationship,
      notes: member.notes,
      birth,
      death,
    });
  };

  const handleAdd = () => {
    const trimmed = addName.trim();
    if (!trimmed) return;
    onAdd(member.id, {
      name: trimmed,
      generation: member.generation + 1,
      relationship: addRel,
      notes: "",
      birth: addBirth.trim(),
      death: addDeath.trim(),
    });
    setAddName("");
    setAddRel("Son");
    setAddBirth("");
    setAddDeath("");
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
  const lifeJourney = formatLifeJourney(member.birth, member.death);
  const lifeJourneyChanged = editBirth.trim() !== member.birth || editDeath.trim() !== member.death;
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
            {lifeJourney && <span><CalendarDays size={14} aria-hidden="true" /> {lifeJourney}</span>}
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

      {/* -- Life journey -- */}
      <div className="panel-section-title"><span>Life Journey</span></div>
      <div className="life-date-grid">
        <label>
          <span>Birth Date</span>
          <input
            className="simple-input"
            placeholder="Birth date"
            value={editBirth}
            onChange={e => setEditBirth(e.target.value)}
          />
        </label>
        <label>
          <span>Date of Passing</span>
          <input
            className="simple-input"
            placeholder="Date of passing"
            value={editDeath}
            onChange={e => setEditDeath(e.target.value)}
          />
        </label>
      </div>
      <div className="details-actions details-actions--compact">
        <button
          type="button"
          className="primary-button"
          disabled={!lifeJourneyChanged}
          onClick={handleSaveLifeJourney}
          title="Save life journey"
        >
          <Save size={16} /> Save
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
          <div className="life-date-grid life-date-grid--inline">
            <label>
              <span>Birth Date</span>
              <input
                className="simple-input"
                placeholder="Optional"
                value={addBirth}
                onChange={e => setAddBirth(e.target.value)}
              />
            </label>
            <label>
              <span>Date of Passing</span>
              <input
                className="simple-input"
                placeholder="Optional"
                value={addDeath}
                onChange={e => setAddDeath(e.target.value)}
              />
            </label>
          </div>
          <div className="add-form-actions">
            <button type="button" className="primary-button" disabled={!addName.trim()} onClick={handleAdd}>
              <Save size={16} /> Save
            </button>
            <button type="button" className="secondary-button" onClick={() => { setShowAdd(false); setAddName(""); setAddRel("Son"); setAddBirth(""); setAddDeath(""); }}>
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
