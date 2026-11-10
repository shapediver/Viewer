import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {GodRaysEffect} from "postprocessing";
import * as THREE from "three";
import {RenderingEngine} from "../../RenderingEngine";

export class GodRaysManager {
	// #region Properties (2)

	private _godRaysEffect!: GodRaysEffect;
	private _lightSource: THREE.Mesh | THREE.Points | null = null;
	private _node: ITreeNode | null = null;

	// #endregion Properties (2)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	// #endregion Constructors (1)

	// #region Public Methods (3)

	public get lightSourceNode(): ITreeNode | null {
		return this._node;
	}

	public removeLightSource(): void {
		this._node = null;
		this._lightSource = null;
		this._renderingEngine.materialBatchManager.syncLightSources();
		this._godRaysEffect.lightSource = new THREE.Mesh();
	}

	public setEffect(godRaysEffect: GodRaysEffect) {
		this._godRaysEffect = godRaysEffect;
		this._godRaysEffect.lightSource = this._lightSource;
	}

	public setLightSource(node: ITreeNode): void {
		// The batch hides a member. This effect draws that mesh itself, so
		// the node has to leave the batch before the pass runs.
		this._node = node;
		this._renderingEngine.materialBatchManager.syncLightSources();
		this._lightSource = null;
		(
			node.convertedObject[this._renderingEngine.id] as THREE.Object3D
		).traverse((o) => {
			if (o instanceof THREE.Mesh || o instanceof THREE.Points)
				this._lightSource = o;
		});

		if (this._lightSource) {
			if (
				Array.isArray(
					(<THREE.Mesh | THREE.Points>this._lightSource).material,
				)
			) {
				(<THREE.Material[]>(
					(<THREE.Mesh | THREE.Points>this._lightSource).material
				)).forEach((m) => (m.transparent = true));
				(<THREE.Material[]>(
					(<THREE.Mesh | THREE.Points>this._lightSource).material
				)).forEach((m) => (m.depthWrite = false));
			} else {
				(<THREE.Material>(
					(<THREE.Mesh | THREE.Points>this._lightSource).material
				)).transparent = true;
				(<THREE.Material>(
					(<THREE.Mesh | THREE.Points>this._lightSource).material
				)).depthWrite = false;
			}
		}

		this._godRaysEffect.lightSource = this._lightSource;
	}

	// #endregion Public Methods (3)
}
