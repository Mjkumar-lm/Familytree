# Family Tree UI Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing family tree app from a basic editor into a polished Premium Family Archive experience.

**Architecture:** Keep the existing React state, browser storage, import/export, and editing data flow. Enhance the component props, markup, and CSS to create a richer command center, more expressive tree nodes, and a profile-like details panel.

**Tech Stack:** React, TypeScript, CSS, lucide-react, Vite.

---

## File Structure

- `src/App.tsx`: calculate archive stats and pass selected member context into the toolbar.
- `src/components/Toolbar.tsx`: redesign header into command center with stats.
- `src/components/FamilyTree.tsx`: pass depth into tree branches for richer visual hierarchy.
- `src/components/MemberNode.tsx`: add generation markers, relationship badges, descendant count, and stronger node states.
- `src/components/MemberDetails.tsx`: redesign panel into profile header, quick facts, grouped form, and clearer actions.
- `src/components/ConfirmDialog.tsx`: polish dialog copy and structure.
- `src/styles.css`: replace the basic styling with a responsive premium archive visual system.

## Tasks

### Task 1: Header And Stats

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Toolbar.tsx`

- [ ] Add memoized stats for direct-line count, generation range, and selected generation.
- [ ] Pass stats into `Toolbar`.
- [ ] Redesign `Toolbar` markup into a brand area, search/action command row, stats strip, and status line.

### Task 2: Tree Node UX

**Files:**
- Modify: `src/components/FamilyTree.tsx`
- Modify: `src/components/MemberNode.tsx`

- [ ] Pass `depth` through recursive branches.
- [ ] Add generation chip, relationship badge, descendant count, and depth-based accent styling to member nodes.
- [ ] Keep expand/collapse and selection behavior unchanged.

### Task 3: Details Panel UX

**Files:**
- Modify: `src/components/MemberDetails.tsx`

- [ ] Rework the selected member panel into a profile header with larger image treatment.
- [ ] Add quick fact pills for generation, relationship, and life details.
- [ ] Group editable fields under cleaner section labels.
- [ ] Keep add, edit, save, cancel, delete, image upload, and image removal behavior unchanged.

### Task 4: Premium Responsive Styling

**Files:**
- Modify: `src/styles.css`

- [ ] Add a refined archive visual language with layered backgrounds, better spacing, richer surfaces, and restrained accent colors.
- [ ] Improve desktop layout density and selected states.
- [ ] Improve tablet stacking and mobile scanability.
- [ ] Ensure no text overlaps at narrow widths.

### Task 5: Verification

**Files:**
- Modify as needed based on build results.

- [ ] Run `npm.cmd run build`.
- [ ] Fix any TypeScript or build errors.
- [ ] Report any visual QA limitations from the sandbox.

## Self-Review

This plan covers the approved Premium Family Archive direction: command center, stats, richer tree nodes, profile-style details panel, responsive polish, and unchanged browser-only data behavior.
