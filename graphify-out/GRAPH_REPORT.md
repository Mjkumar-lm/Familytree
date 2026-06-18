# Graph Report - .  (2026-06-16)

## Corpus Check
- Corpus is ~6,134 words - fits in a single context window. You may not need a graph.

## Summary
- 105 nodes · 155 edges · 9 communities
- Extraction: 93% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_React Components|React Components]]
- [[_COMMUNITY_Data Management|Data Management]]
- [[_COMMUNITY_Type System|Type System]]
- [[_COMMUNITY_Tree Utilities|Tree Utilities]]
- [[_COMMUNITY_UI Layout|UI Layout]]
- [[_COMMUNITY_Storage & Config|Storage & Config]]
- [[_COMMUNITY_Generation Display|Generation Display]]
- [[_COMMUNITY_Member Records|Member Records]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `FamilyMember` - 8 edges
3. `TreeMember` - 8 edges
4. `getInitials()` - 5 edges
5. `compilerOptions` - 5 edges
6. `scripts` - 4 edges
7. `MemberDetails()` - 4 edges
8. `Relationship` - 4 edges
9. `MemberDraft` - 4 edges
10. `loadMembers()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `FamilyTreeProps` --references--> `TreeMember`  [EXTRACTED]
  src/components/FamilyTree.tsx → src/types.ts
- `GenerationRowProps` --references--> `TreeMember`  [EXTRACTED]
  src/components/FamilyTree.tsx → src/types.ts
- `MemberDetails()` --calls--> `getInitials()`  [EXTRACTED]
  src/components/MemberDetails.tsx → src/utils/tree.ts
- `MemberNodeProps` --references--> `TreeMember`  [EXTRACTED]
  src/components/MemberNode.tsx → src/types.ts
- `MemberDetailsProps` --references--> `FamilyMember`  [EXTRACTED]
  src/components/MemberDetails.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "React Components"
Cohesion: 0.16
Nodes (17): ConfirmDialog(), ConfirmDialogProps, HeroSection(), seedMembers, App(), PendingAction, cloneSeedMembers(), loadMembers() (+9 more)

### Community 1 - "Data Management"
Cohesion: 0.11
Nodes (18): dependencies, lucide-react, react, react-dom, typescript, vite, @vitejs/plugin-react, devDependencies (+10 more)

### Community 2 - "Type System"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+10 more)

### Community 3 - "Tree Utilities"
Cohesion: 0.20
Nodes (11): App, FamilyMember, FamilyTree, HeroSection, MemberDetails, MemberNode, seedData, storage utils (+3 more)

### Community 4 - "UI Layout"
Cohesion: 0.33
Nodes (7): emptyDraft(), MemberDetails(), MemberDetailsProps, relationshipOptions, FamilyMember, MemberDraft, Relationship

### Community 5 - "Storage & Config"
Cohesion: 0.33
Nodes (7): FamilyTree(), FamilyTreeProps, GenerationRowProps, MemberNode(), MemberNodeProps, TreeMember, getInitials()

### Community 6 - "Generation Display"
Cohesion: 0.29
Nodes (6): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, include

### Community 7 - "Member Records"
Cohesion: 0.50
Nodes (3): ArchiveStats, Toolbar(), ToolbarProps

## Knowledge Gaps
- **43 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TreeMember` connect `Storage & Config` to `React Components`, `UI Layout`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Management` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Type System` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._