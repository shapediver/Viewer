import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { GodRaysEffect } from "postprocessing";
import * as THREE from "three";
import { RenderingEngine } from "../../RenderingEngine";

export class GodRaysManager {

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine, private readonly _godRaysEffect: GodRaysEffect) { }

    // #endregion Constructors (1)

    // #region Public Methods (4)

    public setLightSource(node: ITreeNode): void {
        let lightSource: THREE.Mesh | THREE.Points | null = null;
        node.threeJsObject[this._renderingEngine.id].traverse(o => {
            if (o instanceof THREE.Mesh || o instanceof THREE.Points)
                lightSource = o;
        })

        if(lightSource) {
            if(Array.isArray((<THREE.Mesh | THREE.Points>lightSource).material)) {
                (<THREE.Material[]>(<THREE.Mesh | THREE.Points>lightSource).material).forEach(m => m.transparent = true);
                (<THREE.Material[]>(<THREE.Mesh | THREE.Points>lightSource).material).forEach(m => m.depthWrite = false);
            } else {
                (<THREE.Material>(<THREE.Mesh | THREE.Points>lightSource).material).transparent = true;
                (<THREE.Material>(<THREE.Mesh | THREE.Points>lightSource).material).depthWrite = false;
            }
        }
        
        this._godRaysEffect.lightSource = lightSource;
    }

    public removeLightSource(): void {
        this._godRaysEffect.lightSource = new THREE.Mesh();
    }


    // #endregion Public Methods (4)
}