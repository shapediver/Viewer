/**
 * Calls of `Material.customProgramCacheKey`. three.js calls it once for
 * every program key it computes, and the viewer replaces it on a material
 * with a fixed function (`MaterialLoader`). Runs in the page. Adds
 * `window.__probe.counters.programCacheKey`.
 * It must not reference anything outside its own body.
 *
 * The prototype method becomes an accessor: reading it gives the counting
 * original, and assigning a function to a material gives that material a
 * counting version of it. Materials that were patched before this was
 * attached are not counted, so `attach` runs when the viewport is created.
 */
export function installProgramCacheKey() {
	const probe = (window as any).__probe;
	let calls = 0;
	let attached = false;

	function attach() {
		if (attached || !probe.scene) return;
		let material: any;
		probe.scene.traverse((object: any) => {
			if (material || !object.material) return;
			material = Array.isArray(object.material)
				? object.material[0]
				: object.material;
		});
		if (!material) return;
		let proto = Object.getPrototypeOf(material);
		while (
			proto &&
			!Object.prototype.hasOwnProperty.call(
				proto,
				"customProgramCacheKey",
			)
		)
			proto = Object.getPrototypeOf(proto);
		if (!proto) throw new Error("Material.customProgramCacheKey not found");
		const original = proto.customProgramCacheKey;
		const counting = (method: (...args: any[]) => any) =>
			function (this: unknown, ...args: any[]) {
				calls++;
				return method.apply(this, args);
			};
		const countingOriginal = counting(original);
		Object.defineProperty(proto, "customProgramCacheKey", {
			configurable: true,
			get: () => countingOriginal,
			set(this: any, method: (...args: any[]) => any) {
				Object.defineProperty(this, "customProgramCacheKey", {
					configurable: true,
					enumerable: true,
					writable: true,
					value: counting(method),
				});
			},
		});
		attached = true;
	}

	probe.counters.programCacheKey = {
		attach,
		reset() {
			calls = 0;
		},
		read: () => ({calls}),
	};
}
