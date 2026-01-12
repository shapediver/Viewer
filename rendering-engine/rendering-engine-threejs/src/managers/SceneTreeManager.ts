import {AbstractCamera} from "@shapediver/viewer.rendering-engine.camera-engine";
import {
	AbstractLight,
	DirectionalLight,
} from "@shapediver/viewer.rendering-engine.light-engine";
import {IManager} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {Box, IBox} from "@shapediver/viewer.shared.math";
import {
	ITree,
	ITreeNode,
	ITreeNodeData,
	Tree,
} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	InputValidator,
	PerformanceEvaluator,
	StateEngine,
} from "@shapediver/viewer.shared.services";
import {
	AbstractMaterialData,
	AnimationData,
	BoneData,
	GeometryData,
	HTMLElementAnchorData,
	InstanceData,
	ISDTFOverview,
	RENDERER_TYPE,
} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {SDBone} from "../objects/SDBone";
import {SDData, SD_DATA_TYPE} from "../objects/SDData";
import {SDObject} from "../objects/SDObject";
import {RenderingEngine} from "../RenderingEngine";
import {ThreejsData} from "../types/ThreejsData";
import {
	assignBoundingBox,
	getBone,
	removeData,
} from "./sceneTree/SceenTreeManagerUtils";
import {createSDTFOverview, injectAttributeData} from "./sceneTree/SDTFUtils";
import {assignEnvironmentMapForThreeJsDataObject} from "./sceneTree/ThreeJsDataUtils";

/* eslint-disable @typescript-eslint/no-empty-function */
// #region Type aliases (1)

type UpdateFilter = {
	transformationOnly: boolean;
};

// #endregion Type aliases (1)

// #region Classes (1)

export class SceneTreeManager implements IManager {
	// #region Properties (12)

	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _inputValidator: InputValidator = InputValidator.instance;
	private readonly _performanceEvaluator = PerformanceEvaluator.instance;
	private readonly _scene: THREE.Scene = new THREE.Scene();
	private readonly _stateEngine: StateEngine = StateEngine.instance;
	private readonly _tree: ITree = Tree.instance;

	private _boundingBox: IBox = new Box();
	private _currentSDTFOverview!: ISDTFOverview;
	private _hiddenCamera: THREE.PerspectiveCamera =
		new THREE.PerspectiveCamera();
	private _lastRendererType: RENDERER_TYPE = RENDERER_TYPE.STANDARD;
	private _lastRootVersion: string = "";
	private _mainNode!: SDObject;
	private _suspendSceneUpdates: boolean = false;

	// #endregion Properties (12)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {
		this._scene.background = new THREE.Color("#ffffff");
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (4)

	public get boundingBox(): IBox {
		return this._boundingBox;
	}

	public get lastRendererType(): RENDERER_TYPE {
		return this._lastRendererType;
	}

	public get lastRootVersion(): string {
		return this._lastRootVersion;
	}

	public get mainNode() {
		return this._mainNode;
	}

	public get scene() {
		return this._scene;
	}

	public get suspendSceneUpdates(): boolean {
		return this._suspendSceneUpdates;
	}

	public set suspendSceneUpdates(value: boolean) {
		this._suspendSceneUpdates = value;
	}

	// #endregion Public Getters And Setters (4)

	// #region Public Methods (6)

	public init(): void {}

	/**
	 * Convert the data of the scene graph node into the format of the implementation.
	 *
	 * @param data the data element
	 * @param obj the corresponding type node
	 */
	public updateData(
		node: ITreeNode,
		obj: SDObject,
		data: ITreeNodeData,
		filter: UpdateFilter,
		isVisibleInHierarchy: boolean,
		skeleton?: THREE.Skeleton,
	): void {
		let dataChild = <SDData>(
			obj.children.find(
				(oc) =>
					(<SDData>oc).SDid === data.id &&
					(<SDData>oc).SDversion === data.version,
			)
		);
		let newChild = false;

		if (!dataChild) {
			newChild = true;
			dataChild = new SDData(data.id, data.version);
			obj.add(dataChild);
		}

		if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
			injectAttributeData(
				this._renderingEngine,
				this._currentSDTFOverview,
				node,
				data,
			);
		} else {
			const sdtfTransform = node.getTransformation("sdtf");
			if (sdtfTransform) node.removeTransformation(sdtfTransform);

			if (data instanceof GeometryData) data.attributeMaterial = null;
		}

