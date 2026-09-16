# Data Model: TFVC Labels Hub

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Entities are described conceptually (fields + relationships + validation) and are independent of the exact wire format returned by `azure-devops-extension-api`'s `TfvcRestClient` (that client's `TfvcLabel`/`TfvcItem` contracts are mapped into these view-facing shapes by the service layer — see [contracts/tfvc-labels-client.md](./contracts/tfvc-labels-client.md)).

## TfvcLabel

Represents a named snapshot of TFVC paths at a point in time; the primary row entity of the main page.

| Field | Type | Notes |
|---|---|---|
| `id` | string/number | Unique label identifier within the team project |
| `name` | string | Label name; shown as the first line of a row and as the details page header title |
| `description` | string \| null | Free-text description; `null`/empty renders as "No description" |
| `createdDate` | ISO date string | Shown on the second row line |
| `creator` | `LabelCreator` | Owner/creator of the label |
| `scopePath` | string | Root TFVC path the label applies to (used to seed the folder tree root) |

**Validation rules**:
- `name` is required and non-empty (source of truth: Azure DevOps; extension treats it as read-only).
- `description` is read-only in this release (editing is out of scope per spec.md Clarifications); no client-side mutation of this field is supported.

## LabelCreator

Represents the identity that created a label; used both on label rows and to populate the creator filter drop-down.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable identity descriptor/GUID |
| `displayName` | string | Shown next to the persona icon |
| `avatarUrl` | string \| null | Used by `VssPersona`; falls back to initials when absent |

**Derivation rule**: The creator drop-down's option list is the distinct set of `LabelCreator` values found across the currently loaded `TfvcLabel` list (per spec.md Assumptions), not the full project membership.

## LabelFolderNode

Represents a folder within a label's captured path structure; nodes form the tree on the left of the label contents section.

| Field | Type | Notes |
|---|---|---|
| `path` | string | Full server path, doubles as the unique node key |
| `name` | string | Leaf segment of `path`, shown as the tree node label |
| `parentPath` | string \| null | `null` for the root node (derived from `TfvcLabel.scopePath`) |
| `hasChildren` | boolean | Drives expandable/leaf rendering in `Tree` |

**Relationships**: A `LabelFolderNode` has zero or more child `LabelFolderNode`s (folders only) and, when selected, exposes its direct `LabelItem`s in the right-hand panel.

## LabelItem

Represents a file or folder listed directly under a selected `LabelFolderNode` (right-hand panel row).

| Field | Type | Notes |
|---|---|---|
| `path` | string | Full server path |
| `name` | string | Leaf segment of `path`, shown as the item name |
| `type` | `"file" \| "folder"` | Drives icon selection |

**Validation/derivation rule**: `LabelItem`s shown in the right-hand panel are exactly the direct children (one path-segment deeper) of the currently selected `LabelFolderNode.path`; deeper descendants are not flattened into this list.

## View/state entities (not persisted beyond the session)

- **LabelListFilterState**: `{ searchText: string; creatorId: string | null }` — drives the derived, filtered view of the loaded `TfvcLabel[]` on the main page.
- **LabelDetailsState**: `{ label: TfvcLabel; selectedFolderPath: string }` — drives the details page's tree/content synchronization.

## State transitions

- **Folder selection**: `selectedFolderPath` changes on tree node click → triggers a re-fetch/re-derivation of the `LabelItem[]` for the right-hand panel; previous panel content is replaced, not merged.
