/**
 * Draco decoding for glTF primitives, off the main thread.
 *
 * One decoder module per page. The first Draco primitive starts a single
 * worker built from the decoder's own source (a blob URL, so consumers do
 * not configure anything in Vite or webpack). Decoded arrays come back as
 * transferred buffers. Where a worker cannot be created or does not start
 * (no Worker, a CSP without `worker-src blob:`), decoding falls back to one
 * shared module on the main thread.
 */

export interface IDecodedDracoAttribute {
	name: string;
	array: Float32Array;
	numComponents: number;
	normalized: boolean;
	byteOffset: number;
}

export interface IDecodedDracoPrimitive {
	attributes: IDecodedDracoAttribute[];
	indices: Uint32Array | null;
}

type DracoModuleFactory = (module?: object) => Promise<unknown>;

/**
 * Decode one compressed buffer.
 *
 * Runs in the worker and in the fallback, so it must reference nothing
 * outside itself: its source is copied into the worker with toString().
 * Keep it to syntax that does not need compiler helpers.
 */
function decodeDracoBuffer(
	draco: any,
	decoder: any,
	data: ArrayBuffer | Int8Array,
	attributeIds: {[name: string]: number},
): IDecodedDracoPrimitive {
	const array =
		data instanceof Int8Array ? data : new Int8Array(data as ArrayBuffer);
	const geometryType = decoder.GetEncodedGeometryType(array);

	let geometry: any;
	if (geometryType === draco.TRIANGULAR_MESH) {
		geometry = new draco.Mesh();
		decoder.DecodeArrayToMesh(array, array.byteLength, geometry);
	} else if (geometryType === draco.POINT_CLOUD) {
		geometry = new draco.PointCloud();
		decoder.DecodeArrayToPointCloud(array, array.byteLength, geometry);
	}

	try {
		if (attributeIds["POSITION"] === undefined)
			throw new Error("No position attribute found in the mesh.");

		const attributes: IDecodedDracoAttribute[] = [];
		for (const name in attributeIds) {
			const attribute = decoder.GetAttributeByUniqueId(
				geometry,
				attributeIds[name],
			);
			const numComponents = attribute.num_components();
			const numValues = geometry.num_points() * numComponents;
			const byteLength = numValues * 4;

			const ptr = draco._malloc(byteLength);
			decoder.GetAttributeDataArrayForAllPoints(
				geometry,
				attribute,
				draco.DT_FLOAT32,
				byteLength,
				ptr,
			);
			// The one copy out of the decoder heap; the result is transferred.
			const values = new Float32Array(
				draco.HEAPF32.buffer,
				ptr,
				numValues,
			).slice();
			draco._free(ptr);

			if (name.indexOf("COLOR") !== -1)
				for (let i = 0; i < values.length; i++)
					values[i] =
						values[i] < 0 ? 0 : values[i] > 1 ? 1 : values[i];

			attributes.push({
				name,
				array: values,
				numComponents,
				normalized: attribute.normalized(),
				byteOffset: attribute.byte_offset(),
			});
		}

		let indices: Uint32Array | null = null;
		if (geometryType === draco.TRIANGULAR_MESH) {
			const numIndices = geometry.num_faces() * 3;
			const byteLength = numIndices * 4;
			const ptr = draco._malloc(byteLength);
			decoder.GetTrianglesUInt32Array(geometry, byteLength, ptr);
			indices = new Uint32Array(
				draco.HEAPF32.buffer,
				ptr,
				numIndices,
			).slice();
			draco._free(ptr);
		}

		return {attributes, indices};
	} finally {
		if (geometry) draco.destroy(geometry);
	}
}

/**
 * Worker entry. Serialized with toString(); same rules as decodeDracoBuffer.
 */
function dracoWorkerMain(
	scope: any,
	factory: DracoModuleFactory,
	decode: typeof decodeDracoBuffer,
): void {
	const queue: any[] = [];
	let handle: ((data: any) => void) | null = null;
	scope.onmessage = (event: any) => {
		if (handle) handle(event.data);
		else queue.push(event.data);
	};
	factory().then(
		(draco: any) => {
			const decoder = new draco.Decoder();
			handle = (data: any) => {
				try {
					const result = decode(
						draco,
						decoder,
						data.buffer,
						data.attributes,
					);
					const transfer: ArrayBuffer[] = [];
					for (let i = 0; i < result.attributes.length; i++)
						transfer.push(
							result.attributes[i].array.buffer as ArrayBuffer,
						);
					if (result.indices)
						transfer.push(result.indices.buffer as ArrayBuffer);
					scope.postMessage({id: data.id, result}, transfer);
				} catch (error: any) {
					scope.postMessage({
						id: data.id,
						error:
							error && error.message
								? error.message
								: String(error),
					});
				}
			};
			scope.postMessage({ready: true});
			while (queue.length > 0) handle(queue.shift());
		},
		(error: any) => scope.postMessage({failed: String(error)}),
	);
}

interface IPendingRequest {
	resolve: (result: IDecodedDracoPrimitive) => void;
	reject: (error: Error) => void;
	retry: () => void;
}

class DracoWorkerDecoder {
	// #region Properties (6)

