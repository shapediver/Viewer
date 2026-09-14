import {GeometryData, type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	HashCreator,
	HttpClient,
	type HttpResponse,
	Logger,
	PerformanceEvaluator,
	ShapeDiverViewerDataProcessingError,
} from "@shapediver/viewer.shared.services";

import {ResOutputContent} from "@shapediver/sdk.geometry-api-sdk-v2";
import {PRIMITIVE_MODE} from "@shapediver/viewer.shared.types";
import {GLTFLoader as GLTF_v1Loader} from "./gltfv1/GLTFLoader";
import {GLTFLoader as GLTF_v2Loader} from "./gltfv2/GLTFLoader";

export class GeometryEngine {
	// #region Properties (7)

	private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
	private readonly _hashCreator: HashCreator = HashCreator.instance;
	private readonly _httpClient: HttpClient = HttpClient.instance;
	private readonly _loadingQueue: Promise<ITreeNode>[] = [];
	private readonly _logger: Logger = Logger.instance;
	private readonly _performanceEvaluator = PerformanceEvaluator.instance;

	private static _instance: GeometryEngine;

	private _gpuInstancing = false;
	private _gpuInstancingUsers = 0;
	private _loadingQueueLength = Infinity;

	// #endregion Properties (7)

	// #region Public Static Accessors (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Accessors (1)

	// #region Public Accessors (3)

	/**
	 * When true, glTF parsing looks for repeated triangle primitives and marks
	 * them instantiable. Off by default. Retain/release so multiple viewports
	 * can opt in independently; already-loaded trees can be scanned with
	 * {@link applyGpuInstancing}.
	 */
	public get gpuInstancing(): boolean {
		return this._gpuInstancing;
	}

	public set gpuInstancing(value: boolean) {
		this._gpuInstancing = value;
		this._gpuInstancingUsers = value ? Math.max(this._gpuInstancingUsers, 1) : 0;
	}

	public retainGpuInstancing(): void {
		this._gpuInstancingUsers++;
		this._gpuInstancing = true;
	}

	public releaseGpuInstancing(): void {
		this._gpuInstancingUsers = Math.max(0, this._gpuInstancingUsers - 1);
		this._gpuInstancing = this._gpuInstancingUsers > 0;
	}

	public get parallelGlTFProcessing(): number {
		return this._loadingQueueLength;
	}

	public set parallelGlTFProcessing(value: number) {
		this._loadingQueueLength = value;
	}

	// #endregion Public Accessors (3)

	// #region Public Methods (1)

