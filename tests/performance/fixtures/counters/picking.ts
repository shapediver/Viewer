/**
 * What a pick costs. Runs in the page. Adds `window.__probe.counters.picking`.
 * It must not reference anything outside its own body.
 *
 * Not in `counters/index.ts`: a spec that measures picking installs it with
 * `page.evaluate(installPicking)` and calls `attach()` once the scene has
 * batches (after `setupInteraction` and `settle`). `attach` wraps prototypes
 * that exist only once the scene holds a mesh and a batch.
 *
 * `read()` gives, since the last reset:
 * - `picks`: calls of `viewport.pointerEventToRay`, one per pointer event the
 *   interaction feature picked for,
 * - `hiddenSourceRaycasts`: `Mesh.raycast` calls on the hidden source mesh of
 *   a batched member (their hits are thrown away),
 * - `batchRaycasts`: `BatchedMesh.raycast` calls, which visit every instance
 *   of the batch,
 * - `batchBoundsReads`: `getBoundingSphereAt` calls made inside
 *   `BatchedMesh.raycast`,
 * - `objectsValidated`: objects the bounds hierarchy compared with the scene.
 *   The hierarchy writes its work into `globalThis.__nodeBoundsStats` only if
 *   this installer created the object before the first pick; 0 on a build
 *   without the hierarchy.
 */
export function installPicking() {
	const probe = (window as any).__probe;
	let picks = 0;
	let hiddenSourceRaycasts = 0;
	let batchRaycasts = 0;
	let batchBoundsReads = 0;
	let insideBatchRaycast = 0;
	let validatedBase = 0;
	(globalThis as any).__nodeBoundsStats = {
		queries: 0,
		objectsChecked: 0,
		rebuilds: 0,
	};
	const validated = () =>
		(globalThis as any).__nodeBoundsStats.objectsChecked;
	let attached = false;

	const protoWith = (object: any, name: string) => {
		let proto = Object.getPrototypeOf(object);
		while (proto && !Object.prototype.hasOwnProperty.call(proto, name))
			proto = Object.getPrototypeOf(proto);
		return proto;
	};

	function attach() {
		if (attached || !probe.scene) return;
		const meshProtos = new Set<any>();
		let batch: any = null;
		probe.scene.traverse((object: any) => {
			if (object.isBatchedMesh) batch = batch ?? object;
			else if (object.isMesh && !object.isInstancedMesh)
				meshProtos.add(protoWith(object, "raycast"));
		});
		for (const proto of meshProtos) {
			const original = proto.raycast;
			proto.raycast = function (this: any, ...args: any[]) {
				if (this.userData.batchedMesh != null) hiddenSourceRaycasts++;
				return original.apply(this, args);
			};
		}
		if (batch) {
			const raycastProto = protoWith(batch, "raycast");
			const originalRaycast = raycastProto.raycast;
			raycastProto.raycast = function (this: any, ...args: any[]) {
				batchRaycasts++;
				insideBatchRaycast++;
				try {
					return originalRaycast.apply(this, args);
				} finally {
					insideBatchRaycast--;
				}
			};
			const boundsProto = protoWith(batch, "getBoundingSphereAt");
			const originalBounds = boundsProto.getBoundingSphereAt;
			boundsProto.getBoundingSphereAt = function (
				this: any,
				...args: any[]
			) {
				if (insideBatchRaycast > 0) batchBoundsReads++;
				return originalBounds.apply(this, args);
			};
		}
		const toRay = probe.viewport.pointerEventToRay.bind(probe.viewport);
		probe.viewport.pointerEventToRay = (event: any) => {
			picks++;
			return toRay(event);
		};
		attached = true;
	}

	probe.counters.picking = {
		attach,
		reset() {
			picks = 0;
			hiddenSourceRaycasts = 0;
			batchRaycasts = 0;
			batchBoundsReads = 0;
			validatedBase = validated();
		},
		read: () => ({
			picks,
			hiddenSourceRaycasts,
			batchRaycasts,
			batchBoundsReads,
			objectsValidated: validated() - validatedBase,
		}),
	};
}

