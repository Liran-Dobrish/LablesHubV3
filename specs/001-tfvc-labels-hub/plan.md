# Implementation Plan: TFVC Labels Hub

**Branch**: `001-tfvc-labels-hub` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-tfvc-labels-hub/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

An Azure DevOps web extension contributing a single hub page for browsing TFVC labels. The hub is a small client-side app that switches between two views: a filterable label list (free-text over name + description, plus a creator dropdown) and a label details view (header with back button, read-only description, and a folder tree/contents master-detail view), reached without registering a second hub contribution. Built in TypeScript with React, using `azure-devops-ui` for all UI components and `azure-devops-extension-api`'s `TfvcRestClient` for label/item data. Bundled with esbuild and packaged into a `.vsix` with `tfx-cli`. Description editing is out of scope for this release per spec.md Clarifications (the TFVC Labels REST API has no update operation), so the description is displayed read-only with no persistence layer of its own.

## Technical Context

**Language/Version**: TypeScript 5.x, compiled/targeted to ES2020; React 17.x (peer dependency of `azure-devops-ui`)

**Primary Dependencies**: `azure-devops-ui` (UI components), `azure-devops-extension-sdk` (host handshake, context, auth), `azure-devops-extension-api` (`TfvcRestClient`), `react` / `react-dom`

**Storage**: N/A — all label/item/description data is read-only via the TFVC REST API; the extension persists no data of its own

**Testing**: Jest + React Testing Library (component/unit tests), with `azure-devops-extension-sdk` and `TfvcRestClient` mocked per [contracts/tfvc-labels-client.md](./contracts/tfvc-labels-client.md)

**Target Platform**: Azure DevOps web UI (hub iframe), Azure DevOps Services and Server 2020+, evergreen browsers

**Project Type**: Single-project web extension (frontend only; "backend" is the existing Azure DevOps REST API — no custom server component)

**Performance Goals**: Main list and details page render initial content or an explicit loading/empty/error state within 3s (SC-004); client-side filter/tree-selection interactions respond in well under 1s

**Constraints**: Must run inside the Azure DevOps iframe sandbox via the `SDK.init()`/`notifyLoadSucceeded()` handshake; must be packaged as a `.vsix` via `tfx-cli` against a `vss-extension.json` manifest; label description is read-only in this release (per spec.md Clarifications); large folder-content lists must be virtualized/paginated (edge case in spec.md)

**Scale/Scope**: 1 hub page contribution (label-list) with a client-side view switch to label details; label lists of 200+ rows (SC-001); folder trees of arbitrary depth

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applicability & Gate Status |
|---|---|
| I. Code Quality | PASS — TypeScript strict mode + ESLint enforced in build; single-responsibility modules (`services/`, `components/`, `hubs/`) planned in Project Structure below; no dead code/commented blocks to be introduced. |
| II. Testing Standards | PASS — Jest + React Testing Library unit tests planned for filter logic (name + description matching) and tree/content sync (see research.md §6, quickstart.md "Automated checks"); mocked data-access seam (contracts/tfvc-labels-client.md) keeps tests deterministic and independent of network/order. |
| III. User Experience Consistency | PASS — Exclusive use of `azure-devops-ui` components (research.md §2) ensures visual/interaction consistency with the ADO host; error/empty states standardized per FR-013/FR-014; accessibility (keyboard/ARIA) explicitly verified in tasks.md T035. Localization is explicitly out of scope for this release. |
| IV. Performance Requirements | PASS — Explicit targets captured above (SC-004, folder virtualization); no unbounded loops or N+1 patterns expected since label/item fetches are paged REST calls. |

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
│   │   ├── App.tsx                   # Single-hub shell: switches between list/details views client-side
│   │   ├── LabelListPage.tsx         # US1: filterable label list (the registered hub's default view)
│   │   ├── LabelListPage.html         # esbuild output mount point for the (only) hub contribution
│   │   └── index.ts                   # SDK.init() bootstrap; mounts App
│   └── label-details/
│       └── LabelDetailsPage.tsx       # US2: header/back button + description + contents (view, not a separate hub)
├── components/
│   ├── LabelListFilterBar.tsx        # US1: free-text (name+description) + creator dropdown (azure-devops-ui Filter)
│   ├── LabelRow.tsx                  # US1: two-line row (name / date + persona)
│   ├── LabelDescriptionView.tsx      # US2: read-only description display
│   ├── LabelFolderTree.tsx           # US3: left-side tree
│   └── LabelFolderContents.tsx       # US3: right-side files/folders table
├── services/
│   ├── tfvcLabelsClient.ts           # Implements the TfvcLabelsClient contract
│   └── sdkInit.ts                    # Shared SDK.init/context helpers
├── models/
│   └── types.ts                      # TfvcLabel, LabelCreator, LabelFolderNode, LabelItem, view-state types
└── common/
    ├── formatting.ts                 # Date formatting, path segment helpers
    ├── navigation.ts                 # Same-page query-string build/parse for the list/details view switch
    └── strings.ts                    # Centralized user-facing strings (accessibility labels; no localization)

static/
└── images/                           # Extension + hub icons for vss-extension.json

tests/
├── unit/
│   ├── labelListFilter.test.ts       # US1
│   ├── labelDetailsNavigation.test.ts # US2
│   └── labelFolderTree.test.ts       # US3
└── integration/
    └── tfvcLabelsClient.test.ts       # Contract tests against mocked TfvcRestClient

scripts/
└── build.mjs                         # esbuild bundling for the single hub entry point (dev + prod modes)

vss-extension.json                    # tfx-cli / Azure DevOps extension manifest (one hub contribution)
package.json
tsconfig.json
```

**Structure Decision**: Single-project web extension (no separate backend project — the
"backend" is the existing Azure DevOps TFVC REST API accessed via
`azure-devops-extension-api`). Only `src/hubs/label-list` is a registered hub
contribution; `src/hubs/label-details/LabelDetailsPage.tsx` is a plain view
component rendered by `App.tsx` based on client-side state (`src/common/navigation.ts`
builds/parses a same-page query string so the browser back button restores the
prior list view and filters). Both views share `components/`, `services/`, and
`models/`. The `services/tfvcLabelsClient.ts` module is the single seam implementing the
[`TfvcLabelsClient` contract](./contracts/tfvc-labels-client.md), keeping REST/SDK
specifics out of components and enabling deterministic unit tests per the
Testing Standards constitution principle.

## Complexity Tracking

*No constitution violations identified; this section is not applicable.*

