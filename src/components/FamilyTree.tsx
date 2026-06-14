import { useEffect, useMemo, useRef } from "react";
import type { TreeMember } from "../types";
import { MemberNode } from "./MemberNode";

interface FamilyTreeProps {
  members: TreeMember[];
  selectedId: string | null;
  expandedGeneration: number;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
}

export const FamilyTree = ({
  members,
  selectedId,
  expandedGeneration,
  onSelect,
  onToggleCollapse,
}: FamilyTreeProps) => {
  if (!members.length) {
    return (
      <section className="tree-panel empty-panel">
        <p>No members match this search.</p>
      </section>
    );
  }

  // Flatten the tree to generations for the Reverse Tree layout
  const generationsList = useMemo(() => {
    // Collect all members into a flat array
    const allMembers: TreeMember[] = [];
    const traverse = (nodes: TreeMember[]) => {
      nodes.forEach(node => {
        allMembers.push(node);
        traverse(node.children);
      });
    };
    traverse(members);

    const gens = new Map<number, TreeMember[]>();
    allMembers.forEach((m) => {
      if (!gens.has(m.generation)) gens.set(m.generation, []);
      gens.get(m.generation)!.push(m);
    });

    return Array.from(gens.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([gen, genMembers]) => {
        const primary = genMembers.find((m) => m.relationship === "Direct Line") || genMembers[0];
        const siblings = genMembers.filter((m) => m.id !== primary.id);
        return { generation: gen, primary, siblings };
      });
  }, [members]);

  return (
    <section className="tree-panel" aria-label="Family hierarchy">
      <div className="tree-titlebar">
        <p className="eyebrow">The Direct Line</p>
        <h2>From Swar Ji to the present</h2>
      </div>
      <div className="tree-scroll org-tree-container">
        <div className="trunk-layout">
          {generationsList.slice(0, expandedGeneration).map((gen, index) => {
            const isCollapsed = gen.generation >= expandedGeneration;
            const isLastGen = index === generationsList.length - 1;
            const hasChildren = !isLastGen;

            return (
              <GenerationRow
                key={gen.generation}
                generation={gen}
                isCollapsed={isCollapsed}
                hasChildren={hasChildren}
                selectedId={selectedId}
                onSelect={onSelect}
                onToggleCollapse={onToggleCollapse}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

interface GenerationRowProps {
  generation: { generation: number; primary: TreeMember; siblings: TreeMember[] };
  isCollapsed: boolean;
  hasChildren: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
}

const GenerationRow = ({
  generation,
  isCollapsed,
  hasChildren,
  selectedId,
  onSelect,
  onToggleCollapse,
}: GenerationRowProps) => {
  const { primary, siblings } = generation;
  
  const nodeRef = useRef<HTMLDivElement>(null);

  // Smooth scroll into view when expanded
  useEffect(() => {
    if (!isCollapsed) {
      setTimeout(() => {
        if (nodeRef.current) {
          nodeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      }, 50);
    }
  }, [isCollapsed]);

  const leftSiblings = siblings.slice(0, Math.ceil(siblings.length / 2));
  const rightSiblings = siblings.slice(Math.ceil(siblings.length / 2));

  return (
    <div className="generation-grid">
      <div className="left-siblings">
        {leftSiblings.map((sibling) => (
          <div key={sibling.id} className="sibling-node">
            <div className="drop-line"></div>
            <MemberNode
              member={sibling}
              isCollapsed={true}
              isSelected={selectedId === sibling.id}
              depth={sibling.generation}
              onSelect={onSelect}
              onToggleCollapse={() => {}}
              hideCollapseButton
            />
          </div>
        ))}
      </div>

      <div
        ref={nodeRef}
        className={`primary-node-container ${
          leftSiblings.length > 0 ? "has-left-siblings" : ""
        } ${rightSiblings.length > 0 ? "has-right-siblings" : ""}`}
      >
        {primary.generation > 1 && <div className="drop-line"></div>}
        <div className="generation-label-top">Generation {primary.generation}</div>
        <MemberNode
          member={primary}
          isCollapsed={isCollapsed}
          isSelected={selectedId === primary.id}
          depth={primary.generation}
          onSelect={onSelect}
          onToggleCollapse={onToggleCollapse}
          hideCollapseButton={!hasChildren}
        />
        {hasChildren && !isCollapsed && <div className="trunk-line-down"></div>}
      </div>

      <div className="right-siblings">
        {rightSiblings.map((sibling) => (
          <div key={sibling.id} className="sibling-node">
            <div className="drop-line"></div>
            <MemberNode
              member={sibling}
              isCollapsed={true}
              isSelected={selectedId === sibling.id}
              depth={sibling.generation}
              onSelect={onSelect}
              onToggleCollapse={() => {}}
              hideCollapseButton
            />
          </div>
        ))}
      </div>
    </div>
  );
};
