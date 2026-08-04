import {GeometryData, ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {RENDERER_TYPE} from "@shapediver/viewer.shared.types";
import * as THREE from "three";
import {RenderingEngine} from "../RenderingEngine";

interface InstanceGroup {
	instanceHash: string;
	defaultMesh: THREE.InstancedMesh;
	effectMeshes: Map<string, THREE.InstancedMesh>; // effectKey → mesh

	// Default mesh slot tracking
	nodeToIndex: Map<string, number>; // nodeId → slot index in defaultMesh
	indexToNode: Map<number, ITreeNode>; // slot index → node
	count: number; // active instance count in defaultMesh

	// Per-node data for reconstruction after swap
	nodeMatrices: Map<string, Float32Array>; // nodeId → flat column-major mat4
	nodeColors: Map<string, [number, number, number]>; // nodeId → RGB
	nodeVisible: Map<string, boolean>; // nodeId → effective visibility

	// Which effect each node is in (if any)
	nodeEffect: Map<string, string>; // nodeId → effectKey
}

/**
 * Manages GPU-instanced meshes and their per-instance operations.
 *
 * Each group of primitives sharing the same geometry hash is represented by
 * one or more THREE.InstancedMesh objects:
 *  - defaultMesh: contains all instances that have no active post-processing effect
 *  - effectMeshes: lazily-created meshes that contain instances which participate
 *    in a specific post-processing effect (outline, bloom, …)
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
				nodeVisible: new Map(),
				nodeEffect: new Map(),
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

		// Resolve color: first entry in instanceColors that corresponds to this node,
		// or white as fallback.
		const colorRaw = geometry.instanceColors[group.count] ?? [1, 1, 1, 1];
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
		(
			group.defaultMesh.userData.instanceNodes as (ITreeNode | undefined)[]
		)[idx] = node;
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
	public removeNode(node: ITreeNode): void {
		const nodeId = node.id;
		const instanceHash = this._nodeToHash.get(nodeId);
		if (!instanceHash) return;

		const group = this._groups.get(instanceHash);
		if (!group) return;

		// Remove from effect first if applicable
		const effectKey = group.nodeEffect.get(nodeId);
		if (effectKey !== undefined) this.removeFromEffect(node, effectKey);

		this._removeFromDefault(group, nodeId);
		group.nodeMatrices.delete(nodeId);
		group.nodeColors.delete(nodeId);
		group.nodeVisible.delete(nodeId);
		this._nodeToHash.delete(nodeId);

		// Dispose empty groups
		if (group.count === 0) {
			this.instancedRoot.remove(group.defaultMesh);
			group.effectMeshes.forEach((m) => this.instancedRoot.remove(m));
			this._groups.delete(instanceHash);
		}
	}

	/**
	 * Move a node's instance from the default mesh to a dedicated effect mesh.
	 * Creates the effect mesh lazily. Returns it so it can be added to the
	 * post-processing effect's selection set.
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

		// Already in an effect mesh
		const existingEffect = group.nodeEffect.get(nodeId);
		if (existingEffect !== undefined)
			return group.effectMeshes.get(existingEffect) ?? null;

		// Lazily create effect mesh (shares geometry, but different material instance)
		let effectMesh = group.effectMeshes.get(effectKey);
		if (!effectMesh) {
			// Clone the material so effect passes can override it independently
			const effectMaterial = (
				group.defaultMesh.material as THREE.Material
			).clone();
			effectMesh = new THREE.InstancedMesh(
				group.defaultMesh.geometry,
				effectMaterial,
				8,
			);
			effectMesh.count = 0;
			effectMesh.frustumCulled = false;
			effectMesh.matrixAutoUpdate = false;
			effectMesh.userData.instanceHash = instanceHash;
			effectMesh.userData.effectKey = effectKey;
			effectMesh.userData.instanceNodes = [] as (ITreeNode | undefined)[];
			group.effectMeshes.set(effectKey, effectMesh);
			this.instancedRoot.add(effectMesh);
		}

		// Remove from default mesh (swap-and-pop), keep metadata
		this._removeFromDefault(group, nodeId);

		// Add to effect mesh
		const matrix = this._getVisibleMatrix(group, nodeId);
		const color = group.nodeColors.get(nodeId)!;
		const effectIdx = effectMesh.count;

		if (effectIdx >= effectMesh.instanceMatrix.count)
			this._growMeshBuffers(effectMesh);

		const tempMatrix = new THREE.Matrix4();
		tempMatrix.fromArray(matrix);
		effectMesh.setMatrixAt(effectIdx, tempMatrix);

		if (effectMesh.instanceColor)
			effectMesh.setColorAt(
				effectIdx,
				new THREE.Color().setRGB(color[0], color[1], color[2]),
			);

		effectMesh.count++;
		(
			effectMesh.userData.instanceNodes as (ITreeNode | undefined)[]
		)[effectIdx] = node;

		effectMesh.instanceMatrix.needsUpdate = true;
		if (effectMesh.instanceColor)
			effectMesh.instanceColor.needsUpdate = true;

		group.nodeEffect.set(nodeId, effectKey);

		return effectMesh;
	}

	/**
	 * Move a node's instance back from an effect mesh to the default mesh.
	 * Disposes the effect mesh if it becomes empty.
	 */
	public removeFromEffect(node: ITreeNode, effectKey: string): void {
		const nodeId = node.id;
		const instanceHash = this._nodeToHash.get(nodeId);
		if (!instanceHash) return;

		const group = this._groups.get(instanceHash);
		if (!group) return;

		if (group.nodeEffect.get(nodeId) !== effectKey) return;

		const effectMesh = group.effectMeshes.get(effectKey);
		if (!effectMesh) return;

		// Find position in effect mesh
		const instanceNodes = effectMesh.userData.instanceNodes as (
			| ITreeNode
			| undefined
		)[];
		const effectIdx = instanceNodes.indexOf(node);
		if (effectIdx === -1) return;

		// Swap-and-pop from effect mesh
		const lastEffectIdx = effectMesh.count - 1;
		if (effectIdx !== lastEffectIdx) {
			const lastNode = instanceNodes[lastEffectIdx]!;
			const lastMatrix = this._getVisibleMatrix(group, lastNode.id);
			const lastColor = group.nodeColors.get(lastNode.id)!;

			const tempMatrix = new THREE.Matrix4();
			tempMatrix.fromArray(lastMatrix);
			effectMesh.setMatrixAt(effectIdx, tempMatrix);

			if (effectMesh.instanceColor)
				effectMesh.setColorAt(
					effectIdx,
					new THREE.Color().setRGB(
						lastColor[0],
						lastColor[1],
						lastColor[2],
					),
				);

			instanceNodes[effectIdx] = lastNode;
		}

		effectMesh.count--;
		instanceNodes[lastEffectIdx] = undefined;
		effectMesh.instanceMatrix.needsUpdate = true;
		if (effectMesh.instanceColor)
			effectMesh.instanceColor.needsUpdate = true;

		group.nodeEffect.delete(nodeId);

		// Add back to default mesh
		this._addBackToDefault(group, nodeId, node);

		// Remove empty effect meshes
		if (effectMesh.count === 0) {
			this.instancedRoot.remove(effectMesh);
			(effectMesh.material as THREE.Material).dispose();
			group.effectMeshes.delete(effectKey);
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

		const effectKey = group.nodeEffect.get(nodeId);
		if (effectKey !== undefined) {
			const effectMesh = group.effectMeshes.get(effectKey);
			const effectNodes = effectMesh?.userData.instanceNodes as
				| (ITreeNode | undefined)[]
				| undefined;
			const effectIndex = effectNodes?.findIndex((n) => n?.id === nodeId) ?? -1;
			if (effectMesh && effectIndex >= 0)
				effectMesh.setMatrixAt(effectIndex, matrix4);
			if (effectMesh) effectMesh.instanceMatrix.needsUpdate = true;
		}

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

		group.defaultMesh.material = material;
		group.defaultMesh.material.needsUpdate = true;
	}

	public getDefaultMesh(
		instanceHash: string | undefined,
	): THREE.InstancedMesh | undefined {
		return instanceHash
			? this._groups.get(instanceHash)?.defaultMesh
			: undefined;
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
		(
			group.defaultMesh.userData.instanceNodes as (
				| ITreeNode
				| undefined
			)[]
		)[lastIdx] = undefined;

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
		(
			group.defaultMesh.userData.instanceNodes as (
				| ITreeNode
				| undefined
			)[]
		)[newIdx] = node;
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

		const effectKey = group.nodeEffect.get(nodeId);
		if (effectKey !== undefined) {
			const effectMesh = group.effectMeshes.get(effectKey);
			if (effectMesh) {
				const instanceNodes = effectMesh.userData.instanceNodes as (
					| ITreeNode
					| undefined
				)[];
				const effectIdx = instanceNodes.indexOf(node);
				if (effectIdx !== -1) {
					const tempMatrix = new THREE.Matrix4();
					tempMatrix.fromArray(this._getVisibleMatrix(group, nodeId));
					effectMesh.setMatrixAt(effectIdx, tempMatrix);
					effectMesh.instanceMatrix.needsUpdate = true;
				}
			}
		}
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
		if (!mesh.userData.instanceNodes)
			mesh.userData.instanceNodes = [];
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

	// #endregion Private Methods (4)
}
