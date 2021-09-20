import * as THREE from 'three'
import { ISDObject, SD_RENDERINGTYPE } from '@shapediver/viewer.shared.types'
import { mat4 } from 'gl-matrix'

export class SDObject extends THREE.Object3D implements ISDObject {
    // #region Constructors (1)

    #SDtype: SD_RENDERINGTYPE;
    #SDid: string;
    #SDversion: string;

    constructor(
        SDid: string,
        SDversion: string
    ) {
        super();
        this.#SDid = SDid;
        this.#SDversion = SDversion;
        this.#SDtype = SD_RENDERINGTYPE.THREEJS;
    }
    
    public applyTransformation(transformation: mat4): void {
        this.matrix.identity();
        this.matrixWorld.identity();
        this.position.set(0,0,0)
        this.scale.set(1,1,1)
        this.quaternion.set(0,0,0,1)
        this.applyMatrix4(new THREE.Matrix4().fromArray(transformation));
    }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    public get SDid(): string {
        return this.#SDid;
    }

    public set SDid(value: string) {
        this.#SDid = value;
    }

    public get SDversion(): string {
        return this.#SDversion;
    }

    public set SDversion(value: string) {
        this.#SDversion = value;
    }

    public get SDtype(): SD_RENDERINGTYPE {
        return this.#SDtype;
    }

    // #endregion Public Accessors (4)
}