import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {SelectiveBloomEffect} from "postprocessing";
import * as THREE from "three";
import {RenderingEngine} from "../../RenderingEngine";

export class SelectiveBloomManager {
	// #region Properties (2)

	private _selectiveBloomEffect!: SelectiveBloomEffect;
	private _selectiveBloomNodes: ITreeNode[] = [];
	private _instancedBloomNodes = new Set<ITreeNode>();

	// #endregion Properties (2)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	// #endregion Constructors (1)

	// #region Public Methods (5)

	public addSelection(node: ITreeNode): void {
		this._selectiveBloomNodes.push(node);
		this.updateSelectiveBloomEffectObjects();
	}

	public clearSelection(): void {
		this._instancedBloomNodes.forEach((node) =>
			this._removeInstancedEffects(node),
		);
		this._instancedBloomNodes.clear();
		this._selectiveBloomNodes = [];
		this.updateSelectiveBloomEffectObjects();
	}

	public removeSelection(node: ITreeNode): boolean {
		const index = this._selectiveBloomNodes.indexOf(node);
		if (index !== -1) this._selectiveBloomNodes.splice(index, 1);

		this._removeInstancedEffects(node);
		this._instancedBloomNodes.delete(node);
		this.updateSelectiveBloomEffectObjects();
		return index !== -1;
	}

	public setEffect(selectiveBloomEffect: SelectiveBloomEffect) {
		this._selectiveBloomEffect = selectiveBloomEffect;
		this.updateSelectiveBloomEffectObjects();
	}

	public updateSelectiveBloomEffectObjects() {
		this._selectiveBloomEffect.selection.clear();
		const selectedNodes = new Set(this._selectiveBloomNodes);
		this._instancedBloomNodes.forEach((node) => {
			if (!selectedNodes.has(node)) this._removeInstancedEffects(node);
		});
		this._instancedBloomNodes.clear();

		for (let i = 0; i < this._selectiveBloomNodes.length; i++) {
			const bloomNode = this._selectiveBloomNodes[i];
			const object = bloomNode.convertedObject[
				this._renderingEngine.id
			] as THREE.Object3D | undefined;
			if (!object) continue;

			object.traverse((o) => {
				if (o.userData.isInstanced) {
					const instanceNode = o.userData
						.instanceNode as ITreeNode | undefined;
					if (!instanceNode) return;
					const effectMesh =
						this._renderingEngine.instanceGroupManager.addToEffect(
							instanceNode,
							"bloom",
						);
					if (effectMesh) {
						this._selectiveBloomEffect.selection.add(effectMesh);
						this._instancedBloomNodes.add(instanceNode);
					}
				} else if (o instanceof THREE.Mesh) {
					this._selectiveBloomEffect.selection.add(o);
				}
			});
		}
		this._renderingEngine.postProcessingManager.refreshInstancedEffectSelections();
	}

	// #endregion Public Methods (5)

	// #region Private Methods (1)

	private _removeInstancedEffects(node: ITreeNode): void {
		const object = node.convertedObject[
			this._renderingEngine.id
		] as THREE.Object3D | undefined;
		if (!object) return;
		object.traverse((o) => {
			if (!o.userData.isInstanced) return;
			const instanceNode = o.userData.instanceNode as
				| ITreeNode
				| undefined;
			if (instanceNode)
				this._renderingEngine.instanceGroupManager.removeFromEffect(
					instanceNode,
					"bloom",
				);
		});
	}

	// #endregion Private Methods (1)
}
