/**
 * Calls of `Object3D.updateMatrixWorld`, recursive calls included. Runs in
 * the page. Adds `window.__probe.counters.matrixWorld`.
 * It must not reference anything outside its own body.
 *
 * `updateWorldMatrix` (the walk up the parents of one object) is counted
 * separately in `worldMatrixTotal`, so that code which replaces a scene walk
 * with it shows the work it still does.
 *
 * `read()` gives `total`, every call since the last reset, and `byFrame`,
 * the calls made inside `renderer.render` per animation frame (the keys are
 * `probe.currentFrame()`, the same numbers as `PassRecord.frame`).
 */
export function installMatrixWorld() {
	const probe = (window as any).__probe;
	let total = 0;
	let worldMatrixTotal = 0;
	let renderDepth = 0;
	const byFrame: Record<number, number> = {};
	let attached = false;

	function attach() {
		if (attached || !probe.scene) return;
		// Scene, Mesh and Group inherit it from Object3D.prototype. Camera
		// overrides it and calls `super`, which lands here as well.
		let proto = Object.getPrototypeOf(probe.scene);
		while (
			proto &&
			!Object.prototype.hasOwnProperty.call(proto, "updateMatrixWorld")
		)
			proto = Object.getPrototypeOf(proto);
		if (!proto) throw new Error("Object3D.updateMatrixWorld was not found");
		const original = proto.updateMatrixWorld;
		proto.updateMatrixWorld = function (this: unknown, ...args: any[]) {
			total++;
			if (renderDepth > 0) {
				const frame = probe.currentFrame();
				byFrame[frame] = (byFrame[frame] ?? 0) + 1;
			}
			return original.apply(this, args);
		};
		const updateWorldMatrix = proto.updateWorldMatrix;
		proto.updateWorldMatrix = function (this: unknown, ...args: any[]) {
			worldMatrixTotal++;
			return updateWorldMatrix.apply(this, args);
		};
		// Outside the probe's own wrapper, so every pass of a frame counts.
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

	probe.counters.matrixWorld = {
		attach,
		reset() {
			total = 0;
			worldMatrixTotal = 0;
			for (const key of Object.keys(byFrame)) delete byFrame[Number(key)];
		},
		read: () => ({total, worldMatrixTotal, byFrame: {...byFrame}}),
	};
}
