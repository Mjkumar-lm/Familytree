import { ChevronDown, Split } from "lucide-react";
import type { TreeMember } from "../types";
import { getInitials } from "../utils/tree";

interface MemberNodeProps {
  member: TreeMember;
  isSelected: boolean;
  isCollapsed: boolean;
  depth: number;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string, wasCollapsed: boolean) => void;
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

  return (
    <div id={`node-${member.id}`} className={`member-node tone-${depthTone} ${isSelected ? "selected" : ""}`}>
      <button type="button" className="plaque-button" onClick={() => onSelect(member.id)}>
        <div className="plaque-grain" aria-hidden="true" />
        <div className="plaque-inner">
          <div className="plaque-avatar">
            <span>{getInitials(member.name)}</span>
          </div>
          <div className="plaque-content">
            <span className="plaque-gen-tag">G{member.generation}</span>
            <strong className="plaque-name">{member.name}</strong>
            <div className="plaque-meta">
              {hasChildren && <span className="plaque-linked">{member.children.length} linked</span>}
            </div>
          </div>
        </div>
      </button>

      {!hideCollapseButton && hasChildren && (
        <button
          type="button"
          className={`tree-bud ${isCollapsed ? "tree-bud--collapsed" : "tree-bud--expanded"}`}
          aria-label={isCollapsed ? `Expand ${member.name}` : `Collapse ${member.name}`}
          aria-expanded={!isCollapsed}
          onClick={() => onToggleCollapse(member.id, isCollapsed)}
        >
          <span className="tree-bud-icon tree-bud-icon--closed" aria-hidden="true">
            <ChevronDown size={16} color="#fff" />
          </span>
          <span className="tree-bud-icon tree-bud-icon--open" aria-hidden="true">
            <Split size={16} color="#fff" />
          </span>
        </button>
      )}
    </div>
  );
};
