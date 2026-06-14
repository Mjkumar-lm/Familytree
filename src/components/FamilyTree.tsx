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

  const generationsList = useMemo(() => {
    const allMembers: TreeMember[] = [];
    const traverse = (nodes: TreeMember[]) => {
      nodes.forEach((node) => {
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
        <div className="organic-tree">
          {generationsList.slice(0, expandedGeneration).map((gen, index) => {
            const isLastGen = index === generationsList.length - 1;
            const hasMoreGenerations = !isLastGen;

            return (
              <GenerationRow
                key={gen.generation}
                generation={gen}
                index={index}
                hasMoreGenerations={hasMoreGenerations}
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
  index: number;
  hasMoreGenerations: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
}

const GenerationRow = ({
  generation,
  index,
  hasMoreGenerations,
  selectedId,
  onSelect,
  onToggleCollapse,
}: GenerationRowProps) => {
  const { primary, siblings } = generation;
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 60);
  }, []);

  const leftSiblings = siblings.slice(0, Math.ceil(siblings.length / 2));
  const rightSiblings = siblings.slice(Math.ceil(siblings.length / 2));
  const hasSiblings = siblings.length > 0;

  return (
    <div
      ref={rowRef}
      className={`tree-generation ${index === 0 ? "tree-generation--root" : ""}`}
    >
      {index > 0 && (
        <div className="branch-connector">
          <svg className="branch-svg" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <line x1="20" y1="0" x2="20" y2="40" stroke="var(--line)" strokeWidth="2" />
          </svg>
        </div>
      )}

      <div className="trunk-leaf-label">
        <svg className="leaf-label-svg" viewBox="0 0 140 32" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="2" width="140" height="28" rx="14" fill="var(--gold-soft)" stroke="var(--gold)" strokeWidth="1" />
          <text x="70" y="20" textAnchor="middle" fontSize="10" fontFamily="Cinzel, serif" fontWeight="700" fill="var(--ink-light)" letterSpacing="1.2">
            GENERATION {generation.generation}
          </text>
        </svg>
      </div>

      <div className={`tree-generation-row ${hasSiblings ? "has-branches" : ""}`}>
        {leftSiblings.length > 0 && (
          <div className="branch-group branch-group--left">
            {leftSiblings.map((sibling) => (
              <div key={sibling.id} className="branch-limb branch-limb--left">
                <MemberNode
                  member={sibling}
                  isCollapsed={true}
                  isSelected={selectedId === sibling.id}
                  depth={sibling.generation}
                  onSelect={onSelect}
                  onToggleCollapse={() => {}}
                  hideCollapseButton
                />
                <svg className="limb-curve" viewBox="0 0 80 40" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0,20 L50,20 Q65,20 65,5 L65,0" stroke="var(--line)" strokeWidth="2" fill="none" />
                </svg>
              </div>
            ))}
          </div>
        )}

        <div className="trunk-node">
          <MemberNode
            member={primary}
            isCollapsed={true}
            isSelected={selectedId === primary.id}
            depth={primary.generation}
            onSelect={onSelect}
            onToggleCollapse={onToggleCollapse}
            hideCollapseButton={!hasMoreGenerations}
          />
        </div>

        {rightSiblings.length > 0 && (
          <div className="branch-group branch-group--right">
            {rightSiblings.map((sibling) => (
              <div key={sibling.id} className="branch-limb branch-limb--right">
                <svg className="limb-curve" viewBox="0 0 80 40" xmlns="http://www.w3.org/2000/svg">
                  <path d="M80,20 L30,20 Q15,20 15,5 L15,0" stroke="var(--line)" strokeWidth="2" fill="none" />
                </svg>
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
        )}
      </div>
    </div>
  );
};
