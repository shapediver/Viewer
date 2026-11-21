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
