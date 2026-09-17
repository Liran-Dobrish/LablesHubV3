# TFVC Labels Hub

Azure DevOps extension for browsing TFVC labels in a team project: a filterable label list and a label details page (read-only description + folder tree/contents browser).

## Prerequisites

- Node.js LTS and npm
- An Azure DevOps organization/collection with a TFVC-enabled team project (for manual validation)

## Setup

```powershell
npm install
```

## Build

```powershell
npm run build:dev   # unminified, sourcemaps
npm run build       # minified, production
```

## Test & Lint

```powershell
npm test
npm run lint
npm run typecheck
```

## Package

```powershell
npm run package
```

Produces a `.vsix` in `dist/` via `tfx-cli`, using the `vss-extension.json` manifest. Replace the `publisher` field in `vss-extension.json` and add a real icon at `static/images/extension-icon.png` before packaging for real use.

## Manual validation

See [specs/001-tfvc-labels-hub/quickstart.md](specs/001-tfvc-labels-hub/quickstart.md) for the end-to-end validation steps against a real Azure DevOps organization.
