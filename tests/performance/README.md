# Viewer performance tests

Opt-in suites for the Viewer's performance work (epic SS-9147). `pnpm test` does not run them. They need Chrome with a real GPU (`channel: "chrome"`, `--use-angle=d3d11`) and a local build of `examples/test-cdn`:

```bash
pnpm build && (cd examples/test-cdn && npm run build)
```

The rule that keeps parallel work apart: **a new test, counter or benchmark section is a new file plus at most one line in an index.** Two pull requests that touch different tickets or scenarios do not edit the same file.

## Layout

| Path                                                           | What it is                                                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `exact/`                                                       | Pass/fail tests of one mechanism on a toy scene. One `SS-<key>.perf.ts` per ticket.                               |
| `exact/harness.ts`                                             | `test` (routes the asset host to `assets/`), `installApi`, `open`, helpers that two tickets share.                |
| `budgets/`                                                     | Exact counters of an AEC facade, compared with a committed baseline.                                              |
| `budgets/harness.ts`                                           | Baseline read/write/compare, per-frame counters, settle and measure helpers.                                      |
| `budgets/<scenario>.perf.ts`                                   | One scenario: `facade` (4 rendering variants), `interaction`, `attributes`, `blendedGlass`, `gltf`, `instancing`. |
| `budgets/baseline/<id>.json`                                   | The baseline of one id. Sorted keys, tabs, CRLF.                                                                  |
| `fixtures/probe.ts`                                            | `window.__probe`: wraps the renderer and reads `renderer.info`. Used by budgets and benchmarks.                   |
| `fixtures/counters/`                                           | Counters that wrap three.js functions. One file each, listed in `counters/index.ts`.                              |
| `fixtures/aecScene.ts`, `instancingGlbs.ts`, `syntheticGlb.ts` | Generated scenes and files.                                                                                       |
| `bench/`                                                       | Work counts and timing for two builds. See [bench/README.md](bench/README.md).                                    |
| `bench/timing/`, `bench/count/`                                | One file per timing metric and per work-count section, listed in `timing/index.ts` and `count/index.ts`.          |

Configs: `playwright.config.ts` (`pnpm test:performance`) runs everything that matches `**/*.perf.ts`, so exact tests and budgets, on port 8099. `budgets.playwright.config.ts` runs only `budgets/**/*.perf.ts` on port 8191. The benchmarks use 8195 to 8198 (see `bench/`). Before a run, check that the ports are free: a second run on a port reads the other run's build.

## Run

```bash
# exact tests
pnpm exec playwright test --config tests/performance/playwright.config.ts exact/
# budgets, one scenario
pnpm exec playwright test --config tests/performance/budgets.playwright.config.ts --grep "AEC facade, ssao"
```

| Variable         | Default                  | Meaning                                         |
| ---------------- | ------------------------ | ----------------------------------------------- |
| `UPDATE_BUDGETS` | unset                    | `1` rewrites the baseline of the tests that run |
| `BUDGET_PORT`    | `8191`                   | Port of `budgets.playwright.config.ts`          |
| `BUDGET_DIST`    | `examples/test-cdn/dist` | Build `budgets.playwright.config.ts` serves     |

## Re-derive a baseline, never hand-merge it

A counter above its baseline is a regression. A counter below it also fails and asks for a lower baseline, so an improvement cannot be lost. Both cases are settled by running the test, not by editing a number:

```bash
UPDATE_BUDGETS=1 pnpm exec playwright test --config tests/performance/budgets.playwright.config.ts --grep "AEC facade, ssao"
```

This rewrites `budgets/baseline/ssao.json` only. After a rebase or merge that conflicts in `baseline/<id>.json`, take either side, then re-run the conflicting test with `UPDATE_BUDGETS=1 --grep "<title>"`. Run the budgets once more without it, and again to see that the numbers are the same: they do not depend on the machine. Review the diff: only the counters you meant to change should move.

Do not loosen a baseline to hide a regression.

## Add an exact test

Create `exact/SS-<key>.perf.ts`:

```ts
import {expect} from "@playwright/test";
import {open, test} from "./harness";

test("SS-<key> what must be true", async ({page}) => {
	await open(page);
	// page.evaluate(...) against window.SDV and window.__perf
});
```

Helpers used by one ticket stay in its file. A helper that two tickets need goes into `exact/harness.ts`; never import one `*.perf.ts` from another, Playwright would register its tests twice.

## Run the exact tests without a GPU

`PERF_RENDERER=swiftshader` runs Chrome on SwiftShader (`--use-angle=swiftshader`) instead of `d3d11`:

```bash
PERF_RENDERER=swiftshader pnpm exec playwright test --config tests/performance/playwright.config.ts exact/
```

The viewer turns shadow maps and the soft-shadow fade off on SwiftShader, so a test about shadows, the fade or the beauty blend would not run its code there. Rule for a new exact test: it is software-safe by default. If it needs shadows, the fade, a hardware-renderer assertion or anything else the viewer disables on SwiftShader, start the body with `await skipOnSoftwareRenderer(page, "<reason>")`. Put it before `test.fail`, so the skip wins and the test cannot pass for the wrong reason. A software-safe test must pass on both renderers.

## Add a budget counter

1. A counter of the facade variants goes into `collect` in `budgets/facade.perf.ts`. A counter of another scenario goes into that scenario's file.
2. A counter that needs a wrapper on three.js code is one file in `fixtures/counters/` plus one line in `counters/index.ts`. The installer runs in the page and must not reference anything outside its own body. It adds `window.__probe.counters.<name>` with `attach`, `reset` and `read`; the test reads it with `__probe.readCounters()`. Pass `{counters: true}` to `openViewer`; the work-count and timing benchmarks leave counters out, because a wrapper is itself a call.
3. A new scenario is `budgets/<id>.perf.ts` with its own `baseline/<id>.json`. Its test title keeps the form `budget: AEC facade, <id>`.
4. Run the test once with `UPDATE_BUDGETS=1`, check the diff, commit the baseline.

Counters today in `facade`: passes, draw calls, triangles, programs, material updates, tree reads and, from SS-10478, `oneNodeChange.programCacheKeyCalls`, `oneNodeChange.updateMatrixWorldCalls`, `oneNodeChange.treeDataReads` and `cameraFrame.updateMatrixWorldCalls`. The three new `oneNodeChange.*` counters cover the change and the first frame drawn after it, nothing later; the cost per frame is in `cameraFrame.*`. The clock is stepped one frame at a time and waits for shader compiles before each step, so the window does not depend on driver speed.

## Add a benchmark section

- Work count: `bench/count/<section>.ts` exporting `label` and `run(viewer)`, plus one line in `ALL_SECTIONS` in `bench/count/index.ts`.
- Timing: `bench/timing/<metric>.ts` exporting a block function, plus one line in `METRICS` and one in `STEPS` in `bench/timing/index.ts`.

File names in `bench/`, `exact/` and `budgets/` that end in `.perf.ts`, `.bench.ts` or `.count.ts` are picked up as tests by a config. Section and harness files must not end like that.
