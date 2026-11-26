import * as THREE from "three";

import {AbstractCamera} from "@shapediver/viewer.rendering-engine.camera-engine";
import {
	AbstractLight,
	DirectionalLight,
} from "@shapediver/viewer.rendering-engine.light-engine";
import {type IManager} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {Box, type IBox} from "@shapediver/viewer.shared.math";
import {
	changedChildrenSince,
	changedKindsSince,
	changeKindsOfBits,
	currentSerial,
	dataChangeKind,
	GeometryData,
	HTMLElementAnchorData,
	InstanceData,
	type ITree,
	type ITreeNode,
	type ITreeNodeData,
	markTreeRead,
	MaterialGemData,
	nextSerial,
	noteNodeChange,
	SCENE_NODE_CHANGE_KIND_INDEX,
	SDTFOverviewData,
	Tree,
} from "@shapediver/viewer.shared.node-tree";
import {
	type ISceneChanges,
	type ISceneState,
	type ISDTFOverview,
	RENDERER_TYPE,
	type SceneChangeChannel,
	type SceneDynamicReason,
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
import {
	SCENE_CHANGE_CHANNEL_INDEX,
	SCENE_CHANGE_CHANNELS,
	SCENE_DYNAMIC_REASONS,
} from "./sceneTree/sceneState";
import {
	createSDTFOverview,
	injectAttributeData,
	mergeSDTFOverviews,
} from "./sceneTree/SDTFUtils";
import {assignEnvironmentMapForThreeJsDataObject} from "./sceneTree/ThreeJsDataUtils";

export class SceneTreeManager implements IManager {
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _performanceEvaluator = PerformanceEvaluator.instance;
	private readonly _scene: THREE.Scene = new THREE.Scene();
	private readonly _stateEngine: StateEngine = StateEngine.instance;
	private readonly _tree: ITree = Tree.instance;

	private _boundingBox: IBox = new Box();
	private _currentSDTFOverview!: ISDTFOverview;
	/**
	 * In the attribute visualization: per tree node id, the overview items
	 * (`SDTFOverviewData`) the scene update found on the node, with their
	 * versions. A change merges the overview again from these items.
	 */
	private readonly _sdtfOverviewItems = new Map<
		string,
		{item: SDTFOverviewData; version: string}[]
	>();
	/** `_currentSDTFOverview` is current for the attribute visualization. */
	private _sdtfOverviewKept = false;
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
	// What the scene updates since the last `takeSceneChanges` went through:
	// the nodes they converted again, in the order they visited them (parents
	// first), and the ids of the nodes whose converted objects they removed.
	private readonly _changedNodes = new Set<ITreeNode>();
	private readonly _removedNodeIds = new Set<string>();
	// The kinds (bits) of the nodes in _changedNodes that changed on the
	// node itself, read from the node's change serials. Absent: none.
	private readonly _changedKinds = new Map<ITreeNode, number>();
	// Per channel (SCENE_CHANGE_CHANNELS), the clock value at which this
	// viewport last applied a change of that channel.
	private readonly _revisions = new Float64Array(
		SCENE_CHANGE_CHANNELS.length,
	);
	// Why the scene changes from frame to frame (bits, SCENE_DYNAMIC_REASONS).
	private _dynamicReasons = 0;
	// A scene update ran since the last `takeSceneChanges`.
	private _passRan = false;
	// One of them went through the whole tree, so the sets say nothing.
	private _fullPass = false;

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

	/** The scene does not change from frame to frame by itself. */
	public get isStatic(): boolean {
		return this._dynamicReasons === 0;
	}

	public get mainNode() {
		return this._mainConvertedObject;
	}

	/**
	 * Per channel (in the order of SCENE_CHANGE_CHANNELS), the clock value at
	 * which this viewport last applied a change of that channel. Read only.
	 */
	public get revisionValues(): Readonly<Float64Array> {
		return this._revisions;
	}

	/** The scene state of this viewport, a new frozen object per read. */
	public get sceneState(): ISceneState {
		const revisions = {} as Record<SceneChangeChannel, number>;
		for (let i = 0; i < SCENE_CHANGE_CHANNELS.length; i++)
			revisions[SCENE_CHANGE_CHANNELS[i]] = this._revisions[i];
		const reasons: SceneDynamicReason[] = [];
		for (let i = 0; i < SCENE_DYNAMIC_REASONS.length; i++)
			if (this._dynamicReasons & (1 << i))
				reasons.push(SCENE_DYNAMIC_REASONS[i]);
		return Object.freeze({
			static: reasons.length === 0,
			reasons: Object.freeze(reasons),
			revisions: Object.freeze(revisions),
		});
	}

	public get scene() {
		return this._scene;
	}

	/**
	 * What the scene updates since the last call went through, to be sent
	 * with `VIEWPORT_UPDATED`, and forgets it. `undefined` if no scene
	 * update ran, or if one of them went through the whole tree (first
	 * update, renderer type or instancing switch, entering or leaving the
	 * attribute visualization):
	 * a listener has to read the whole tree then.
	 */
	public takeSceneChanges(
		unknownWithoutPass: boolean = true,
	): ISceneChanges | undefined {
		let changes: ISceneChanges | undefined;
		if (this._passRan && !this._fullPass) {
			const nodes = [...this._changedNodes];
			changes = Object.freeze({
				nodes: Object.freeze(nodes),
				removedNodeIds: Object.freeze([...this._removedNodeIds]),
				kinds: Object.freeze(
					nodes.map((node) =>
						changeKindsOfBits(this._changedKinds.get(node) ?? 0),
					),
				),
			});
		} else if (this._passRan || unknownWithoutPass) {
			// A listener reads the whole tree: so does every cache.
			this.recordChannel("unknown");
		}
		this._changedNodes.clear();
		this._changedKinds.clear();
		this._removedNodeIds.clear();
		this._passRan = false;
		this._fullPass = false;
		return changes;
	}

	/**
	 * Records that this viewport applied a change of `channel` now (see
	 * `ISceneState.revisions`).
	 */
	public recordChannel(channel: SceneChangeChannel): void {
		this._revisions[SCENE_CHANGE_CHANNEL_INDEX[channel]] = nextSerial();
	}

	/**
	 * Sets why the scene changes from frame to frame (bits in the order of
	 * SCENE_DYNAMIC_REASONS). Returns whether they changed.
	 */
	public setDynamicReasons(reasons: number): boolean {
		if (reasons === this._dynamicReasons) return false;
		this._dynamicReasons = reasons;
		return true;
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
			let sdtfTransform = treeNode.getTransformation("sdtf");
			while (sdtfTransform) {
				treeNode.removeTransformation(sdtfTransform);
				sdtfTransform = treeNode.getTransformation("sdtf");
			}

			if (treeNodeData instanceof GeometryData)
				treeNodeData.attributeMaterial = null;
		}

		// switch (true) with a default branch is exhaustive; the rule treats
		// the boolean discriminant as the union true | false and cannot see that.
		// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
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
							// GPU-instanced occurrences and attribute visualization
							// always refresh; regular meshes only when the material
							// was replaced (other id). Re-applying an edited material
							// drops the environment map and flattens the shading.
							if (
								existingGeometry.userData.isInstanced ||
								this._renderingEngine.type ===
									RENDERER_TYPE.ATTRIBUTES ||
								this._renderingEngine.geometryLoader.isMaterialReplaced(
									geometryData,
									existingGeometry,
								)
							) {
								this._renderingEngine.geometryLoader.updateGeometryMaterial(
									geometryData,
								);
								this._renderingEngine.renderingManager.requestCompile(
									existingGeometry,
								);
							}
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
							this._renderingEngine.renderingManager.requestCompile(
								dataChild,
							);
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
					this._renderingEngine.renderingManager.requestCompile(
						dataChild,
					);
					// A compile target that holds lights would count them a
					// second time. Such an object takes the full compile.
					let hasLight = false;
					dataChild.traverse((object) => {
						if (!(object as THREE.Light).isLight) return;
						hasLight = true;
						this._renderingEngine.renderingManager.trackLight(
							object as THREE.Light,
						);
					});
					if (hasLight)
						this._renderingEngine.renderingManager.requestFullCompile();

					// set the currently used environment map
					assignEnvironmentMapForThreeJsDataObject(
						treeNodeData as ThreejsData,
						this._renderingEngine.environmentMapLoader
							.environmentMap,
						this._renderingEngine.environmentMapLoader.type,
						this._renderingEngine.environmentMapIntensity,
						this._renderingEngine.effectiveEnvironmentMapRotation,
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
						this._renderingEngine.renderingManager.trackLight(
							threeLight,
						);
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

		// Changes made from now on are applied by a later update.
		if (this._batchDepth === 0) markTreeRead();
		this._batchDepth++;
		try {
			const convertedObject = <SDObject>obj;
			const nodeMatrix = treeNode.nodeMatrix;
			const isVisible = this.isNodeVisible(treeNode);
			const isVisibleInHierarchy = visibleInHierarchy && isVisible;
			// The clock value when this viewport last applied the node, 0 if
			// it converts the node for the first time.
			const appliedBefore = convertedObject.SDappliedSerial;
			// Moves and visibility changes can be reported ahead of the rest.
			const movesApplied = Math.max(
				appliedBefore,
				convertedObject.SDmovesReportedSerial,
			);
			const moved = !convertedObject.hasTransformation(nodeMatrix);
			const visibilityChanged = convertedObject.visible !== isVisible;
			// A matrix changed in place (no setter of the node saw it): the
			// node records the move now, so every viewport reads it.
			if (
				moved &&
				appliedBefore > 0 &&
				!(
					changedKindsSince(treeNode, movesApplied) &
					TRANSFORMATION_BIT
				)
			)
				noteNodeChange(treeNode, "transformation");
			// A transformation-only pass also applies the visibility of the
			// node. The next scene update then finds it applied and leaves the
			// node out, so it is reported here.
			if (filter.transformationOnly && visibilityChanged)
				this._changedNodes.add(treeNode);
			if (
				filter.transformationOnly &&
				appliedBefore > 0 &&
				(moved || visibilityChanged)
			)
				this.applyMoveOrVisibility(
					treeNode,
					convertedObject,
					appliedBefore,
					movesApplied,
					(moved ? TRANSFORMATION_BIT : 0) |
						(visibilityChanged ? VISIBILITY_BIT : 0),
					visibilityChanged,
				);

			// The transformation and the visibility are inherited by the
			// whole branch (world matrices, bounding boxes, instances and
			// batches), so a change here forces an update of everything below.
			const dirty =
				moved ||
				visibilityChanged ||
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

			// A node that is only passed on the way to a change below it
			// (unchanged matrix and visibility, already converted) goes
			// through the children that its log names (SS-10564), not
			// through all of them. `undefined`: all children.
			const childrenSerial = currentSerial();
			const logged =
				this._skipUnchanged &&
				filter.transformationOnly === false &&
				!dirty &&
				this._dirtyDepth === 0 &&
				appliedBefore > 0 &&
				convertedObject.SDchildrenSerial > 0
					? changedChildrenSince(
							treeNode,
							convertedObject.SDchildrenSerial,
						)
					: undefined;
			// The boxes before this visit, to update them by the changed
			// children only.
			const oldBoxes = logged ? this.cloneBoxes(treeNode) : undefined;

			// reset bounding boxes
			this.resetBoundingBoxes(treeNode);

			// The kinds of change on this node that this viewport applies
			// now. A node converted for the first time gets the kinds of its
			// data items (below).
			let changedKinds = 0;
			// A data item of this node was removed or converted again, so
			// its bounding box may differ from the one before this visit.
			let dataChanged = false;
			// cleanup obsolete data and children
			if (filter.transformationOnly === false) {
				this._changedNodes.add(treeNode);
				if (appliedBefore > 0)
					changedKinds =
						(changedKindsSince(treeNode, appliedBefore) &
							~MOVE_BITS) |
						(changedKindsSince(treeNode, movesApplied) &
							MOVE_BITS) |
						(visibilityChanged ? VISIBILITY_BIT : 0);
				// A node that holds no data and held none at its last visit has
				// nothing to clean up: a visit through the log leaves out the
				// look at its children.
				if (
					(!logged || convertedObject.SDholdsData !== false) &&
					this.cleanupObsoleteData(treeNode, convertedObject)
				)
					dataChanged = true;
				// A visit through the log removes the children its log
				// names as removed.
				if (!logged)
					this.cleanupObsoleteChildren(treeNode, convertedObject);
				// Children added or removed below this node from now on make
				// the next scene update come back to this branch.
				convertedObject.SDstructureVersion = treeNode.structureVersion;
			}

			// convert all data items of the current node
			// old versions will be replaced by new ones

			// Create a lookup map for efficient access to converted children.
			// A visit through the log needs it only for the data items.
			const convertedChildrenMap = new Map<string, SDObject>();
			if (!logged || convertedObject.SDholdsData !== false)
				for (const child of convertedObject.children) {
					if (child instanceof SDObject) {
						convertedChildrenMap.set(child.SDid, child);
					}
				}

			// Lights and three.js objects are read on every scene update.
			let alwaysUpdate = false;
			// Lights, cameras and three.js objects move without a change of
			// the tree: the matrix walk always goes through their branch.
			let alwaysWalk = false;
			let forceChildren = false;
			// The overview items of this node, in the attribute visualization.
			let overviewItems:
				| {item: SDTFOverviewData; version: string}[]
				| undefined;
			for (let i = 0, len = treeNode.data.length; i < len; i++) {
				const dataItem = treeNode.data[i];
				// Data objects are added for data items only.
				convertedObject.SDholdsData = true;
				if (dataItem instanceof SDTFOverviewData)
					(overviewItems ??= []).push({
						item: dataItem,
						version: dataItem.version,
					});
				if (
					dataItem instanceof AbstractLight ||
					dataItem instanceof ThreejsData
				) {
					alwaysUpdate = alwaysWalk = forceChildren = true;
					// A three.js object changes its box without a new
					// version: the box of this node is made again in full.
					if (dataItem instanceof ThreejsData) dataChanged = true;
				} else if (dataItem instanceof AbstractCamera)
					alwaysWalk = forceChildren = true;
				if (
					appliedBefore === 0 &&
					filter.transformationOnly === false
				) {
					const kind = dataChangeKind(dataItem);
					if (kind)
						changedKinds |= 1 << SCENE_NODE_CHANGE_KIND_INDEX[kind];
				}
				const convertedObjectData = convertedChildrenMap.get(
					dataItem.id,
				);

				if (
					!convertedObjectData ||
					convertedObjectData.SDversion !== dataItem.version ||
					this._newRendererType
				) {
					dataChanged = true;
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

			if (this._sdtfOverviewKept && filter.transformationOnly === false)
				this.noteSDTFOverviewItems(treeNode, overviewItems);

			// The batches compare the meshes of the nodes visited since their
			// last rebuild, a moved node among them (it can leave or join a
			// batch by being mirrored). A node passed through the log whose
			// data did not change keeps its meshes.
			if (!logged || dataChanged)
				this._renderingEngine.materialBatchManager.markNode(treeNode);

			// Children write batch matrices from mesh.matrixWorld, which walks
			// ancestors. Apply this node's matrix first, or a transform-only
			// update leaves descendants at the previous pose until a rebuild.
			convertedObject.visible = isVisible;
			convertedObject.applyTransformation(nodeMatrix);
			convertedObject.SDvisibleInHierarchy = isVisibleInHierarchy;
			if (filter.transformationOnly === false)
				this.applyChangedKinds(
					treeNode,
					convertedObject,
					changedKinds,
					appliedBefore,
				);

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
				if (logged) {
					this.updateLoggedChildren(
						treeNode,
						convertedObject,
						logged,
						oldBoxes!,
						dataChanged,
						filter,
						isVisibleInHierarchy,
						isVisible,
					);
					const flagged = convertedObject.SDflaggedChildren;
					if (flagged?.SDalwaysUpdate?.size) alwaysUpdate = true;
					if (flagged?.SDalwaysWalk?.size) alwaysWalk = true;
				} else {
					// Rebuilt from the children below.
					convertedObject.SDflaggedChildren = undefined;
					for (
						let i = 0, len = treeNode.children.length;
						i < len;
						i++
					) {
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

						const child = <SDObject | undefined>(
							treeNodeChild.convertedObject[
								this._renderingEngine.id
							]
						);
						if (child?.SDalwaysUpdate) alwaysUpdate = true;
						if (child?.SDalwaysWalk) alwaysWalk = true;
						if (
							child?.SDalwaysUpdate ||
							child?.SDalwaysWalk ||
							child?.SDboundsStale
						)
							this.noteFlaggedChild(
								convertedObject,
								treeNodeChild,
								child,
							);
					}
				}
			} finally {
				if (dirty) this._dirtyDepth--;
			}
			// What the next visit reads of the log of changed children. A
			// transformation-only visit converts no added child.
			if (filter.transformationOnly === false)
				convertedObject.SDchildrenSerial = childrenSerial;
			// A node updated on its own (`viewport.updateNode()`, a drag)
			// changed its boxes without its ancestors: the next scene update
			// unites their boxes over all children on the way.
			if (
				this._batchDepth === 1 &&
				filter.transformationOnly === false &&
				treeNode.parent
			)
				this.flagAncestors(treeNode, convertedObject, "SDboundsStale");
			if (alwaysUpdate) {
				this.flagAncestors(treeNode, convertedObject, "SDalwaysUpdate");
			} else {
				convertedObject.SDalwaysUpdate = false;
			}
			// Only this node, its ancestors do not force their children.
			convertedObject.SDforceChildren = forceChildren;
			if (alwaysWalk) {
				this.flagAncestors(treeNode, convertedObject, "SDalwaysWalk");
			} else {
				convertedObject.SDalwaysWalk = false;
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
			// Nodes created during the update (by a callback) count as read.
			if (this._batchDepth === 0) markTreeRead();
			if (
				this._batchDepth === 0 &&
				filter.transformationOnly === false &&
				this._deferBatch === false
			)
				this._renderingEngine.materialBatchManager.rebuild();
		}
	}

	/**
	 * Update several nodes with one reconcile of the material batches at the
	 * end. A nested call (or a scene update inside it) reconciles at the
	 * outermost one.
	 */
	public updateNodes(nodes: ITreeNode[]): void {
		if (nodes.length === 0) return;
		const outer = this._deferBatch;
		this._deferBatch = true;
		try {
			for (const node of nodes)
				this.updateNode(
					node,
					node.convertedObject[
						this._renderingEngine.id
					] as THREE.Object3D,
				);
		} finally {
			this._deferBatch = outer;
			if (!outer && this._batchDepth === 0)
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
		if (this._newRendererType && this._mainConvertedObject)
			this.recordChannel("rendererType");
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

		this._passRan = true;
		if (!this._mainConvertedObject) {
			// The first update of a viewport goes through the whole tree.
			this._fullPass = true;
			this._mainConvertedObject = new SDObject(
				rootTreeNode.id,
				rootTreeNode.version,
			);
			// The matrix is written by applyTransformation only.
			this._mainConvertedObject.matrixAutoUpdate = false;
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

		// Ensure the instanced-mesh root container is in the scene. A parent
		// check: a search by name walks every object of the scene.
		const instancedRoot =
			this._renderingEngine.instanceGroupManager.instancedRoot;
		if (instancedRoot.parent !== this._scene)
			this._scene.add(instancedRoot);

		// Only the attribute visualization reads the overview. Collecting it
		// walks every node of the tree: once when the visualization starts.
		// Later passes keep it, and merge it again from the overview items
		// when one of them changes (SS-10564).
		if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
			if (this._newRendererType || !this._sdtfOverviewKept) {
				this._sdtfOverviewItems.clear();
				this._currentSDTFOverview = createSDTFOverview(rootTreeNode);
				this._sdtfOverviewKept = true;
			}
		} else {
			this._currentSDTFOverview = {};
			this._sdtfOverviewItems.clear();
			this._sdtfOverviewKept = false;
		}
		const outerDefer = this._deferBatch;
		this._deferBatch = true;
		// Branches whose version, transformation and visibility are unchanged
		// are left out. A renderer type or instancing switch (entering or
		// leaving the attribute visualization among them) updates every
		// node. A pass in the attribute visualization converts again only
		// the data with a new version, as in the standard renderer.
		this._skipUnchanged = !this._newRendererType;
		if (!this._skipUnchanged) this._fullPass = true;
		this._renderingEngine.instanceGroupManager.beginBoundsUpdate();
		// A pass over the whole tree makes loose instance bounds exact.
		if (!this._skipUnchanged)
			this._renderingEngine.instanceGroupManager.tightenBounds();
		try {
			this.updateNode(rootTreeNode, this._mainConvertedObject);
		} finally {
			this._renderingEngine.instanceGroupManager.endBoundsUpdate();
			this._deferBatch = outerDefer;
			this._skipUnchanged = false;
		}
		if (!outerDefer) this._renderingEngine.materialBatchManager.rebuild();
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

		// we initialize all texture and then clear the cache. Only the
		// entries added or used differently since the last update.
		const threeJsTextureCache =
			this._renderingEngine.materialLoader.threeJsTextureCache;
		for (const key of this._renderingEngine.materialLoader.takeDirtyTextureKeys()) {
			if (!threeJsTextureCache[key]) continue;
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

		// we compile the shaders, the rendering waits until they are ready.
		// Only the objects this update created or re-materialized are
		// compiled. A renderer type or instancing switch (entering or leaving
		// the attribute visualization among them) changes the programs of
		// every object.
		this._renderingEngine.renderingManager.compileShaders(
			this._renderingEngine.scene,
			this._hiddenCamera,
			this._newRendererType,
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
	 * Adds kinds (bits) to the report of a node in _changedNodes.
	 */
	private addChangedKinds(treeNode: ITreeNode, kinds: number): void {
		if (kinds === 0) return;
		this._changedKinds.set(
			treeNode,
			(this._changedKinds.get(treeNode) ?? 0) | kinds,
		);
	}

	/**
	 * Marks a node as applied by this viewport now, and records the kinds of
	 * change it applied: in the report and in the revisions of their
	 * channels.
	 */
	private applyChangedKinds(
		treeNode: ITreeNode,
		convertedObject: SDObject,
		kinds: number,
		appliedBefore: number,
	): void {
		if (kinds === 0) {
			// Nothing to record. A later change gets a larger clock value.
			if (appliedBefore === 0)
				convertedObject.SDappliedSerial = currentSerial();
			return;
		}
		const applied = nextSerial();
		convertedObject.SDappliedSerial = applied;
		this.addChangedKinds(treeNode, kinds);
		for (let i = 0; kinds >> i; i++)
			if (kinds & (1 << i)) this._revisions[i] = applied;
	}

	/**
	 * A transformation-only visit applied a move or a visibility change of
	 * the node (`kinds`): records their channels and, for a visibility
	 * change, the node's report (the visibility in this viewport can also
	 * change through `excludeViewports` or `restrictViewports`, which record
	 * no kind). A report includes every move and visibility change of the
	 * node not reported yet. The node then counts as applied if nothing else
	 * waits on it (this visit does not convert its data); otherwise only its
	 * moves and visibility changes do, and the full visit reports the rest.
	 * A move alone is reported by the next full visit, so it stays waiting:
	 * the in-place record of an animated node is then written once, not
	 * every frame.
	 */
	private applyMoveOrVisibility(
		treeNode: ITreeNode,
		convertedObject: SDObject,
		appliedBefore: number,
		movesApplied: number,
		kinds: number,
		reported: boolean,
	): void {
		const applied = nextSerial();
		for (let i = 0; kinds >> i; i++)
			if (kinds & (1 << i)) this._revisions[i] = applied;
		if (!reported) return;
		this.addChangedKinds(
			treeNode,
			kinds | (changedKindsSince(treeNode, movesApplied) & MOVE_BITS),
		);
		if (changedKindsSince(treeNode, appliedBefore) & ~MOVE_BITS)
			convertedObject.SDmovesReportedSerial = applied;
		else convertedObject.SDappliedSerial = applied;
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
		flag: FlagName,
	): void {
		if (convertedObject[flag]) return;
		convertedObject[flag] = true;
		let child = treeNode;
		let parent = treeNode.parent;
		while (parent) {
			const parentObject = parent.convertedObject[
				this._renderingEngine.id
			] as SDObject | undefined;
			if (!parentObject) return;
			// A visit of the parent through its log goes through the child.
			((parentObject.SDflaggedChildren ??= {})[flag] ??= new Set()).add(
				child,
			);
			if (parentObject[flag]) return;
			parentObject[flag] = true;
			child = parent;
			parent = parent.parent;
		}
	}

	/**
	 * Records in the converted object of a node which flags (see
	 * {@link flagAncestors}) the converted object of its child `treeNodeChild`
	 * has set.
	 */
	private noteFlaggedChild(
		convertedObject: SDObject,
		treeNodeChild: ITreeNode,
		child: SDObject | undefined,
	): void {
		for (const flag of FLAG_NAMES) {
			if (child?.[flag])
				((convertedObject.SDflaggedChildren ??= {})[flag] ??=
					new Set()).add(treeNodeChild);
			else
				convertedObject.SDflaggedChildren?.[flag]?.delete(
					treeNodeChild,
				);
		}
	}

	/**
	 * The children of a node that a visit through its log of changed
	 * children (`TreeNode.changedChildren`, SS-10564) goes through: the
	 * changed, added and removed children it names, and the children whose
	 * converted object has a flag set (lights and three.js objects, a branch
	 * a transformation-only pass moved). The other children are unchanged
	 * since the last visit.
	 *
	 * The bounding boxes of the node are its data boxes (already in place)
	 * and the boxes before this visit, with the changed children's new boxes
	 * added. That is exact when the old box of every changed child lay
	 * strictly inside the node's old box: then the other children span it.
	 * Otherwise (a box on the hull shrank or moved inwards, the node's data
	 * changed, a branch moved by a transformation-only pass) the boxes are
	 * united over all children, as a full visit does.
	 */
	private updateLoggedChildren(
		treeNode: ITreeNode,
		convertedObject: SDObject,
		logged: {child: ITreeNode; removed: boolean}[],
		oldBoxes: {general: IBox; viewport: IBox},
		dataChanged: boolean,
		filter: UpdateFilter,
		isVisibleInHierarchy: boolean,
		isVisible: boolean,
	): void {
		const id = this._renderingEngine.id;
		const flagged = convertedObject.SDflaggedChildren;
		// A branch moved by a transformation-only pass changed its boxes
		// already: their old boxes are gone.
		let unite = dataChanged || (flagged?.SDboundsStale?.size ?? 0) > 0;
		const changed: ITreeNode[] = [];
		const visit = (child: ITreeNode) => {
			const childObject = child.convertedObject[id] as
				| SDObject
				| undefined;
			const own = childObject?.parent === convertedObject;
			const oldGeneral = child.boundingBox.clone();
			const oldViewport = (
				child.boundingBoxViewport[id] ?? EMPTY_BOX
			).clone();
			const inside = child.parent === treeNode;
			if (!inside || child.excludeViewports.includes(id)) {
				// Removed, or excluded from this viewport: the converted
				// object leaves, as in cleanupObsoleteChildren.
				if (own)
					this.removeConvertedChild(convertedObject, childObject);
				this.noteFlaggedChild(convertedObject, child, undefined);
			}
			// A child that left: its boxes may already be those of its new
			// place, so its old extent is unknown. Unite over all children.
			if (!inside) unite = true;
			if (inside) {
				this.processChildTreeNode(
					child,
					convertedObject,
					own && childObject.parent === convertedObject
						? childObject
						: undefined,
					filter,
					isVisibleInHierarchy,
				);
				this.noteFlaggedChild(
					convertedObject,
					child,
					child.convertedObject[id] as SDObject | undefined,
				);
				changed.push(child);
			}
			if (unite) return;
			const newGeneral = inside ? child.boundingBox : EMPTY_BOX;
			const newViewport = inside
				? (child.boundingBoxViewport[id] ?? EMPTY_BOX)
				: EMPTY_BOX;
			if (
				(!boxEquals(oldGeneral, newGeneral) &&
					!strictlyInside(oldGeneral, oldBoxes.general)) ||
				(isVisible &&
					!boxEquals(oldViewport, newViewport) &&
					!strictlyInside(oldViewport, oldBoxes.viewport))
			)
				unite = true;
		};

		let seen: Set<ITreeNode> | undefined;
		const hasFlagged =
			!!flagged?.SDalwaysUpdate?.size ||
			!!flagged?.SDalwaysWalk?.size ||
			!!flagged?.SDboundsStale?.size;
		if (hasFlagged) seen = new Set();
		for (const {child} of logged) {
			seen?.add(child);
			visit(child);
		}
		if (hasFlagged)
			for (const flag of FLAG_NAMES) {
				const set = flagged?.[flag];
				if (!set) continue;
				for (const child of [...set]) {
					if (seen!.has(child)) continue;
					seen!.add(child);
					if (child.parent !== treeNode) {
						set.delete(child);
						continue;
					}
					visit(child);
				}
			}

		if (unite) {
			for (let i = 0, len = treeNode.children.length; i < len; i++)
				this.unionChildBoundingBoxes(
					treeNode,
					treeNode.children[i],
					isVisible,
				);
			return;
		}
		// The data boxes are in place: add the old boxes and the changed
		// children.
		if (!oldBoxes.general.isEmpty())
			treeNode.boundingBox.union(oldBoxes.general);
		if (isVisible && !oldBoxes.viewport.isEmpty())
			treeNode.boundingBoxViewport[id].union(oldBoxes.viewport);
		for (const child of changed)
			this.unionChildBoundingBoxes(treeNode, child, isVisible);
	}

	/**
	 * Records the overview items (`SDTFOverviewData`) of a visited node in
	 * the attribute visualization. When they differ from the last visit (an
	 * item added, removed or with a new version), the overview is merged
	 * again from all recorded items, for the nodes visited after this one
	 * (an overview item sits on an output node, its geometry below it). The
	 * pass that starts the visualization read the overview from the whole
	 * tree already and only records.
	 */
	private noteSDTFOverviewItems(
		treeNode: ITreeNode,
		items: {item: SDTFOverviewData; version: string}[] | undefined,
	): void {
		const before = this._sdtfOverviewItems.get(treeNode.id);
		if (
			(before?.length ?? 0) === (items?.length ?? 0) &&
			(before ?? []).every(
				(b, i) =>
					b.item === items![i].item &&
					b.version === items![i].version,
			)
		)
			return;
		if (items) this._sdtfOverviewItems.set(treeNode.id, items);
		else this._sdtfOverviewItems.delete(treeNode.id);
		if (!this._newRendererType) this.mergeSDTFOverview();
	}

	/** The overview, merged from the recorded overview items. */
	private mergeSDTFOverview(): void {
		const items: SDTFOverviewData[] = [];
		for (const list of this._sdtfOverviewItems.values())
			for (const {item} of list) items.push(item);
		this._currentSDTFOverview = mergeSDTFOverviews(items);
	}

	/** Copies of the bounding boxes of a node (general and this viewport). */
	private cloneBoxes(treeNode: ITreeNode): {general: IBox; viewport: IBox} {
		return {
			general: treeNode.boundingBox.clone(),
			viewport: (
				treeNode.boundingBoxViewport[this._renderingEngine.id] ??
				EMPTY_BOX
			).clone(),
		};
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
		childrenToRemove.forEach((cTR) =>
			this.removeConvertedChild(convertedObject, cTR),
		);
	}

	/**
	 * Removes the converted object of a child node and its branch from the
	 * converted object of the node, with the data they hold.
	 */
	private removeConvertedChild(
		convertedObject: SDObject,
		cTR: THREE.Object3D,
	): void {
		let overviewChanged = false;
		cTR.traverse((o) => {
			// The node and every node below it left this viewport.
			if (o instanceof SDObject && o.SDtype === SD_DATA_TYPE.OBJECT) {
				this._removedNodeIds.add(o.SDid);
				if (this._sdtfOverviewItems.delete(o.SDid))
					overviewChanged = true;
			}
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
		if (overviewChanged && !this._newRendererType) this.mergeSDTFOverview();
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
		// Gem shading needs a per-mesh normal cube map, center and radius,
		// which the instancing path does not set up.
		if (
			this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES &&
			geometry.material instanceof MaterialGemData
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
	 * Remove obsolete data items from the converted object. Returns whether
	 * one was removed.
	 */
	private cleanupObsoleteData(
		treeNode: ITreeNode,
		convertedObject: SDObject,
	): boolean {
		// remove all data items that do not exist anymore
		const dataMap = new Map(treeNode.data.map((d) => [d.id, d.version]));
		let kept = 0;
		const dataToRemove = convertedObject.children.filter((oc) => {
			if (!(oc instanceof SDObject)) {
				const version = dataMap.get(oc.userData.SDid);
				if (version !== undefined) {
					if (version !== oc.userData.SDversion) {
						// version is different
						return true;
					} else {
						kept++;
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
		// Data objects are added only for data items of the node.
		convertedObject.SDholdsData = kept > 0 || dataMap.size > 0;
		return dataToRemove.length > 0;
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
			// The matrix is written by applyTransformation only.
			newChild.matrixAutoUpdate = false;
			const oldChild = treeNodeChild.convertedObject[
				this._renderingEngine.id
			] as THREE.Object3D;
			// The node moved here from another parent that this pass has not
			// visited yet: its converted object leaves that parent now. A
			// visit of the old parent through its log would no longer find it
			// (the node's converted object is the new one from here on).
			if (
				oldChild instanceof SDObject &&
				oldChild.parent instanceof SDObject &&
				oldChild.parent !== convertedObject
			)
				this.removeConvertedChild(oldChild.parent, oldChild);
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

type UpdateFilter = {
	transformationOnly: boolean;
};

/** The flags `flagAncestors` sets on a branch. */
type FlagName = "SDalwaysUpdate" | "SDalwaysWalk" | "SDboundsStale";
const FLAG_NAMES: readonly FlagName[] = [
	"SDalwaysUpdate",
	"SDalwaysWalk",
	"SDboundsStale",
];

/** An empty box, never written. */
const EMPTY_BOX: IBox = new Box();

function boxEquals(a: IBox, b: IBox): boolean {
	return (
		a.min[0] === b.min[0] &&
		a.min[1] === b.min[1] &&
		a.min[2] === b.min[2] &&
		a.max[0] === b.max[0] &&
		a.max[1] === b.max[1] &&
		a.max[2] === b.max[2]
	);
}

/**
 * Whether `box` lies inside `outer` without touching any of its faces. An
 * empty box does.
 */
function strictlyInside(box: IBox, outer: IBox): boolean {
	if (box.isEmpty()) return true;
	return (
		box.min[0] > outer.min[0] &&
		box.min[1] > outer.min[1] &&
		box.min[2] > outer.min[2] &&
		box.max[0] < outer.max[0] &&
		box.max[1] < outer.max[1] &&
		box.max[2] < outer.max[2]
	);
}

const TRANSFORMATION_BIT = 1 << SCENE_NODE_CHANGE_KIND_INDEX.transformation;
const VISIBILITY_BIT = 1 << SCENE_NODE_CHANGE_KIND_INDEX.visibility;
const MOVE_BITS = TRANSFORMATION_BIT | VISIBILITY_BIT;
