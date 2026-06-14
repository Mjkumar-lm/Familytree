# Family Tree Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive browser-only family tree editor that deploys to Vercel.

**Architecture:** Create a Vite React app with local browser persistence. Data operations live in small utility modules, while rendering is split into toolbar, tree, member node, details panel, and confirmation dialog components.

**Tech Stack:** Vite, React, TypeScript, CSS, localStorage, FileReader image uploads.

---

## File Structure

- `package.json`: project scripts and dependencies for Vercel.
- `index.html`: Vite HTML entry.
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`: TypeScript and Vite config.
- `src/main.tsx`: React app bootstrap.
- `src/App.tsx`: app state, persistence, selection, and action orchestration.
- `src/data/seedData.ts`: initial family hierarchy.
- `src/types.ts`: shared member types.
- `src/utils/storage.ts`: load/save/reset browser storage.
- `src/utils/tree.ts`: build hierarchy, validate imports, descendants deletion.
- `src/components/Toolbar.tsx`: search, import, export, reset controls.
- `src/components/FamilyTree.tsx`: recursive responsive tree renderer.
- `src/components/MemberNode.tsx`: individual profile node.
- `src/components/MemberDetails.tsx`: view/edit/add/delete form.
- `src/components/ConfirmDialog.tsx`: confirmation UI.
- `src/styles.css`: responsive visual design for desktop, tablet, and mobile.

## Tasks

### Task 1: Scaffold App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`

- [ ] Create Vite React project files with `dev`, `build`, and `preview` scripts.
- [ ] Add the React bootstrap that mounts `App` into `#root`.
- [ ] Run `npm install` if dependencies are missing.

### Task 2: Data Model And Utilities

**Files:**
- Create: `src/types.ts`
- Create: `src/data/seedData.ts`
- Create: `src/utils/storage.ts`
- Create: `src/utils/tree.ts`

- [ ] Define the `FamilyMember` and `TreeMember` types.
- [ ] Encode the provided hierarchy as seed data using stable IDs and `parentId`.
- [ ] Implement storage load/save/reset with localStorage.
- [ ] Implement hierarchy building, import validation, descendant collection, and ID generation.

### Task 3: Core App State

**Files:**
- Create: `src/App.tsx`

- [ ] Load saved data or seed data on startup.
- [ ] Track selected member, search query, collapsed member IDs, edit status messages, and confirmation state.
- [ ] Implement add, update, delete, reset, import, export, image persistence, and branch collapse handlers.

### Task 4: UI Components

**Files:**
- Create: `src/components/Toolbar.tsx`
- Create: `src/components/FamilyTree.tsx`
- Create: `src/components/MemberNode.tsx`
- Create: `src/components/MemberDetails.tsx`
- Create: `src/components/ConfirmDialog.tsx`

- [ ] Build toolbar controls for search, import, export, and reset.
- [ ] Render recursive tree branches with expand/collapse behavior.
- [ ] Render member cards with photo/initial fallback and relationship badges.
- [ ] Build detail editing form with image upload/change/remove.
- [ ] Build confirmation dialog for reset and delete flows.

### Task 5: Responsive Visual Design

**Files:**
- Create: `src/styles.css`

- [ ] Add archive-inspired visual styling with readable colors, 8px max card radius, clear focus states, and stable node dimensions.
- [ ] Add desktop layout: toolbar, horizontal workspace, tree left, details panel right.
- [ ] Add tablet layout: stacked workspace with details panel below tree.
- [ ] Add mobile layout: compact toolbar, scrollable tree list, full-width details panel, no text overlap.

### Task 6: Verification

**Files:**
- Modify as needed based on test results.

- [ ] Run `npm run build`.
- [ ] Start local preview or dev server.
- [ ] Verify desktop, tablet, and mobile widths.
- [ ] Verify seed render, add, edit, delete, reset, import, export, and image persistence.

## Self-Review

The plan covers the approved spec: browser-only storage, Vercel deployment, seed hierarchy, add/edit/delete, one image per member, JSON import/export, reset, responsive desktop/tablet/mobile layouts, and a future backend path through isolated utilities. No placeholders or contradictory data fields are used.