	/**
	 * Load the geometry content into a scene graph node.
	 *
	 * @param content the geometry content
	 * @returns the scene graph node
	 */
	public async loadContent(
		content: ResOutputContent,
		taskEventId: string,
		sessionId?: string,
	): Promise<ITreeNode> {
		if (!content || (content && !content.href))
			throw new ShapeDiverViewerDataProcessingError(
				"GeometryEngine cannot load content.",
			);

		while (this._loadingQueueLength <= this._loadingQueue.length)
			await new Promise((resolve) => setTimeout(resolve, 10));

		const url = content.href!;
		const urlHash = this._gpuInstancing
			? this._hashCreator.createMurmurHash(url)
			: undefined;

		// eslint-disable-next-line no-async-promise-executor
		const loadingPromise = new Promise<ITreeNode>(
			async (resolve, reject) => {
				let gltfContent, gltfBinary, gltfBaseUrl, gltfHeader;
				let version = "2.0";

				if (content.format === "glb" || content.format === "gltf") {
					this._performanceEvaluator.startSection(
						"gltfProcessing." + url,
					);

					this._performanceEvaluator.startSection("loadGltf." + url);
					const response = (await this._httpClient
						.get(url!, {
							responseType: "arraybuffer",
						})
						.catch(reject)) as
						| HttpResponse<ArrayBuffer>
						| undefined;
					this._performanceEvaluator.endSection("loadGltf." + url);

					if (!response) return;

					const magic = new TextDecoder().decode(
						new Uint8Array(response.data, 0, 4),
					);
					const isBinary = magic === "glTF";

					if (isBinary) {
						gltfBinary = response.data;
						// create header data
						const headerDataView = new DataView(
							gltfBinary,
							0,
							this.BINARY_EXTENSION_HEADER_LENGTH,
						);
						gltfHeader = {
							magic: magic,
							version: headerDataView.getUint32(4, true),
							length: headerDataView.getUint32(8, true),
							contentLength: headerDataView.getUint32(12, true),
							contentFormat: headerDataView.getUint32(16, true),
						};
						if (gltfHeader.magic != "glTF")
							throw new ShapeDiverViewerDataProcessingError(
								"Invalid data: glTF magic wrong.",
							);

						// create content
						const contentDataView = new DataView(
							gltfBinary,
							this.BINARY_EXTENSION_HEADER_LENGTH,
							gltfHeader.contentLength,
						);
						const contentDecoded = new TextDecoder().decode(
							contentDataView,
						);
						gltfContent = JSON.parse(contentDecoded);

						if (
							gltfContent &&
							gltfContent.asset &&
							gltfContent.asset.version
						) {
							const assetVersion = (
								gltfContent.asset.version + ""
							).endsWith(".0")
								? gltfContent.asset.version
								: gltfContent.asset.version + ".0";
							if (gltfHeader.version + ".0" === assetVersion) {
								version = gltfHeader.version + ".0";
							} else {
								throw new ShapeDiverViewerDataProcessingError(
									"GeometryEngine.loadContent: glTF header version (" +
										gltfHeader.version +
										") is not the same as asset version (" +
										assetVersion +
										").",
								);
							}
						} else {
							version = gltfHeader.version + ".0";
						}
					} else {
						gltfContent = JSON.parse(
							new TextDecoder().decode(response.data),
						);

						if (
							gltfContent &&
							gltfContent.asset &&
							gltfContent.asset.version
						) {
							if (gltfContent.asset.version !== "2.0")
								throw new ShapeDiverViewerDataProcessingError(
									"GeometryEngine.loadContent: Only gltf v2 is supported in a non-binary format.",
								);
						} else {
							this._logger.warn(
								"GeometryEngine.loadContent: No version specified in asset, trying to load as v2.",
							);
							version = "2.0";
						}

						const removeLastDirectoryPartOf = (
							the_url: string,
						): string => {
							const dir_char = the_url.includes("/") ? "/" : "\\";
							const the_arr = the_url.split(dir_char);
							the_arr.pop();
							return the_arr.join(dir_char);
						};

						gltfBaseUrl = removeLastDirectoryPartOf(url!);
						if (
							!gltfBaseUrl &&
							window &&
							window.location &&
							window.location.href
						)
							gltfBaseUrl = removeLastDirectoryPartOf(
								window.location.href,
							);
					}
				}

				let promise: Promise<ITreeNode>;
				if (version === "1.0") {
					promise = new GLTF_v1Loader().load(
						gltfContent,
						gltfBinary,
						gltfHeader,
						gltfBaseUrl,
						taskEventId,
					);
				} else {
					promise = new GLTF_v2Loader().load(
						gltfContent,
						gltfBinary,
						gltfHeader,
						gltfBaseUrl,
						taskEventId,
						urlHash,
						sessionId,
						this._gpuInstancing,
					);
				}
				promise.catch((e) => {
					reject(e);
				});
				resolve(promise);
			},
		);

		this._loadingQueue.push(loadingPromise);
		const node = await loadingPromise;
		this._loadingQueue.splice(
			this._loadingQueue.indexOf(loadingPromise),
			1,
		);

		this._performanceEvaluator.endSection("gltfProcessing." + url);

		return node;
	}

