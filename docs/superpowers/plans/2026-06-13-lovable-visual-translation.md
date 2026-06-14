# Lovable Visual Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate the strongest Lovable visual ideas into the local Vite family-tree app.

**Architecture:** Keep the app's existing data model, localStorage persistence, and editing behavior. Change the tree representation and styling so direct-line members form a centered lineage timeline with generation bands, while side members remain visually secondary.

**Tech Stack:** React, TypeScript, CSS, lucide-react, Vite.

---

## File Structure

- `src/components/Toolbar.tsx`: adjust copy and actions to match Lovable's command center, including a visible add-member command wired through selection.
- `src/components/FamilyTree.tsx`: render a timeline-style tree surface with header and generation rows.
- `src/components/MemberNode.tsx`: distinguish direct-line, brother, and member nodes with stronger labels and visual weight.
- `src/components/MemberDetails.tsx`: tune panel labels and quick facts toward the Lovable profile panel.
- `src/styles.css`: implement generation bands, centered direct-line rail, branch cards, and tighter responsive behavior.

## Tasks

### Task 1: Tree Surface Structure

**Files:**
- Modify: `src/components/FamilyTree.tsx`
- Modify: `src/components/MemberNode.tsx`

- [ ] Add a tree header reading "The Direct Line" and "From Swar Ji to the present".
- [ ] Render each member branch inside a generation row with a left generation label.
- [ ] Add relationship classes so direct-line nodes can align on the central rail while side nodes remain offset.

### Task 2: Profile Panel And Command Copy

**Files:**
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/MemberDetails.tsx`

- [ ] Update labels to match the Lovable archive tone: "Twenty-five generations", "Direct heir", "Quick facts", "Lineage".
- [ ] Keep all add/edit/delete/upload behavior unchanged.

### Task 3: Visual Translation CSS

**Files:**
- Modify: `src/styles.css`

- [ ] Add Lovable-inspired horizontal generation bands.
- [ ] Add a centered golden vertical direct-line rail.
- [ ] Make direct-line cards centered and prominent.
- [ ] Make brother/member cards secondary and laterally offset.
- [ ] Improve mobile timeline behavior so rows stack without overlap.

### Task 4: Verification

**Files:**
- Modify as needed based on errors.

- [ ] Run `npm.cmd run build`.
- [ ] Fix any TypeScript or bundling errors.

## Self-Review

The plan directly covers the Lovable preview patterns: command center, direct-line rail, generation bands, premium profile panel language, and responsive family archive representation.
