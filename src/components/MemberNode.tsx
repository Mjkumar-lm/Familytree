import { ChevronDown, ChevronUp } from "lucide-react";
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
  const relationClass = `relation-${member.relationship.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={`member-node tone-${depthTone} ${isSelected ? "selected" : ""}`}>
      <button type="button" className="plaque-button" onClick={() => onSelect(member.id)}>
        <div className="plaque-grain" aria-hidden="true" />
        <div className="plaque-inner">
          <div className="plaque-avatar">
            {member.image ? (
              <img src={member.image} alt="" />
            ) : (
              <span>{getInitials(member.name)}</span>
            )}
          </div>
          <div className="plaque-content">
            <span className="plaque-gen-tag">G{member.generation}</span>
            <strong className="plaque-name">{member.name}</strong>
            <div className="plaque-meta">
              <span className={`plaque-badge ${relationClass}`}>{relationLabel}</span>
              {hasChildren && <span className="plaque-linked">{member.children.length} linked</span>}
            </div>
          </div>
        </div>
      </button>

      {!hideCollapseButton && hasChildren && (
        <button
          type="button"
          className="tree-bud"
          aria-label={isCollapsed ? `Expand ${member.name}` : `Collapse ${member.name}`}
          onClick={() => onToggleCollapse(member.id)}
        >
          {isCollapsed ? (
            <ChevronDown size={16} color="#fff" />
          ) : (
            <ChevronUp size={16} color="#fff" />
          )}
        </button>
      )}
    </div>
  );
};
