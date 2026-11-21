/**
 * What the viewer writes into batches (`THREE.BatchedMesh`). Runs in the
 * page. Adds `window.__probe.counters.batchedMesh`.
 * It must not reference anything outside its own body.
 *
 * `read()` gives, since the last reset:
 * - `vertexCopies`, `indexCopies`: vertices and indices written into a batch
 *   (the size of the geometry copied). `addGeometry` writes through
 *   `setGeometryAt`, so that one function counts both.
 * - `geometryWrites`: calls of `setGeometryAt`
 * - `instancesAdded`, `instancesDeleted`
 * - `matrixWrites`: calls of `setMatrixAt`, one per batch member the viewer
 *   applied again
 * - `bufferGrowths`, `instanceGrowths`, `optimizes`: resizes of a batch
 * - `batchesCreated`: batches in the scene that were not there at the reset
 * - `batchesRemoved`: batches that were there at the reset and are gone
 */
export function installBatchedMesh() {
	const probe = (window as any).__probe;
	let vertexCopies = 0;
	let indexCopies = 0;
	let geometryWrites = 0;
	let instancesAdded = 0;
	let instancesDeleted = 0;
	let matrixWrites = 0;
	let bufferGrowths = 0;
	let instanceGrowths = 0;
	let optimizes = 0;
	let known = new Set<any>();
	let attached = false;

	function batches() {
		const found = new Set<any>();
		if (!probe.scene) return found;
		probe.scene.traverse((object: any) => {
			if (object.isBatchedMesh) found.add(object);
		});
		return found;
	}

	function wrap(proto: any, name: string, before: (args: any[]) => void) {
		const original = proto[name];
		proto[name] = function (this: unknown, ...args: any[]) {
			before(args);
			return original.apply(this, args);
		};
	}

	function attach() {
		if (attached || !probe.scene) return;
		const batch = [...batches()][0];
		// The prototype exists only once a batch does. `build` runs `attach`
		// again after the scene is converted.
		if (!batch) return;
		const proto = Object.getPrototypeOf(batch);
		const written = (geometry: any) => {
			geometryWrites++;
			vertexCopies += geometry.getAttribute("position").count;
			const index = geometry.getIndex();
			if (index) indexCopies += index.count;
		};
		wrap(proto, "setGeometryAt", (args) => written(args[1]));
		wrap(proto, "addInstance", () => instancesAdded++);
		wrap(proto, "deleteInstance", () => instancesDeleted++);
		wrap(proto, "setMatrixAt", () => matrixWrites++);
		wrap(proto, "setGeometrySize", () => bufferGrowths++);
		wrap(proto, "setInstanceCount", () => instanceGrowths++);
		wrap(proto, "optimize", () => optimizes++);
		known = batches();
		attached = true;
	}

	probe.counters.batchedMesh = {
		attach,
		reset() {
			vertexCopies = 0;
			indexCopies = 0;
			geometryWrites = 0;
			instancesAdded = 0;
			instancesDeleted = 0;
			matrixWrites = 0;
			bufferGrowths = 0;
			instanceGrowths = 0;
			optimizes = 0;
			known = batches();
		},
		read() {
			const now = batches();
			let batchesCreated = 0;
			let batchesRemoved = 0;
			for (const batch of now) if (!known.has(batch)) batchesCreated++;
			for (const batch of known) if (!now.has(batch)) batchesRemoved++;
			return {
				vertexCopies,
				indexCopies,
				geometryWrites,
				instancesAdded,
				instancesDeleted,
				matrixWrites,
				bufferGrowths,
				instanceGrowths,
				optimizes,
				batchesCreated,
				batchesRemoved,
			};
		},
	};
}
