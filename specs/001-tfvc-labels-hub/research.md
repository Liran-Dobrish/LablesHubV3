# Research: TFVC Labels Hub

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## 1. Extension framework & language

- **Decision**: Build the extension as an Azure DevOps **web extension** contributing two **hub** pages, written in **TypeScript**, rendered with **React** (peer dependency of `azure-devops-ui`), bootstrapped via `azure-devops-extension-sdk`.
- **Rationale**: Azure DevOps hubs are the standard contribution type for adding a page to the project-level navigation (e.g., under "Repos" or a custom hub group). `azure-devops-extension-sdk` is Microsoft's official SDK for the iframe handshake (`SDK.init()`/`SDK.notifyLoadSucceeded()`), theming, and host context (current project, current user, auth tokens for REST calls). TypeScript is explicitly required by the user.
- **Alternatives considered**: Plain JS (rejected — user requires TypeScript; also loses type safety against `azure-devops-extension-api` contracts). Angular/Vue wrapper (rejected — `azure-devops-ui` is React-based, adding another framework would mean bridging two component models for no benefit).

## 2. UI component library

- **Decision**: Use **`azure-devops-ui`** for all UI building blocks: `Page`/`Header` (page header + back button), `Filter`/`FilterBar` + `KeywordFilterBarItem` (free-text filter), `DropdownFilterBarItem`/`Dropdown` (creator filter), `Table`/`ListView`-based master list with two-line `ISimpleTableCell` renderers (label name + created date/persona), `VssPersona` (creator icon), `TextField` (description edit), `Tree`/`TreeItemProvider` (folder tree), and a second `Table` (or `ListView`) for folder node contents. Use `ObservableValue`/`ObservableArray` from `azure-devops-ui/Core/Observable` to drive re-renders idiomatically for this library.
- **Rationale**: `azure-devops-ui` is Microsoft's own component library used to build Azure DevOps' native pages, so extensions built with it are visually and behaviorally consistent with the host (satisfies the constitution's UX Consistency principle) and covers every UI element requested (list, filter bar, dropdown, persona, tree, master-detail content) without needing a second design system.
- **Alternatives considered**: Fluent UI React directly (rejected — more manual theming work to match the ADO chrome, and `azure-devops-ui` already wraps Fluent internally where appropriate). Hand-rolled HTML/CSS (rejected — reinvents accessibility/theming already solved by the library).

## 3. Data access (TFVC labels)

- **Decision**: Use **`azure-devops-extension-api`**'s `TfvcRestClient` (subpath import `azure-devops-extension-api/Tfvc`) via `getClient(TfvcRestClient)` to call:
  - `getLabels(requestData, project, top, skip)` → list of labels (name, description, owner, date) for the main page.
  - `getLabelItems(labelId, top, skip)` → items under a label, filtered client-side by folder path to build the folder tree and per-node contents.
- **Rationale**: This is the only supported, documented client for TFVC label data in web extensions; it returns strongly-typed contracts matching `TfvcLabel`/`TfvcItem`.
- **Alternatives considered**: Calling the raw REST endpoints with `fetch` (rejected — `azure-devops-extension-api` already provides typed, auth-handled clients; no reason to bypass it).
- **Risk / constraint identified**: The public Azure DevOps REST API for TFVC Labels (`_apis/tfvc/labels`) exposes only **Get**, **Get Label Items**, and **List** operations — there is **no supported update/patch operation** for a label's description. This directly affects User Story 3 (edit description).
  - **Decision**: Persist user-edited descriptions using the extension's own **Extension Data Service** (`azure-devops-extension-api` data storage / `SDK.getService(CommonServiceIds.ExtensionDataService)`), keyed by project + label id, layered on top of (and displayed in place of) the read-only label description returned by the REST API. The UI clearly treats this as "this extension's annotation," not a mutation of the underlying TFVC label object.
  - **Rationale**: Keeps FR-010/FR-011 (edit/cancel description) implementable without an unsupported API call, while being transparent that the edit does not round-trip to `tf.exe`/Visual Studio label metadata.
  - **Alternatives considered**: Omitting edit support entirely (rejected — explicitly requested by the user and specified in spec.md US3); attempting an undocumented/internal API call (rejected — unsupported, breaks without notice, security/compliance risk).

## 4. Bundling

- **Decision**: Use **esbuild** (via a small Node build script, e.g. `scripts/build.mjs`) to bundle each hub's TypeScript/React entry point into a single JS file (plus CSS extraction for `azure-devops-ui` styles), with separate dev (unminified + sourcemaps) and production (minified) build modes.
- **Rationale**: Explicitly required by the user; esbuild is fast and has first-class TS/JSX support with minimal configuration, well suited to bundling two small hub entry points.
- **Alternatives considered**: Webpack (rejected — slower, more config, not requested). Rollup (rejected — not requested; esbuild covers the bundling needs directly).

## 5. Packaging

- **Decision**: Use **tfx-cli** (`tfx extension create` / `tfx extension package`) driven by a `vss-extension.json` manifest to produce the installable `.vsix` package, run as an npm script after the esbuild step.
- **Rationale**: `tfx-cli` is the standard, Microsoft-supported CLI for packaging/publishing Azure DevOps extensions; explicitly required by the user.
- **Alternatives considered**: Manual `.vsix` (zip) assembly (rejected — error-prone, reinvents what tfx already validates, e.g. manifest schema checks).

## 6. Testing

- **Decision**: **Jest** + **React Testing Library** (`ts-jest` or `esbuild-jest` transform) for unit/component tests; mock `azure-devops-extension-sdk` and the `TfvcRestClient`/Extension Data Service for deterministic tests of filtering logic, tree selection, and description edit/cancel flows.
- **Rationale**: Jest + RTL is the de facto standard for TypeScript/React unit testing, integrates with esbuild-based projects via existing transforms, and satisfies the constitution's Testing Standards principle (deterministic, independent tests).
- **Alternatives considered**: Vitest (viable alternative, but Jest has broader precedent in Azure DevOps extension samples and simpler esbuild-adjacent setup).

## 7. Target platform & performance

- **Decision**: Target evergreen browsers inside the Azure DevOps web (Services and Server 2020+) iframe host. Client-side filtering/sorting over the fetched label set (per Assumption in spec.md). Virtualize/paginate folder-content lists for very large folders (Edge case in spec.md) using `azure-devops-ui`'s `Table` built-in virtualization support.
- **Rationale**: Matches SC-005 (visible content within 3s) and FR-016/edge cases without requiring a custom backend.

## Summary of resolved unknowns

| Technical Context item | Resolution |
|---|---|
| Language/Version | TypeScript (target ES2020), React 17.x (per `azure-devops-ui` peer dependency) |
| Primary Dependencies | `azure-devops-ui`, `azure-devops-extension-sdk`, `azure-devops-extension-api` |
| Storage | N/A for label data (read via TFVC REST API); Extension Data Service used only for the extension's own description-edit overlay |
| Testing | Jest + React Testing Library |
| Target Platform | Azure DevOps web hub (iframe), evergreen browsers |
| Project Type | Single-project web extension (frontend only; "backend" = Azure DevOps REST APIs) |
| Performance Goals | Initial render/loading state ≤ 3s (SC-005); folder content list virtualized for large sets |
| Constraints | Must run inside ADO iframe sandbox via SDK handshake; description edits are extension-local (not written back to the TFVC label) |
| Scale/Scope | 2 hub pages; label lists of 200+ rows; arbitrarily deep folder trees |