	private _mainThread?: Promise<{decoder: unknown; draco: unknown}>;
	private _nextId = 0;
	private readonly _pending = new Map<number, IPendingRequest>();
	private _worker?: Worker;
	private _workerFailed = false;
	private _workerReady?: Promise<boolean>;

	// #endregion Properties (6)

	// #region Public Methods (1)

	/**
	 * Decode a compressed primitive. `data` is the compressed buffer view;
	 * it is copied once so the worker can own it.
	 */
	public decode(
		data: {buffer: ArrayBuffer; byteOffset: number; byteLength: number},
		attributeIds: {[name: string]: number},
	): Promise<IDecodedDracoPrimitive> {
		return this.startWorker().then((ready) =>
			ready
				? this.decodeInWorker(data, attributeIds)
				: this.decodeOnMainThread(data, attributeIds),
		);
	}

	// #endregion Public Methods (1)

	// #region Private Methods (5)

	private async decodeOnMainThread(
		data: {buffer: ArrayBuffer; byteOffset: number; byteLength: number},
		attributeIds: {[name: string]: number},
	): Promise<IDecodedDracoPrimitive> {
		if (!this._mainThread)
			this._mainThread = loadFactory()
				.then((factory) => factory())
				.then((draco) => ({
					draco,
					decoder: new (draco as any).Decoder(),
				}));
		const {draco, decoder} = await this._mainThread;
		return decodeDracoBuffer(
			draco,
			decoder,
			new Int8Array(data.buffer, data.byteOffset, data.byteLength),
			attributeIds,
		);
	}

	private decodeInWorker(
		data: {buffer: ArrayBuffer; byteOffset: number; byteLength: number},
		attributeIds: {[name: string]: number},
	): Promise<IDecodedDracoPrimitive> {
		return new Promise((resolve, reject) => {
			const id = this._nextId++;
			this._pending.set(id, {
				resolve,
				reject,
				retry: () =>
					this.decodeOnMainThread(data, attributeIds).then(
						resolve,
						reject,
					),
			});
			const buffer = data.buffer.slice(
				data.byteOffset,
				data.byteOffset + data.byteLength,
			);
			this._worker!.postMessage({id, buffer, attributes: attributeIds}, [
				buffer,
			]);
		});
	}

	private failWorker(): void {
		this._workerFailed = true;
		this._worker?.terminate();
		this._worker = undefined;
		// Requests already sent decode on the main thread instead.
		const pending = [...this._pending.values()];
		this._pending.clear();
		pending.forEach((request) => request.retry());
	}

	private onMessage(data: {
		id?: number;
		result?: IDecodedDracoPrimitive;
		error?: string;
	}): void {
		if (data.id === undefined) return;
		const request = this._pending.get(data.id);
		if (!request) return;
		this._pending.delete(data.id);
		if (data.error !== undefined) request.reject(new Error(data.error));
		else request.resolve(data.result!);
	}

	private startWorker(): Promise<boolean> {
		if (this._workerFailed) return Promise.resolve(false);
		if (this._workerReady) return this._workerReady;

		this._workerReady = loadFactory().then(
			(factory) =>
				new Promise<boolean>((resolve) => {
					let url: string | undefined;
					try {
						if (
							typeof Worker === "undefined" ||
							typeof Blob === "undefined" ||
							typeof URL === "undefined" ||
							typeof URL.createObjectURL !== "function"
						)
							throw new Error("Workers are not available.");
						const source =
							"var DracoDecoderModule = " +
							factory.toString() +
							";\n(" +
							dracoWorkerMain.toString() +
							")(self, DracoDecoderModule, " +
							decodeDracoBuffer.toString() +
							");";
						url = URL.createObjectURL(
							new Blob([source], {type: "text/javascript"}),
						);
						const worker = new Worker(url);
						this._worker = worker;
						let started = false;
						worker.onmessage = (event: MessageEvent) => {
							const data = event.data;
							if (data && data.ready) {
								started = true;
								if (url) URL.revokeObjectURL(url);
								resolve(true);
							} else if (data && data.failed !== undefined) {
								this.failWorker();
								resolve(false);
							} else {
								this.onMessage(data);
							}
						};
						worker.onerror = (event: ErrorEvent) => {
							event.preventDefault();
							if (!started && url) URL.revokeObjectURL(url);
							this.failWorker();
							resolve(false);
						};
					} catch {
						if (url) URL.revokeObjectURL(url);
						this.failWorker();
						resolve(false);
					}
				}),
		);
		return this._workerReady;
	}

	// #endregion Private Methods (5)
}

let factoryPromise: Promise<DracoModuleFactory> | undefined;

/** The decoder source is only evaluated for glTFs that use Draco. */
function loadFactory(): Promise<DracoModuleFactory> {
	if (!factoryPromise)
		factoryPromise = import("./draco_decoder.js").then(
			(module) =>
				(module as unknown as {default: DracoModuleFactory}).default,
		);
	return factoryPromise;
}

let instance: DracoWorkerDecoder | undefined;

/** The decoder shared by every glTF load on the page. */
export function getDracoDecoder(): DracoWorkerDecoder {
	if (!instance) instance = new DracoWorkerDecoder();
	return instance;
}
