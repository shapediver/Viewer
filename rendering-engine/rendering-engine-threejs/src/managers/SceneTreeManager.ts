import * as THREE from "three";

import {AbstractCamera} from "@shapediver/viewer.rendering-engine.camera-engine";
import {
	AbstractLight,
	DirectionalLight,
} from "@shapediver/viewer.rendering-engine.light-engine";
import {type IManager} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {Box, type IBox} from "@shapediver/viewer.shared.math";
import {
	GeometryData,
	HTMLElementAnchorData,
	InstanceData,
	type ITree,
	type ITreeNode,
	type ITreeNodeData,
	Tree,
} from "@shapediver/viewer.shared.node-tree";
import {
	type ISDTFOverview,
	RENDERER_TYPE,
} from "@shapediver/viewer.shared.types";

import {
	EventEngine,
	EVENTTYPE,
	PerformanceEvaluator,
	StateEngine,
} from "@shapediver/viewer.shared.services";
import {vec3} from "gl-matrix";

import {SD_DATA_TYPE, SDObject} from "../objects/SDObject";
import {RenderingEngine} from "../RenderingEngine";
import {ThreejsData} from "../types/ThreejsData";
import {assignBoundingBox, removeData} from "./sceneTree/SceenTreeManagerUtils";
import {createSDTFOverview, injectAttributeData} from "./sceneTree/SDTFUtils";
import {assignEnvironmentMapForThreeJsDataObject} from "./sceneTree/ThreeJsDataUtils";

export class SceneTreeManager implements IManager {
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _performanceEvaluator = PerformanceEvaluator.instance;
	private readonly _scene: THREE.Scene = new THREE.Scene();
	private readonly _stateEngine: StateEngine = StateEngine.instance;
	private readonly _tree: ITree = Tree.instance;

	private _boundingBox: IBox = new Box();
	private _currentSDTFOverview!: ISDTFOverview;
	private _directionalLightData: DirectionalLight[] = [];
	private _hiddenCamera: THREE.PerspectiveCamera =
		new THREE.PerspectiveCamera();
	private _lastRendererType: RENDERER_TYPE = RENDERER_TYPE.STANDARD;
	private _lastRootVersion: string = "";
	private _lastInstancingEnabled: boolean = false;
	private _mainConvertedObject!: SDObject;
	private _newRendererType: boolean = false;
	private _suspendSceneUpdates: boolean = false;
	private _deferBatch = false;
	private _batchDepth = 0;
	// Number of nodes on the current update path whose transformation or
	// visibility changed. Everything below such a node has to be updated.
	private _dirtyDepth = 0;
	// Set while a pass over the whole tree may leave out unchanged branches.
	private _skipUnchanged = false;
	/** Counts the nodes a transformation-only pass updated. */
	private _movedNodes = 0;

	constructor(private readonly _renderingEngine: RenderingEngine) {
		this._scene.background = new THREE.Color("#ffffff");
	}

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
		return this._mainConvertedObject;
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

	public init(): void {}

	/**
	 * Convert the data of the scene graph node into the format of the implementation.
	 *
	 * @param data the data element
	 * @param obj the corresponding type node
	 */
	public updateData(
		treeNodeData: ITreeNodeData,
		treeNode: ITreeNode,
		convertedObject: SDObject,
		filter: UpdateFilter = {transformationOnly: false},
		isVisibleInHierarchy: boolean = true,
	): void {
		let dataChild: THREE.Object3D | undefined;
		if (this._newRendererType && filter.transformationOnly === false) {
			const staleObjects = convertedObject.children.filter(
				(child) =>
					child.userData.SDtype === SD_DATA_TYPE.GEOMETRY &&
					child.userData.SDid === treeNodeData.id &&
					child.userData.SDversion === treeNodeData.version,
			);
			staleObjects.forEach((child) => {
				removeData(this._renderingEngine, child);
				convertedObject.remove(child);
			});
		}

		if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
			if (treeNodeData instanceof GeometryData) {
				injectAttributeData(
					this._renderingEngine,
					this._currentSDTFOverview,
					treeNode,
					treeNodeData,
				);
			}
		} else {
			const sdtfTransform = treeNode.getTransformation("sdtf");
			if (sdtfTransform) treeNode.removeTransformation(sdtfTransform);

			if (treeNodeData instanceof GeometryData)
				treeNodeData.attributeMaterial = null;
		}