	/**
	 * Mark already-loaded opaque triangle geometry as instantiable when the
	 * same primitive is referenced more than once, or when attribute arrays
	 * are byte-identical. Baked-transform recovery still runs only at parse
	 * time. Call before converting the scene with instancing enabled.
	 */
	public applyGpuInstancing(root: ITreeNode): void {
		const geometries: GeometryData[] = [];
		this.collectGeometryData(root, geometries);

		const byPrimitive = new Map<string, GeometryData[]>();
		const unique = new Map<string, GeometryData[]>();
		for (const geometry of geometries) {
			if (!this.canMarkInstantiable(geometry)) continue;
			if (geometry.instantiable && geometry.instanceHash) continue;
			const primitiveKey = geometry.primitive.id;
			let group = byPrimitive.get(primitiveKey);
			if (!group) {
				group = [];
				byPrimitive.set(primitiveKey, group);
			}
			group.push(geometry);
		}

		for (const group of byPrimitive.values()) {
			if (group.length >= 2) {
				this.markGroupInstantiable(group, group[0].primitive.id);
				continue;
			}
			const geometry = group[0];
			const fingerprint = this.createGeometryFingerprint(geometry);
			if (!fingerprint) continue;
			let bucket = unique.get(fingerprint);
			if (!bucket) {
				bucket = [];
				unique.set(fingerprint, bucket);
			}
			bucket.push(geometry);
		}

		for (const bucket of unique.values()) {
			if (bucket.length < 2) continue;
			const byContent = new Map<string, GeometryData[]>();
			for (const geometry of bucket) {
				const content = this.createGeometryContentHash(geometry);
				if (!content) continue;
				let contentGroup = byContent.get(content);
				if (!contentGroup) {
					contentGroup = [];
					byContent.set(content, contentGroup);
				}
				contentGroup.push(geometry);
			}
			for (const contentGroup of byContent.values()) {
				if (contentGroup.length >= 2)
					this.markGroupInstantiable(
						contentGroup,
						contentGroup[0].primitive.id,
					);
			}
		}
	}

	// #endregion Public Methods (1)

	// #region Private Methods (1)

	private collectGeometryData(
		node: ITreeNode,
		out: GeometryData[],
	): void {
		for (const data of node.data) {
			if (data instanceof GeometryData) out.push(data);
		}
		for (const child of node.children) this.collectGeometryData(child, out);
	}

	private canMarkInstantiable(geometry: GeometryData): boolean {
		if (geometry.mode !== PRIMITIVE_MODE.TRIANGLES) return false;
		const position = geometry.primitive.attributes["POSITION"];
		if (position?.morphAttributeData?.length) return false;
		if ((geometry.material?.opacity ?? 1) < 1) return false;
		return true;
	}

	private markGroupInstantiable(
		group: GeometryData[],
		contentKey: string,
	): void {
		const geometryHash =
			this._hashCreator.createMurmurHash(contentKey) +
			"_" +
			contentKey.length;
		const instanceHash = "tree_" + geometryHash;
		for (const geometry of group) {
			geometry.instanceHash = instanceHash;
			if (!geometry.instantiable) {
				geometry.instantiable = true;
				geometry.instanceColors = [
					geometry.material && geometry.material.color
						? geometry.material.color
						: [255, 255, 255, 255],
				];
			}
		}
	}

	private createGeometryFingerprint(
		geometry: GeometryData,
	): string | undefined {
		const attributes = geometry.primitive.attributes;
		const names = Object.keys(attributes).sort();
		if (names.length === 0) return;
		const parts = names.map((name) => {
			const attribute = attributes[name];
			return `${name}:${attribute.count}:${attribute.itemSize}:${attribute.array.length}`;
		});
		const indices = geometry.primitive.indices;
		return JSON.stringify({
			indices: indices
				? `${indices.count}:${indices.array.length}`
				: "",
			parts,
		});
	}

	private createGeometryContentHash(
		geometry: GeometryData,
	): string | undefined {
		const attributes = geometry.primitive.attributes;
		const names = Object.keys(attributes).sort();
		const parts: string[] = [];
		for (const name of names)
			parts.push(name + ":" + this.hashTypedArray(attributes[name].array));
		if (geometry.primitive.indices)
			parts.push(
				"indices:" + this.hashTypedArray(geometry.primitive.indices.array),
			);
		return parts.join("|");
	}

	private hashTypedArray(array: ArrayBufferView & {length: number}): string {
		const bytes = new Uint8Array(
			array.buffer,
			array.byteOffset,
			array.byteLength,
		);
		let hash = 2166136261;
		const view = new DataView(
			bytes.buffer,
			bytes.byteOffset,
			bytes.byteLength,
		);
		const len = bytes.length;
		let i = 0;
		for (; i + 4 <= len; i += 4)
			hash = Math.imul(hash ^ view.getUint32(i, true), 16777619);
		for (; i < len; i++) hash = Math.imul(hash ^ bytes[i], 16777619);
		return `${array.constructor.name}:${array.length}:${hash >>> 0}`;
	}

	// #endregion Private Methods (1)
}
