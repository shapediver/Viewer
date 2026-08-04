import {GeometryData, ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {RENDERER_TYPE} from "@shapediver/viewer.shared.types";
import * as THREE from "three";
import {RenderingEngine} from "../RenderingEngine";

interface InstanceGroup {
	instanceHash: string;
	defaultMesh: THREE.InstancedMesh;
	effectMeshes: Map<string, THREE.InstancedMesh>; // sorted effect-key combination → mesh

	// Default mesh slot tracking
	nodeToIndex: Map<string, number>; // nodeId → slot index in defaultMesh
	indexToNode: Map<number, ITreeNode>; // slot index → node
	count: number; // active instance count in defaultMesh

	// Per-node data for reconstruction after swap
	nodeMatrices: Map<string, Float32Array>; // nodeId → flat column-major mat4
	nodeColors: Map<string, [number, number, number]>; // nodeId → RGB
	nodeColorIndices: Map<string, number>; // nodeId → source color index
	nodeVisible: Map<string, boolean>; // nodeId → effective visibility
	nextColorIndex: number;

	// Effects each node participates in.
	nodeEffects: Map<string, Set<string>>; // nodeId → effect keys
	nodeEffectMeshKeys: Map<string, string>; // nodeId → effectMeshes key
}

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
	private readonly _nodeToHash = new Map<string, string>(); // nodeId → instanceHash

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
		material: THREE.Material,
	): THREE.InstancedMesh {
		const instanceHash = geometry.instanceHash!;
		let group = this._groups.get(instanceHash);

		if (!group) {
			const initialCapacity = Math.max(geometry.instanceColors.length, 4);
			const instancedMesh = new THREE.InstancedMesh(
				bufferGeometry,
				material,
				initialCapacity,
			);
			instancedMesh.count = 0;
			instancedMesh.frustumCulled = false;
			instancedMesh.matrixAutoUpdate = false;
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
				count: 0,
				nodeMatrices: new Map(),
				nodeColors: new Map(),
				nodeColorIndices: new Map(),
				nodeVisible: new Map(),
				nextColorIndex: 0,
				nodeEffects: new Map(),
				nodeEffectMeshKeys: new Map(),
			};
			this._groups.set(instanceHash, group);
			this.instancedRoot.add(instancedMesh);
		}

		const nodeId = node.id;

		// If already registered, just refresh matrix (re-load scenario)
		if (this._nodeToHash.has(nodeId)) {
			this._refreshNodeMatrix(group, node);
			return group.defaultMesh;
		}

		this._nodeToHash.set(nodeId, instanceHash);

		// Keep the source color index independent from active mesh slots. Slots
		// change when instances move to effects or are removed.
		let colorIndex = group.nodeColorIndices.get(nodeId);
		if (colorIndex === undefined) {
			colorIndex = group.nextColorIndex++;
			group.nodeColorIndices.set(nodeId, colorIndex);
		}
		const colorRaw = geometry.instanceColors[colorIndex] ?? [1, 1, 1, 1];
		const rgb: [number, number, number] = [
			Array.isArray(colorRaw) ? (colorRaw[0] as number) : 1,
			Array.isArray(colorRaw) ? (colorRaw[1] as number) : 1,
			Array.isArray(colorRaw) ? (colorRaw[2] as number) : 1,
		];

		const matrix = new Float32Array(node.worldMatrix);
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

		if (this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES) {
			group.defaultMesh.setColorAt(
				idx,
				new THREE.Color().setRGB(rgb[0], rgb[1], rgb[2]),
			);
		}

		group.nodeToIndex.set(nodeId, idx);
		group.indexToNode.set(idx, node);
		(group.defaultMesh.userData.instanceNodes as (ITreeNode | undefined)[])[
			idx
		] = node;
		group.count++;
		group.defaultMesh.count = group.count;

		group.defaultMesh.instanceMatrix.needsUpdate = true;
		if (group.defaultMesh.instanceColor)
			group.defaultMesh.instanceColor.needsUpdate = true;

		return group.defaultMesh;
	}

	/**
	 * Unregister a node from its instance group.
	 * Uses swap-and-pop so the InstancedMesh never has gaps.
	 */
	public removeNode(node: ITreeNode): boolean {
		const nodeId = node.id;
		const instanceHash = this._nodeToHash.get(nodeId);
		if (!instanceHash) return false;

		const group = this._groups.get(instanceHash);
		if (!group) return false;

		// Remove from effect first if applicable
		const effectKeys = [...(group.nodeEffects.get(nodeId) ?? [])];
		for (const effectKey of effectKeys)
			this.removeFromEffect(node, effectKey);

		this._removeFromDefault(group, nodeId);
		group.nodeMatrices.delete(nodeId);
		group.nodeColors.delete(nodeId);
		group.nodeColorIndices.delete(nodeId);
		group.nodeVisible.delete(nodeId);
		this._nodeToHash.delete(nodeId);

		// Dispose empty groups
		if (group.nodeMatrices.size === 0) {
			this._disposeGroup(group);
			this._groups.delete(instanceHash);
			return true;
		}
		return false;
	}

	/**
	 * Add an effect to a node. Each node is held by exactly one mesh, keyed by
	 * its complete effect set, so combining effects never renders it twice.
	 */
	public addToEffect(
		node: ITreeNode,
		effectKey: string,
	): THREE.InstancedMesh | null {
		const nodeId = node.id;
		const instanceHash = this._nodeToHash.get(nodeId);
		if (!instanceHash) return null;

		const group = this._groups.get(instanceHash);
		if (!group) return null;

		const nodeEffects = group.nodeEffects.get(nodeId);
		if (nodeEffects?.has(effectKey))
			return this._getEffectMesh(group, nodeId) ?? null;

		const effects = nodeEffects ?? new Set<string>();
		effects.add(effectKey);
		group.nodeEffects.set(nodeId, effects);
		this._moveToEffectMesh(group, node, nodeId, effects);
		return this._getEffectMesh(group, nodeId) ?? null;
	}

	/**
	 * Remove one effect from a node and move it to the matching remaining batch.
	 */
	public removeFromEffect(node: ITreeNode, effectKey: string): void {
		const nodeId = node.id;
		const instanceHash = this._nodeToHash.get(nodeId);
		if (!instanceHash) return;

		const group = this._groups.get(instanceHash);
		if (!group) return;

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
		return this._nodeToHash.has(nodeId);
	}

	/** Refresh the transform of an already registered instance. */
	public updateNode(node: ITreeNode): void {
		const instanceHash = this._nodeToHash.get(node.id);
		if (!instanceHash) return;

		const group = this._groups.get(instanceHash);
		if (!group) return;

		this._refreshNodeMatrix(group, node);
	}

	/** Set effective visibility for one registered instance. */
	public setNodeVisible(nodeId: string, visible: boolean): void {
		const instanceHash = this._nodeToHash.get(nodeId);
		if (!instanceHash) return;
		const group = this._groups.get(instanceHash);
		if (!group) return;

		group.nodeVisible.set(nodeId, visible);
		const matrix = this._getVisibleMatrix(group, nodeId);
		const matrix4 = new THREE.Matrix4().fromArray(matrix);
		const defaultIndex = group.nodeToIndex.get(nodeId);
		if (defaultIndex !== undefined)
			group.defaultMesh.setMatrixAt(defaultIndex, matrix4);

		const effectMesh = this._getEffectMesh(group, nodeId);
		if (effectMesh) this._setMeshMatrix(effectMesh, nodeId, matrix4);

		group.defaultMesh.instanceMatrix.needsUpdate = true;
	}

	/** Replace the shared material used by the non-effect instances in a group. */
	public updateMaterial(
		instanceHash: string | undefined,
		material: THREE.Material,
	): void {
		if (!instanceHash) return;
		const group = this._groups.get(instanceHash);
		if (!group) return;

		(group.defaultMesh.material as THREE.Material).dispose();
		group.defaultMesh.material = material;
		group.defaultMesh.material.needsUpdate = true;
		group.effectMeshes.forEach((mesh) => {
			(mesh.material as THREE.Material).dispose();
			mesh.material = material.clone();
			(mesh.material as THREE.Material).needsUpdate = true;
		});
	}

	public getDefaultMesh(
		instanceHash: string | undefined,
	): THREE.InstancedMesh | undefined {
		return instanceHash
			? this._groups.get(instanceHash)?.defaultMesh
			: undefined;
	}

	/** Return the current, single effect mesh containing this node. */
	public getEffectMeshForNode(
		nodeId: string,
	): THREE.InstancedMesh | undefined {
		const instanceHash = this._nodeToHash.get(nodeId);
		const group = instanceHash ? this._groups.get(instanceHash) : undefined;
		return group ? this._getEffectMesh(group, nodeId) : undefined;
	}

	/** Returns all active InstancedMeshes (default + effect) for a node. */
	public getMeshesForNode(nodeId: string): THREE.InstancedMesh[] {
		const instanceHash = this._nodeToHash.get(nodeId);
		if (!instanceHash) return [];
		const group = this._groups.get(instanceHash);
		if (!group) return [];
		const result: THREE.InstancedMesh[] = [group.defaultMesh];
		group.effectMeshes.forEach((m) => result.push(m));
		return result;
	}

	/** Release group-owned scene objects and references when the renderer closes. */
	public clear(): void {
		this._groups.forEach((group) => this._disposeGroup(group));
		this._groups.clear();
		this._nodeToHash.clear();
		this.instancedRoot.clear();
	}

	// #endregion Public Methods (7)

	// #region Private Methods (4)

	private _removeFromDefault(group: InstanceGroup, nodeId: string): void {
		const index = group.nodeToIndex.get(nodeId);
		if (index === undefined) return;

		const lastIdx = group.count - 1;
		if (index !== lastIdx) {
			const lastNode = group.indexToNode.get(lastIdx)!;
			const lastMatrix = this._getVisibleMatrix(group, lastNode.id);
			const lastColor = group.nodeColors.get(lastNode.id)!;

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

			group.nodeToIndex.set(lastNode.id, index);
			group.indexToNode.set(index, lastNode);
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
		(group.defaultMesh.userData.instanceNodes as (ITreeNode | undefined)[])[
			lastIdx
		] = undefined;

		group.defaultMesh.instanceMatrix.needsUpdate = true;
		if (group.defaultMesh.instanceColor)
			group.defaultMesh.instanceColor.needsUpdate = true;
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
		(group.defaultMesh.userData.instanceNodes as (ITreeNode | undefined)[])[
			newIdx
		] = node;
		group.count++;
		group.defaultMesh.count = group.count;

		group.defaultMesh.instanceMatrix.needsUpdate = true;
		if (group.defaultMesh.instanceColor)
			group.defaultMesh.instanceColor.needsUpdate = true;
	}

	private _refreshNodeMatrix(group: InstanceGroup, node: ITreeNode): void {
		const nodeId = node.id;
		const matrix = new Float32Array(node.worldMatrix);
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

		const effectMesh = this._getOrCreateEffectMesh(group, effects);
		const effectIdx = effectMesh.count;
		if (effectIdx >= effectMesh.instanceMatrix.count)
			this._growMeshBuffers(effectMesh);

		const matrix = new THREE.Matrix4().fromArray(
			this._getVisibleMatrix(group, nodeId),
		);
		effectMesh.setMatrixAt(effectIdx, matrix);
		const color = group.nodeColors.get(nodeId)!;
		if (effectMesh.instanceColor)
			effectMesh.setColorAt(
				effectIdx,
				new THREE.Color().setRGB(color[0], color[1], color[2]),
			);

		effectMesh.count++;
		(effectMesh.userData.instanceNodes as (ITreeNode | undefined)[])[
			effectIdx
		] = node;
		effectMesh.instanceMatrix.needsUpdate = true;
		if (effectMesh.instanceColor)
			effectMesh.instanceColor.needsUpdate = true;
		group.nodeEffectMeshKeys.set(nodeId, this._getEffectMeshKey(effects));
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
		const effectIdx = instanceNodes.findIndex(
			(node) => node?.id === nodeId,
		);
		if (effectIdx === -1) return;
		const lastEffectIdx = effectMesh.count - 1;
		if (effectIdx !== lastEffectIdx) {
			const lastNode = instanceNodes[lastEffectIdx]!;
			const matrix = new THREE.Matrix4().fromArray(
				this._getVisibleMatrix(group, lastNode.id),
			);
			effectMesh.setMatrixAt(effectIdx, matrix);
			const color = group.nodeColors.get(lastNode.id)!;
			if (effectMesh.instanceColor)
				effectMesh.setColorAt(
					effectIdx,
					new THREE.Color().setRGB(color[0], color[1], color[2]),
				);
			instanceNodes[effectIdx] = lastNode;
		}

		effectMesh.count--;
		instanceNodes[lastEffectIdx] = undefined;
		effectMesh.instanceMatrix.needsUpdate = true;
		if (effectMesh.instanceColor)
			effectMesh.instanceColor.needsUpdate = true;
		group.nodeEffectMeshKeys.delete(nodeId);

		if (effectMesh.count === 0) {
			this.instancedRoot.remove(effectMesh);
			(effectMesh.material as THREE.Material).dispose();
			group.effectMeshes.delete(meshKey);
		}
	}

	private _getOrCreateEffectMesh(
		group: InstanceGroup,
		effects: Set<string>,
	): THREE.InstancedMesh {
		const meshKey = this._getEffectMeshKey(effects);
		let effectMesh = group.effectMeshes.get(meshKey);
		if (effectMesh) return effectMesh;

		effectMesh = new THREE.InstancedMesh(
			group.defaultMesh.geometry,
			(group.defaultMesh.material as THREE.Material).clone(),
			8,
		);
		effectMesh.count = 0;
		effectMesh.frustumCulled = false;
		effectMesh.matrixAutoUpdate = false;
		effectMesh.userData.instanceHash = group.instanceHash;
		effectMesh.userData.effectKeys = [...effects].sort();
		effectMesh.userData.instanceNodes = [] as (ITreeNode | undefined)[];
		group.effectMeshes.set(meshKey, effectMesh);
		this.instancedRoot.add(effectMesh);
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
		const nodes = mesh.userData.instanceNodes as (ITreeNode | undefined)[];
		const index = nodes.findIndex((node) => node?.id === nodeId);
		if (index === -1) return;
		mesh.setMatrixAt(index, matrix);
		mesh.instanceMatrix.needsUpdate = true;
	}

	private _growMeshBuffers(mesh: THREE.InstancedMesh): void {
		const currentCapacity = mesh.instanceMatrix.count;
		const newCapacity = Math.max(currentCapacity * 2, 8);

		const newMatrixArray = new Float32Array(newCapacity * 16);
		newMatrixArray.set(mesh.instanceMatrix.array as Float32Array);
		mesh.instanceMatrix = new THREE.InstancedBufferAttribute(
			newMatrixArray,
			16,
		);

		if (mesh.instanceColor) {
			const newColorArray = new Float32Array(newCapacity * 3);
			newColorArray.set(mesh.instanceColor.array as Float32Array);
			mesh.instanceColor = new THREE.InstancedBufferAttribute(
				newColorArray,
				3,
			);
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

	private _disposeGroup(group: InstanceGroup): void {
		this.instancedRoot.remove(group.defaultMesh);
		(group.defaultMesh.material as THREE.Material).dispose();
		group.effectMeshes.forEach((mesh) => {
			this.instancedRoot.remove(mesh);
			(mesh.material as THREE.Material).dispose();
		});
	}

	// #endregion Private Methods (4)
}
