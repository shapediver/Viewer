# Viewer (pnpm + Lerna monorepo)

Packages publish from `dist/` (`main` → `dist/index.js`). Examples and other packages consume built output, not `src/`: after editing a package, run `pnpm build` in it before anything downstream sees the change.

## Commands (changed package and files only)

- Typecheck one package: `pnpm check` in that package dir (`tsc --noEmit`). Packages type-check against other packages' `dist/`: if types from a workspace dependency are missing or stale, `pnpm build` that dependency first (e.g. `rendering-engine/camera-engine` before `rendering-engine/rendering-engine-threejs`).
- Build one package: `pnpm build` in that package dir. Never root `pnpm build` for a one-package change (~29 packages); it is for a full compile before publish or a broad check.
- Format: `npx prettier --write <files>`. Lint: `npx eslint <files>`.

## Run the viewer locally

- `pnpm build-dev` in `examples/simple`: webpack-dev-server on `http://localhost:8080/`. It watches the packages' `dist/`, so `pnpm build` in a changed package triggers a rebundle.
- Load a model: `http://localhost:8080/?ticket=<ticket>&modelViewUrl=<gateway-url>`. The page exposes `window.SDV` once `bundle.js` loads.

## Tests

- E2E: `e2e-testing` skill.
- Root `pnpm test` runs Playwright against the hosted viewer (`https://viewer.shapediver.com/v3/latest/`), not your `src/` or `dist/`. To check uncommitted code, drive `localhost:8080` or `test-cdn`.
- `VIEWER_TEST_ENV=staging` targets the staging CDN. Tests load `test-cdn/index.html`, which exposes `SDV` without creating a session.

## Don't read

`dist/`, `docs/`, `llms.txt`, `artifacts/`, `tmp*/`, `test-results/`, `lerna-debug.log`, `pnpm-lock.yaml`.

## Topic rules

`.claude/rules/*.md` load automatically when you read files matching their `paths:`. When you learn a durable repo fact (build or test pitfall, load semantics, package boundary, "don't do X"), update the matching rule or add one in the same session: one topic per file, short, with `paths:` set. Record the reusable constraint, not the one-off bugfix.

Teammates still use Cursor, so `.cursor/rules/*.mdc` mirrors these rules. Apply every rule change to the matching `.mdc` in the same session (`restriction-snapping` → `geometry-restriction-grid` + `restriction-occlusion`; `viewer-load-performance`, `gltf-buffer-views`, `gpu-instancing` → `viewer-load-and-geometry`; new rule → new `.mdc` with `globs:` set to the same paths). Keep the CLAUDE.md commands section and `local-development.mdc` in sync the same way.
