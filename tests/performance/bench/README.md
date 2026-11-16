# Timing benchmark

Compares two builds of `examples/test-cdn` on the AEC facade fixture (`../fixtures/aecScene.ts`) and prints a Markdown table. It is a report. It never fails because of a number.

The counters that can fail a run are in `../budgets.perf.ts`.

## Run it

Build both versions of `examples/test-cdn` and keep each `dist` folder:

```bash
# on the base commit
cd examples/test-cdn && npm run build && cp -r dist ../../../bench-base
# on the head commit
cd examples/test-cdn && npm run build
```

Then, from the repository root:

```bash
BENCH_BASE=../bench-base BENCH_HEAD=examples/test-cdn/dist pnpm exec playwright test --config tests/performance/bench/playwright.config.ts
```

| Variable     | Default                  | Meaning                               |
| ------------ | ------------------------ | ------------------------------------- |
| `BENCH_BASE` | `examples/test-cdn/dist` | Folder served as base on port 8195    |
| `BENCH_HEAD` | `examples/test-cdn/dist` | Folder served as head on port 8196    |
| `BENCH_RUNS` | `5`                      | Page loads per build, after a warm-up |

Without `BENCH_BASE` and `BENCH_HEAD` both servers serve the same build. Do that once on a machine to learn its noise level: every change in that table is noise.

The table is printed and written to `tests/test-results/bench/report.md`. The raw samples are in `samples.json` next to it. That folder is not committed.

Ports 8195 and 8196 must be free. Close other heavy programs, keep the laptop on mains power, and do not run it in parallel with other test suites.

## What is measured

Each run is a fresh page. Runs alternate base, head, head, base, so thermal drift and background load hit both builds.

| Metric                 | How                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Full scene build       | Building the tree through `SDV` plus the synchronous `viewport.update()`. One sample per run.                              |
| First frame            | Time inside `renderer.render` for the first frame. Includes shader compilation. One sample per run.                        |
| Camera frame           | Time inside `renderer.render` for the first frame after a 1 degree orbit. Median of 40 frames per run.                     |
| Camera frame with SSAO | `effectComposer.render` followed by `gl.finish()`, with the default ambient occlusion effect. Median of 40 frames per run. |
| One-node scene update  | Toggling one glass pane, `updateVersion()` and the synchronous `viewport.update()`. Median of 30 updates per run.          |

`renderer.render` time is CPU time on the main thread: traversal, sorting, uniform uploads, and issuing draw calls. The GPU works after the call returns. Only the SSAO metric waits for the GPU.

`PerformanceEvaluator` already has a `sceneTreeUpdate.<version>` section around the scene tree update, but the singleton is not exported from `@shapediver/viewer` and its sections only record after `start()`, which only the session flow calls. The benchmark therefore times from outside. Exposing the evaluator would be a product change.

## Observed noise

Base = head, 5 runs each, Intel UHD 630 laptop with other test sessions running on the same GPU (2026-11-16, 3860 meshes, 12921 tree nodes). Spread (max - min) / median of the five runs:

| Metric                 | Base spread | Head spread | Median difference between identical builds |
| ---------------------- | ----------: | ----------: | -----------------------------------------: |
| Full scene build       |       24.6% |       40.7% |                                     -21.7% |
| First frame            |      146.8% |      137.7% |                                     -14.2% |
| Camera frame           |       26.0% |       39.5% |                                     -15.5% |
| Camera frame with SSAO |       30.7% |       29.5% |                                     -18.2% |
| One-node scene update  |       25.8% |       29.7% |                                      +5.0% |

Two identical builds differed by up to 22% in the median. Only a change clearly larger than that is a finding on a loaded machine. Run it on an idle machine before trusting a smaller difference.

## Why milliseconds are not asserted

- They depend on the machine, the GPU driver, power mode, and what else is running. A threshold that passes on one laptop fails on another.
- The same build measured twice differs by several percent. Run with base = head to see how much on your machine. A gate tighter than that noise fails at random; a gate looser than it misses most real changes.
- CI runners have no GPU. Chrome falls back to SwiftShader there, which measures a software rasterizer and not the viewer.
- `performance.now()` in Chrome is rounded to 0.1 ms, so sub-millisecond metrics are coarse.

Use the table to decide whether a change is worth it, and read a change only against the spread columns. Lock the result in with a counter in `budgets.baseline.json`: a draw call that is gone stays gone on every machine.
