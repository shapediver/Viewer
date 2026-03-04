import {IGLTF_v2} from "@shapediver/viewer.data-engine.shared-types";
import {
	ICamera,
	OrthographicCamera,
	PerspectiveCamera,
} from "@shapediver/viewer.rendering-engine.camera-engine";
import {
	AbstractLight,
	DirectionalLight,
	ILight,
	PointLight,
	SpotLight,
} from "@shapediver/viewer.rendering-engine.light-engine";
import {ITreeNode, TreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	HttpClient,
	HttpResponse,
	Logger,
	PerformanceEvaluator,
	ShapeDiverViewerDataProcessingError,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {
	AnimationData,
	AttributeData,
	BoneData,
	Color,
	CustomData,
	IAnimationTrack,
	InstanceData,
	ITaskEvent,
	TASK_TYPE,
} from "@shapediver/viewer.shared.types";
import {mat4, vec3, vec4} from "gl-matrix";

import {AccessorLoader} from "./loaders/AccessorLoader";
import {BufferLoader} from "./loaders/BufferLoader";
import {BufferViewLoader} from "./loaders/BufferViewLoader";
import {GeometryLoader} from "./loaders/GeometryLoader";
import {MaterialLoader} from "./loaders/MaterialLoader";
import {TextureLoader} from "./loaders/TextureLoader";

export enum GLTF_EXTENSIONS {
	KHR_BINARY_GLTF = "KHR_binary_glTF",
	KHR_DRACO_MESH_COMPRESSION = "KHR_draco_mesh_compression",
	KHR_LIGHTS_PUNCTUAL = "KHR_lights_punctual",
	KHR_MATERIALS_CLEARCOAT = "KHR_materials_clearcoat",
	KHR_MATERIALS_IOR = "KHR_materials_ior",
	KHR_MATERIALS_PBRSPECULARGLOSSINESS = "KHR_materials_pbrSpecularGlossiness",
	KHR_MATERIALS_SHEEN = "KHR_materials_sheen",
	KHR_MATERIALS_SPECULAR = "KHR_materials_specular",
	KHR_MATERIALS_TRANSMISSION = "KHR_materials_transmission",
	KHR_MATERIALS_UNLIT = "KHR_materials_unlit",
	KHR_MATERIALS_VARIANTS = "KHR_materials_variants",
	KHR_MATERIALS_VOLUME = "KHR_materials_volume",
	KHR_MESH_QUANTIZATION = "KHR_mesh_quantization",
	KHR_TEXTURE_TRANSFORM = "KHR_texture_transform",
	SHAPEDIVER_MATERIALS_PRESET = "SHAPEDIVER_materials_preset",
	EXT_MESH_GPU_INSTANCING = "EXT_mesh_gpu_instancing",
}

export class GLTFLoader {
	// #region Properties (22)

	private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _globalTransformation = mat4.fromValues(
		1,
		0,
		0,
		0,
		0,
		0,
		1,
		0,
		0,
		-1,
		0,
		0,
		0,
		0,
		0,
		1,
	);
	private readonly _httpClient: HttpClient = HttpClient.instance;
	private readonly _logger: Logger = Logger.instance;
	private readonly _performanceEvaluator = PerformanceEvaluator.instance;
	private readonly _progressUpdateLimit = 500;
	private readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;
	private readonly _matrixPool: mat4[] = [];
	private readonly _nodeBatchSize = 100;
	private readonly _vec3Pool: vec3[] = [];
	private readonly _vec4Pool: vec4[] = [];

	private _accessorLoader!: AccessorLoader;
	private _baseUri: string | undefined;
	private _body: ArrayBuffer | undefined;
	private _bufferLoader!: BufferLoader;
	private _bufferViewLoader!: BufferViewLoader;
	private _content!: IGLTF_v2;
	private _eventId: string = "";
	private _geometryLoader!: GeometryLoader;
	private _materialLoader!: MaterialLoader;
	private _nodes: {
		[key: number]: ITreeNode;
	} = {};
	private _numberOfConvertedNodes = 0;
	private _numberOfNodes = 0;
	private _progressTimer = 0;
	private _textureLoader!: TextureLoader;

	// #endregion Properties (22)

	// #region Public Methods (2)

	public async load(
		content: IGLTF_v2,
		gltfBinary?: ArrayBuffer,
		gltfHeader?: {
			magic: string;
			version: number;
			length: number;
			contentLength: number;
			contentFormat: number;
		},
		baseUri?: string,
		taskEventId?: string,
	): Promise<ITreeNode> {
		this._eventId = taskEventId || this._uuidGenerator.create();
		const eventStart: ITaskEvent = {
			type: TASK_TYPE.GLTF_CONTENT_LOADING,
			id: this._eventId,
			progress: 0,
			status: "Starting glTF 2.0 loading.",
		};
		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

		this._numberOfConvertedNodes = 0;
		this._numberOfNodes = content.nodes ? content.nodes.length : 0;
		this._progressTimer = performance.now();

		this._baseUri = baseUri;
		if (gltfBinary && gltfHeader)
			this._body = gltfBinary.slice(
				this.BINARY_EXTENSION_HEADER_LENGTH +
					gltfHeader.contentLength +
					8,
				gltfHeader.length,
			);
		this._content = content;

		this.validateVersionAndExtensions();

		// Lazy load DRACO module and parallelize independent loaders
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const DRACO = require("./draco/draco_decoder.js");
		const dracoModulePromise = new DRACO();

		this._bufferLoader = new BufferLoader(
			this._content,
			this._body,
			this._baseUri,
		);
		const bufferLoadPromise = this._bufferLoader.load();

		// Wait for buffers, then parallelize texture and material loading
		await bufferLoadPromise;
		this._bufferViewLoader = new BufferViewLoader(
			this._content,
			this._bufferLoader,
		);
		this._bufferViewLoader.load();
		this._accessorLoader = new AccessorLoader(
			this._content,
			this._bufferViewLoader,
		);
		this._accessorLoader.load();

		// Parallelize texture loading and DRACO module initialization
		this._textureLoader = new TextureLoader(
			this._content,
			this._bufferViewLoader,
			this._baseUri,
		);
		const [dracoModule] = await Promise.all([
			dracoModulePromise,
			this._textureLoader.load(),
		]);

		this._materialLoader = new MaterialLoader(
			this._content,
			this._textureLoader,
		);
		await this._materialLoader.load();
		this._geometryLoader = new GeometryLoader(
			this._content,
			this._accessorLoader,
			this._bufferViewLoader,
			this._materialLoader,
			dracoModule,
		);

		const eventProgressInit: ITaskEvent = {
			type: TASK_TYPE.GLTF_CONTENT_LOADING,
			id: this._eventId,
			progress: 0.1,
			status: "Initial logic of glTF loading.",
		};
		this._eventEngine.emitEvent(
			EVENTTYPE.TASK.TASK_PROCESS,
			eventProgressInit,
		);

		const node = await this.loadScene();

		if (
			this._content.extensions &&
			this._content.extensions[GLTF_EXTENSIONS.KHR_MATERIALS_VARIANTS]
		) {
			const variants =
				this._content.extensions[GLTF_EXTENSIONS.KHR_MATERIALS_VARIANTS]
					.variants;
			for (let i = 0; i < variants.length; i++)
				this._geometryLoader.materialVariantsData.variants.push(
					variants[i].name,
				);
			this._geometryLoader.materialVariantsData.variantIndex = 0;
			node.data.push(this._geometryLoader.materialVariantsData);
		}

		if (
			this._content.skins !== undefined &&
			this._content.nodes !== undefined
		) {
			for (let i = 0; i < this._content.nodes?.length; i++) {
				if (this._content.nodes[i].skin !== undefined) {
					const skinDef = this.loadSkin(this._content.nodes[i].skin!);

					const skinNode = this._nodes[i];

					const bones: ITreeNode[] = [];
					const boneInverses: mat4[] = [];

					for (let j = 0; j < skinDef.joints.length; j++) {
						this._nodes[skinDef.joints[j]].data.push(
							new BoneData(),
						);
						bones.push(this._nodes[skinDef.joints[j]]);

						let mat = mat4.create();
						if (skinDef.inverseBindMatrices !== undefined) {
							const matricesArray =
								skinDef.inverseBindMatrices!.array;
							mat = mat4.fromValues(
								matricesArray[j * 16 + 0],
								matricesArray[j * 16 + 1],
								matricesArray[j * 16 + 2],
								matricesArray[j * 16 + 3],
								matricesArray[j * 16 + 4],
								matricesArray[j * 16 + 5],
								matricesArray[j * 16 + 6],
								matricesArray[j * 16 + 7],
								matricesArray[j * 16 + 8],
								matricesArray[j * 16 + 9],
								matricesArray[j * 16 + 10],
								matricesArray[j * 16 + 11],
								matricesArray[j * 16 + 12],
								matricesArray[j * 16 + 13],
								matricesArray[j * 16 + 14],
								matricesArray[j * 16 + 15],
							);
						}
						boneInverses.push(mat);
					}

					skinNode.skinNode = true;
					skinNode.bones = bones;
					skinNode.boneInverses = boneInverses;
				}
			}
		}

		if (this._content.animations)
			for (let i = 0; i < this._content.animations?.length; i++)
				node.data.push(this.loadAnimation(i));

		const eventEnd: ITaskEvent = {
			type: TASK_TYPE.GLTF_CONTENT_LOADING,
			id: this._eventId,
			progress: 1,
			status: "GlTF loading complete.",
		};
		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

		// Clean up resources that are no longer needed
		this._geometryLoader.cleanup();

		return node;
	}

	public async loadWithUrl(url?: string | undefined): Promise<ITreeNode> {
		this._performanceEvaluator.startSection("gltfProcessing." + url);

		this._performanceEvaluator.startSection("loadGltf." + url);
		const axiosResponse = (await this._httpClient.get(url!, {
			responseType: "arraybuffer",
		})) as HttpResponse<ArrayBuffer>;
		this._performanceEvaluator.endSection("loadGltf." + url);

		let gltfContent, gltfBinary, gltfBaseUrl, gltfHeader;

		const magic = new TextDecoder().decode(
			new Uint8Array(axiosResponse.data, 0, 4),
		);
		const isBinary =
			magic === "glTF" ||
			(axiosResponse.headers["content-type"] &&
				(axiosResponse.headers["content-type"] ===
					"model/gltf-binary" ||
					axiosResponse.headers["content-type"] ===
						"application/octet-stream" ||
					axiosResponse.headers["content-type"] ===
						"model/gltf.binary"));

		if (isBinary) {
			gltfBinary = axiosResponse.data;
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
					"GLTFLoader.load: Invalid data: sdgTF magic wrong.",
				);

			// create content
			const contentDataView = new DataView(
				gltfBinary,
				this.BINARY_EXTENSION_HEADER_LENGTH,
				gltfHeader.contentLength,
			);
			const contentDecoded = new TextDecoder().decode(contentDataView);
			gltfContent = JSON.parse(contentDecoded);

			// create body
			this._body = gltfBinary.slice(
				this.BINARY_EXTENSION_HEADER_LENGTH +
					gltfHeader.contentLength +
					8,
				gltfHeader.length,
			);
		} else {
			gltfContent = JSON.parse(
				new TextDecoder().decode(axiosResponse.data),
			);

			const removeLastDirectoryPartOf = (the_url: string): string => {
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
				gltfBaseUrl = removeLastDirectoryPartOf(window.location.href);
		}

		return await this.load(
			gltfContent,
			gltfBinary,
			gltfHeader,
			gltfBaseUrl,
		);
	}

	// #endregion Public Methods (2)

	// #region Private Methods (7)

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
	 * @param {number} animationIndex
	 * @return {Promise<AnimationClip>}
	 */
	private loadAnimation(animationId: number): AnimationData {
		if (!this._content.animations)
			throw new Error("Animations not available.");
		if (!this._content.animations[animationId])
			throw new Error("Animations not available.");
		const animationDef = this._content.animations[animationId];
		const animationTracks: IAnimationTrack[] = [];
		let min = Infinity,
			max = -Infinity;

		for (let i = 0; i < animationDef.channels.length; i++) {
			const channel = animationDef.channels[i];
			const sampler = animationDef.samplers[channel.sampler];

			const target = channel.target;
			const path = target.path;
			const node = this._nodes[target.node];
			if (node === undefined)
				throw new Error("Animation node not available.");

			const input = this._accessorLoader.getAccessor(sampler.input);
			min = Math.min(min, input!.min[0]);
			max = Math.max(max, input!.max[0]);
			const output = this._accessorLoader.getAccessor(sampler.output);
			let interpolation = sampler.interpolation;
			if (interpolation === "CUBICSPLINE") {
				this._logger.warn(
					"Animation with CUBICSPLINE interpolation is currently not supported. Assigning linear interpolation instead.",
				);
				interpolation = "linear";
			}

			animationTracks.push({
				node,
				times: input!.array,
				values: output!.array,
				path: <"scale" | "translation" | "rotation">path,
				interpolation: <"linear" | "step">interpolation?.toLowerCase(),
			});
		}

		return new AnimationData(
			animationDef.name || "gltf_animation_" + animationId,
			animationTracks,
			min,
			max - min,
		);
	}

	private loadCamera(cameraId: number): ICamera {
		if (!this._content.cameras) throw new Error("Cameras not available.");
		if (!this._content.cameras[cameraId])
			throw new Error("Cameras not available.");
		const cameraDef = this._content.cameras[cameraId];
		const id = cameraDef.name || "camera_" + cameraId;

		let cameraData: PerspectiveCamera | OrthographicCamera;
		if (cameraDef.type === "perspective") {
			const perspectiveCameraDef = cameraDef.perspective!;
			cameraData = new PerspectiveCamera(id);
			cameraData.name = id;
			cameraData.fov = perspectiveCameraDef.yfov * (180 / Math.PI);
			cameraData.aspect = perspectiveCameraDef.aspectRatio || 1;
			cameraData.near = perspectiveCameraDef.znear || 1;
			cameraData.far = perspectiveCameraDef.zfar || 2e6;
		} else {
			const orthographicCameraDef = cameraDef.orthographic!;
			cameraData = new OrthographicCamera(id);
			cameraData.name = id;
			cameraData.left = -orthographicCameraDef.xmag;
			cameraData.right = orthographicCameraDef.xmag;
			cameraData.top = -orthographicCameraDef.ymag;
			cameraData.bottom = orthographicCameraDef.ymag;
			cameraData.near = orthographicCameraDef.znear || 1;
			cameraData.far = orthographicCameraDef.zfar || 2e6;
		}

		cameraData.useNodeData = true;

		return cameraData;
	}

	private loadLights(lightId: number): ILight {
		if (
			!this._content.extensions ||
			!this._content.extensions[GLTF_EXTENSIONS.KHR_LIGHTS_PUNCTUAL] ||
			!this._content.extensions[GLTF_EXTENSIONS.KHR_LIGHTS_PUNCTUAL]
				.lights
		)
			throw new Error(
				`Extension ${GLTF_EXTENSIONS.KHR_LIGHTS_PUNCTUAL} not available.`,
			);
		if (
			!this._content.extensions[GLTF_EXTENSIONS.KHR_LIGHTS_PUNCTUAL]
				.lights[lightId]
		)
			throw new Error("Light not available.");
		const lightDef =
			this._content.extensions[GLTF_EXTENSIONS.KHR_LIGHTS_PUNCTUAL]
				.lights[lightId];
		const id = lightDef.name || "light_" + lightId;

		let color: Color = "#ffffffff";
		if (lightDef.color !== undefined)
			color = [
				lightDef.color[0] * 255,
				lightDef.color[1] * 255,
				lightDef.color[2] * 255,
			];

		const range = lightDef.range !== undefined ? lightDef.range : 0;

		let lightData: AbstractLight;
		if (lightDef.type === "directional") {
			lightData = new DirectionalLight({color});
			lightData.name = id;

			const directionalLightData = <DirectionalLight>lightData;

			if (lightDef.intensity !== undefined)
				directionalLightData.intensity = lightDef.intensity;
		} else if (lightDef.type === "point") {
			lightData = new PointLight({color});
			lightData.name = id;

			const pointLightData = <PointLight>lightData;

			pointLightData.distance = range;
			pointLightData.decay = 2;
			if (lightDef.intensity !== undefined)
				lightData.intensity = lightDef.intensity;

			pointLightData.position = [0, 0, 0];
		} else if (lightDef.type === "spot") {
			lightData = new SpotLight({color});
			lightData.name = id;

			lightDef.spot = lightDef.spot || {};
			lightDef.spot.innerConeAngle =
				lightDef.spot.innerConeAngle !== undefined
					? lightDef.spot.innerConeAngle
					: 0;
			lightDef.spot.outerConeAngle =
				lightDef.spot.outerConeAngle !== undefined
					? lightDef.spot.outerConeAngle
					: Math.PI / 4.0;

			const spotLightData = <SpotLight>lightData;
			spotLightData.distance = range;
			spotLightData.angle = lightDef.spot.outerConeAngle;
			spotLightData.penumbra =
				1.0 -
				lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
			spotLightData.decay = 2;
			if (lightDef.intensity !== undefined)
				lightData.intensity = lightDef.intensity;

			spotLightData.position = [0, 0, 0];
			spotLightData.target = [0, 0, -1];
		} else {
			throw new Error("Unexpected light type: " + lightDef.type);
		}

		lightData.useNodeData = true;
		return lightData;
	}

	private async loadNode(nodeId: number): Promise<ITreeNode> {
		if (!this._content.nodes) throw new Error("Nodes not available.");
		if (!this._content.nodes[nodeId])
			throw new Error("Node not available.");
		const node = this._content.nodes[nodeId];
		const nodeDef = new TreeNode(node.name || "node_" + nodeId);
		nodeDef.originalName = node.name;
		this._nodes[nodeId] = nodeDef;

		if (node.matrix) {
			nodeDef.addTransformation({
				id: "gltf_matrix",
				matrix: mat4.fromValues(
					node.matrix[0],
					node.matrix[1],
					node.matrix[2],
					node.matrix[3],
					node.matrix[4],
					node.matrix[5],
					node.matrix[6],
					node.matrix[7],
					node.matrix[8],
					node.matrix[9],
					node.matrix[10],
					node.matrix[11],
					node.matrix[12],
					node.matrix[13],
					node.matrix[14],
					node.matrix[15],
				),
			});

			nodeDef.addTransformation({
				id: "gltf_matrix_translation",
				matrix: mat4.create(),
			});
			nodeDef.addTransformation({
				id: "gltf_matrix_rotation",
				matrix: mat4.create(),
			});
			nodeDef.addTransformation({
				id: "gltf_matrix_scale",
				matrix: mat4.create(),
			});
		} else if (node.translation || node.scale || node.rotation) {
			const matT = node.translation
				? mat4.fromTranslation(
						mat4.create(),
						vec3.fromValues(
							node.translation[0],
							node.translation[1],
							node.translation[2],
						),
					)
				: mat4.create();
			const matS = node.scale
				? mat4.fromScaling(
						mat4.create(),
						vec3.fromValues(
							node.scale[0],
							node.scale[1],
							node.scale[2],
						),
					)
				: mat4.create();
			const matR = node.rotation
				? mat4.fromQuat(
						mat4.create(),
						vec4.fromValues(
							node.rotation[0],
							node.rotation[1],
							node.rotation[2],
							node.rotation[3],
						),
					)
				: mat4.create();

			nodeDef.addTransformation({
				id: "gltf_matrix_translation",
				matrix: matT,
			});
			nodeDef.addTransformation({
				id: "gltf_matrix_rotation",
				matrix: matR,
			});
			nodeDef.addTransformation({
				id: "gltf_matrix_scale",
				matrix: matS,
			});
		}

		const instanceTransformations: mat4[] = [];
		if (
			node.extensions &&
			node.extensions[GLTF_EXTENSIONS.EXT_MESH_GPU_INSTANCING]
		) {
			const ext =
				node.extensions[GLTF_EXTENSIONS.EXT_MESH_GPU_INSTANCING]
					.attributes;
			if (ext["TRANSLATION"] && ext["ROTATION"] && ext["SCALE"]) {
				const translationAttribute = this._accessorLoader.getAccessor(
					ext["TRANSLATION"],
				);
				const rotationAttribute = this._accessorLoader.getAccessor(
					ext["ROTATION"],
				);
				const scaleAttribute = this._accessorLoader.getAccessor(
					ext["SCALE"],
				);

				if (
					translationAttribute &&
					rotationAttribute &&
					scaleAttribute
				) {
					const translationMatrices: mat4[] = [];
					const translationVectors: vec3[] = [];
					for (
						let i = 0;
						i < translationAttribute.array.length;
						i += 3
					) {
						const v = this.getPooledVec3();
						vec3.set(
							v,
							translationAttribute.array[i],
							translationAttribute.array[i + 1],
							translationAttribute.array[i + 2],
						);
						translationVectors.push(v);
						translationMatrices.push(
							mat4.fromTranslation(this.getPooledMatrix(), v),
						);
					}

					const rotationMatrices: mat4[] = [];
					const rotationVectors: vec4[] = [];
					for (
						let i = 0;
						i < rotationAttribute.array.length;
						i += 4
					) {
						const v = this.getPooledVec4();
						vec4.set(
							v,
							rotationAttribute.array[i],
							rotationAttribute.array[i + 1],
							rotationAttribute.array[i + 2],
							rotationAttribute.array[i + 3],
						);
						rotationVectors.push(v);
						rotationMatrices.push(
							mat4.fromQuat(this.getPooledMatrix(), v),
						);
					}

					const scaleMatrices: mat4[] = [];
					const scaleVectors: vec3[] = [];
					for (let i = 0; i < scaleAttribute.array.length; i += 3) {
						const v = this.getPooledVec3();
						vec3.set(
							v,
							scaleAttribute.array[i],
							scaleAttribute.array[i + 1],
							scaleAttribute.array[i + 2],
						);
						scaleVectors.push(v);
						scaleMatrices.push(
							mat4.fromScaling(this.getPooledMatrix(), v),
						);
					}

					if (
						translationMatrices.length ===
							rotationMatrices.length &&
						translationMatrices.length === scaleMatrices.length
					) {
						for (let i = 0; i < translationMatrices.length; i++) {
							const transformationMatrix = this.getPooledMatrix();
							mat4.multiply(
								transformationMatrix,
								translationMatrices[i],
								rotationMatrices[i],
							);
							mat4.multiply(
								transformationMatrix,
								transformationMatrix,
								scaleMatrices[i],
							);

							instanceTransformations.push(transformationMatrix);
						}

						// Return temporary matrices and vectors to pool for reuse
						for (const mat of translationMatrices)
							this.returnMatrixToPool(mat);
						for (const mat of rotationMatrices)
							this.returnMatrixToPool(mat);
						for (const mat of scaleMatrices)
							this.returnMatrixToPool(mat);
						for (const v of translationVectors)
							this.returnVec3ToPool(v);
						for (const v of rotationVectors)
							this.returnVec4ToPool(v);
						for (const v of scaleVectors) this.returnVec3ToPool(v);
					}
				}
			}

			if (instanceTransformations.length > 0)
				nodeDef.addData(new InstanceData(instanceTransformations));
		}

		if (node.mesh !== undefined) {
			const geometryDataArray = this._geometryLoader.loadMesh(
				node.mesh,
				node.weights,
			);
			nodeDef.addData(geometryDataArray);
		}

		if (node.camera !== undefined)
			nodeDef.addData(this.loadCamera(node.camera));

		if (
			node.extensions &&
			node.extensions[GLTF_EXTENSIONS.KHR_LIGHTS_PUNCTUAL]
		)
			nodeDef.addData(
				this.loadLights(
					node.extensions[GLTF_EXTENSIONS.KHR_LIGHTS_PUNCTUAL].light,
				),
			);

		if (node.children) {
			for (let i = 0, len = node.children.length; i < len; i++) {
				// got through all children
				nodeDef.addChild(await this.loadNode(node.children[i]));
			}
		}

		if (node.extras) {
			const customData = new CustomData(node.extras);
			nodeDef.data.push(customData);
		}

		this._numberOfConvertedNodes++;
		if (
			performance.now() - this._progressTimer >
			this._progressUpdateLimit
		) {
			this._progressTimer = performance.now();
			const eventProgress: ITaskEvent = {
				type: TASK_TYPE.GLTF_CONTENT_LOADING,
				id: this._eventId,
				progress:
					this._numberOfConvertedNodes / this._numberOfNodes / 2 +
					0.1,
				status: `GlTF conversion progress: ${this._numberOfConvertedNodes}/${this._numberOfNodes} nodes.`,
			};
			this._eventEngine.emitEvent(
				EVENTTYPE.TASK.TASK_PROCESS,
				eventProgress,
			);
		}

		return nodeDef;
	}

	private async loadScene(): Promise<ITreeNode> {
		if (!this._content.scenes) throw new Error("Scenes not available.");
		const sceneId = this._content.scene || 0;
		if (!this._content.scenes[sceneId])
			throw new Error("Scene not available.");
		const scene = this._content.scenes[sceneId];
		const sceneDef = new TreeNode(scene.name || "scene_" + sceneId + "");
		sceneDef.originalName = scene.name;
		sceneDef.addTransformation({
			id: this._uuidGenerator.create(),
			matrix: this._globalTransformation,
		});
		if (scene.nodes)
			for (let i = 0, len = scene.nodes.length; i < len; i++)
				sceneDef.addChild(await this.loadNode(scene.nodes[i]));
		return sceneDef;
	}

	private loadSkin(skinId: number): {
		joints: number[];
		inverseBindMatrices: AttributeData | null;
	} {
		if (!this._content.skins) throw new Error("Skins not available.");
		if (!this._content.skins[skinId])
			throw new Error("Skin not available.");
		const skinDef = this._content.skins![skinId];

		const skinEntry: {
			joints: number[];
			inverseBindMatrices: AttributeData | null;
		} = {
			joints: skinDef.joints,
			inverseBindMatrices: null,
		};

		if (skinDef.inverseBindMatrices === undefined) {
			return skinEntry;
		}

		skinEntry.inverseBindMatrices = this._accessorLoader.getAccessor(
			skinDef.inverseBindMatrices,
		);
		return skinEntry;
	}

	private validateVersionAndExtensions(): void {
		if (!this._content.asset) throw new Error("Asset not available.");
		const asset = this._content.asset;
		if (!asset.version) throw new Error("Asset does not have a version.");
		const version: string = asset.minVersion
			? asset.minVersion
			: asset.version;
		if (!version.startsWith("2"))
			throw new Error("Version of the glTF not supported.");

		if (this._content.extensionsUsed) {
			const notSupported = [];
			for (let i = 0; i < this._content.extensionsUsed.length; i++) {
				if (
					!(<string[]>Object.values(GLTF_EXTENSIONS)).includes(
						this._content.extensionsUsed[i],
					)
				)
					notSupported.push(this._content.extensionsUsed[i]);
			}
			if (notSupported.length > 0) {
				let message =
					"Extension" + (notSupported.length === 1 ? " " : "s ");
				notSupported.forEach((element, index) => {
					message +=
						'"' +
						element +
						'"' +
						(index === notSupported.length - 1
							? ""
							: index === notSupported.length - 2
								? " and "
								: ", ");
				});
				message +=
					(notSupported.length === 1 ? " is" : " are") +
					" not supported, but used. Loading glTF regardless.";
				this._logger.info(
					"GLTFLoader.validateVersionAndExtensions: " + message,
				);
			}
		}

		if (this._content.extensionsRequired) {
			const notSupported = [];
			for (let i = 0; i < this._content.extensionsRequired.length; i++) {
				if (
					!(<string[]>Object.values(GLTF_EXTENSIONS)).includes(
						this._content.extensionsRequired[i],
					)
				)
					notSupported.push(this._content.extensionsRequired[i]);
			}
			if (notSupported.length > 0) {
				let message =
					"Extension" + (notSupported.length === 1 ? " " : "s ");
				notSupported.forEach((element, index) => {
					message +=
						'"' +
						element +
						'"' +
						(index === notSupported.length - 1
							? ""
							: index === notSupported.length - 2
								? " and "
								: ", ");
				});
				message +=
					(notSupported.length === 1 ? " is" : " are") +
					" not supported, but required. Aborting glTF loading.";
				throw new Error(message);
			}
		}
	}

	private getPooledMatrix(): mat4 {
		return this._matrixPool.length > 0
			? this._matrixPool.pop()!
			: mat4.create();
	}

	private returnMatrixToPool(matrix: mat4): void {
		if (this._matrixPool.length < 1000) {
			// Limit pool size to prevent memory bloat
			mat4.identity(matrix);
			this._matrixPool.push(matrix);
		}
	}

	private getPooledVec3(): vec3 {
		return this._vec3Pool.length > 0
			? this._vec3Pool.pop()!
			: vec3.create();
	}

	private returnVec3ToPool(v: vec3): void {
		if (this._vec3Pool.length < 1000) {
			vec3.set(v, 0, 0, 0);
			this._vec3Pool.push(v);
		}
	}

	private getPooledVec4(): vec4 {
		return this._vec4Pool.length > 0
			? this._vec4Pool.pop()!
			: vec4.create();
	}

	private returnVec4ToPool(v: vec4): void {
		if (this._vec4Pool.length < 1000) {
			vec4.set(v, 0, 0, 0, 0);
			this._vec4Pool.push(v);
		}
	}

	// #endregion Private Methods (7)
}
