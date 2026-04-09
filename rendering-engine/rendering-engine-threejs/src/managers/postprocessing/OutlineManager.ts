import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {OutlineEffect} from "postprocessing";
import * as THREE from "three";
import {RenderingEngine} from "../../RenderingEngine";

export class OutlineManager {
	// #region Properties (2)

	private _outlineEffect!: OutlineEffect;
	private _outlineNodes: ITreeNode[] = [];

	// #endregion Properties (2)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	// #endregion Constructors (1)

	// #region Public Methods (5)

	public addSelection(node: ITreeNode): void {
		console.debug(
			`[OutlineManager] addSelection: node="${node.name}", nodes before=${this._outlineNodes.length}`,
		);
		this._outlineNodes.push(node);
		this.updateOutlineEffectObjects();
	}

	public clearSelection(): void {
		console.debug(
			`[OutlineManager] clearSelection: clearing ${this._outlineNodes.length} nodes`,
		);
		this._outlineNodes = [];
		this.updateOutlineEffectObjects();
	}

	public removeSelection(node: ITreeNode): boolean {
		const index = this._outlineNodes.indexOf(node);
		console.debug(
			`[OutlineManager] removeSelection: node="${node.name}", found=${index !== -1}, nodes before=${this._outlineNodes.length}`,
		);
		if (index !== -1) {
			this._outlineNodes.splice(index, 1);
			this.updateOutlineEffectObjects();
			return true;
		}
		return false;
	}

	public setEffect(outlineEffect: OutlineEffect) {
		this._outlineEffect = outlineEffect;
		this.updateOutlineEffectObjects();
	}

	public updateOutlineEffectObjects() {
		this._outlineEffect.selection.clear();

		const objects: THREE.Object3D[] = [];
		for (let i = 0; i < this._outlineNodes.length; i++) {
			const object = this._outlineNodes[i].convertedObject[
				this._renderingEngine.id
			] as THREE.Object3D | undefined;
			if (!object) continue;

			object.traverse((o) => {
				if (o instanceof THREE.Mesh) objects.push(o);
			});
		}
		this._outlineEffect.selection.set(objects);
	}

	public selectedNodes(): ITreeNode[] {
		return this._outlineNodes;
	}

	// #endregion Public Methods (5)
}
