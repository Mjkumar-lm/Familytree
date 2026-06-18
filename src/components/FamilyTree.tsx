import { ChevronsDownUp, ChevronsUpDown, Maximize2, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { usePanZoom } from "../hooks/usePanZoom";
import type { TreeMember } from "../types";
import { MemberNode } from "./MemberNode";

interface FamilyTreeProps {
  members: TreeMember[];
  selectedId: string | null;
  expandedGeneration: number;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onSetExpandedGeneration: (n: number) => void;
}

type SideMember = {
  member: TreeMember;
  kind: "sibling" | "descendant";
  ancestorChain: string[];
};

type Row = {
  generation: number;
  primary: TreeMember;
  leftMembers: SideMember[];
  rightMembers: SideMember[];
};

export const FamilyTree = ({
  members,
  selectedId,
  expandedGeneration,
  onSelect,
  onToggleCollapse,
  onSetExpandedGeneration,
}: FamilyTreeProps) => {
  const { containerRef, contentRef, transform, isPanning, zoomIn, zoomOut, reset } = usePanZoom({
    minScale: 0.3,
    maxScale: 2.5,
  });

  const [expandedSiblings, setExpandedSiblings] = useState<Set<string>>(new Set());
  const toggleSibling = (id: string) =>
    setExpandedSiblings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Max generation and all members with children — used by the Expand All button
  const { maxGeneration, allBranchableIds } = useMemo(() => {
    let max = 0;
    const ids = new Set<string>();
    const walk = (nodes: TreeMember[]) => {
      nodes.forEach((n) => {
        if (n.generation > max) max = n.generation;
        if (n.children.length > 0) ids.add(n.id);
        walk(n.children);
      });
    };
    walk(members);
    return { maxGeneration: max, allBranchableIds: ids };
  }, [members]);

  const isFullyExpanded =
    expandedGeneration >= maxGeneration &&
    [...allBranchableIds].every((id) => expandedSiblings.has(id));

  const handleToggleAll = () => {
    if (isFullyExpanded) {
      onSetExpandedGeneration(1);
      setExpandedSiblings(new Set());
    } else {
      onSetExpandedGeneration(maxGeneration);
      setExpandedSiblings(new Set(allBranchableIds));
    }
  };

  const generationsList: Row[] = useMemo(() => {
    if (!members.length) return [];

    const allMembers: TreeMember[] = [];
    const traverse = (nodes: TreeMember[]) => {
      nodes.forEach((n) => {
        allMembers.push(n);
        traverse(n.children);
      });
    };
    traverse(members);

    const memberById = new Map(allMembers.map((m) => [m.id, m] as const));
    const root = allMembers.find((m) => !m.parentId) ?? allMembers[0];

    // Trunk chain (Son/Daughter only)
    const trunkIds = new Set<string>();
    {
      let t: TreeMember | undefined = root;
      while (t) {
        trunkIds.add(t.id);
        t = t.children.find((c) => c.relationship === "Son" || c.relationship === "Daughter");
      }
    }

    // Build trunk rows
    const rows: Row[] = [];
    {
      let current: TreeMember | undefined = root;
      while (current) {
        rows.push({ generation: current.generation, primary: current, leftMembers: [], rightMembers: [] });
        current = current.children.find((c) => c.relationship === "Son" || c.relationship === "Daughter");
      }
    }
    const rowByGen = new Map(rows.map((r) => [r.generation, r] as const));

    // Compute side ("left" / "right") for every non-trunk member
    const side = new Map<string, "left" | "right">();
    const sideRootIds = new Set<string>();

    for (const row of rows) {
      const trunk = row.primary;
      const directSiblings = allMembers.filter((m) => {
        if (m.id === trunk.id || trunkIds.has(m.id)) return false;
        if (m.generation !== trunk.generation) return false;
        if (trunk.parentId !== null && m.parentId === trunk.parentId) return true;
        if (m.parentId === trunk.id && (m.relationship === "Brother" || m.relationship === "Sister")) return true;
        return false;
      });
      const half = Math.ceil(directSiblings.length / 2);
      directSiblings.forEach((s, i) => {
        side.set(s.id, i < half ? "left" : "right");
        sideRootIds.add(s.id);
      });
    }

    // Propagate side downward through descendants
    for (const sid of [...sideRootIds]) {
      const sd = side.get(sid)!;
      const seed = memberById.get(sid);
      if (!seed) continue;
      const stack: TreeMember[] = [...seed.children];
      while (stack.length) {
        const c = stack.pop()!;
        if (trunkIds.has(c.id)) continue;
        side.set(c.id, sd);
        stack.push(...c.children);
      }
    }

    // Compute ancestor chain (non-trunk ancestors, nearest first) for each non-trunk member
    const ancestorsOf = (m: TreeMember): string[] => {
      const chain: string[] = [];
      let cur: TreeMember | undefined = m.parentId ? memberById.get(m.parentId) : undefined;
      while (cur && !trunkIds.has(cur.id)) {
        chain.push(cur.id);
        cur = cur.parentId ? memberById.get(cur.parentId) : undefined;
      }
      return chain;
    };

    // Place every sided member into its own generation row
    for (const m of allMembers) {
      if (trunkIds.has(m.id)) continue;
      const sd = side.get(m.id);
      if (!sd) continue;
      const row = rowByGen.get(m.generation);
      if (!row) continue;
      const entry: SideMember = {
        member: m,
        kind: sideRootIds.has(m.id) ? "sibling" : "descendant",
        ancestorChain: ancestorsOf(m),
      };
      if (sd === "left") row.leftMembers.push(entry);
      else row.rightMembers.push(entry);
    }

    return rows;
  }, [members]);

  if (!members.length) {
    return (
      <section className="tree-panel empty-panel">
        <p>No members match this search.</p>
      </section>
    );
  }

  return (
    <section className="tree-panel" aria-label="Family hierarchy">
      <div className="tree-titlebar" data-reveal>
        <div>
          <p className="eyebrow">The Direct Line</p>
          <h2>From Jhanj Dev to the present</h2>
        </div>
        <button
          type="button"
          className="expand-all-btn"
          onClick={handleToggleAll}
          title={isFullyExpanded ? "Collapse whole tree" : "Expand whole tree"}
          aria-label={isFullyExpanded ? "Collapse whole tree" : "Expand whole tree"}
        >
          {isFullyExpanded ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
          <span>{isFullyExpanded ? "Collapse All" : "Expand All"}</span>
        </button>
      </div>

      <div className="zoom-controls" role="group" aria-label="Zoom controls">
        <button type="button" className="zoom-btn" onClick={zoomIn} aria-label="Zoom in" title="Zoom in">
          <Plus size={16} />
        </button>
        <button type="button" className="zoom-btn" onClick={zoomOut} aria-label="Zoom out" title="Zoom out">
          <Minus size={16} />
        </button>
        <button type="button" className="zoom-btn" onClick={reset} aria-label="Reset view" title="Reset view">
          <Maximize2 size={14} />
        </button>
        <span className="zoom-level" aria-live="polite">{Math.round(transform.scale * 100)}%</span>
      </div>

      <div
        ref={containerRef}
        className={`tree-scroll org-tree-container pan-zoom-viewport ${isPanning ? "is-panning" : ""}`}
      >
        <div
          ref={contentRef}
          className="pan-zoom-content"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          <div className="organic-tree">
            {(() => {
              // Render any row that has either (a) trunk visible per expandedGeneration
              // or (b) at least one visible descendant whose ancestors are all expanded.
              // Direct siblings only count if their trunk row is also visible.
              const isVisibleAt = (m: SideMember, rowIdx: number) =>
                m.kind === "sibling"
                  ? rowIdx < expandedGeneration
                  : m.ancestorChain.every((id) => expandedSiblings.has(id));
              let lastSideRow = -1;
              for (let i = 0; i < generationsList.length; i++) {
                const r = generationsList[i];
                if (
                  r.leftMembers.some((m) => isVisibleAt(m, i)) ||
                  r.rightMembers.some((m) => isVisibleAt(m, i))
                ) {
                  lastSideRow = i;
                }
              }
              const renderUpTo = Math.max(expandedGeneration, lastSideRow + 1);
              return generationsList.slice(0, renderUpTo).map((gen, index) => {
                const isLastGen = index === generationsList.length - 1;
                const showTrunk = index < expandedGeneration;
                return (
                  <GenerationRow
                    key={gen.generation}
                    row={gen}
                    index={index}
                    hasMoreGenerations={!isLastGen}
                    showTrunk={showTrunk}
                    selectedId={selectedId}
                    expandedSiblings={expandedSiblings}
                    onSelect={onSelect}
                    onToggleCollapse={onToggleCollapse}
                    onToggleSibling={toggleSibling}
                  />
                );
              });
            })()}
          </div>
        </div>
      </div>
    </section>
  );
};

// A render unit in a side group: either a standalone trunk-sibling, or a cluster of
// descendants that share the same parent (drawn with a single sibling-bar connector).
type SideUnit =
  | { type: "sibling"; entry: SideMember }
  | { type: "cluster"; parentId: string; entries: SideMember[] };

const buildUnits = (entries: SideMember[]): SideUnit[] => {
  const units: SideUnit[] = [];
  const clusterIndex = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind === "sibling") {
      units.push({ type: "sibling", entry });
      continue;
    }
    const pid = entry.member.parentId ?? "";
    const existing = clusterIndex.get(pid);
    if (existing !== undefined) {
      (units[existing] as { type: "cluster"; entries: SideMember[] }).entries.push(entry);
    } else {
      clusterIndex.set(pid, units.length);
      units.push({ type: "cluster", parentId: pid, entries: [entry] });
    }
  }
  return units;
};

