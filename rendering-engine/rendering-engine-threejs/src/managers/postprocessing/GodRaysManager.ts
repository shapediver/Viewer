import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { GodRaysEffect } from "postprocessing";
import * as THREE from "three";
import { RenderingEngine } from "../../RenderingEngine";

export class GodRaysManager {
    // #region Properties (1)

    private _godRaysEffect!: GodRaysEffect;
    private _lightSource: THREE.Mesh | THREE.Points | null = null;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    public removeLightSource(): void {
        this._godRaysEffect.lightSource = new THREE.Mesh();
    }

    public setEffect(godRaysEffect: GodRaysEffect) {
        this._godRaysEffect = godRaysEffect;
        this._godRaysEffect.lightSource = this._lightSource;
    }

    public setLightSource(node: ITreeNode): void {
        this._lightSource = null;
        node.threeJsObject[this._renderingEngine.id].traverse(o => {
            if (o instanceof THREE.Mesh || o instanceof THREE.Points)
                this._lightSource = o;
        })

        if(this._lightSource) {
            if(Array.isArray((<THREE.Mesh | THREE.Points>this._lightSource).material)) {
                (<THREE.Material[]>(<THREE.Mesh | THREE.Points>this._lightSource).material).forEach(m => m.transparent = true);
                (<THREE.Material[]>(<THREE.Mesh | THREE.Points>this._lightSource).material).forEach(m => m.depthWrite = false);
            } else {
                (<THREE.Material>(<THREE.Mesh | THREE.Points>this._lightSource).material).transparent = true;
                (<THREE.Material>(<THREE.Mesh | THREE.Points>this._lightSource).material).depthWrite = false;
            }
        }
        
        this._godRaysEffect.lightSource = this._lightSource;
    }

    // #endregion Public Methods (3)
}