/**
 * What a pick costs per object it tests (SS-10563). Runs in the page. Adds
 * `window.__pickWork`. It must not reference anything outside its own body.
 * Install it with `page.evaluate(installPickWork)` before the first pick,
 * and call `attach(instancedMesh)` with any instanced mesh of the scene once
 * there is one.
 *
 * `read()` gives, since the last reset:
 * - `queries`: queries of a bounds hierarchy (one per ray of a pick, hover
 *   or select),
 * - `nodesTested`: the entries the hierarchies returned as candidates, that
 *   is `IntersectionEngine.intersectNode` calls made for those queries,
 * - `instancesTested`: `InstancedMesh.getMatrixAt` calls, which an instance
 *   test makes once per instance (and the normal of an instanced hit once
 *   more). Calls inside `computeBoundingBox` and `computeBoundingSphere`
 *   (the bounds of an instanced mesh after a highlight) are not counted
 *   here but in `instanceBoundsReads`,
 * - `raycasts`: calls of the raycast of the classes of the objects passed
 *   to `attachRaycasts(...)` (for example a line and a points object),
 * - `objectsValidated`: objects the hierarchies compared with the scene,
 * - `instancesChecked`: instance slots the hierarchies compared with what
 *   they recorded for them, after an instanced mesh changed.
 * The hierarchy writes into `globalThis.__nodeBoundsStats` only if it
 * exists; this installer creates it if no other counter did.
 */
export function installPickWork() {
	const stats = ((globalThis as any).__nodeBoundsStats ??= {
		queries: 0,
		objectsChecked: 0,
		rebuilds: 0,
	});
	stats.nodesTested ??= 0;
	stats.instancesChecked ??= 0;
	let instancesTested = 0;
	let instanceBoundsReads = 0;
	let insideBounds = 0;
	let base = {
		queries: 0,
		nodesTested: 0,
		objectsChecked: 0,
		instancesChecked: 0,
	};
	const current = () => ({
		queries: stats.queries,
		nodesTested: stats.nodesTested,
		objectsChecked: stats.objectsChecked,
		instancesChecked: stats.instancesChecked,
	});
	let attached = false;
	let raycasts = 0;
	const wrapped = new Set<any>();

	(window as any).__pickWork = {
		attach(instancedMesh: any) {
			if (attached || !instancedMesh) return;
			const protoWith = (name: string) => {
				let proto = Object.getPrototypeOf(instancedMesh);
				while (
					proto &&
					!Object.prototype.hasOwnProperty.call(proto, name)
				)
					proto = Object.getPrototypeOf(proto);
				return proto;
			};
			const proto = protoWith("getMatrixAt");
			const original = proto.getMatrixAt;
			proto.getMatrixAt = function (this: any, ...args: any[]) {
				if (insideBounds > 0) instanceBoundsReads++;
				else instancesTested++;
				return original.apply(this, args);
			};
			for (const name of [
				"computeBoundingBox",
				"computeBoundingSphere",
			]) {
				const owner = protoWith(name);
				const bounds = owner[name];
				owner[name] = function (this: any, ...args: any[]) {
					insideBounds++;
					try {
						return bounds.apply(this, args);
					} finally {
						insideBounds--;
					}
				};
			}
			attached = true;
		},
		/** Count the calls of the raycast of each object's class. */
		attachRaycasts(...objects: any[]) {
			for (const object of objects) {
				let proto = Object.getPrototypeOf(object);
				while (
					proto &&
					!Object.prototype.hasOwnProperty.call(proto, "raycast")
				)
					proto = Object.getPrototypeOf(proto);
				if (!proto || wrapped.has(proto)) continue;
				wrapped.add(proto);
				const original = proto.raycast;
				proto.raycast = function (this: any, ...args: any[]) {
					raycasts++;
					return original.apply(this, args);
				};
			}
		},
		reset() {
			instancesTested = 0;
			instanceBoundsReads = 0;
			raycasts = 0;
			base = current();
		},
		read() {
			const now = current();
			return {
				queries: now.queries - base.queries,
				nodesTested: now.nodesTested - base.nodesTested,
				instancesTested,
				instanceBoundsReads,
				raycasts,
				objectsValidated: now.objectsChecked - base.objectsChecked,
				instancesChecked: now.instancesChecked - base.instancesChecked,
			};
		},
	};
}