interface GenerationRowProps {
  row: Row;
  index: number;
  hasMoreGenerations: boolean;
  showTrunk: boolean;
  selectedId: string | null;
  expandedSiblings: Set<string>;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onToggleSibling: (id: string) => void;
}

const GenerationRow = ({
  row,
  index,
  hasMoreGenerations,
  showTrunk,
  selectedId,
  expandedSiblings,
  onSelect,
  onToggleCollapse,
  onToggleSibling,
}: GenerationRowProps) => {
  const { primary, leftMembers, rightMembers } = row;

  // Direct sibling visible only when its trunk row is shown. Descendant visible when every non-trunk ancestor is expanded.
  const isVisible = (m: SideMember) =>
    m.kind === "sibling"
      ? showTrunk
      : m.ancestorChain.every((id) => expandedSiblings.has(id));
  const visibleLeft = leftMembers.filter(isVisible);
  const visibleRight = rightMembers.filter(isVisible);
  const hasSides = visibleLeft.length > 0 || visibleRight.length > 0;

  const leftUnits = buildUnits(visibleLeft);
  const rightUnits = buildUnits(visibleRight);

  return (
    <div
      className={`tree-generation ${index === 0 ? "tree-generation--root" : ""}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {index > 0 && showTrunk && (
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
            GENERATION {row.generation}
          </text>
        </svg>
      </div>

      <div className={`tree-generation-row ${hasSides ? "has-branches" : ""}`}>
        <div className="branch-group branch-group--left">
          {leftUnits.map((unit, i) =>
            unit.type === "sibling" ? (
              <SideMemberCell
                key={unit.entry.member.id}
                entry={unit.entry}
                side="left"
                selectedId={selectedId}
                expandedSiblings={expandedSiblings}
                onSelect={onSelect}
                onToggleCollapse={onToggleCollapse}
                onToggleSibling={onToggleSibling}
              />
            ) : (
              <SiblingCluster
                key={`cluster-${unit.parentId}-${i}`}
                entries={unit.entries}
                side="left"
                selectedId={selectedId}
                expandedSiblings={expandedSiblings}
                onSelect={onSelect}
                onToggleCollapse={onToggleCollapse}
                onToggleSibling={onToggleSibling}
              />
            ),
          )}
        </div>

        {showTrunk ? (
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
        ) : (
          <div className="trunk-node trunk-node--empty" aria-hidden="true" />
        )}

        <div className="branch-group branch-group--right">
          {rightUnits.map((unit, i) =>
            unit.type === "sibling" ? (
              <SideMemberCell
                key={unit.entry.member.id}
                entry={unit.entry}
                side="right"
                selectedId={selectedId}
                expandedSiblings={expandedSiblings}
                onSelect={onSelect}
                onToggleCollapse={onToggleCollapse}
                onToggleSibling={onToggleSibling}
              />
            ) : (
              <SiblingCluster
                key={`cluster-${unit.parentId}-${i}`}
                entries={unit.entries}
                side="right"
                selectedId={selectedId}
                expandedSiblings={expandedSiblings}
                onSelect={onSelect}
                onToggleCollapse={onToggleCollapse}
                onToggleSibling={onToggleSibling}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
};

interface SideMemberCellProps {
  entry: SideMember;
  side: "left" | "right";
  selectedId: string | null;
  expandedSiblings: Set<string>;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onToggleSibling: (id: string) => void;
}

const SideMemberCell = ({
  entry,
  side,
  selectedId,
  expandedSiblings,
  onSelect,
  onToggleCollapse,
  onToggleSibling,
}: SideMemberCellProps) => {
  const { member } = entry;
  const hasKids = member.children.length > 0;
  const isCollapsed = !expandedSiblings.has(member.id);

  const node = (
    <MemberNode
      member={member}
      isCollapsed={isCollapsed}
      isSelected={selectedId === member.id}
      depth={member.generation}
      onSelect={onSelect}
      onToggleCollapse={onToggleSibling}
      hideCollapseButton={!hasKids}
    />
  );

  const curve = (
    <svg className="limb-curve" viewBox="0 0 80 40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <line x1="0" y1="20" x2="80" y2="20" stroke="var(--line)" strokeWidth="2" />
    </svg>
  );

  return (
    <div className={`branch-limb branch-limb--${side}`}>
      {side === "left" ? (
        <>
          {node}
          {curve}
        </>
      ) : (
        <>
          {curve}
          {node}
        </>
      )}
    </div>
  );
};

interface SiblingClusterProps {
  entries: SideMember[];
  side: "left" | "right";
  selectedId: string | null;
  expandedSiblings: Set<string>;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onToggleSibling: (id: string) => void;
}

// Renders descendants that share a parent: a single drop-line from the parent meets a
// horizontal sibling bar, with short stems dropping to each member box.
const SiblingCluster = ({
  entries,
  side,
  selectedId,
  expandedSiblings,
  onSelect,
  onToggleCollapse,
  onToggleSibling,
}: SiblingClusterProps) => {
  // The child that sits directly under the parent (and carries the up-drop):
  // first DOM child on the right side, last on the left side.
  const dropIndex = side === "left" ? entries.length - 1 : 0;

  return (
    <div className={`sibling-cluster sibling-cluster--${side}`}>
      {entries.map((entry, i) => {
        const member = entry.member;
        const hasKids = member.children.length > 0;
        const isCollapsed = !expandedSiblings.has(member.id);
        return (
          <div className="cluster-child" key={member.id}>
            {i === dropIndex && <span className="cluster-uplink" aria-hidden="true" />}
            <MemberNode
              member={member}
              isCollapsed={isCollapsed}
              isSelected={selectedId === member.id}
              depth={member.generation}
              onSelect={onSelect}
              onToggleCollapse={hasKids ? onToggleSibling : onToggleCollapse}
              hideCollapseButton={!hasKids}
            />
          </div>
        );
      })}
    </div>
  );
};
