# Contract: TFVC Labels Data Service

**Feature**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md) | **Data model**: [data-model.md](../data-model.md)

This is the internal contract between the UI (hub pages/components) and the data-access layer. It decouples components from `azure-devops-extension-api`/`azure-devops-extension-sdk` specifics and is the seam mocked in unit tests.

## `TfvcLabelsClient`

```ts
interface TfvcLabelsClient {
  /** Fetch all labels for the current team project (used by the main page). */
  getLabels(): Promise<TfvcLabel[]>;

  /** Fetch a single label by id (used to hydrate the details page on deep-link/refresh). */
  getLabel(labelId: string): Promise<TfvcLabel>;

  /**
   * Fetch the direct children (files and folders) of a given path within a label.
   * Passing the label's scopePath returns the root-level children.
   */
  getLabelFolderContents(labelId: string, folderPath: string): Promise<LabelItem[]>;
}
```

### `getLabels()`

- **Input**: none (operates on the current project context obtained via `SDK.getWebContext()`).
- **Output**: `TfvcLabel[]`, as returned by the TFVC REST API (description is read-only; no client-side merging/overlay).
- **Errors**: rejects with a typed `DataAccessError` (`{ kind: "network" | "unauthorized" | "unknown"; message: string }`) that the UI maps to the error-state described in FR-014.

### `getLabel(labelId)`

- **Input**: `labelId` — identifier from the label row that was clicked.
- **Output**: single `TfvcLabel`.
- **Errors**: `DataAccessError` including a `"not-found"` kind when the label no longer exists (edge case: label deleted while details page open).

### `getLabelFolderContents(labelId, folderPath)`

- **Input**: `labelId`, `folderPath` (server path of the currently selected tree node).
- **Output**: `LabelItem[]` — direct children only (see data-model.md validation rule).
- **Errors**: `DataAccessError`; UI shows the empty-state (FR-013) when the array is empty rather than treating it as an error.

## External dependency contract (consumed, not owned)

The above is implemented on top of the public **Azure DevOps TFVC REST API** (`azure-devops-extension-api/Tfvc` → `TfvcRestClient`), specifically:

| Operation | Used for |
|---|---|
| `List` (`getLabels`) | `TfvcLabelsClient.getLabels()` |
| `Get` (`getLabel`) | `TfvcLabelsClient.getLabel()` |
| `Get Label Items` (`getLabelItems`) | `TfvcLabelsClient.getLabelFolderContents()` (results filtered/grouped client-side into direct-child folders/files) |

There is no REST operation for updating a label; description editing is out of scope for this release (see spec.md Clarifications and research.md §3).