		switch (true) {
			case treeNodeData instanceof GeometryData:
				{
					const geometryData = treeNodeData as GeometryData;
					// The instance matrices (EXT_mesh_gpu_instancing) live on the
					// same node as the geometry since the gltf tree was flattened.
					// Older producers still store them on the mesh-level parent.
					const instanceTransformationData: InstanceData | undefined =
						(treeNode.data.find((d) => d instanceof InstanceData) ??
							treeNode.parent?.data.find(
								(d) => d instanceof InstanceData,
							)) as InstanceData | undefined;
					const existingGeometry = convertedObject.children.find(
						(child) =>
							child.userData.SDtype === SD_DATA_TYPE.GEOMETRY &&
							child.userData.SDid === treeNodeData.id &&
							child.userData.SDversion === treeNodeData.version,
					);
					const shouldInstance = this.shouldUseGpuInstancing(
						geometryData,
						treeNode,
					);
					const instanceModeChanged =
						!!existingGeometry &&
						!!existingGeometry.userData.isInstanced !==
							shouldInstance;
					const instanceGroupChanged =
						!!existingGeometry?.userData.isInstanced &&
						existingGeometry.userData.instanceGroupKey !==
							this._renderingEngine.instanceGroupManager.getGroupKey(
								geometryData,
							);
					const instancingChanged =
						instanceModeChanged || instanceGroupChanged;
					if (instancingChanged && existingGeometry) {
						removeData(this._renderingEngine, existingGeometry);
						convertedObject.remove(existingGeometry);
					}

					if (
						filter.transformationOnly === false ||
						instancingChanged
					) {
						// Geometry children are Object3D placeholders/meshes, not
						// SDObjects, so the convertedChildrenMap miss would otherwise
						// recreate them on every scene update — leaking instanced
						// placeholders and moving InstancedMeshes out of instancedRoot.
						if (
							existingGeometry &&
							!instancingChanged &&
							!this._newRendererType
						) {
							dataChild = existingGeometry;
							// Instancing and attribute visualization keep color on a
							// separate material or instance attribute. Beauty-mode color
							// edits already mutate the existing material; replacing it
							// here drops the environment map and flattens the shading.
							if (
								(geometryData.instantiable &&
									this._renderingEngine.instanceGroupManager
										.enabled) ||
								this._renderingEngine.type ===
									RENDERER_TYPE.ATTRIBUTES
							)
								this._renderingEngine.geometryLoader.updateGeometryMaterial(
									geometryData,
								);
						} else {
							// In attribute-visualization mode instancing works with
							// per-instance flat colors, but transparency needs
							// per-object sorting: occurrences with a non-opaque
							// attribute material use the regular path.
							if (shouldInstance) {
								// GPU-instanced geometry: delegate to InstanceGroupManager.
								// Returns a lightweight placeholder that tracks this node.
								dataChild =
									this._renderingEngine.geometryLoader.loadInstanced(
										treeNode,
										geometryData,
									);
							} else {
								dataChild =
									this._renderingEngine.geometryLoader.load(
										treeNode,
										geometryData,
										instanceTransformationData,
									);

								// Three.js Object3Ds can only have one parent. If the
								// same GeometryData is referenced by multiple tree nodes,
								// the cache returns the same mesh each time. Adding it to
								// a second node silently removes it from the first. Clone
								// only when this would happen (different existing parent).
								if (
									dataChild.parent !== null &&
									dataChild.parent !== convertedObject
								) {
									// Object3D.clone JSON.stringifies userData.
									// batchedMesh points at the batch, which
									// points back through its node list.
									const original = dataChild;
									const batchedMesh =
										original.userData.batchedMesh;
									const batchId = original.userData.batchId;
									delete original.userData.batchedMesh;
									delete original.userData.batchId;
									try {
										dataChild =
											original.clone() as typeof dataChild;
									} finally {
										if (batchedMesh) {
											original.userData.batchedMesh =
												batchedMesh;
											original.userData.batchId = batchId;
										}
									}
								}

								// Baked-transform occurrences share the source
								// geometry; place the mesh via the offset matrix.
								if (geometryData.instanceOffsetMatrix) {
									dataChild.matrixAutoUpdate = false;
									dataChild.matrix.fromArray(
										geometryData.instanceOffsetMatrix,
									);
									dataChild.matrixWorldNeedsUpdate = true;
								}
							}
							this._renderingEngine.geometryLoader.registerGeometryObject(
								treeNodeData as GeometryData,
								dataChild,
							);

							dataChild.userData.SDtype = SD_DATA_TYPE.GEOMETRY;
							dataChild.userData.SDid = treeNodeData.id;
							dataChild.userData.SDversion = treeNodeData.version;
							convertedObject.add(dataChild);
						}
					} else if (existingGeometry) {
						// A transformation-only update keeps the geometry,
						// its bounding box moves with the node.
						dataChild = existingGeometry;
					}
				}
				break;
			case treeNodeData instanceof ThreejsData:
				{
					dataChild = (<ThreejsData>treeNodeData).obj;
					(<ThreejsData>treeNodeData).obj.userData.SDtype =
						SD_DATA_TYPE.THREEJS;
					(<ThreejsData>treeNodeData).obj.userData.SDid =
						treeNodeData.id;
					(<ThreejsData>treeNodeData).obj.userData.SDversion =
						treeNodeData.version;
					convertedObject.add(dataChild);

					// set the currently used environment map
					assignEnvironmentMapForThreeJsDataObject(
						treeNodeData as ThreejsData,
						this._renderingEngine.environmentMapLoader
							.environmentMap,
						this._renderingEngine.environmentMapLoader.type,
						this._renderingEngine.environmentMapIntensity,
						this._renderingEngine.environmentMapRotation,
					);
				}
				break;
			case treeNodeData instanceof AbstractLight:
				if (filter.transformationOnly === false) {
					const threeLight = this._renderingEngine.lightLoader.load(
						<AbstractLight>treeNodeData,
						convertedObject,
					);

					if (threeLight) {
						dataChild = threeLight;
						dataChild.userData.SDtype = SD_DATA_TYPE.LIGHT;
						dataChild.userData.SDid = treeNodeData.id;
						dataChild.userData.SDversion = treeNodeData.version;
					}
				}

				if (
					treeNodeData instanceof DirectionalLight &&
					(<DirectionalLight>treeNodeData).useNodeData === false
				)
					this._directionalLightData.push(treeNodeData);

				break;
			case treeNodeData instanceof AbstractCamera:
				if (filter.transformationOnly === false) {
					const threeCamera =
						this._renderingEngine.cameraManager.load(
							<AbstractCamera>treeNodeData,
							convertedObject,
						);
					if (threeCamera) {
						dataChild = threeCamera;
						dataChild.userData.SDtype = SD_DATA_TYPE.CAMERA;
						dataChild.userData.SDid = treeNodeData.id;
						dataChild.userData.SDversion = treeNodeData.version;
					}
				}
				break;
			case treeNodeData instanceof HTMLElementAnchorData:
				if (filter.transformationOnly === false) {
					this._renderingEngine.htmlElementAnchorLoader.load(
						treeNode,
						<HTMLElementAnchorData>treeNodeData,
						isVisibleInHierarchy,
					);
					const existingAnchor = convertedObject.children.find(
						(o) =>
							!(o instanceof SDObject) &&
							o.userData.SDtype ===
								SD_DATA_TYPE.HTML_ELEMENT_ANCHOR &&
							o.userData.SDid === treeNodeData.id &&
							o.userData.SDversion === treeNodeData.version,
					);
					if (!existingAnchor) {
						const dataChild = new THREE.Object3D();
						dataChild.userData.SDtype =
							SD_DATA_TYPE.HTML_ELEMENT_ANCHOR;
						dataChild.userData.SDid = treeNodeData.id;
						dataChild.userData.SDversion = treeNodeData.version;
						convertedObject.add(dataChild);
					}
				}
				break;
			default:
				break;
		}

