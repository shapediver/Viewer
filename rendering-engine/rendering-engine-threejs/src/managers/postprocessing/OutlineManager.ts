import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {OutlineEffect} from "postprocessing";
import * as THREE from "three";
import {RenderingEngine} from "../../RenderingEngine";

export class OutlineManager {
	// #region Properties (5)

	private _outlineEffect!: OutlineEffect;
	private _outlineNodes: ITreeNode[] = [];
	private _separateObjects: boolean = false;
	private _perNodeEffects: Map<ITreeNode, OutlineEffect> = new Map();
	private _instancedOutlineNodes = new Set<ITreeNode>();
	private _onEffectsChanged?: () => void;

	// #endregion Properties (5)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	// #endregion Constructors (1)

	// #region Public Methods (8)

	public addSelection(node: ITreeNode): void {
		this._outlineNodes.push(node);
		if (this._separateObjects) {
			this._onEffectsChanged?.();
		} else {
			this.updateOutlineEffectObjects();
		}
	}

	public clearSelection(): void {
		this._instancedOutlineNodes.forEach((node) =>
			this._removeInstancedEffects(node),
		);
		this._instancedOutlineNodes.clear();
		this._outlineNodes = [];
		if (this._separateObjects) {
			this._perNodeEffects.clear();
			this._onEffectsChanged?.();
		} else {
			this.updateOutlineEffectObjects();
		}
	}

	/**
	 * Called by PostProcessingManager during changeEffectPass to configure the
	 * rendering mode and register the callback that rebuilds the effect pass
	 * when the node selection changes.
	 */
	public configure(
		separateObjects: boolean,
		onEffectsChanged: () => void,
	): void {
		this._instancedOutlineNodes.forEach((node) =>
			this._removeInstancedEffects(node),
		);
		this._instancedOutlineNodes.clear();
		this._separateObjects = separateObjects;
		this._onEffectsChanged = onEffectsChanged;
		this._perNodeEffects.clear();
	}

	public removeSelection(node: ITreeNode): boolean {
		const index = this._outlineNodes.indexOf(node);
		if (index !== -1) {
			this._outlineNodes.splice(index, 1);
			this._removeInstancedEffects(node);
			this._instancedOutlineNodes.delete(node);
			if (this._separateObjects) {
				this._perNodeEffects.delete(node);
				this._onEffectsChanged?.();
			} else {
				this.updateOutlineEffectObjects();
			}
			return true;
		}
		return false;
	}

	/** Used in the default grouped mode. */
	public setEffect(outlineEffect: OutlineEffect) {
		this._outlineEffect = outlineEffect;
		this.updateOutlineEffectObjects();
	}

	/**
	 * Used in separateObjects mode. PostProcessingManager passes a fresh
	 * per-node map each time it rebuilds the effect pass.
	 */
	public setPerNodeEffects(effects: Map<ITreeNode, OutlineEffect>): void {
		this._perNodeEffects = effects;
		this.updateOutlineEffectObjects();
	}

	public updateOutlineEffectObjects() {
		const selectedNodes = new Set(this._outlineNodes);
		this._instancedOutlineNodes.forEach((node) => {
			if (!selectedNodes.has(node)) this._removeInstancedEffects(node);
		});
		this._instancedOutlineNodes.clear();

		if (this._separateObjects) {
			for (const [node, effect] of this._perNodeEffects) {
				effect.selection.clear();
				const object = node.convertedObject[
					this._renderingEngine.id
				] as THREE.Object3D | undefined;
				if (!object) continue;
				object.traverse((o) => {
					if (o.userData.isInstanced) {
						const instanceNode = o.userData.instanceNode as
							| ITreeNode
							| undefined;
						if (!instanceNode) return;
						const effectMesh =
							this._renderingEngine.instanceGroupManager.addToEffect(
								instanceNode,
								this._getEffectKey(instanceNode),
							);
						if (effectMesh) {
							effect.selection.add(effectMesh);
							this._instancedOutlineNodes.add(instanceNode);
						}
					} else if (o instanceof THREE.Mesh) effect.selection.add(o);
				});
			}
		} else {
			if (!this._outlineEffect) return;
			this._outlineEffect.selection.clear();

			const objects: THREE.Object3D[] = [];
			for (let i = 0; i < this._outlineNodes.length; i++) {
				const outlineNode = this._outlineNodes[i];
				const object = outlineNode.convertedObject[
					this._renderingEngine.id
				] as THREE.Object3D | undefined;
				if (!object) continue;

				object.traverse((o) => {
					if (o.userData.isInstanced) {
						// Instanced placeholder: move instance to an effect InstancedMesh
						const instanceNode = o.userData.instanceNode as
							| ITreeNode
							| undefined;
						if (!instanceNode) return;
						const effectMesh =
							this._renderingEngine.instanceGroupManager.addToEffect(
								instanceNode,
								this._getEffectKey(instanceNode),
							);
						if (effectMesh) {
							this._instancedOutlineNodes.add(instanceNode);
							if (!objects.includes(effectMesh))
								objects.push(effectMesh);
						}
					} else if (o instanceof THREE.Mesh) {
						objects.push(o);
					}
				});
			}
			this._outlineEffect.selection.set(objects);
		}
		this._renderingEngine.postProcessingManager.refreshInstancedEffectSelections();
	}

	public selectedNodes(): ITreeNode[] {
		return this._outlineNodes;
	}

	// #endregion Public Methods (5)

	// #region Private Methods (1)

	private _removeInstancedEffects(node: ITreeNode): void {
		const object = node.convertedObject[this._renderingEngine.id] as
			| THREE.Object3D
			| undefined;
		if (!object) return;
		object.traverse((o) => {
			if (!o.userData.isInstanced) return;
			const instanceNode = o.userData.instanceNode as
				| ITreeNode
				| undefined;
			if (instanceNode)
				this._renderingEngine.instanceGroupManager.removeFromEffect(
					instanceNode,
					this._getEffectKey(instanceNode),
				);
		});
	}

	private _getEffectKey(node: ITreeNode): string {
		return this._separateObjects ? `outline:${node.id}` : "outline";
	}

	// #endregion Private Methods (1)
}
