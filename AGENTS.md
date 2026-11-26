# Viewer (pnpm + Lerna monorepo)

Instructions for every coding agent (Claude Code, Cursor, Codex, Copilot). Keep this file tool-neutral; tool-specific notes go in that tool's file (`CLAUDE.md` for Claude Code).

Base branch: `staging` (task branches start from `origin/staging`; `development` doesn't have this agent setup yet).

Packages publish from `dist/` (`main` → `dist/index.js`). Examples and other packages consume built output, not `src/`: after editing a package, run `pnpm build` in it before anything downstream sees the change.

New worktree: `node scripts/agents/setup-worktree.mjs` copies the local files listed in `.worktreeinclude` from the main checkout, runs `pnpm install` and, once, the root `pnpm build` so every package has a `dist/`. Each agent tool runs it automatically (see "Agent config"); run it by hand if `node_modules` or `dist/` is missing.

## Commands (changed package and files only)

- Typecheck one package: `pnpm check` in that package dir (`tsc --noEmit`). Packages type-check against other packages' `dist/`: if types from a workspace dependency are missing or stale, `pnpm build` that dependency first (e.g. `rendering-engine/camera-engine` before `rendering-engine/rendering-engine-threejs`), or `npx lerna run build --scope <package name> --include-dependencies` for the whole chain.
- Build one package: `pnpm build` in that package dir. Never root `pnpm build` for a one-package change (~29 packages); it is for a full compile before publish or a broad check.
- Format: `npx prettier --write <files>`. Lint: `npx eslint <files>`.

## Line endings

The working tree is CRLF, git stores LF (`autocrlf`), and ESLint enforces `linebreak-style: windows`. Edit with your tool's file edit tool. `sed -i` and plain Python writes produce LF and break lint.

## Run the viewer locally

- `pnpm build-dev` in `examples/simple`: webpack-dev-server on `http://localhost:8080/`. It watches the packages' `dist/`, so `pnpm build` in a changed package triggers a rebundle.
- Load a model: `http://localhost:8080/?ticket=<ticket>&modelViewUrl=<gateway-url>`. The page exposes `window.SDV` once `bundle.js` loads.

## Tests

- E2E: `e2e-testing` skill (user level).
- Root `pnpm test` runs Playwright against the hosted viewer (`https://viewer.shapediver.com/v3/latest/`), not your `src/` or `dist/`. For a manual check of uncommitted code, drive `localhost:8080` or `test-cdn`; for suite runs against the working tree, use the `e2e-testing` skill.
- `VIEWER_TEST_ENV=staging` targets the staging CDN. Tests load `test-cdn/index.html`, which exposes `SDV` without creating a session.

## Don't read

`dist/`, `docs/`, `llms.txt`, `artifacts/`, `tmp*/`, `test-results/`, `lerna-debug.log`, `pnpm-lock.yaml`.

## Agent config

All content is tool-neutral and lives in `AGENTS.md`, `.agents/`, `.worktreeinclude` and `scripts/agents/`. Files under `.claude/`, `.cursor/` and `.codex/` are only hook adapters.

| Concern           | Content (edit this)                                      | Adapters                                                                                     |
| ----------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Repo instructions | `AGENTS.md`                                              | `CLAUDE.md` imports it; Cursor, Codex and Copilot read it directly                           |
| Topic rules       | `.agents/rules/<topic>.md`                               | None: the list below is the only index                                                       |
| Skills            | `.agents/skills/<name>/SKILL.md`                         | None: Cursor, Codex and Copilot discover them; others use the list below                     |
| Worktree setup    | `.worktreeinclude` + `scripts/agents/setup-worktree.mjs` | `.claude/settings.json`, `.cursor/hooks.json`, `.cursor/worktrees.json`, `.codex/hooks.json` |

- New or renamed rule or skill: add the file in `.agents/` and its line in the matching list below. Don't add tool-specific rule or skill files.
- Don't `@`-import rules or skills: Claude Code expands `@` imports at session start, which loads all of them into every session.
- Cursor also runs the `.claude/settings.json` hook and it fails there (`$CLAUDE_PROJECT_DIR` is unset). That is expected: the `.cursor/hooks.json` hooks do the setup.

When you learn a durable repo fact that would have prevented a recurring agent mistake (build or test pitfall, load semantics, package boundary, "don't do X"), update the matching topic rule or add one in the same session: one topic per file, short. Record the reusable constraint, not the one-off bugfix. No ticket notes, example paths or restatements of a change. Don't add feature notes to this file.

### Skills

Procedures. When a task matches, read the skill's `SKILL.md` and follow it (skip this if your tool already loaded it as a skill).

- None in this repo yet.

### Topic rules

Before changing a file that matches a rule's globs, or working on the area it describes, read that rule and follow it.

- `.agents/rules/gltf-buffer-views.md` (`data-engine/geometry-engine/src/**`): Overlapping glTF bufferViews share the source buffer instead of being sliced. Apply when changing glTF buffer, accessor, Draco or image loading.
- `.agents/rules/gpu-instancing.md` (`rendering-engine/rendering-engine-threejs/src/**`, `data-engine/geometry-engine/src/**`, `data-engine/gltf-converter/src/**`, `shared/node-tree/src/**`, `tests/instancing/**`): Automatic GPU instancing — detection, runtime toggling, bounds, color variants, export and picking. Apply when changing instancing or anything that creates, bounds or picks instanced meshes.
- `.agents/rules/restriction-snapping.md` (`rendering-engine/intersection-restriction-engine/src/**`, `features/drawing-tools/src/**`, `features/interaction/src/**`, `features/transformation-tools/src/**`): Geometry restriction grids, placement picking and occlusion of hideable snaps. Apply when changing restrictions, snapping, placement picking or drag interaction.
- `.agents/rules/texture-downloads.md` (`shared/services/src/http-client/**`, `session-engine/session-engine/src/**`, `api/session/src/**`, `data-engine/geometry-engine/src/gltfv2/loaders/TextureLoader.ts`, `data-engine/material-engine/src/**`): How texture downloads choose the image proxy or a direct fetch. Apply when changing texture or image loading.
- `.agents/rules/viewer-load-performance.md` (`rendering-engine/rendering-engine-threejs/src/**`, `api/viewport/src/**`, `shared/node-tree/src/**`, `examples/simple/**`, `tests/**`): When the viewport is actually visible, scene bounding boxes and line draw calls. Apply when changing or measuring load time, viewport visibility or bounds.