		if (dataChild)
			assignBoundingBox(
				treeNode,
				treeNodeData,
				this._renderingEngine.id,
				dataChild,
			);
	}

	/**
	 * Update the current node via the scene graph node.
	 * Convert the data if needed.
	 *
	 * @param treeNode the scene graph node
	 * @param obj the current type object
	 */
	public updateNode(
		treeNode: ITreeNode = this._tree.root,
		obj?: THREE.Object3D,
		filter: UpdateFilter = {transformationOnly: false},
		visibleInHierarchy: boolean = true,
	) {
		// Resolve the converted object if not provided
		if (obj === undefined) {
			obj = this.resolveConvertedObject(
				treeNode,
				filter,
				visibleInHierarchy,
			);
			if (!obj) return;
		}

		this._batchDepth++;
		try {
			const convertedObject = <SDObject>obj;
			const nodeMatrix = treeNode.nodeMatrix;
			const isVisible = this.isNodeVisible(treeNode);
			const isVisibleInHierarchy = visibleInHierarchy && isVisible;

			// The transformation and the visibility are inherited by the
			// whole branch (world matrices, bounding boxes, instances and
			// batches), so a change here forces an update of everything below.
			const dirty =
				!convertedObject.hasTransformation(nodeMatrix) ||
				convertedObject.visible !== isVisible ||
				convertedObject.SDvisibleInHierarchy !== isVisibleInHierarchy;

			// A transformation-only pass over the whole tree only has to
			// find the nodes that moved. An unchanged node below unchanged
			// ancestors is left as it is, only its children are checked.
			if (
				this._skipUnchanged &&
				filter.transformationOnly &&
				!dirty &&
				this._dirtyDepth === 0
			) {
				const movedBefore = this._movedNodes;
				for (let i = 0, len = treeNode.children.length; i < len; i++) {
					const treeNodeChild = treeNode.children[i];
					const child = treeNodeChild.convertedObject[
						this._renderingEngine.id
					] as SDObject | undefined;
					this.processChildTreeNode(
						treeNodeChild,
						convertedObject,
						child?.parent === convertedObject ? child : undefined,
						filter,
						isVisibleInHierarchy,
					);
				}
				// A node below moved: its bounding boxes moved with it.
				if (this._movedNodes !== movedBefore)
					this.refreshBoundingBoxes(
						treeNode,
						convertedObject,
						isVisible,
					);
				return;
			}
			if (filter.transformationOnly) this._movedNodes++;

			// reset bounding boxes
			this.resetBoundingBoxes(treeNode);

			// cleanup obsolete data and children
			if (filter.transformationOnly === false) {
				this.cleanupObsoleteData(treeNode, convertedObject);
				this.cleanupObsoleteChildren(treeNode, convertedObject);
				// Children added or removed below this node from now on make
				// the next scene update come back to this branch.
				convertedObject.SDstructureVersion = treeNode.structureVersion;
			}

			// convert all data items of the current node
			// old versions will be replaced by new ones

			// Create a lookup map for efficient access to converted children
			const convertedChildrenMap = new Map<string, SDObject>();
			for (const child of convertedObject.children) {
				if (child instanceof SDObject) {
					convertedChildrenMap.set(child.SDid, child);
				}
			}

			// Lights and three.js objects are read on every scene update.
			let alwaysUpdate = false;
			for (let i = 0, len = treeNode.data.length; i < len; i++) {
				const dataItem = treeNode.data[i];
				if (
					dataItem instanceof AbstractLight ||
					dataItem instanceof ThreejsData
				)
					alwaysUpdate = true;
				const convertedObjectData = convertedChildrenMap.get(
					dataItem.id,
				);

				if (
					!convertedObjectData ||
					convertedObjectData.SDversion !== dataItem.version ||
					this._newRendererType
				) {
					this.updateData(
						dataItem,
						treeNode,
						convertedObject,
						filter,
						isVisibleInHierarchy,
					);
				} else {
					assignBoundingBox(
						treeNode,
						dataItem,
						this._renderingEngine.id,
						convertedObjectData,
					);
				}
			}

			// Children write batch matrices from mesh.matrixWorld, which walks
			// ancestors. Apply this node's matrix first, or a transform-only
			// update leaves descendants at the previous pose until a rebuild.
			convertedObject.visible = isVisible;
			convertedObject.applyTransformation(nodeMatrix);
			convertedObject.SDvisibleInHierarchy = isVisibleInHierarchy;

			// A transformation-only pass does not union the bounding boxes of
			// the ancestors that it only checks, so the next scene update has
			// to come back to this branch.
			if (filter.transformationOnly) {
				this.flagAncestors(treeNode, convertedObject, "SDboundsStale");
			} else {
				convertedObject.SDboundsStale = false;
			}

			// Update or create child nodes
			if (dirty) this._dirtyDepth++;
			try {
				for (let i = 0, len = treeNode.children.length; i < len; i++) {
					const treeNodeChild = treeNode.children[i];
					const childConvertedObject = convertedChildrenMap.get(
						treeNodeChild.id,
					);

					this.processChildTreeNode(
						treeNodeChild,
						convertedObject,
						childConvertedObject,
						filter,
						isVisibleInHierarchy,
					);

					this.unionChildBoundingBoxes(
						treeNode,
						treeNodeChild,
						isVisible,
					);

					if (
						(<SDObject | undefined>(
							treeNodeChild.convertedObject[
								this._renderingEngine.id
							]
						))?.SDalwaysUpdate
					)
						alwaysUpdate = true;
				}
			} finally {
				if (dirty) this._dirtyDepth--;
			}
			if (alwaysUpdate) {
				this.flagAncestors(treeNode, convertedObject, "SDalwaysUpdate");
			} else {
				convertedObject.SDalwaysUpdate = false;
			}
			this._renderingEngine.instanceGroupManager.updateNode(treeNode);
			this._renderingEngine.instanceGroupManager.setNodeVisible(
				treeNode.id,
				isVisibleInHierarchy,
			);
			if (!this._deferBatch)
				this._renderingEngine.materialBatchManager.updateTransforms(
					treeNode,
					isVisibleInHierarchy,
				);
		} finally {
			this._batchDepth--;
			if (
				this._batchDepth === 0 &&
				filter.transformationOnly === false &&
				this._deferBatch === false
			)
				this._renderingEngine.materialBatchManager.rebuild();
		}
	}

	public updateSceneTree(rootTreeNode: ITreeNode): void {
		const instancingChanged =
			this._renderingEngine.instanceGroupManager.enabled !==
			this._lastInstancingEnabled;

		// check if we currently have the same root version
		if (
			this._tree.root.version === this._lastRootVersion &&
			this._renderingEngine.type === this._lastRendererType &&
			!instancingChanged
		)
			return;

		// check if scene tree updates are currently suspended
		if (this._suspendSceneUpdates) return;

		this._lastRootVersion = this._tree.root.version;
		this._newRendererType =
			this._renderingEngine.type !== this._lastRendererType ||
			instancingChanged;
		this._lastRendererType = this._renderingEngine.type;
		this._lastInstancingEnabled =
			this._renderingEngine.instanceGroupManager.enabled;

		if (this._renderingEngine.closed) {
			this._newRendererType = false;
			return;
		}

		if (
			instancingChanged &&
			!this._renderingEngine.instanceGroupManager.enabled
		)
			this._renderingEngine.instanceGroupManager.clear();

		this._performanceEvaluator.startSection(
			"sceneTreeUpdate." + this._lastRootVersion,
		);

		const oldBB = this._boundingBox.clone();
		this._boundingBox = new Box();
		this._renderingEngine.lightLoader.shadowMapCount = 0;

		if (!this._mainConvertedObject) {
			this._mainConvertedObject = new SDObject(
				rootTreeNode.id,
				rootTreeNode.version,
			);
			const oldObj = rootTreeNode.convertedObject[
				this._renderingEngine.id
			] as THREE.Object3D;
			rootTreeNode.convertedObject[this._renderingEngine.id] =
				this._mainConvertedObject;
			if (rootTreeNode.updateCallbackConvertedObject)
				rootTreeNode.updateCallbackConvertedObject!(
					this._mainConvertedObject,
					oldObj,
					this._renderingEngine.id,
				);
			this._scene.add(this._mainConvertedObject);
		}

		// Ensure the instanced-mesh root container is in the scene.
		if (!this._scene.getObjectByName("instancedRoot"))
			this._scene.add(
				this._renderingEngine.instanceGroupManager.instancedRoot,
			);

		this._currentSDTFOverview = createSDTFOverview(rootTreeNode);
		this._deferBatch = true;
		// Branches whose version, transformation and visibility are unchanged
		// are left out. A renderer type or instancing switch and the
		// attribute visualization, which depends on data of the whole tree,
		// update every node.
		this._skipUnchanged =
			!this._newRendererType &&
			this._renderingEngine.type === RENDERER_TYPE.STANDARD;
		this._renderingEngine.instanceGroupManager.beginBoundsUpdate();
		try {
			this.updateNode(rootTreeNode, this._mainConvertedObject);
		} finally {
			this._renderingEngine.instanceGroupManager.endBoundsUpdate();
			this._deferBatch = false;
			this._skipUnchanged = false;
		}
		this._renderingEngine.materialBatchManager.rebuild();
		this._boundingBox =
			rootTreeNode.boundingBoxViewport[this._renderingEngine.id].clone();

		// directional lights need to be with the bounding box
		this._directionalLightData.forEach((dl) => {
			// check if the data has stored converted object
			const convertedObject = <SDObject | undefined>(
				(<THREE.Object3D | undefined>(
					dl.convertedObject[this._renderingEngine.id]
				))?.parent
			);
			if (!convertedObject) return;

			this._renderingEngine.lightLoader.adjustToBoundingBox(
				dl,
				convertedObject,
				this._boundingBox,
			);
		});
		this._directionalLightData = [];

		const bbChanged =
			this._boundingBox.min[0] !== oldBB.min[0] ||
			this._boundingBox.min[1] !== oldBB.min[1] ||
			this._boundingBox.min[2] !== oldBB.min[2] ||
			this._boundingBox.max[0] !== oldBB.max[0] ||
			this._boundingBox.max[1] !== oldBB.max[1] ||
			this._boundingBox.max[2] !== oldBB.max[2];

		if (bbChanged) {
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

		// Instancing (and renderer-type) toggles dispose and recreate meshes.
		// Rebind outline/bloom selections onto the new objects so they do not
		// keep referencing disposed InstancedMeshes or regular meshes.
		if (this._newRendererType)
			this._renderingEngine.postProcessingManager.refreshInstancedEffectSelections();
		this._newRendererType = false;

		this._performanceEvaluator.endSection(
			"sceneTreeUpdate." + this._lastRootVersion,
		);
	}

	/**
	 * Apply changed node transformations of the whole tree, without
	 * converting data. Nodes that did not move are only checked.
	 */
	public updateTransformations(): void {
		const skipUnchanged = this._skipUnchanged;
		this._skipUnchanged =
			this._renderingEngine.type === RENDERER_TYPE.STANDARD;
		try {
			this.updateNode(undefined, undefined, {transformationOnly: true});
		} finally {
			this._skipUnchanged = skipUnchanged;
		}
	}

	/**
	 * Whether the branch of an already converted child can be left out of
	 * the current scene update: nothing it depends on has changed.
	 */
	private canSkipChild(
		treeNodeChild: ITreeNode,
		childConvertedObject: SDObject,
		filter: UpdateFilter,
		isVisibleInHierarchy: boolean,
	): boolean {
		if (
			!this._skipUnchanged ||
			filter.transformationOnly ||
			this._dirtyDepth > 0 ||
			childConvertedObject.SDalwaysUpdate ||
			childConvertedObject.SDboundsStale ||
			// a child was added or removed in this branch
			childConvertedObject.SDstructureVersion !==
				treeNodeChild.structureVersion
		)
			return false;

		const isVisible = this.isNodeVisible(treeNodeChild);
		return (
			childConvertedObject.visible === isVisible &&
			childConvertedObject.SDvisibleInHierarchy ===
				(isVisibleInHierarchy && isVisible) &&
			childConvertedObject.hasTransformation(treeNodeChild.nodeMatrix)
		);
	}

	/**
	 * Set a flag on the converted object of a node and of its ancestors,
	 * so that a scene update that starts at the root reaches the node.
	 */
	private flagAncestors(
		treeNode: ITreeNode,
		convertedObject: SDObject,
		flag: "SDalwaysUpdate" | "SDboundsStale",
	): void {
		if (convertedObject[flag]) return;
		convertedObject[flag] = true;
		let parent = treeNode.parent;
		while (parent) {
			const parentObject = parent.convertedObject[
				this._renderingEngine.id
			] as SDObject | undefined;
			if (!parentObject || parentObject[flag]) return;
			parentObject[flag] = true;
			parent = parent.parent;
		}
	}

	/**
	 * Remove obsolete child nodes from the converted object
	 */
	private cleanupObsoleteChildren(
		treeNode: ITreeNode,
		convertedObject: SDObject,
	): void {
		// remove all child nodes in the transformed object that do not exist anymore
		// the filter goes also through the data items as they were already added
		const nodeIds = new Set(
			treeNode.children
				.filter(
					(d) =>
						!d.excludeViewports.includes(this._renderingEngine.id),
				)
				.map((d) => d.id),
		);
		const childrenToRemove = convertedObject.children.filter((oc) => {
			if (oc instanceof SDObject && oc.SDtype === SD_DATA_TYPE.OBJECT) {
				return !nodeIds.has(oc.SDid);
			} else {
				return false;
			}
		});
		childrenToRemove.forEach((cTR) => {
			cTR.traverse((o) => {
				if (o instanceof SDObject && o.SDtype !== SD_DATA_TYPE.OBJECT) {
					removeData(this._renderingEngine, o);
				} else if (
					!(o instanceof SDObject) &&
					o.userData.SDtype !== undefined
				) {
					removeData(this._renderingEngine, o);
				}
			});
			convertedObject.remove(cTR);
		});
	}

	private shouldUseGpuInstancing(
		geometry: GeometryData,
		node: ITreeNode,
	): boolean {
		if (
			!geometry.instantiable ||
			!this._renderingEngine.instanceGroupManager.enabled
		)
			return false;
		if (
			this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES &&
			(geometry.attributeMaterial?.opacity ?? 1) < 1
		)
			return false;

		const matrix = new THREE.Matrix4().fromArray(node.worldMatrix);
		if (geometry.instanceOffsetMatrix)
			matrix.multiply(
				new THREE.Matrix4().fromArray(geometry.instanceOffsetMatrix),
			);
		// THREE.InstancedMesh does not support negatively scaled matrices.
		return matrix.determinant() >= 0;
	}

	/**
	 * Remove obsolete data items from the converted object
	 */
	private cleanupObsoleteData(
		treeNode: ITreeNode,
		convertedObject: SDObject,
	): void {
		// remove all data items that do not exist anymore
		const dataMap = new Map(treeNode.data.map((d) => [d.id, d.version]));
		const dataToRemove = convertedObject.children.filter((oc) => {
			if (!(oc instanceof SDObject)) {
				const version = dataMap.get(oc.userData.SDid);
				if (version !== undefined) {
					if (version !== oc.userData.SDversion) {
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
			removeData(this._renderingEngine, dTR);
			convertedObject.remove(dTR);
		});
	}

	/**
	 * Check if a node is visible in the current viewport
	 */
	private isNodeVisible(treeNode: ITreeNode): boolean {
		return (
			treeNode.visible &&
			!treeNode.excludeViewports.includes(this._renderingEngine.id) &&
			!(
				treeNode.restrictViewports.length > 0 &&
				!treeNode.restrictViewports.includes(this._renderingEngine.id)
			)
		);
	}

	/**
	 * Process a child node by creating it if needed, updating it, and syncing bounding boxes
	 */
	private processChildTreeNode(
		treeNodeChild: ITreeNode,
		convertedObject: SDObject,
		childConvertedObject: SDObject | undefined,
		filter: UpdateFilter,
		isVisibleInHierarchy: boolean,
	): void {
		if (!childConvertedObject) {
			const newChild = new SDObject(
				treeNodeChild.id,
				treeNodeChild.version,
			);
			const oldChild = treeNodeChild.convertedObject[
				this._renderingEngine.id
			] as THREE.Object3D;
			treeNodeChild.convertedObject[this._renderingEngine.id] = newChild;
			if (treeNodeChild.updateCallbackConvertedObject)
				treeNodeChild.updateCallbackConvertedObject(
					newChild,
					oldChild,
					this._renderingEngine.id,
				);
			convertedObject.add(newChild);
			this.updateNode(
				treeNodeChild,
				newChild,
				filter,
				isVisibleInHierarchy,
			);
		} else if (
			childConvertedObject.SDversion !== treeNodeChild.version ||
			this._newRendererType
		) {
			// if the version is different, update the child
			this.updateNode(
				treeNodeChild,
				childConvertedObject,
				filter,
				isVisibleInHierarchy,
			);
			// A transformation-only update did not convert the new content.
			if (filter.transformationOnly === false)
				childConvertedObject.SDversion = treeNodeChild.version;
		} else if (
			this.canSkipChild(
				treeNodeChild,
				childConvertedObject,
				filter,
				isVisibleInHierarchy,
			)
		) {
			// nothing this branch depends on has changed
		} else {
			this.updateNode(
				treeNodeChild,
				childConvertedObject,
				filter,
				isVisibleInHierarchy,
			);
		}
	}

	/**
	 * Recompute the bounding boxes of a node that did not move from its
	 * converted data and the bounding boxes of its children.
	 */
	private refreshBoundingBoxes(
		treeNode: ITreeNode,
		convertedObject: SDObject,
		isVisible: boolean,
	): void {
		this.resetBoundingBoxes(treeNode);
		for (let i = 0, len = treeNode.data.length; i < len; i++) {
			const dataItem = treeNode.data[i];
			const dataChild = convertedObject.children.find(
				(child) =>
					child.userData.SDid === dataItem.id &&
					child.userData.SDversion === dataItem.version,
			);
			if (dataChild)
				assignBoundingBox(
					treeNode,
					dataItem,
					this._renderingEngine.id,
					dataChild,
				);
		}
		for (let i = 0, len = treeNode.children.length; i < len; i++)
			this.unionChildBoundingBoxes(
				treeNode,
				treeNode.children[i],
				isVisible,
			);
	}

	/**
	 * Reset and initialize bounding boxes for a node
	 */
	private resetBoundingBoxes(treeNode: ITreeNode): void {
		// reset the general bounding box of the current node
		// it will be recomputed in the following steps
		treeNode.boundingBox.reset();

		// create the specific BB if it doesn't exist yet
		if (!treeNode.boundingBoxViewport[this._renderingEngine.id])
			treeNode.boundingBoxViewport[this._renderingEngine.id] = new Box();

		// reset the specific bounding box of the current node
		// it will be recomputed in the following steps
		treeNode.boundingBoxViewport[this._renderingEngine.id].reset();
	}

	/**
	 * Resolves the converted object for a node, handling cases where it doesn't exist
	 */
	private resolveConvertedObject(
		treeNode: ITreeNode,
		filter: UpdateFilter,
		visibleInHierarchy: boolean,
	): THREE.Object3D | undefined {
		// check if there is a converted object
		if (treeNode.convertedObject[this._renderingEngine.id]) {
			return treeNode.convertedObject[
				this._renderingEngine.id
			] as THREE.Object3D;
		} else {
			// the node has not been converted yet
			// go up the hierarchy until a converted object is found
			let parent = treeNode.parent;
			while (parent) {
				if (parent.convertedObject[this._renderingEngine.id]) {
					this.updateNode(
						parent,
						parent.convertedObject[
							this._renderingEngine.id
						] as THREE.Object3D,
						filter,
						visibleInHierarchy,
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

	/**
	 * Union child bounding boxes with parent bounding boxes
	 */
	private unionChildBoundingBoxes(
		treeNode: ITreeNode,
		treeNodeChild: ITreeNode,
		isVisible: boolean,
	): void {
		// adjust the general BB
		if (!treeNodeChild.boundingBox.isEmpty())
			treeNode.boundingBox.union(treeNodeChild.boundingBox);

		// adjust the specific BB
		if (
			treeNodeChild.boundingBoxViewport[this._renderingEngine.id] &&
			!treeNodeChild.boundingBoxViewport[
				this._renderingEngine.id
			].isEmpty()
		) {
			// only do this if the node is
			// 1. visible
			// 2. no included in the "excludeViewports"
			// 3. if there are "restrictViewports", it needs to be in them
			if (isVisible)
				treeNode.boundingBoxViewport[this._renderingEngine.id].union(
					treeNodeChild.boundingBoxViewport[this._renderingEngine.id],
				);
		}
	}
}

/* eslint-disable @typescript-eslint/no-empty-function */
type UpdateFilter = {
	transformationOnly: boolean;
};
