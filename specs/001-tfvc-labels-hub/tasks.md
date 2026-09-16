---

description: "Task list template for feature implementation"
---

# Tasks: TFVC Labels Hub

**Input**: Design documents from `/specs/001-tfvc-labels-hub/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/tfvc-labels-client.md](./contracts/tfvc-labels-client.md), [quickstart.md](./quickstart.md)

**Tests**: Included. The constitution's Testing Standards principle requires automated tests for every feature; test tasks below mirror the Jest/React Testing Library suite already described in plan.md/research.md/quickstart.md.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single-project web extension (per plan.md Project Structure): `src/`, `tests/`, `static/`, `scripts/` at repository root; no separate backend project.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create the project directory skeleton (`src/hubs/label-list/`, `src/hubs/label-details/`, `src/components/`, `src/services/`, `src/models/`, `src/common/`, `static/images/`, `tests/unit/`, `tests/integration/`, `scripts/`) per plan.md Project Structure
- [ ] T002 Initialize `package.json` with dependencies `azure-devops-ui`, `azure-devops-extension-sdk`, `azure-devops-extension-api`, `react`, `react-dom` and devDependencies `typescript`, `esbuild`, `tfx-cli`, `jest`, `ts-jest` (or `esbuild-jest`), `@testing-library/react`, `eslint`
- [ ] T003 [P] Configure `tsconfig.json` (TypeScript 5.x strict mode, ES2020 target, JSX for React)
- [ ] T004 [P] Configure ESLint for TypeScript/React in `.eslintrc.cjs` (or `eslint.config.mjs`)
- [ ] T005 [P] Configure Jest in `jest.config.cjs` plus a test setup file mocking `azure-devops-extension-sdk` (`SDK.init`, `SDK.getWebContext`)
- [ ] T006 [P] Create the esbuild bundling script in `scripts/build.mjs` with dev (unminified + sourcemaps) and prod (minified) modes for both hub entry points
- [ ] T007 [P] Add a CI workflow in `.github/workflows/ci.yml` that runs `npm run lint`, `tsc --noEmit`, and `npm test` on every pull request, per the constitution's Development Workflow & Quality Gates
- [ ] T008 Scaffold the `vss-extension.json` manifest (publisher/extension id, icons under `static/images/`, empty `contributions` array to be filled in per-story) and wire `package.json` scripts `build`, `build:dev`, `package`, `test` per quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Define shared model and view-state types (`TfvcLabel`, `LabelCreator`, `LabelFolderNode`, `LabelItem`, `LabelListFilterState`, `LabelDetailsState`) in `src/models/types.ts` per data-model.md
- [ ] T010 [P] Implement the SDK bootstrap helper (`SDK.init`/`notifyLoadSucceeded`, `getWebContext`, theme handling) shared by both hubs in `src/services/sdkInit.ts`
- [ ] T011 [P] Implement date and path formatting helpers (created-date display, path leaf-segment extraction) in `src/common/formatting.ts`
- [ ] T012 [P] Write the contract test for `TfvcLabelsClient` (`getLabels`, `getLabel`, `getLabelFolderContents`, `DataAccessError` mapping) against a mocked `TfvcRestClient`, per contracts/tfvc-labels-client.md, in `tests/integration/tfvcLabelsClient.test.ts`
- [ ] T013 Implement `TfvcLabelsClient` in `src/services/tfvcLabelsClient.ts` satisfying the contract and making T012 pass (depends on T009, T012)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Browse and Filter TFVC Labels (Priority: P1) 🎯 MVP

**Goal**: Main hub page listing all TFVC labels as two-line rows (name; created date + creator persona/name), with a free-text filter (name + description) and a creator dropdown filter that can be combined.

**Independent Test**: Open the main hub page and verify all labels render correctly; type into the free-text filter and confirm matches on name/description; select a creator and confirm the list narrows; combine both filters; confirm an empty-state appears when no labels match.

### Tests for User Story 1

- [ ] T014 [P] [US1] Unit test for label list filtering (name/description substring match, creator match, combined filters, empty-result state) in `tests/unit/labelListFilter.test.ts`

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create the `LabelRow` component (two-line row: label name; created date + `VssPersona` creator icon/name) in `src/components/LabelRow.tsx`
- [ ] T016 [P] [US1] Create the `LabelListFilterBar` component (`azure-devops-ui` `Filter`/`FilterBar` with a `KeywordFilterBarItem` for free text and a `DropdownFilterBarItem` populated with distinct creators from the loaded labels) in `src/components/LabelListFilterBar.tsx`
- [ ] T017 [US1] Implement `LabelListPage` (fetch labels via `TfvcLabelsClient.getLabels`, derive the filtered `ObservableArray` from `LabelListFilterState`, render a `Table` of `LabelRow`, loading/empty-state/error-state-with-retry) in `src/hubs/label-list/LabelListPage.tsx` (depends on T013, T015, T016)
- [ ] T018 [US1] Create the label-list hub bootstrap entry (`SDK.init`/`notifyLoadSucceeded`, mount `LabelListPage`) in `src/hubs/label-list/index.ts` and `src/hubs/label-list/LabelListPage.html` (depends on T017)
- [ ] T019 [US1] Register the label-list hub contribution in `vss-extension.json` (depends on T008, T018)

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - View Label Details (Priority: P1)

**Goal**: Clicking a label row opens a details page with a header (back button + label name) and a read-only description; the back button returns to the main list with filters preserved.

**Independent Test**: Click any label row and verify the details page opens with the correct name/description; click back and verify the list is restored with the previously applied filters still active.

### Tests for User Story 2

- [ ] T020 [P] [US2] Unit test for label details navigation (header renders back button + label name, back button restores the prior `LabelListFilterState`) in `tests/unit/labelDetailsNavigation.test.ts`

### Implementation for User Story 2

- [ ] T021 [P] [US2] Create the `LabelDescriptionView` component (read-only description text, "No description" fallback, scroll/expand for long text) in `src/components/LabelDescriptionView.tsx`
- [ ] T022 [US2] Implement `LabelDetailsPage` header (`azure-devops-ui` `Page`/`Header` with back button + label name) and description section (fetch via `TfvcLabelsClient.getLabel`, render `LabelDescriptionView`, error-state-with-retry for both a deleted/renamed label and generic load failures, per FR-014) in `src/hubs/label-details/LabelDetailsPage.tsx` (depends on T013, T021)
- [ ] T023 [US2] Wire navigation: label row click in `LabelListPage` routes to the label-details hub with the `labelId` and current `LabelListFilterState`; the details page's back button returns to `LabelListPage` restoring that filter state, in `src/hubs/label-list/LabelListPage.tsx` and `src/hubs/label-details/LabelDetailsPage.tsx` (depends on T017, T022)
- [ ] T024 [US2] Create the label-details hub bootstrap entry (`SDK.init`/`notifyLoadSucceeded`, mount `LabelDetailsPage`) in `src/hubs/label-details/index.ts` and `src/hubs/label-details/LabelDetailsPage.html` (depends on T022)
- [ ] T025 [US2] Register the label-details hub contribution in `vss-extension.json` (depends on T008, T019, T024 — same file as T019, kept sequential to avoid conflicting edits to `vss-extension.json`)

**Checkpoint**: User Stories 1 AND 2 should both work independently (browse → open details → back with filters preserved)

---

## Phase 5: User Story 3 - Explore Label Folder Contents (Priority: P2)

**Goal**: The label details page shows a folder tree on the left and, on the right, the files/folders directly under the selected node; selecting a different node replaces the right-hand content.

**Independent Test**: Open a label's details page, select different folder tree nodes, and verify the right-hand panel updates to the newly selected node's direct children each time, including an empty-state for a childless node.

### Tests for User Story 3

- [ ] T026 [P] [US3] Unit test for folder tree selection and content synchronization (selecting a node fetches/derives its direct children, replaces prior content, shows empty-state for no children) in `tests/unit/labelFolderTree.test.ts`

### Implementation for User Story 3

- [ ] T027 [P] [US3] Create the `LabelFolderTree` component (`azure-devops-ui` `Tree`/`TreeItemProvider` seeded from the label's `scopePath`, expand/select handling) in `src/components/LabelFolderTree.tsx`
- [ ] T028 [P] [US3] Create the `LabelFolderContents` component (`Table`/virtualized list of `LabelItem`s for the selected node, empty-state for no children) in `src/components/LabelFolderContents.tsx`
- [ ] T029 [US3] Wire the label contents section into `LabelDetailsPage` (track `selectedFolderPath`, fetch via `TfvcLabelsClient.getLabelFolderContents` on selection change, render `LabelFolderTree` + `LabelFolderContents` side by side, error-state-with-retry on fetch failure per FR-014) in `src/hubs/label-details/LabelDetailsPage.tsx` (depends on T022, T027, T028)

**Checkpoint**: All user stories (US1, US2, US3) should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T030 [P] Extract a shared empty-state/error-state presentational component (used by the label list and folder contents panel, per FR-013/FR-014) in `src/components/StateMessage.tsx`
- [ ] T031 [P] Add `README.md` with setup/build/package/install instructions mirroring quickstart.md
- [ ] T032 Verify large folder-content lists are virtualized/paginated in `LabelFolderContents` (edge case in spec.md) and large creator lists support search/typeahead in `LabelListFilterBar` (edge case in spec.md)
- [ ] T033 Run the quickstart.md manual validation steps end-to-end against a test Azure DevOps organization/collection with a TFVC team project
- [ ] T034 [P] Verify initial render of the label list and details page meets the 3-second target (SC-004) under normal network conditions; adjust loading-state thresholds if needed
- [ ] T035 [P] Verify accessibility and localization readiness of new components (keyboard navigation and ARIA labeling for `LabelRow`, `LabelListFilterBar`, `LabelFolderTree` selection, and `LabelDescriptionView`; confirm all user-facing strings are extracted into a single resource module rather than inlined, per Constitution Principle III) in `src/components/` and `src/common/strings.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — no dependency on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational; integrates with US1's `LabelListPage` for navigation (T023) but is independently testable given a label id
- **User Story 3 (Phase 5)**: Depends on Foundational and on US2's `LabelDetailsPage` shell (T022) existing to host the tree/contents section
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### Within Each User Story

