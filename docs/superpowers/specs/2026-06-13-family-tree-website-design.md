# Family Tree Website Design

## Goal

Build a browser-only family tree website that can be deployed to Vercel. The first version lets users view the provided generation hierarchy, add members, edit member details, delete members, upload one image per member, search the tree, and preserve changes in the browser.

## Scope

The app will be a static frontend application. It will not include accounts, shared editing, server storage, or database-backed sync in this version. Data and images are stored locally in the visitor's browser. Because of that, different devices or browsers will have separate copies of the tree.

To reduce lock-in, the app will include JSON export and import so the tree can be backed up or moved manually.

## Recommended Approach

Use a Vercel-friendly React app with client-side storage.

The app will ship with the starting family hierarchy as seed data. On first load, the app copies that seed into browser storage. After that, the user edits their local copy. A reset action can restore the original seed hierarchy.

## User Experience

The first screen is the actual family-tree workspace, not a landing page.

Desktop layout:
- Header toolbar with search, import, export, and reset actions.
- Main interactive family tree area on the left.
- Member details panel on the right for the selected person.

Mobile layout:
- Search and primary actions remain at the top.
- Tree becomes a scrollable, readable vertical hierarchy.
- Member details open as a drawer or stacked panel below the selected member.

Each member node shows:
- Image or initials fallback.
- Name.
- Generation number.
- Relationship tag such as Direct Line, Brother, or Member.
- Visual parent-child branch connection.

Selecting a member opens details with:
- Name.
- Generation.
- Relationship.
- Notes.
- Optional life details fields.
- Image upload/change/remove.
- Add child/member action.
- Edit/save/cancel controls.
- Delete action with confirmation.

## Data Model

Each member will be stored as a structured object:

```json
{
  "id": "unique-member-id",
  "name": "Hera Lal",
  "generation": 22,
  "relationship": "Direct Line",
  "parentId": "member-id-or-null",
  "notes": "",
  "birth": "",
  "death": "",
  "image": ""
}
```

The tree can be derived from `parentId`, which keeps add, edit, delete, import, and export logic straightforward.

## Storage

Use browser storage for the first version:
- Store text data as JSON.
- Store uploaded images as browser-safe data URLs.
- Keep an export/import path for backup.

If image size becomes a problem, the implementation can move image storage to IndexedDB while keeping the same member model.

## Editing Rules

Adding:
- A user selects a member and adds a child/member beneath that person.
- The new member receives the next generation number by default.
- The user can change relationship and details before saving.

Editing:
- Existing member fields can be edited from the details panel.
- Edits update browser storage immediately after save.

Deleting:
- Deleting a member asks for confirmation.
- If the member has descendants, the confirmation clearly states that descendants will also be removed.

Reset:
- Restores the original provided hierarchy.
- Requires confirmation because it overwrites local edits.

Import:
- Accepts exported JSON from the app.
- Validates that imported records have required fields before replacing local data.

Export:
- Downloads the current tree as JSON, including stored image data.

## Visual Direction

The design should feel like a refined family archive rather than a generic admin dashboard:
- Warm off-white background.
- Dark readable text.
- Muted heritage accent colors.
- Clear branch lines.
- Compact profile nodes with restrained shadows and 8px or smaller corner radius.
- Details panel designed for repeated editing, not marketing content.

The UI must remain readable with long names and deep generations. Text should not overlap controls or tree lines on desktop or mobile.

## Components

Core components:
- `App`: loads data, owns selected member state, coordinates storage.
- `Toolbar`: search, import, export, reset.
- `FamilyTree`: renders the hierarchy and expand/collapse behavior.
- `MemberNode`: compact member profile node.
- `MemberDetails`: read/edit form for the selected member.
- `ConfirmDialog`: destructive action confirmation.
- `EmptyState`: used if imported data is empty or selection is missing.

Core utilities:
- `seedData`: starting hierarchy from the provided lineage.
- `storage`: load/save/reset browser data.
- `tree`: build nested tree, find members, delete descendants, validate imports.

## Error Handling

The app should handle:
- Invalid imported JSON.
- Missing required fields in imported data.
- Oversized or unreadable image files.
- Deleting a selected member.
- Empty tree state after import.
- Storage failures with a visible message.

## Testing And Verification

Minimum verification:
- Build succeeds.
- App opens locally.
- Seed hierarchy renders.
- Add, edit, delete, reset, import, and export flows work.
- Uploaded member image persists after reload in the same browser.
- Mobile and desktop layouts do not overlap or clip important text.

## Future Backend Path

The browser-only version should keep data operations behind utility functions so a later backend can replace local storage with API calls. A future shared version can add:
- Vercel-hosted backend/API routes.
- Database storage.
- Authentication.
- Role-based edit permissions.
- Shared image storage.

## UI Enhancement Direction

The approved visual direction is Premium Family Archive. The app should feel more finished and emotionally appropriate than a basic editor while staying practical for repeated family-tree maintenance.

Enhancements:
- Replace the simple header with an archive command center that includes the app identity, search, import/export/reset actions, and compact stats.
- Add stats for total members, visible results, direct-line members, and selected generation.
- Make the tree surface feel more intentional with richer member nodes, generation markers, relationship badges, clearer selected/hover states, and refined branch depth.
- Improve the details panel into a profile-style surface with a stronger image header, quick facts, cleaner edit form sections, and better action hierarchy.
- Improve responsive behavior so mobile reads as a focused family archive, not a squeezed desktop dashboard.
- Keep all existing browser-only data behavior unchanged.
