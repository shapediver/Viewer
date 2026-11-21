/**
 * Reconciles of the material batches (`MaterialBatchManager.rebuild()`). Runs
 * in the page. Adds `window.__probe.counters.batchRebuild`.
 * It must not reference anything outside its own body.
 *
 * `rebuild()` is not reachable from the page. It reads `root.parent` once per
 * call, outside of rendering, so the counter reads of that property of the
 * batch root (`materialBatchRoot`) outside `renderer.render`. The exact test
 * of SS-10492 calibrates it: one `updateNode` is one call.
 *
 * `read()` gives `calls`, since the last reset.
 */
export function installBatchRebuild() {
	const probe = (window as any).__probe;
	let calls = 0;
	let renderDepth = 0;
	let attached = false;

	function attach() {
		if (attached || !probe.scene) return;
		// The root joins the scene with the first scene update.
		const root = probe.scene.getObjectByName("materialBatchRoot");
		if (!root) return;
		let parent = root.parent;
		Object.defineProperty(root, "parent", {
			configurable: true,
			get() {
				if (renderDepth === 0) calls++;
				return parent;
			},
			set(value) {
				parent = value;
			},
		});
		const renderer = probe.renderer;
		const render = renderer.render;
		renderer.render = function (this: unknown, ...args: any[]) {
			renderDepth++;
			try {
				return render.apply(this, args);
			} finally {
				renderDepth--;
			}
		};
		attached = true;
	}

	probe.counters.batchRebuild = {
		attach,
		reset() {
			calls = 0;
		},
		read: () => ({calls}),
	};
}
