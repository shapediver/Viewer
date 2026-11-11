# Viewer (pnpm + Lerna monorepo)

@.cursor/rules/local-development.mdc

## Commands (changed package and files only)
- Typecheck one package: `pnpm check` in that package dir (`tsc --noEmit`)
- Build one package: `pnpm build` in that package dir. Never root `build` for a one-package change (~29 packages).
- Format: `npx prettier --write <files>`. Lint: `npx eslint <files>`.
- E2E: `e2e-testing` skill. Root `pnpm test` hits the hosted viewer, not your code.

## Don't read
`dist/`, `docs/`, `llms.txt`, `artifacts/`, `tmp*/`, `test-results/`, `lerna-debug.log`, `pnpm-lock.yaml`.

## Topic rules: read the file before touching that area
The rules live in `.cursor/rules/` and are shared with Cursor. When you learn a durable repo fact, update the matching rule there or add a short new one (`extend-cursor-rules.mdc`).

| Area | Rule |
|---|---|
| Load timing, viewport visibility, glTF buffers, bounding boxes, geometry performance | `viewer-load-and-geometry.mdc` |
| Geometry restriction grids, placement picking | `geometry-restriction-grid.mdc` |
| Snap occlusion while dragging | `restriction-occlusion.mdc` |
| Texture downloads (Geometry Backend proxy vs direct) | `texture-downloads.mdc` |
