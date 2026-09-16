# Implementation Plan: TFVC Labels Hub

**Branch**: `001-tfvc-labels-hub` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-tfvc-labels-hub/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

An Azure DevOps web extension contributing two hub pages for browsing TFVC labels: a filterable label list (free-text + creator dropdown) and a label details page (header with back button, editable description, and a folder tree/contents master-detail view). Built in TypeScript with React, using `azure-devops-ui` for all UI components and `azure-devops-extension-api`'s `TfvcRestClient` for label/item data. Bundled with esbuild and packaged into a `.vsix` with `tfx-cli`. Since the TFVC Labels REST API has no update operation, edited descriptions are persisted as an extension-local overlay via the Azure DevOps Extension Data Service rather than mutating the label itself (see [research.md](./research.md) §3).

## Technical Context

**Language/Version**: TypeScript 5.x, compiled/targeted to ES2020; React 17.x (peer dependency of `azure-devops-ui`)

**Primary Dependencies**: `azure-devops-ui` (UI components), `azure-devops-extension-sdk` (host handshake, context, auth), `azure-devops-extension-api` (`TfvcRestClient`, Extension Data Service), `react` / `react-dom`

**Storage**: N/A for label/item data (read-only via TFVC REST API); Azure DevOps Extension Data Service used only to persist the extension-local description-edit overlay (see research.md §3)

**Testing**: Jest + React Testing Library (component/unit tests), with `azure-devops-extension-sdk` and `TfvcRestClient` mocked per [contracts/tfvc-labels-client.md](./contracts/tfvc-labels-client.md)

**Target Platform**: Azure DevOps web UI (hub iframe), Azure DevOps Services and Server 2020+, evergreen browsers

**Project Type**: Single-project web extension (frontend only; "backend" is the existing Azure DevOps REST API — no custom server component)

**Performance Goals**: Main list and details page render initial content or an explicit loading/empty/error state within 3s (SC-005); client-side filter/tree-selection interactions respond in well under 1s

**Constraints**: Must run inside the Azure DevOps iframe sandbox via the `SDK.init()`/`notifyLoadSucceeded()` handshake; must be packaged as a `.vsix` via `tfx-cli` against a `vss-extension.json` manifest; description edits are extension-local only (not written back to the underlying TFVC label, per research.md §3); large folder-content lists must be virtualized/paginated (edge case in spec.md)

**Scale/Scope**: 2 hub page contributions; label lists of 200+ rows (SC-001); folder trees of arbitrary depth

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applicability & Gate Status |
|---|---|
| I. Code Quality | PASS — TypeScript strict mode + ESLint enforced in build; single-responsibility modules (`services/`, `components/`, `hubs/`) planned in Project Structure below; no dead code/commented blocks to be introduced. |
| II. Testing Standards | PASS — Jest + React Testing Library unit tests planned for filter logic, tree/content sync, and description edit/cancel (see research.md §6, quickstart.md "Automated checks"); mocked data-access seam (contracts/tfvc-labels-client.md) keeps tests deterministic and independent of network/order. |
| III. User Experience Consistency | PASS — Exclusive use of `azure-devops-ui` components (research.md §2) ensures visual/interaction consistency with the ADO host; error/empty states standardized per FR-016/FR-017. |
| IV. Performance Requirements | PASS — Explicit targets captured above (SC-005, folder virtualization); no unbounded loops or N+1 patterns expected since label/item fetches are paged REST calls. |

No violations identified; Complexity Tracking table below is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── hubs/
│   ├── label-list/
│   │   ├── LabelListPage.tsx        # US1: filterable label list (hub entry point)
│   │   ├── LabelListPage.html        # esbuild output mount point for this hub contribution
│   │   └── index.ts                  # SDK.init() bootstrap for this hub
│   └── label-details/
│       ├── LabelDetailsPage.tsx      # US2: header/back button + description + contents
│       ├── LabelDetailsPage.html
│       └── index.ts
├── components/
│   ├── LabelListFilterBar.tsx        # US1: free-text + creator dropdown (azure-devops-ui Filter)
│   ├── LabelRow.tsx                  # US1: two-line row (name / date + persona)
│   ├── LabelDescriptionEditor.tsx    # US3: read/edit/save/cancel description
│   ├── LabelFolderTree.tsx           # US4: left-side tree (azure-devops-ui Tree)
│   └── LabelFolderContents.tsx       # US4: right-side files/folders table
├── services/
│   ├── tfvcLabelsClient.ts           # Implements the TfvcLabelsClient contract
│   ├── sdkInit.ts                    # Shared SDK.init/context helpers for both hubs
│   └── descriptionOverlayStore.ts    # Extension Data Service-backed overlay (research.md §3)
├── models/
│   └── types.ts                      # TfvcLabel, LabelCreator, LabelFolderNode, LabelItem, view-state types
└── common/
    └── formatting.ts                 # Date formatting, path segment helpers

static/
└── images/                           # Extension + hub icons for vss-extension.json

tests/
├── unit/
│   ├── labelListFilter.test.ts       # US1
│   ├── labelDetailsNavigation.test.ts # US2
│   ├── descriptionEditor.test.ts     # US3
│   └── labelFolderTree.test.ts       # US4
└── integration/
    └── tfvcLabelsClient.test.ts       # Contract tests against mocked TfvcRestClient

scripts/
└── build.mjs                         # esbuild bundling for both hub entry points (dev + prod modes)

vss-extension.json                    # tfx-cli / Azure DevOps extension manifest
package.json
tsconfig.json
```

**Structure Decision**: Single-project web extension (no separate backend project — the
"backend" is the existing Azure DevOps TFVC REST API accessed via
`azure-devops-extension-api`). Two hub entry points (`src/hubs/label-list`,
`src/hubs/label-details`) share `components/`, `services/`, and `models/`. The
`services/tfvcLabelsClient.ts` module is the single seam implementing the
[`TfvcLabelsClient` contract](./contracts/tfvc-labels-client.md), keeping REST/SDK
specifics out of components and enabling deterministic unit tests per the
Testing Standards constitution principle.

## Complexity Tracking

*No constitution violations identified; this section is not applicable.*