		switch (true) {
			case data instanceof GeometryData:
				{
					dataChild.SDtype = SD_DATA_TYPE.GEOMETRY;

					// We search for the instance matrices data in the parent of our current node
					// We are currently at the primitive level and the instance matrices are stored at the mesh level
					const instanceTransformationData: InstanceData | undefined =
						node.parent?.data.find(
							(d) => d instanceof InstanceData,
						) as InstanceData | undefined;
					if (filter.transformationOnly === false)
						this._renderingEngine.geometryLoader.load(
							<GeometryData>data,
							dataChild,
							newChild,
							skeleton,
							instanceTransformationData,
						);
				}
				break;
			case data instanceof ThreejsData:
				{
					dataChild.SDtype = SD_DATA_TYPE.THREEJS;
					dataChild.add(<SDData>(<ThreejsData>data).obj);

					// set the currently used environment map
					assignEnvironmentMapForThreeJsDataObject(
						data as ThreejsData,
						this._renderingEngine.environmentMapLoader
							.environmentMap,
						this._renderingEngine.environmentMapLoader.type,
						this._renderingEngine.environmentMapIntensity,
						this._renderingEngine.environmentMapRotation,
					);
				}
				break;
			case data instanceof AbstractMaterialData:
				dataChild.SDtype = SD_DATA_TYPE.MATERIAL;
				break;
			case data instanceof AbstractLight:
				dataChild.SDtype = SD_DATA_TYPE.LIGHT;
				if (filter.transformationOnly === false)
					this._renderingEngine.lightLoader.load(
						<AbstractLight>data,
						dataChild,
					);
				break;
			case data instanceof AbstractCamera:
				dataChild.SDtype = SD_DATA_TYPE.CAMERA;
				if (filter.transformationOnly === false)
					this._renderingEngine.cameraManager.load(
						<AbstractCamera>data,
						dataChild,
					);
				break;
			case data instanceof HTMLElementAnchorData:
				dataChild.SDtype = SD_DATA_TYPE.HTML_ELEMENT_ANCHOR;
				if (filter.transformationOnly === false)
					this._renderingEngine.htmlElementAnchorLoader.load(
						node,
						<HTMLElementAnchorData>data,
						isVisibleInHierarchy,
					);
				break;
			case data instanceof AnimationData:
				dataChild.SDtype = SD_DATA_TYPE.ANIMATION;
				break;
			default:
				// if there is no valid conversion here, call the convertData of the implementation
				break;
		}
		assignBoundingBox(
			node,
			data,
			this._renderingEngine.id,
			dataChild,
			skeleton !== undefined,
		);
	}

	/**
	 * Update the current node via the scene graph node.
	 * Convert the data if needed.
	 *
	 * @param node the scene graph node
	 * @param obj the current type object
	 */
	public updateNode(
		node: ITreeNode = this._tree.root,
		obj: THREE.Object3D | undefined,
		filter: UpdateFilter = {transformationOnly: false},
		visibleInHierarchy: boolean = true,
		skeleton?: THREE.Skeleton,
	) {
		if (obj === undefined) {
			// check if there is a converted object
			if (node.convertedObject[this._renderingEngine.id]) {
				obj = node.convertedObject[
					this._renderingEngine.id
				] as THREE.Object3D;
			} else {
				// the node has not been converted yet
				// go up the hierarchy until a converted object is found
				let parent = node.parent;
				while (parent) {
					if (parent.convertedObject[this._renderingEngine.id]) {
						this.updateNode(
							parent,
							parent.convertedObject[
								this._renderingEngine.id
							] as THREE.Object3D,
							filter,
							visibleInHierarchy,
							skeleton,
						);
						return;
					} else {
						parent = parent.parent;
					}
				}

				// no converted object found in the hierarchy
				// update the whole scene tree
				this.updateSceneTree(this._tree.root);
				return;
			}
		}

		const convertedObject = <SDObject>obj;

		// reset the general bounding box of the current node
		// it will be recomputed in the following steps
		node.boundingBox.reset();

		// create the specific BB if it doesn't exist yet
		if (!node.boundingBoxViewport[this._renderingEngine.id])
			node.boundingBoxViewport[this._renderingEngine.id] = new Box();

		// reset the specific bounding box of the current node
		// it will be recomputed in the following steps
		node.boundingBoxViewport[this._renderingEngine.id].reset();

		if (filter.transformationOnly === false) {
			// remove all data items that do not exist anymore
			const dataIds = node.data.map((d) => d.id);
			const dataToRemove = convertedObject.children.filter((oc) => {
				if (oc instanceof SDData) {
					if (dataIds.includes(oc.SDid)) {
						const data = node.data.find((d) => d.id === oc.SDid);
						if (data && data.version !== oc.SDversion) {
							// version is different
							return true;
						} else {
							return false;
						}
					} else {
						// id not included anymore
						return true;
					}
				} else {
					return false;
				}
			});

			dataToRemove.forEach((dTR) => {
				removeData(this._renderingEngine, <SDData>dTR);
				convertedObject.remove(dTR);
			});

			// remove all child nodes in the transformed object that do not exist anymore
			// the filter goes also through the data items as they were already added
			const nodeIds = node.children
				.filter(
					(d) =>
						!d.excludeViewports.includes(this._renderingEngine.id),
				)
				.map((d) => d.id);
			const childrenToRemove = convertedObject.children.filter((oc) => {
				if (oc instanceof SDObject && !(oc instanceof SDData)) {
					if (nodeIds.includes(oc.SDid)) {
						return false;
					} else {
						// id not included anymore
						return true;
					}
				} else {
					return false;
				}
			});
			childrenToRemove.forEach((cTR) => {
				cTR.traverse((o) => {
					if (o instanceof SDData)
						removeData(this._renderingEngine, o);
				});
				convertedObject.remove(cTR);
			});
		}

		// create the skeleton if the node is marked as the skin node (root node of the skeleton)
		if (node.skinNode === true) {
			const bones: THREE.Bone[] = [];
			for (let i = 0; i < node.bones.length; i++)
				bones.push(getBone(this._mainNode, node.bones[i]));

			const boneInverses: THREE.Matrix4[] = [];
			for (let i = 0; i < node.boneInverses.length; i++)
				boneInverses.push(
					new THREE.Matrix4().fromArray(node.boneInverses[i]),
				);

			skeleton = new THREE.Skeleton(bones, boneInverses);
		}

		const isVisible =
			node.visible &&
			!node.excludeViewports.includes(this._renderingEngine.id) &&
			!(
				node.restrictViewports.length > 0 &&
				!node.restrictViewports.includes(this._renderingEngine.id)
			);
		const isVisibleInHierarchy = visibleInHierarchy && isVisible;

		// convert all data items of the current node
		// old versions will be replaced by new ones
		for (let i = 0, len = node.data.length; i < len; i++) {
			const convertedObjectData = <SDData>(
				convertedObject.children.find(
					(oc) =>
						(<SDData>oc).SDid === node.data[i].id &&
						(<SDData>oc).SDversion === node.data[i].version,
				)
			);
			if (!convertedObjectData) {
				this.updateData(
					node,
					convertedObject,
					node.data[i],
					filter,
					isVisibleInHierarchy,
					skeleton,
				);
			} else {
				assignBoundingBox(
					node,
					node.data[i],
					this._renderingEngine.id,
					convertedObjectData,
					skeleton !== undefined,
				);
			}
		}

		// add new children and update the ones that have a different version
		for (let i = 0, len = node.children.length; i < len; i++) {
			const nodeChild = node.children[i];
			const objChild = <SDObject>(
				convertedObject.children.find(
					(oc) => (<SDObject>oc).SDid === nodeChild.id,
				)
			);

			if (!objChild) {
				const newChild = node.data.find((d) => d instanceof BoneData)
					? new SDBone(nodeChild.id, nodeChild.version)
					: new SDObject(nodeChild.id, nodeChild.version);
				const oldChild = nodeChild.convertedObject[
					this._renderingEngine.id
				] as THREE.Object3D;
				nodeChild.convertedObject[this._renderingEngine.id] = newChild;
				if (nodeChild.updateCallbackConvertedObject)
					nodeChild.updateCallbackConvertedObject(
						newChild,
						oldChild,
						this._renderingEngine.id,
					);
				convertedObject.add(newChild);
				this.updateNode(
					nodeChild,
					newChild,
					filter,
					isVisibleInHierarchy,
					skeleton,
				);
			} else if (objChild.SDversion !== nodeChild.version) {
				// if the version is different, update the child
				this.updateNode(
					nodeChild,
					objChild,
					filter,
					isVisibleInHierarchy,
					skeleton,
				);
				objChild.SDversion = nodeChild.version;
			} else {
				this.updateNode(
					nodeChild,
					objChild,
					filter,
					isVisibleInHierarchy,
					skeleton,
				);
			}

			// adjust the general BB
			if (!nodeChild.boundingBox.isEmpty())
				node.boundingBox.union(nodeChild.boundingBox);

			// adjust the specific BB
			if (
				nodeChild.boundingBoxViewport[this._renderingEngine.id] &&
				!nodeChild.boundingBoxViewport[
					this._renderingEngine.id
				].isEmpty()
			) {
				// only do this if the node is
				// 1. visible
				// 2. no included in the "excludeViewports"
				// 3. if there are "restrictViewports", it needs to be in them
				if (isVisible)
					node.boundingBoxViewport[this._renderingEngine.id].union(
						nodeChild.boundingBoxViewport[this._renderingEngine.id],
					);
			}
		}

		convertedObject.visible =
			node.visible &&
			!node.excludeViewports.includes(this._renderingEngine.id) &&
			!(
				node.restrictViewports.length > 0 &&
				!node.restrictViewports.includes(this._renderingEngine.id)
			);
		convertedObject.applyTransformation(node.nodeMatrix);
	}

	public updateSceneTree(root: ITreeNode): void {
		// check if we currently have the same root version
		if (
			this._tree.root.version === this._lastRootVersion &&
			this._renderingEngine.type === this._lastRendererType
		)
			return;

		// check if scene tree updates are currently suspended
		if (this._suspendSceneUpdates) return;

		this._lastRootVersion = this._tree.root.version;
		const didRenderTypeChange =
			this._renderingEngine.type !== this._lastRendererType;
		if (didRenderTypeChange) {
			root.traverseData((data) => {
				if (data instanceof GeometryData) {
					data.updateVersion();
				}
			});
			this._lastRootVersion = this._tree.root.version;
		}
		this._lastRendererType = this._renderingEngine.type;

		if (this._renderingEngine.closed) return;

		this._performanceEvaluator.startSection(
			"sceneTreeUpdate." + this._lastRootVersion,
		);

		const oldBB = this._boundingBox.clone();
		this._boundingBox = new Box();
		this._renderingEngine.lightLoader.shadowMapCount = 0;

		if (!this._mainNode) {
			this._mainNode = new SDObject(root.id, root.version);
			const oldObj = root.convertedObject[
				this._renderingEngine.id
			] as THREE.Object3D;
			root.convertedObject[this._renderingEngine.id] = this._mainNode;
			if (root.updateCallbackConvertedObject)
				root.updateCallbackConvertedObject!(
					this._mainNode,
					oldObj,
					this._renderingEngine.id,
				);
			this._scene.add(this._mainNode);
		}

		this._currentSDTFOverview = createSDTFOverview(root);
		this.updateNode(root, this._mainNode);
		this._boundingBox =
			root.boundingBoxViewport[this._renderingEngine.id].clone();

		// directional lights need to be with the bounding box
		root.traverseData((data) => {
			if (
				data instanceof DirectionalLight &&
				(<DirectionalLight>data).useNodeData === false
			) {
				// check if the data has stored converted object
				const convertedObject = <SDData | undefined>(
					(<THREE.Object3D | undefined>(
						data.convertedObject[this._renderingEngine.id]
					))?.parent
				);
				if (!convertedObject) return;

				this._renderingEngine.lightLoader.adjustToBoundingBox(
					data,
					convertedObject,
					this._boundingBox,
				);
			}
		});

		if (
			!(
				this._boundingBox.min[0] === oldBB.min[0] &&
				this._boundingBox.min[1] === oldBB.min[1] &&
				this._boundingBox.min[2] === oldBB.min[2] &&
				this._boundingBox.max[0] === oldBB.max[0] &&
				this._boundingBox.max[1] === oldBB.max[1] &&
				this._boundingBox.max[2] === oldBB.max[2]
			)
		) {
			if (
				!this._stateEngine.viewportEngines[this._renderingEngine.id]
					?.boundingBoxCreated.resolved &&
				!this._boundingBox.isEmpty()
			)
				this._stateEngine.viewportEngines[
					this._renderingEngine.id
				]?.boundingBoxCreated.resolve(true);

			this._eventEngine.emitEvent(
				EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE,
				{
					viewportId: this._renderingEngine.id,
					boundingBox: {
						min: vec3.clone(this._boundingBox.min),
						max: vec3.clone(this._boundingBox.max),
					},
				},
			);
		}

		if (this._boundingBox.isEmpty()) {
			// check if all outputs that should be loaded at the start of a session are loaded
			// if the bounding box is empty then, emit the event
			if (
				Object.values(this._stateEngine.sessionEngines).every(
					(s) => s && s.initialOutputsLoaded.resolved === true,
				)
			) {
				this._eventEngine.emitEvent(
					EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_EMPTY,
					{
						viewportId: this._renderingEngine.id,
					},
				);
			}
		}

		this._renderingEngine.renderingManager.evaluateTextureUnitCount(
			this._renderingEngine.lightLoader.shadowMapCount +
				this._renderingEngine.materialLoader.maxMapCount,
		);

		/**
		 *
		 * Three.js texture upload and compiling
		 * This step is needed as three.js would compile the shaders and initialize the texture on the first render call instead.
		 *
		 */

		// we initialize all texture and then clear the cache
		const threeJsTextureCache =
			this._renderingEngine.materialLoader.threeJsTextureCache;
		for (const key in threeJsTextureCache) {
			if (threeJsTextureCache[key].usage === 0) {
				threeJsTextureCache[key].texture.dispose();
				delete threeJsTextureCache[key];
			} else if (threeJsTextureCache[key].initialized === false) {
				this._renderingEngine.renderer.initTexture(
					threeJsTextureCache[key].texture,
				);
				threeJsTextureCache[key].initialized = true;
			}
		}

		// we compile the shaders
		this._renderingEngine.renderer.compile(
			this._renderingEngine.scene,
			this._hiddenCamera,
		);

		this._performanceEvaluator.endSection(
			"sceneTreeUpdate." + this._lastRootVersion,
		);
	}

	// #endregion Public Methods (6)
}

// #endregion Classes (1)