- Tests are written before the implementation tasks they cover
- Components before the page that composes them
- Page composition before hub bootstrap/registration

### Parallel Opportunities

- Setup tasks T003–T007 can run in parallel
- Foundational tasks T010, T011, T012 can run in parallel (T013 depends on T009 + T012)
- US1 tasks T014, T015, T016 can run in parallel; US2 tasks T020, T021 can run in parallel; US3 tasks T026, T027, T028 can run in parallel
- Once Foundational completes, US1 and (given a stubbed label id) US2's description section could be developed in parallel by different people, though US2's full navigation wiring (T023) needs US1's `LabelListPage` (T017)

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests and components together:
Task: "Unit test for label list filtering in tests/unit/labelListFilter.test.ts"
Task: "Create LabelRow component in src/components/LabelRow.tsx"
Task: "Create LabelListFilterBar component in src/components/LabelListFilterBar.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — both Priority P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 → **STOP and VALIDATE** independently
4. Complete Phase 4: User Story 2 → **STOP and VALIDATE** independently
5. Deploy/demo the MVP (browse, filter, and drill into label details)

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → test independently → demo
3. Add User Story 2 → test independently → demo (MVP complete)
4. Add User Story 3 → test independently → demo
5. Polish pass

---

## Notes

- [P] tasks touch different files with no unmet dependencies
- [Story] label maps each task to its user story for traceability
- Each user story is independently completable and testable per its Independent Test above
- Commit after each task or logical group
