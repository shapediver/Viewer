# Environment map prefilter and .hdr decode

- Compile PMREM programs with a render target bound. Without one, three.js builds the screen variant (canvas colour space, tone mapping), which the prefilter never draws with.
- Do not dispose a PMREM generator per map. Disposing deletes its programs and the next map links them again. `ViewerPMREMGenerator.releaseTargets()` frees the GPU memory of the intermediate target and keeps the programs; dispose only when the viewport closes.
- `ViewerPMREMGenerator` reads three.js `PMREMGenerator` underscore fields (`_setSize`, `_allocateTargets`, `_compileMaterial`, the materials, `_pingPongRenderTarget`). Check them on every three.js upgrade: if one is renamed, `prepare` silently falls back to linking on first use, and `tests/performance/exact/SS-10619.perf.ts` fails.
- Six-image maps are prefiltered by three.js itself (`WebGLEnvironments`) in the first frame. The loader only prepares the matching programs; the renderer's program cache shares them.
- `decodeRgbeBuffer` runs from its `toString()` in a worker: no imports, no references outside the function, and no syntax that needs tsc helpers at the ES6 target (async, spread, rest).
- Never transfer an `HttpClient` response buffer to a worker. The client caches the response; copy it first.
