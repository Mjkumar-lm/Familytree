import { ChevronDown, ChevronRight } from "lucide-react";
import type { TreeMember } from "../types";
import { getInitials } from "../utils/tree";

interface MemberNodeProps {
  member: TreeMember;
  isSelected: boolean;
  isCollapsed: boolean;
  depth: number;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  hideCollapseButton?: boolean;
}

export const MemberNode = ({
  member,
  isSelected,
  isCollapsed,
  depth,
  onSelect,
  onToggleCollapse,
  hideCollapseButton,
}: MemberNodeProps) => {
  const hasChildren = member.children.length > 0;
  const depthTone = depth % 5;
  const relationLabel = member.relationship === "Direct Line" ? "Direct Heir" : member.relationship;

  return (
    <div className={`member-node tone-${depthTone} ${isSelected ? "selected" : ""}`}>
      <button type="button" className="profile-button" onClick={() => onSelect(member.id)}>
        <span className="generation-pin">G{member.generation}</span>
        <span className="avatar">
          {member.image ? <img src={member.image} alt="" /> : <span>{getInitials(member.name)}</span>}
        </span>
        <span className="node-copy">
          <strong>{member.name}</strong>
          <span className="node-meta">
            <span className={`relation-badge relation-${member.relationship.toLowerCase().replace(/\s+/g, "-")}`}>
              {relationLabel}
            </span>
            {hasChildren && <span>{member.children.length} linked</span>}
          </span>
        </span>
      </button>

      {!hideCollapseButton && hasChildren && (
        <button
          type="button"
          className="collapse-button-bottom"
          aria-label={isCollapsed ? `Expand ${member.name}` : `Collapse ${member.name}`}
          onClick={() => onToggleCollapse(member.id)}
        >
          {isCollapsed ? (
            <ChevronDown size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" style={{ transform: "rotate(180deg)" }} />
          )}
        </button>
      )}
    </div>
  );
};
