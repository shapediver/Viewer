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
 *
 * SS-10485: the SDObject of the viewer overrides `updateMatrixWorld` and
 * leaves a branch that did not change. `total` and `byFrame` stay the walks
 * that reach `Object3D.prototype.updateMatrixWorld`. `skips` and
 * `skipsByFrame` count the calls of the override that returned without a
 * walk. The override is found from an SDObject child of the scene, so it is
 * wrapped by the `attach` that runs after the scene was built. A build
 * without the override (its prototype has no own method) never skips.
 */
export function installMatrixWorld() {
	const probe = (window as any).__probe;
	let total = 0;
	let worldMatrixTotal = 0;
	let renderDepth = 0;
	let skips = 0;
	const byFrame: Record<number, number> = {};
	const skipsByFrame: Record<number, number> = {};
	let attached = false;
	let skipsAttached = false;

	function attachSkips() {
		if (skipsAttached) return;
		const root = probe.scene.children.find((child: any) => "SDid" in child);
		if (!root) return;
		skipsAttached = true;
		const proto = Object.getPrototypeOf(root);
		if (!Object.prototype.hasOwnProperty.call(proto, "updateMatrixWorld"))
			return;
		const original = proto.updateMatrixWorld;
		proto.updateMatrixWorld = function (this: unknown, ...args: any[]) {
			const before = total;
			const result = original.apply(this, args);
			// A walk of this object, or of anything below it, reaches
			// Object3D.prototype.updateMatrixWorld.
			if (total === before) {
				skips++;
				if (renderDepth > 0) {
					const frame = probe.currentFrame();
					skipsByFrame[frame] = (skipsByFrame[frame] ?? 0) + 1;
				}
			}
			return result;
		};
	}

	function attach() {
		if (!probe.scene) return;
		if (attached) {
			attachSkips();
			return;
		}
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
		attachSkips();
	}

	probe.counters.matrixWorld = {
		attach,
		reset() {
			total = 0;
			worldMatrixTotal = 0;
			skips = 0;
			for (const key of Object.keys(byFrame)) delete byFrame[Number(key)];
			for (const key of Object.keys(skipsByFrame))
				delete skipsByFrame[Number(key)];
		},
		read: () => ({
			total,
			worldMatrixTotal,
			skips,
			byFrame: {...byFrame},
			skipsByFrame: {...skipsByFrame},
		}),
	};
}
