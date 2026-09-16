# Quickstart: TFVC Labels Hub

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This guide validates the feature end-to-end in a real Azure DevOps organization/collection with a TFVC-enabled team project.

## Prerequisites

- Node.js LTS and npm installed.
- Access to an Azure DevOps organization (Services) or collection (Server) containing a **team project using TFVC**, with at least a few existing labels (create some via Visual Studio/`tf.exe` if none exist).
- A [Personal Access Token](https://learn.microsoft.com/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate) with **Marketplace (publish)** scope, for publishing/sharing the extension to your organization during manual verification.
- `tfx-cli` available via `npx tfx-cli` (no global install required).

## Setup

```powershell
npm install
```

## Build

```powershell
# Development build (unminified, sourcemaps)
npm run build:dev

# Production build (minified, used for packaging)
npm run build
```

Both scripts invoke the esbuild bundling script (see [plan.md](./plan.md) Project Structure) to produce the two hub bundles referenced by `vss-extension.json`.

## Package

```powershell
npm run package
```

This runs `tfx extension create` against `vss-extension.json`, producing a `.vsix` file in `dist/`.

## Install & manually validate

1. Share/install the generated `.vsix` in a test Azure DevOps organization (**Organization settings → Extensions → Browse marketplace → Upload new extension**, or `tfx extension publish` if you maintain a private publisher).
2. Navigate to the TFVC team project and open the **Labels Hub** from the project-level navigation.
3. **US1 — Browse and filter**: Confirm all labels render with name (line 1) and created date + creator persona/name (line 2). Type into the free-text filter and confirm the list narrows; select a creator from the drop-down and confirm the list narrows further; combine both.
4. **US2 — View details**: Click a label row; confirm the details page opens with a back button and the label's name in the header, and that back returns to the list with filters preserved. Confirm the description is shown read-only (no edit control is present, per spec.md Clarifications).
5. **US3 — Explore folder contents**: On the details page, click different nodes in the folder tree and confirm the right-hand panel updates to show that node's direct files/folders, including an empty-state for a node with no children.
6. Confirm empty/error states: temporarily point at a project with zero labels (or simulate a network failure) and confirm the empty-state/error-state messaging described in spec.md Edge Cases.

## Automated checks

```powershell
npm test
```

Runs the Jest/React Testing Library suite covering filter logic (name + description matching) and tree/content synchronization against mocked `TfvcRestClient` responses (see [contracts/tfvc-labels-client.md](./contracts/tfvc-labels-client.md)).
