# Timing benchmark

Compares two builds of `examples/test-cdn` on the AEC facade fixture (`../fixtures/aecScene.ts`) and prints a Markdown table. It is a report. It never fails because of a number.

The counters that can fail a run are in `../budgets.perf.ts`. For numbers that are exactly the same on every run, see [Work-count benchmark](#work-count-benchmark) below.

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

| Variable            | Default                  | Meaning                                                                                                                            |
| ------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `BENCH_BASE`        | `examples/test-cdn/dist` | Folder served as base on port 8195                                                                                                 |
| `BENCH_HEAD`        | `examples/test-cdn/dist` | Folder served as head on port 8196                                                                                                 |
| `BENCH_RUNS`        | `6`                      | Rounds, after a warm-up                                                                                                            |
| `BENCH_GLASS_BLEND` | unset                    | `1` makes the glass glTF BLEND: transparent, no depth write. The default glass writes depth. Also read by the work-count benchmark |

A run of 6 rounds took 14 minutes on a lightly loaded laptop and 17 minutes with a second test suite running.

The table is printed and written to `tests/test-results/bench/report.md`. The raw samples are in `samples.json` next to it. That folder is not committed.

Only one benchmark runs per machine. A second run prints `Another timing benchmark is running (process …)` and waits until the first one ends; the lock file is `shapediver-viewer-bench.lock` in the system temp folder, and a lock left by a killed run is taken over. Checkouts without the lock (before this README section existed) neither wait nor are waited for, and fail on the busy ports instead.

## How it measures

Wall-clock time on a shared laptop mostly measures what else runs. Four things keep that out of the result:

1. **Side by side, not one after the other.** Each round opens three pages at once: base, head, and control (the base build again). For every metric the pages take turns block by block, a few seconds apart, in an order that rotates. Load that comes and goes then hits all three. Before a page is measured, the page before it must have drawn nothing for 10 frames, so a finishing beauty render does not overlap.
2. **CPU time for CPU-bound work.** The CDP domain `Performance` with `timeDomain: "threadTicks"` reports `TaskDuration` as CPU time of the page's main thread. Time the thread waits for a core does not count. Checked: a main thread blocked 1010 ms in a synchronous request counts 2 ms; a 1000 ms busy loop counts 980 ms. The measured code runs synchronously inside one `page.evaluate`, because the counter includes everything on the thread between two reads.
3. **Paired ratios with a confidence interval.** Each round gives one ratio per metric: the median of its block ratios, head block over the base block of the same turn. The report shows the geometric mean of the round ratios and its 95% confidence interval (Student t). A change whose interval contains 0 is "not distinguishable".
4. **Its own noise floor.** Control against base is an A/A comparison of identical builds in the same run. Its interval should contain 0 and shows how small a change this run could see. If it does not contain 0, the machine was too busy.

| Metric                 | Main clock      | How                                                                                                                                                      |
| ---------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full scene build       | main-thread CPU | Building the tree through `SDV` plus the synchronous `viewport.update()`. One block per page.                                                            |
| First frame            | main-thread CPU | From `viewport.show = true` until the first frame is drawn. One block per page. Shader compilation runs in the GPU process and is not in this number.    |
| Camera frame           | main-thread CPU | `renderer.render` of the viewport scene, called directly 2 times per block, 12 blocks. The camera does not move, so the viewer draws nothing on its own. |
| One-node scene update  | main-thread CPU | Toggling one glass pane, `updateVersion()` and the synchronous `viewport.update()`, 4 times per block (back to the start), 8 blocks.                     |
| Camera frame with SSAO | wall            | From the start of `effectComposer.render` until a one-pixel `readPixels` returns, after a 1 degree orbit. 4 frames per block, 4 blocks.                  |

The report has a second table with the other clock for every metric. It has no verdict column: with ten intervals per report, one would be wrong by chance about every other run.

`renderer.render` time is CPU time on the main thread: traversal, sorting, uniform uploads, and issuing draw calls. The GPU works after the call returns. Only the SSAO metric waits for the GPU. It waits with `readPixels`, because `gl.finish()` returned after about 2 ms on ANGLE with Direct3D 11 without waiting.

`PerformanceEvaluator` already has a `sceneTreeUpdate.<version>` section around the scene tree update, but the singleton is not exported from `@shapediver/viewer` and its sections only record after `start()`, which only the session flow calls. The benchmark therefore times from outside. Exposing the evaluator would be a product change.

### Tried and left out

- **GPU timer queries.** `EXT_disjoint_timer_query_webgl2` is available in this Playwright Chrome (ANGLE, D3D11, UHD 630) and reported no disjoint event. On a busy machine its SSAO frame times were only slightly steadier than `readPixels` (A/A interval ±32% against ±36%, old method, 5 page loads), and they were almost the same numbers (270 ms against 307 ms median): on the facade the GPU waits for the CPU to submit thousands of draw calls, and the timer counts that wait, as well as other pages' GPU work in between. Not worth an extension check and disjoint handling.
- **Minimum instead of median.** Load only adds time, so the minimum looks attractive, but it was noisier wherever it was tried: over 5 page loads (camera frame interval ±49% for the minimum against ±34% for the median, old method), and as the per-round estimate from the blocks (ratio of block minimums ±5–23% against ±3–16% for the median of block ratios, same samples).
- **Wall time for the first frame.** It would include shader compilation in the GPU process, but the three pages share that process and its program cache, so a page's first frame depended on which page compiled first: identical-build intervals reached -33%…+154% on wall time, against -22%…+7% on CPU time in the same run. The first frame therefore uses CPU time; count shader programs in `budgets.baseline.json` to catch compilation changes.
- **CPU time alone.** On a busy laptop all-core turbo drops and the hyperthread sibling is busy, which slows the thread down while it runs, and CPU time counts that. Without side-by-side pages, CPU time narrowed the camera frame interval only from ±12% to ±11% and made no difference for the build. Pairing in time does most of the work; CPU time removes the part where the thread waits for a core.

## Observed noise

Base = head (the same `development` build), Intel UHD 630 laptop, 2026-11-16, 3860 meshes, 12921 tree nodes. Every comparison below is between identical builds, so every difference is noise.

- **Old**: the previous version of this benchmark (wall clock, one page per load, base and head alternating), 5 loads per build. One identical-build comparison per run: head against base.
- **New**: this benchmark, 6 rounds, main clock of each metric. Two identical-build comparisons per run: control against base, and head against base.
- **Spread**: (max - min) / median of one build over the runs, lowest to highest build.
- **Interval**: 95% confidence interval of the change between identical builds. It should contain 0; its width is the smallest change the run can see.
- **Worst**: the largest difference between identical builds in one run pair (old) or one round (new).

The laptop was never idle: other Claude sessions ran their own Playwright suites and builds all evening. Total CPU is the average over the run.

### Background load only

| Metric                 | Old: spread | Old: interval | Old: worst | New: spread |      New: intervals | New: worst |
| ---------------------- | ----------: | ------------: | ---------: | ----------: | ------------------: | ---------: |
| Full scene build       |     30%–52% |     -21%…+33% |        42% |     15%–23% |  -10%…+11%, -6%…+3% |        18% |
| First frame            |     41%–79% |     -28%…+24% |        32% |     19%–42% | -22%…+7%, -24%…+12% |        28% |
| Camera frame           |     33%–38% |     -35%…+18% |        33% |     10%–16% |    -2%…+2%, -3%…+3% |         5% |
| One-node scene update  |     13%–42% |     -21%…+20% |        26% |     11%–22% |    -5%…+9%, -1%…+3% |        15% |
| Camera frame with SSAO |     33%–37% |     -13%…+23% |        21% |     11%–14% |    -3%…+6%, -5%…+6% |         9% |

Total CPU: 49% during the old run, 24% during the new one.

### A second Playwright suite in parallel

`budgets.perf.ts` looping in parallel on its own port, on top of the background load.

| Metric                 | Old: spread | Old: interval | Old: worst | New: spread |       New: intervals | New: worst |
| ---------------------- | ----------: | ------------: | ---------: | ----------: | -------------------: | ---------: |
| Full scene build       |     38%–42% |     -32%…+24% |        31% |     28%–50% |    -8%…+3%, -17%…+4% |        23% |
| First frame            |     24%–58% |     -28%…+12% |        31% |     76%–83% | -21%…+52%, -17%…+10% |        71% |
| Camera frame           |     29%–49% |     -23%…+14% |        21% |     53%–65% |     -7%…+4%, -7%…+2% |        11% |
| One-node scene update  |     34%–40% |     -30%…+45% |        54% |     27%–34% |     -5%…+8%, 0%…+14% |        15% |
| Camera frame with SSAO |     26%–35% |     -25%…+41% |        40% |     42%–46% |  -11%…+11%, -5%…+13% |        17% |

Total CPU: 56% during the old run, 50% during the new one.

### What this shows

- The absolute numbers still move with the load: compare the base medians of two runs and you compare two machines. Only the paired change is meaningful.
- For camera frames, one-node updates and SSAO frames the identical-build intervals shrank from ±15–45% to ±2–9% with background load and to ±5–14% with a second suite running.
- Scene build and first frame happen once per page, so there is nothing to alternate. They stay at ±5–20% (build) and ±10–50% (first frame). For them, prefer a counter in `budgets.baseline.json`.
- With a 95% interval, one in twenty identical-build comparisons misses 0 by chance. That happened once here: one-node update, head against base, 0%…+14% with the second suite.
- Even the best case is a few percent, not zero. Milliseconds on a shared laptop cannot be exactly the same on every run.

## Why milliseconds are not asserted

- They depend on the machine, the GPU driver, power mode, and what else is running. A threshold that passes on one laptop fails on another.
- The same build measured twice differs by several percent. The A/A column shows how much on your machine. A gate tighter than that noise fails at random; a gate looser than it misses most real changes.
- CI runners have no GPU. Chrome falls back to SwiftShader there, which measures a software rasterizer and not the viewer.
- `performance.now()` in Chrome is rounded to 0.1 ms, so sub-millisecond metrics are coarse.

Use the table to decide whether a change is worth it. Lock the result in with a counter in `budgets.baseline.json`: a draw call that is gone stays gone on every machine.

# Work-count benchmark

`work.count.ts` counts the work two builds do instead of timing it: JavaScript function calls and executed blocks in the viewer bundle, and WebGL calls. A count does not depend on what else runs on the machine, so the same builds give the same table on every run, idle or loaded. Like the timing benchmark it is a report and never fails because of a number.

## Run it

Build both `dist` folders as for the timing benchmark, then:

```bash
BENCH_BASE=../bench-base BENCH_HEAD=examples/test-cdn/dist pnpm exec playwright test --config tests/performance/bench/count.playwright.config.ts
```

| Variable           | Default                  | Meaning                                                                               |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------- |
| `BENCH_BASE`       | `examples/test-cdn/dist` | Folder served as base                                                                 |
| `BENCH_HEAD`       | `examples/test-cdn/dist` | Folder served as head                                                                 |
| `COUNT_PAGES`      | `2`                      | Pages per build. Every page must give the same counts                                 |
| `COUNT_BASE_PORT`  | `8197`                   | Port of the base server                                                               |
| `COUNT_HEAD_PORT`  | `8198`                   | Port of the head server                                                               |
| `COUNT_DUMP`       | unset                    | File that gets the calls per function, one JSON line per section and page (see below) |
| `COUNT_ATTRIBUTES` | unset                    | `1` adds the attribute switch section, on its own page per build                      |

It takes no lock and uses its own ports, so it can run next to the timing benchmark. With 2 pages per build a run takes about 1 minute, with 5 pages about 3 minutes (5 minutes with every core but one busy).

The tables are printed and written to `tests/test-results/bench/work-count.md`, the counts of every page to `work-count.json`.

## Sections and counters

| Section                | What runs, synchronously in one `page.evaluate`                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full scene build       | Building the fixture tree through `SDV` plus `viewport.update()`. Only the `SDV` calls count: the fixture code is not in the bundle.                                                         |
| Camera frame           | `renderer.render` of the viewport scene, 2 times.                                                                                                                                            |
| One-node scene update  | Toggling one glass pane, `updateVersion()` and `viewport.update()`, 4 times (back to the start).                                                                                             |
| Camera frame with SSAO | The SSAO effect composer's `render()`, 2 times, with the renderer state `PostProcessingManager.render` sets around it.                                                                       |
| Attribute switch       | Only with `COUNT_ATTRIBUTES=1`. A one-floor tower in attribute mode switches the visualized attribute from `zone` to `load`. Every item gets a new material and its node is converted again. |

WebGL calls include the methods of the `WEBGL_multi_draw` extension, which three.js uses to draw a `BatchedMesh`. One multi-draw call counts as one draw call.

| Counter            | Meaning                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| JS function calls  | Calls of functions in the viewer bundle (`bundle.js`, which includes three.js and the other dependencies). V8 precise coverage. |
| JS executed blocks | Executions of basic blocks (function bodies, branches, loop bodies) in the bundle. Grows with loop iterations, not only calls.  |
| JS functions run   | Distinct bundle functions that ran at least once.                                                                               |
| WebGL calls        | Every method call on the viewer's WebGL context, including state and uniform calls three.js does not skip.                      |
| WebGL draw calls   | `drawArrays`, `drawElements` and their instanced, range and multi-draw variants.                                                |

The "Pages agree" column compares all pages of a build. It should always say "yes"; anything else means the counts are no longer exact (see below).

## How the counts are made exact

- **Coverage around one synchronous section.** CDP `Profiler.startPreciseCoverage({callCount: true, detailed: true})` keeps a counter per function and block. `Profiler.takePreciseCoverage` returns and resets them; it is called right before and right after the section. Only scripts from the build's own origin count, so the fixture, the probe and Playwright's helpers do not.
- **No optimizing compilers.** Chrome runs with `--js-flags=--no-opt --no-maglev`. Optimized code does not count the calls it inlines, and when V8 optimizes a function depends on timing. With TurboFan and Maglev on, one page counted 878,792 calls of `TreeNode.children` in a one-node update and three others counted none; SSAO frames differed by up to 170 calls between pages. Without them every page agreed. This also means the counts are higher than in a normal browser (the one-node update: 24.8 million calls instead of about 10.3 million), because inlined calls count too. Compare counts with counts from this benchmark only.
- **Nothing else runs during the section.** Before each section the viewer must have drawn nothing for 10 frames, so the first frames, a beauty render, or the redraw after the last section are over. Then `requestAnimationFrame`, `setTimeout` and `setInterval` callbacks that come due are queued until both coverage reads are done.
- **One uncounted run before the frames.** The camera frame and the SSAO frame run once inside the hold before they are counted. Without it, one SSAO page in five created and uploaded one texture fewer in the section, because one of the viewer's own frames before it had already done so, and whether that happened depended on timing.
- **Seeded `Math.random`.** An init script replaces it with a seeded generator before the page loads, so three.js UUIDs and anything ordered by them are the same on every page. This is a precaution; no difference was traced to it.

## Verified

`development` (06c315efb) against SS-10439 (eee9e1116, the scene-tree changes), 5 pages per build, Intel UHD 630 laptop, 2026-11-17. Once with the usual background load, once with a busy loop on 11 of 12 cores. All 10 pages of each build (20 in total) gave the same count for every function in every section, and the two runs printed the same tables.

| Section                | Counter           |       Base |       Head | Change |
| ---------------------- | ----------------- | ---------: | ---------: | -----: |
| Full scene build       | JS function calls | 11,367,814 | 10,522,138 |  -7.4% |
| Camera frame (x2)      | JS function calls |  1,279,748 |  1,228,052 |  -4.0% |
| One-node update (x4)   | JS function calls | 24,792,565 |  6,210,169 | -75.0% |
| Camera frame with SSAO | JS function calls |  1,985,361 |  1,881,969 |  -5.2% |

WebGL calls and draw calls were the same for both builds in every section: SS-10439 changes CPU work, not what reaches the GPU. The camera frame saves 25,848 calls per render, about 2 per scene-tree node, which fits SS-10439 turning off `matrixAutoUpdate` on the static scene nodes.

## Finding the functions behind a difference

Set `COUNT_DUMP` to a file. Each section of each page appends one line `{origin, section, perFunction}`, where `perFunction` maps a function's character offset in `bundle.js` to its call count. Compare two lines and map the offsets to source with the build's `bundle.js.map` (for example with the `source-map` package). That is how the inlining and texture-upload differences above were found.

## What counts do not show

- **Time.** A count says how much work ran, not how long it took. A call that got cheaper but runs as often does not show; a slow call and a fast one count the same. Use the timing benchmark for that.
- **GPU work.** WebGL calls count what the viewer asks for, not what the GPU does with it: no fill rate, no shader cost, no overdraw, no waiting for the GPU.
- **Shader compilation.** It runs in the GPU process. `budgets.baseline.json` counts shader programs.
- **Garbage collection and allocation.** Neither is counted. An allocation-heavy change can be slower with fewer calls.
- **Native code.** Built-in functions (`Array.prototype.sort`, typed arrays, DOM) count as nothing; only bundle functions and their blocks do. The WebGL calls are the exception, because they are wrapped.
- **Work outside the sections.** Loading, the first frame, beauty renders and asynchronous work after `viewport.update()` are not counted.
- **Optimized-code behaviour.** With the optimizing compilers off, the counts describe the code, not what V8 makes of it.
