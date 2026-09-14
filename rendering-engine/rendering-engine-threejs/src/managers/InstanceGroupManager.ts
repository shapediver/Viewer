import {GeometryData, ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {RENDERER_TYPE} from "@shapediver/viewer.shared.types";
import * as THREE from "three";
import {GemMaterial} from "../materials/GemMaterial";
import {RenderingEngine} from "../RenderingEngine";

interface InstanceGroup {
	instanceHash: string;
	defaultMesh: THREE.InstancedMesh;
	effectMeshes: Map<string, THREE.InstancedMesh>; // sorted effect-key combination → mesh

	// Default mesh slot tracking
	nodeToIndex: Map<string, number>; // nodeId → slot index in defaultMesh
	indexToNode: Map<number, ITreeNode>; // slot index → node
	indexToKey: Map<number, string>; // slot index → nodeId (node+geometry key)
	count: number; // active instance count in defaultMesh

	// Per-node data for reconstruction after swap
	nodeMatrices: Map<string, Float32Array>; // nodeId → flat column-major mat4
	nodeColors: Map<string, [number, number, number]>; // nodeId → RGB
	nodeVisible: Map<string, boolean>; // nodeId → effective visibility
	nodeRefs: Map<string, ITreeNode>; // nodeId → tree node
	// Offset of a baked-transform occurrence relative to the shared geometry;
	// the rendered instance matrix is worldMatrix * offset.
	nodeOffsets: Map<string, THREE.Matrix4>; // nodeId → offset

	// Effects each node participates in.
	nodeEffects: Map<string, Set<string>>; // nodeId → effect keys
	nodeEffectMeshKeys: Map<string, string>; // nodeId → effectMeshes key
	// Per-occurrence material overrides (interaction highlights). An override
	// moves the instance into its own effect batch instead of re-materialing
	// the whole group.
	materialOverrides: Map<string, THREE.Material>; // nodeId → material
	sharedMaterialId?: string;
	// One primitive-cache retain per group; released in _disposeGroup.
	primitiveCacheKey: string;
}

// Effect-key prefix for per-occurrence material overrides. The suffix is the
// geometry id, so each overridden occurrence gets its own batch.
const MATERIAL_OVERRIDE_PREFIX = "material-override:";

/**
 * Manages GPU-instanced meshes and their per-instance operations.
 *
 * Each group of primitives sharing the same geometry hash is represented by
 * one or more THREE.InstancedMesh objects:
 *  - defaultMesh: contains all instances that have no active post-processing effect
 *  - effectMeshes: lazily-created meshes partitioned by the complete set of
 *    post-processing effects an instance participates in (outline, bloom, …)
 *
 * All InstancedMeshes are direct children of `instancedRoot`, which must be
 * added to the THREE scene by the owner (RenderingEngine / SceneTreeManager).
 */
export class InstanceGroupManager {
	// #region Properties (3)

	private readonly _groups = new Map<string, InstanceGroup>();
	private _boundsDirty = false;
	private _suspendBoundsCommit = false;
	// A tree node may contain more than one primitive. Keep those registrations
	// separate: using only node.id makes every primitive after the first look like
	// a reload and drops it from its instanced batch.
	private readonly _nodeToHash = new Map<string, string>(); // node+geometry → instanceHash
	// Scene-tree updates look registrations up per tree node. Without this index
	// every visibility or transform change scans all registered keys.
	private readonly _nodeKeysByTreeNode = new Map<string, Set<string>>(); // treeNodeId → nodeIds
	// Material overrides address registrations by their GeometryData id.
	private readonly _nodeKeysByGeometry = new Map<string, Set<string>>(); // geometryId → nodeIds
	private readonly _geometryIdByNodeKey = new Map<string, string>(); // nodeId → geometryId

	/**
	 * When false, SceneTreeManager renders instantiable geometry through the
	 * regular per-mesh path instead of batching it here. Off by default so
	 * scenes that never opt in pay no instancing overhead; turn on together
	 * with GeometryEngine.gpuInstancing before loading content.
	 */
	public enabled = false;

	readonly instancedRoot: THREE.Group = new THREE.Group();

	// #endregion Properties (3)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {
		this.instancedRoot.matrixAutoUpdate = false;
		this.instancedRoot.name = "instancedRoot";
	}

	// #endregion Constructors (1)

	// #region Public Methods (7)

	/**
	 * Register a node as part of an instanced group.
	 * Creates the InstancedMesh if this is the first node for the given hash.
	 * Returns the defaultMesh so callers can reference it.
	 */
	public addNode(
		node: ITreeNode,
		geometry: GeometryData,
		bufferGeometry: THREE.BufferGeometry,
		material: THREE.Material | undefined,
	): THREE.InstancedMesh {
		const instanceHash = geometry.instanceHash!;
		let group = this._groups.get(instanceHash);

		if (!group) {
			const initialCapacity = Math.max(geometry.instanceColors.length, 4);
			const instancedMesh = new THREE.InstancedMesh(
				bufferGeometry,
				material!,
				initialCapacity,
			);
			instancedMesh.count = 0;
			instancedMesh.frustumCulled = true;
			instancedMesh.matrixAutoUpdate = false;
			instancedMesh.castShadow = geometry.castShadow;
			instancedMesh.receiveShadow = !(material instanceof GemMaterial)
				? geometry.receiveShadow
				: false;
			instancedMesh.userData.instanceHash = instanceHash;
			instancedMesh.userData.instanceNodes = [] as (
				| ITreeNode
				| undefined
			)[];

			group = {
				instanceHash,
				defaultMesh: instancedMesh,
				effectMeshes: new Map(),
				nodeToIndex: new Map(),
				indexToNode: new Map(),
				indexToKey: new Map(),
				count: 0,
				nodeMatrices: new Map(),
				nodeColors: new Map(),
				nodeVisible: new Map(),
				nodeRefs: new Map(),
				nodeOffsets: new Map(),
				nodeEffects: new Map(),
				nodeEffectMeshKeys: new Map(),
				materialOverrides: new Map(),
				sharedMaterialId: geometry.material?.id,
				primitiveCacheKey:
					geometry.primitive.id + "_" + geometry.primitive.version,
			};
			this._groups.set(instanceHash, group);
			this.instancedRoot.add(instancedMesh);
		}

		const nodeId = this._getNodeKey(node, geometry.id);

		// If already registered, refresh matrix and color (re-load scenario;
		// in attribute mode a re-load carries a new attribute color)
		if (this._nodeToHash.has(nodeId)) {
			this._refreshNodeMatrix(group, node, nodeId);
			this._setNodeColor(group, nodeId, this._computeNodeColor(geometry));
			return group.defaultMesh;
		}

		this._nodeToHash.set(nodeId, instanceHash);
		let treeNodeKeys = this._nodeKeysByTreeNode.get(node.id);
		if (!treeNodeKeys) {
			treeNodeKeys = new Set();
			this._nodeKeysByTreeNode.set(node.id, treeNodeKeys);
		}
		treeNodeKeys.add(nodeId);
		let geometryKeys = this._nodeKeysByGeometry.get(geometry.id);
		if (!geometryKeys) {
			geometryKeys = new Set();
			this._nodeKeysByGeometry.set(geometry.id, geometryKeys);
		}
		geometryKeys.add(nodeId);
		this._geometryIdByNodeKey.set(nodeId, geometry.id);
		group.nodeRefs.set(nodeId, node);
		if (geometry.instanceOffsetMatrix)
			group.nodeOffsets.set(
				nodeId,
				new THREE.Matrix4().fromArray(geometry.instanceOffsetMatrix),
			);

		const rgb = this._computeNodeColor(geometry);

		const matrix = this._composeInstanceMatrix(group, node, nodeId);
		group.nodeMatrices.set(nodeId, matrix);
		group.nodeColors.set(nodeId, rgb);
		group.nodeVisible.set(nodeId, true);

		// Grow buffers if needed
		if (group.count >= group.defaultMesh.instanceMatrix.count) {
			this._growMeshBuffers(group.defaultMesh);
		}

		const idx = group.count;
		const tempMatrix = new THREE.Matrix4();
		tempMatrix.fromArray(matrix);
		group.defaultMesh.setMatrixAt(idx, tempMatrix);

		group.defaultMesh.setColorAt(
			idx,
			new THREE.Color().setRGB(rgb[0], rgb[1], rgb[2]),
		);

		if (geometry.castShadow) group.defaultMesh.castShadow = true;
		if (
			geometry.receiveShadow &&
			!(group.defaultMesh.material instanceof GemMaterial)
		)
			group.defaultMesh.receiveShadow = true;

		group.nodeToIndex.set(nodeId, idx);
		group.indexToNode.set(idx, node);
		group.indexToKey.set(idx, nodeId);
		(group.defaultMesh.userData.instanceNodes as (ITreeNode | undefined)[])[
			idx
		] = node;
		group.count++;
		group.defaultMesh.count = group.count;

		group.defaultMesh.instanceMatrix.needsUpdate = true;
		if (group.defaultMesh.instanceColor)
			group.defaultMesh.instanceColor.needsUpdate = true;

		this._boundsDirty = true;
		return group.defaultMesh;
	}

	/**
	 * Unregister a node from its instance group.
	 * Uses swap-and-pop so the InstancedMesh never has gaps.
	 */
	public removeNode(node: ITreeNode, nodeKey?: string): boolean {
		const nodeId = nodeKey ?? this._getNodeKeys(node.id)[0];
		if (!nodeId) return false;
		const instanceHash = this._nodeToHash.get(nodeId);
		if (!instanceHash) return false;

		const group = this._groups.get(instanceHash);
		if (!group) return false;

		// Remove from effect first if applicable
		const effectKeys = [...(group.nodeEffects.get(nodeId) ?? [])];
		for (const effectKey of effectKeys)
			this._removeKeyFromEffect(group, node, nodeId, effectKey);

		this._removeFromDefault(group, nodeId);
		group.nodeMatrices.delete(nodeId);
		group.nodeColors.delete(nodeId);
		group.nodeVisible.delete(nodeId);
		group.nodeRefs.delete(nodeId);
		group.nodeOffsets.delete(nodeId);
		group.materialOverrides.delete(nodeId);
		this._nodeToHash.delete(nodeId);
		const treeNodeKeys = this._nodeKeysByTreeNode.get(node.id);
		if (treeNodeKeys) {
			treeNodeKeys.delete(nodeId);
			if (treeNodeKeys.size === 0)
				this._nodeKeysByTreeNode.delete(node.id);
		}
		const geometryId = this._geometryIdByNodeKey.get(nodeId);
		if (geometryId !== undefined) {
			this._geometryIdByNodeKey.delete(nodeId);
			const geometryKeys = this._nodeKeysByGeometry.get(geometryId);
			if (geometryKeys) {
				geometryKeys.delete(nodeId);
				if (geometryKeys.size === 0)
					this._nodeKeysByGeometry.delete(geometryId);
			}
		}

		// Dispose empty groups
		if (group.nodeMatrices.size === 0) {
			this._disposeGroup(group);
			this._groups.delete(instanceHash);
			this._boundsDirty = true;
			return true;
		}
		this._boundsDirty = true;
		return false;
	}

	/**
	 * Add an effect to all instanced primitives of a node. Each instance is held
	 * by exactly one mesh, keyed by its complete effect set, so combining
	 * effects never renders it twice. Returns the effect meshes now holding the
	 * node's instances.
	 */
	public addToEffect(
		node: ITreeNode,
		effectKey: string,
	): THREE.InstancedMesh[] {
		const meshes: THREE.InstancedMesh[] = [];
		for (const nodeId of this._getNodeKeys(node.id)) {
			const instanceHash = this._nodeToHash.get(nodeId);
			const group = instanceHash
				? this._groups.get(instanceHash)
				: undefined;
			if (!group) continue;

			const nodeEffects = group.nodeEffects.get(nodeId);
			if (!nodeEffects?.has(effectKey)) {
				const effects = nodeEffects ?? new Set<string>();
				effects.add(effectKey);
				group.nodeEffects.set(nodeId, effects);
				this._moveToEffectMesh(group, node, nodeId, effects);
			}
			const effectMesh = this._getEffectMesh(group, nodeId);
			if (effectMesh && !meshes.includes(effectMesh))
				meshes.push(effectMesh);
		}
		return meshes;
	}

	/**
	 * Remove one effect from all instanced primitives of a node and move them
	 * to the matching remaining batches.
	 */
	public removeFromEffect(node: ITreeNode, effectKey: string): void {
		for (const nodeId of this._getNodeKeys(node.id)) {
			const instanceHash = this._nodeToHash.get(nodeId);
			const group = instanceHash
				? this._groups.get(instanceHash)
				: undefined;
			if (!group) continue;
			this._removeKeyFromEffect(group, node, nodeId, effectKey);
		}
	}

	/**
	 * Look up the tree node for a given InstancedMesh + instanceId.
	 * Used by the intersection engine.
	 */
	public findNodeByMeshAndIndex(
		mesh: THREE.InstancedMesh,
		instanceId: number,
	): ITreeNode | undefined {
		const instanceNodes = mesh.userData.instanceNodes as
			| (ITreeNode | undefined)[]
			| undefined;
		return instanceNodes?.[instanceId];
	}

	/** Returns true if the node participates in any instance group. */
	public isInstanced(nodeId: string): boolean {
		return this._getNodeKeys(nodeId).length > 0;
	}

	/** Refresh the transform of an already registered instance. */
	public updateNode(node: ITreeNode): void {
		for (const nodeId of this._getNodeKeys(node.id)) {
			const instanceHash = this._nodeToHash.get(nodeId);
			const group = instanceHash
				? this._groups.get(instanceHash)
				: undefined;
			if (group) this._refreshNodeMatrix(group, node, nodeId);
		}
		this.commitBounds();
	}

	/** Set effective visibility for one registered instance. */
	public setNodeVisible(nodeId: string, visible: boolean): void {
		for (const key of this._getNodeKeys(nodeId)) {
			const instanceHash = this._nodeToHash.get(key);
			const group = instanceHash
				? this._groups.get(instanceHash)
				: undefined;
			if (!group) continue;

			const wasVisible = group.nodeVisible.get(key) !== false;
			if (wasVisible === visible) continue;
			group.nodeVisible.set(key, visible);

			const node = group.nodeRefs.get(key);
			if (!node) continue;

			if (!visible) {
				if (group.nodeToIndex.has(key))
					this._removeFromDefault(group, key);
				else if (group.nodeEffectMeshKeys.has(key))
					this._removeFromEffectMesh(group, key);
				continue;
			}

			const effects = group.nodeEffects.get(key);
			if (effects && effects.size > 0)
				this._moveToEffectMesh(group, node, key, effects);
			else this._addBackToDefault(group, key, node);
		}
		this.commitBounds();
	}

	/** Replace the shared material used by the non-effect instances in a group. */
	public updateMaterial(
		instanceHash: string | undefined,
		material: THREE.Material,
	): void {
		if (!instanceHash) return;
		const group = this._groups.get(instanceHash);
		if (!group) return;

		this._disposeMaterial(group.defaultMesh.material as THREE.Material);
		group.defaultMesh.material = material;
		this._trackMaterial(material, `gpu-instance/${instanceHash}`);
		group.defaultMesh.material.needsUpdate = true;
		group.effectMeshes.forEach((mesh) => {
			// Meshes holding material overrides keep their own material.
			if (mesh.userData.hasMaterialOverride) return;
			this._disposeMaterial(mesh.material as THREE.Material);
			mesh.material = material.clone();
			this._trackMaterial(
				mesh.material as THREE.Material,
				`gpu-instance/${instanceHash}/${[...mesh.userData.effectKeys].join("|")}`,
			);
			(mesh.material as THREE.Material).needsUpdate = true;
		});
	}

	/**
	 * Apply a per-occurrence material override (e.g. an interaction highlight)
	 * to the instances registered for the given GeometryData. The instances
	 * move into their own effect batch carrying the override material, so the
	 * rest of the group keeps its shared material.
	 */
	public setMaterialOverride(
		geometryId: string,
		material: THREE.Material,
	): void {
		const effectKey = MATERIAL_OVERRIDE_PREFIX + geometryId;
		for (const nodeId of this._nodeKeysByGeometry.get(geometryId) ?? []) {
			const instanceHash = this._nodeToHash.get(nodeId);
			const group = instanceHash
				? this._groups.get(instanceHash)
				: undefined;
			const node = group?.nodeRefs.get(nodeId);
			if (!group || !node) continue;

			group.materialOverrides.set(nodeId, material);
			const effects = group.nodeEffects.get(nodeId) ?? new Set<string>();
			if (!effects.has(effectKey)) {
				effects.add(effectKey);
				group.nodeEffects.set(nodeId, effects);
				this._moveToEffectMesh(group, node, nodeId, effects);
			} else {
				// Override replaced while active: swap the batch material.
				const effectMesh = this._getEffectMesh(group, nodeId);
				if (effectMesh && effectMesh.material !== material) {
					this._disposeMaterial(
						effectMesh.material as THREE.Material,
					);
					effectMesh.material = material;
					this._trackMaterial(
						material,
						`gpu-instance/${group.instanceHash}/${MATERIAL_OVERRIDE_PREFIX}${geometryId}`,
					);
					(effectMesh.material as THREE.Material).needsUpdate = true;
				}
			}
		}
	}

	/**
	 * Refresh the per-instance color of every registration of a GeometryData
	 * (used by attribute visualization, where each occurrence carries its own
	 * flat attribute color).
	 */
	public updateNodeColor(geometry: GeometryData): void {
		const rgb = this._computeNodeColor(geometry);
		for (const nodeId of this._nodeKeysByGeometry.get(geometry.id) ?? []) {
			const instanceHash = this._nodeToHash.get(nodeId);
			const group = instanceHash
				? this._groups.get(instanceHash)
				: undefined;
			if (group) this._setNodeColor(group, nodeId, rgb);
		}
	}

	/** Remove a per-occurrence material override set via setMaterialOverride. */
	public clearMaterialOverride(geometryId: string): void {
		const effectKey = MATERIAL_OVERRIDE_PREFIX + geometryId;
		for (const nodeId of this._nodeKeysByGeometry.get(geometryId) ?? []) {
			const instanceHash = this._nodeToHash.get(nodeId);
			const group = instanceHash
				? this._groups.get(instanceHash)
				: undefined;
			const node = group?.nodeRefs.get(nodeId);
			if (!group || !node) continue;
			if (!group.materialOverrides.has(nodeId)) continue;

			group.materialOverrides.delete(nodeId);
			// The override material itself is disposed when its batch empties.
			this._removeKeyFromEffect(group, node, nodeId, effectKey);
		}
	}

	public getDefaultMesh(
		instanceHash: string | undefined,
	): THREE.InstancedMesh | undefined {
		return instanceHash
			? this._groups.get(instanceHash)?.defaultMesh
			: undefined;
	}

	public getSharedMaterialId(
		instanceHash: string | undefined,
	): string | undefined {
		return instanceHash
			? this._groups.get(instanceHash)?.sharedMaterialId
			: undefined;
	}

	/** Return the effect meshes currently containing this tree node's instances. */
	public getEffectMeshesForNode(treeNodeId: string): THREE.InstancedMesh[] {
		const meshes: THREE.InstancedMesh[] = [];
		for (const nodeId of this._getNodeKeys(treeNodeId)) {
			const instanceHash = this._nodeToHash.get(nodeId);
			const group = instanceHash
				? this._groups.get(instanceHash)
				: undefined;
			const effectMesh = group
				? this._getEffectMesh(group, nodeId)
				: undefined;
			if (effectMesh && !meshes.includes(effectMesh))
				meshes.push(effectMesh);
		}
		return meshes;
	}

	/** Returns all active InstancedMeshes (default + effect) for a tree node. */
	public getMeshesForNode(treeNodeId: string): THREE.InstancedMesh[] {
		const result: THREE.InstancedMesh[] = [];
		for (const nodeId of this._getNodeKeys(treeNodeId)) {
			const instanceHash = this._nodeToHash.get(nodeId);
			const group = instanceHash
				? this._groups.get(instanceHash)
				: undefined;
			if (!group) continue;
			if (!result.includes(group.defaultMesh))
				result.push(group.defaultMesh);
			group.effectMeshes.forEach((m) => {
				if (!result.includes(m)) result.push(m);
			});
		}
		return result;
	}

	/** Release group-owned scene objects and references when the renderer closes. */
	public clear(): void {
		this._groups.forEach((group) => this._disposeGroup(group));
		this._groups.clear();
		this._nodeToHash.clear();
		this._nodeKeysByTreeNode.clear();
		this._nodeKeysByGeometry.clear();
		this._geometryIdByNodeKey.clear();
		this.instancedRoot.clear();
		this._boundsDirty = false;
	}

	/**
	 * Recompute InstancedMesh bounding spheres after instance matrices change.
	 * Call once at the end of a scene conversion, not per instance.
	 */
	public beginBoundsUpdate(): void {
		this._suspendBoundsCommit = true;
	}

	public endBoundsUpdate(): void {
		this._suspendBoundsCommit = false;
		this.commitBounds();
	}

	public commitBounds(): void {
		if (this._suspendBoundsCommit || !this._boundsDirty) return;
		this._boundsDirty = false;
		this._groups.forEach((group) => {
			this._updateMeshBounds(group.defaultMesh);
			group.effectMeshes.forEach((mesh) => this._updateMeshBounds(mesh));
		});
	}

	/** Snapshot of the current batching state, for debugging and support. */
	public get stats(): {
		groupCount: number;
		instanceCount: number;
		effectMeshCount: number;
		drawCallCount: number;
	} {
		let instanceCount = 0;
		let effectMeshCount = 0;
		let drawCallCount = 0;
		this._groups.forEach((group) => {
			instanceCount += group.nodeMatrices.size;
			effectMeshCount += group.effectMeshes.size;
			if (group.defaultMesh.count > 0) drawCallCount++;
			group.effectMeshes.forEach((mesh) => {
				if (mesh.count > 0) drawCallCount++;
			});
		});
		return {
			groupCount: this._groups.size,
			instanceCount,
			effectMeshCount,
			drawCallCount,
		};
	}

	// #endregion Public Methods (7)

	// #region Private Methods (4)

	private _getNodeKey(node: ITreeNode, geometryId: string): string {
		return `${node.id}:${geometryId}`;
	}

	private _getNodeKeys(treeNodeId: string): string[] {
		const keys = this._nodeKeysByTreeNode.get(treeNodeId);
		return keys ? [...keys] : [];
	}

	/**
	 * The instance color: the source color of the occurrence, or — in
	 * attribute-visualization mode — the current attribute color (the batch
	 * material is white, so the instance color carries the visualization).
	 */
	private _computeNodeColor(
		geometry: GeometryData,
	): [number, number, number] {
		const colorRaw =
			this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES
				? (geometry.attributeMaterial?.color ?? [255, 255, 255, 255])
				: (geometry.instanceColors[0] ?? [255, 255, 255, 255]);
		const color = this._renderingEngine.createThreeJsColor(colorRaw);
		return [color.r, color.g, color.b];
	}

	private _setNodeColor(
		group: InstanceGroup,
		nodeId: string,
		rgb: [number, number, number],
	): void {
		const previous = group.nodeColors.get(nodeId);
		if (
			previous &&
			previous[0] === rgb[0] &&
			previous[1] === rgb[1] &&
			previous[2] === rgb[2]
		)
			return;
		group.nodeColors.set(nodeId, rgb);

		const color = new THREE.Color().setRGB(rgb[0], rgb[1], rgb[2]);
		const idx = group.nodeToIndex.get(nodeId);
		if (idx !== undefined && group.defaultMesh.instanceColor) {
			group.defaultMesh.setColorAt(idx, color);
			group.defaultMesh.instanceColor.needsUpdate = true;
		}

		const effectMesh = this._getEffectMesh(group, nodeId);
		if (
			effectMesh &&
			effectMesh.instanceColor &&
			!effectMesh.userData.hasMaterialOverride
		) {
			const keys = effectMesh.userData.instanceKeys as (
				| string
				| undefined
			)[];
			const effectIdx = keys.indexOf(nodeId);
			if (effectIdx !== -1) {
				effectMesh.setColorAt(effectIdx, color);
				effectMesh.instanceColor.needsUpdate = true;
			}
		}
	}

	private _removeFromDefault(group: InstanceGroup, nodeId: string): void {
		const index = group.nodeToIndex.get(nodeId);
		if (index === undefined) return;

		const lastIdx = group.count - 1;
		if (index !== lastIdx) {
			const lastNode = group.indexToNode.get(lastIdx)!;
			const lastKey = group.indexToKey.get(lastIdx)!;
			const lastMatrix = this._getVisibleMatrix(group, lastKey);
			const lastColor = group.nodeColors.get(lastKey)!;

			const tempMatrix = new THREE.Matrix4();
			tempMatrix.fromArray(lastMatrix);
			group.defaultMesh.setMatrixAt(index, tempMatrix);

			if (group.defaultMesh.instanceColor)
				group.defaultMesh.setColorAt(
					index,
					new THREE.Color().setRGB(
						lastColor[0],
						lastColor[1],
						lastColor[2],
					),
				);

			group.nodeToIndex.set(lastKey, index);
			group.indexToNode.set(index, lastNode);
			group.indexToKey.set(index, lastKey);
			(
				group.defaultMesh.userData.instanceNodes as (
					| ITreeNode
					| undefined
				)[]
			)[index] = lastNode;
		}

		group.count--;
		group.defaultMesh.count = group.count;
		group.nodeToIndex.delete(nodeId);
		group.indexToNode.delete(lastIdx);
		group.indexToKey.delete(lastIdx);
		(group.defaultMesh.userData.instanceNodes as (ITreeNode | undefined)[])[
			lastIdx
		] = undefined;

		group.defaultMesh.instanceMatrix.needsUpdate = true;
		if (group.defaultMesh.instanceColor)
			group.defaultMesh.instanceColor.needsUpdate = true;
		this._boundsDirty = true;
	}

	private _addBackToDefault(
		group: InstanceGroup,
		nodeId: string,
		node: ITreeNode,
	): void {
		const matrix = this._getVisibleMatrix(group, nodeId);
		const color = group.nodeColors.get(nodeId)!;
		const newIdx = group.count;

		if (newIdx >= group.defaultMesh.instanceMatrix.count)
			this._growMeshBuffers(group.defaultMesh);

		const tempMatrix = new THREE.Matrix4();
		tempMatrix.fromArray(matrix);
		group.defaultMesh.setMatrixAt(newIdx, tempMatrix);

		if (group.defaultMesh.instanceColor)
			group.defaultMesh.setColorAt(
				newIdx,
				new THREE.Color().setRGB(color[0], color[1], color[2]),
			);

		group.nodeToIndex.set(nodeId, newIdx);
		group.indexToNode.set(newIdx, node);
		group.indexToKey.set(newIdx, nodeId);
		(group.defaultMesh.userData.instanceNodes as (ITreeNode | undefined)[])[
			newIdx
		] = node;
		group.count++;
		group.defaultMesh.count = group.count;

		group.defaultMesh.instanceMatrix.needsUpdate = true;
		if (group.defaultMesh.instanceColor)
			group.defaultMesh.instanceColor.needsUpdate = true;
		this._boundsDirty = true;
	}

	/** worldMatrix, composed with the baked-transform offset when present. */
	private _composeInstanceMatrix(
		group: InstanceGroup,
		node: ITreeNode,
		nodeId: string,
	): Float32Array {
		const offset = group.nodeOffsets.get(nodeId);
		if (!offset) return new Float32Array(node.worldMatrix);
		const composed = new THREE.Matrix4()
			.fromArray(node.worldMatrix)
			.multiply(offset);
		return new Float32Array(composed.elements);
	}

	private _refreshNodeMatrix(
		group: InstanceGroup,
		node: ITreeNode,
		nodeId: string,
	): void {
		const matrix = this._composeInstanceMatrix(group, node, nodeId);
		group.nodeMatrices.set(nodeId, matrix);

		const idx = group.nodeToIndex.get(nodeId);
		if (idx !== undefined) {
			const tempMatrix = new THREE.Matrix4();
			tempMatrix.fromArray(this._getVisibleMatrix(group, nodeId));
			group.defaultMesh.setMatrixAt(idx, tempMatrix);
			group.defaultMesh.instanceMatrix.needsUpdate = true;
		}

		const effectMesh = this._getEffectMesh(group, nodeId);
		if (effectMesh) {
			const tempMatrix = new THREE.Matrix4();
			tempMatrix.fromArray(this._getVisibleMatrix(group, nodeId));
			this._setMeshMatrix(effectMesh, nodeId, tempMatrix);
		}
		this._boundsDirty = true;
	}

	private _removeKeyFromEffect(
		group: InstanceGroup,
		node: ITreeNode,
		nodeId: string,
		effectKey: string,
	): void {
		const nodeEffects = group.nodeEffects.get(nodeId);
		if (!nodeEffects?.has(effectKey)) return;

		nodeEffects.delete(effectKey);
		if (nodeEffects.size === 0) {
			group.nodeEffects.delete(nodeId);
			this._removeFromEffectMesh(group, nodeId);
			this._addBackToDefault(group, nodeId, node);
		} else {
			this._moveToEffectMesh(group, node, nodeId, nodeEffects);
		}
	}

	private _moveToEffectMesh(
		group: InstanceGroup,
		node: ITreeNode,
		nodeId: string,
		effects: Set<string>,
	): void {
		if (group.nodeEffectMeshKeys.has(nodeId))
			this._removeFromEffectMesh(group, nodeId);
		else this._removeFromDefault(group, nodeId);

		const effectMesh = this._getOrCreateEffectMesh(
			group,
			effects,
			group.materialOverrides.get(nodeId),
		);
		const effectIdx = effectMesh.count;
		if (effectIdx >= effectMesh.instanceMatrix.count)
			this._growMeshBuffers(effectMesh);

		const matrix = new THREE.Matrix4().fromArray(
			this._getVisibleMatrix(group, nodeId),
		);
		effectMesh.setMatrixAt(effectIdx, matrix);
		const color = group.nodeColors.get(nodeId)!;
		// Mirror the default mesh: setColorAt creates the instanceColor
		// attribute on first use, so a fresh effect mesh keeps its colors.
		// Override batches skip this — instance colors would tint the
		// override (highlight) material.
		if (
			group.defaultMesh.instanceColor &&
			!effectMesh.userData.hasMaterialOverride
		)
			effectMesh.setColorAt(
				effectIdx,
				new THREE.Color().setRGB(color[0], color[1], color[2]),
			);

		effectMesh.count++;
		(effectMesh.userData.instanceNodes as (ITreeNode | undefined)[])[
			effectIdx
		] = node;
		(effectMesh.userData.instanceKeys as (string | undefined)[])[
			effectIdx
		] = nodeId;
		effectMesh.instanceMatrix.needsUpdate = true;
		if (effectMesh.instanceColor)
			effectMesh.instanceColor.needsUpdate = true;
		group.nodeEffectMeshKeys.set(nodeId, this._getEffectMeshKey(effects));
		this._boundsDirty = true;
	}

	private _removeFromEffectMesh(group: InstanceGroup, nodeId: string): void {
		const meshKey = group.nodeEffectMeshKeys.get(nodeId);
		if (!meshKey) return;
		const effectMesh = group.effectMeshes.get(meshKey);
		if (!effectMesh) return;

		const instanceNodes = effectMesh.userData.instanceNodes as (
			| ITreeNode
			| undefined
		)[];
		const instanceKeys = effectMesh.userData.instanceKeys as (
			| string
			| undefined
		)[];
		const effectIdx = instanceKeys.indexOf(nodeId);
		if (effectIdx === -1) return;
		const lastEffectIdx = effectMesh.count - 1;
		if (effectIdx !== lastEffectIdx) {
			const lastNode = instanceNodes[lastEffectIdx]!;
			const lastKey = instanceKeys[lastEffectIdx]!;
			const matrix = new THREE.Matrix4().fromArray(
				this._getVisibleMatrix(group, lastKey),
			);
			effectMesh.setMatrixAt(effectIdx, matrix);
			const color = group.nodeColors.get(lastKey)!;
			if (effectMesh.instanceColor)
				effectMesh.setColorAt(
					effectIdx,
					new THREE.Color().setRGB(color[0], color[1], color[2]),
				);
			instanceNodes[effectIdx] = lastNode;
			instanceKeys[effectIdx] = lastKey;
		}

		effectMesh.count--;
		instanceNodes[lastEffectIdx] = undefined;
		instanceKeys[lastEffectIdx] = undefined;
		effectMesh.instanceMatrix.needsUpdate = true;
		if (effectMesh.instanceColor)
			effectMesh.instanceColor.needsUpdate = true;
		group.nodeEffectMeshKeys.delete(nodeId);

		if (effectMesh.count === 0) {
			this.instancedRoot.remove(effectMesh);
			effectMesh.dispose();
			this._disposeMaterial(effectMesh.material as THREE.Material);
			group.effectMeshes.delete(meshKey);
		}
		this._boundsDirty = true;
	}

	private _getOrCreateEffectMesh(
		group: InstanceGroup,
		effects: Set<string>,
		overrideMaterial?: THREE.Material,
	): THREE.InstancedMesh {
		const meshKey = this._getEffectMeshKey(effects);
		let effectMesh = group.effectMeshes.get(meshKey);
		if (effectMesh) return effectMesh;

		effectMesh = new THREE.InstancedMesh(
			group.defaultMesh.geometry,
			overrideMaterial ??
				(group.defaultMesh.material as THREE.Material).clone(),
			8,
		);
		effectMesh.userData.hasMaterialOverride =
			overrideMaterial !== undefined;
		effectMesh.count = 0;
		effectMesh.frustumCulled = true;
		effectMesh.matrixAutoUpdate = false;
		effectMesh.castShadow = group.defaultMesh.castShadow;
		effectMesh.receiveShadow = group.defaultMesh.receiveShadow;
		effectMesh.userData.instanceHash = group.instanceHash;
		effectMesh.userData.effectKeys = [...effects].sort();
		effectMesh.userData.instanceNodes = [] as (ITreeNode | undefined)[];
		effectMesh.userData.instanceKeys = [] as (string | undefined)[];
		group.effectMeshes.set(meshKey, effectMesh);
		this.instancedRoot.add(effectMesh);
		this._renderingEngine.materialLoader.trackMaterial(
			`gpu-instance/${group.instanceHash}/${meshKey}`,
			effectMesh.material as THREE.Material,
		);
		return effectMesh;
	}

	private _getEffectMesh(
		group: InstanceGroup,
		nodeId: string,
	): THREE.InstancedMesh | undefined {
		const meshKey = group.nodeEffectMeshKeys.get(nodeId);
		return meshKey ? group.effectMeshes.get(meshKey) : undefined;
	}

	private _getEffectMeshKey(effects: Set<string>): string {
		return [...effects].sort().join("|");
	}

	private _setMeshMatrix(
		mesh: THREE.InstancedMesh,
		nodeId: string,
		matrix: THREE.Matrix4,
	): void {
		const keys = mesh.userData.instanceKeys as (string | undefined)[];
		const index = keys.indexOf(nodeId);
		if (index === -1) return;
		mesh.setMatrixAt(index, matrix);
		mesh.instanceMatrix.needsUpdate = true;
	}

	private _growMeshBuffers(mesh: THREE.InstancedMesh): void {
		const currentCapacity = mesh.instanceMatrix.count;
		const newCapacity = Math.max(currentCapacity * 2, 8);

		const oldMatrix = mesh.instanceMatrix;
		const newMatrixArray = new Float32Array(newCapacity * 16);
		newMatrixArray.set(oldMatrix.array as Float32Array);
		mesh.instanceMatrix = new THREE.InstancedBufferAttribute(
			newMatrixArray,
			16,
		);
		oldMatrix.dispose();

		if (mesh.instanceColor) {
			const oldColor = mesh.instanceColor;
			const newColorArray = new Float32Array(newCapacity * 3);
			newColorArray.set(oldColor.array as Float32Array);
			mesh.instanceColor = new THREE.InstancedBufferAttribute(
				newColorArray,
				3,
			);
			oldColor.dispose();
		}

		// Grow the instanceNodes array too
		if (!mesh.userData.instanceNodes) mesh.userData.instanceNodes = [];
	}

	private _getVisibleMatrix(
		group: InstanceGroup,
		nodeId: string,
	): Float32Array {
		if (group.nodeVisible.get(nodeId) !== false)
			return group.nodeMatrices.get(nodeId)!;

		const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
		return new Float32Array(hidden.elements);
	}

	private _updateMeshBounds(mesh: THREE.InstancedMesh): void {
		if (mesh.count === 0) return;
		if (!mesh.geometry.boundingSphere)
			mesh.geometry.computeBoundingSphere();
		mesh.computeBoundingSphere();
		mesh.computeBoundingBox();
	}

	private _disposeGroup(group: InstanceGroup): void {
		this.instancedRoot.remove(group.defaultMesh);
		group.defaultMesh.dispose();
		this._disposeMaterial(group.defaultMesh.material as THREE.Material);
		group.effectMeshes.forEach((mesh) => {
			this.instancedRoot.remove(mesh);
			mesh.dispose();
			this._disposeMaterial(mesh.material as THREE.Material);
		});
		this._renderingEngine.geometryLoader.removeFromPrimitiveCache(
			group.primitiveCacheKey,
		);
	}

	private _trackMaterial(material: THREE.Material, cacheKey: string): void {
		this._renderingEngine.materialLoader.trackMaterial(cacheKey, material);
	}

	private _disposeMaterial(material: THREE.Material): void {
		const cacheKey = material.userData.cacheKey as string | undefined;
		if (cacheKey)
			this._renderingEngine.materialLoader.removeFromMaterialCache(
				cacheKey,
			);
		else material.dispose();
	}

	// #endregion Private Methods (4)
}
