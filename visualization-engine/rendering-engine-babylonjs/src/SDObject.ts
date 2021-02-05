import * as BABYLON from 'babylonjs';

import { ISDObject, SD_RENDERINGTYPE } from '@shapediver/viewer.shared.types';
import { mat4 } from 'gl-matrix';

export class SDObject extends BABYLON.AbstractMesh implements ISDObject {
    // #region Constructors (1)

    private _SDtype: SD_RENDERINGTYPE;

    constructor(
        private _SDid: string,
        private _SDversion: string,
        scene: BABYLON.Scene
    ) {
        super(_SDid, scene);
        this._SDtype = SD_RENDERINGTYPE.BABYLONJS;
    }

    public applyTransformation(transformation: mat4): void {
        this.setPreTransformMatrix(BABYLON.Matrix.FromArray(transformation));
    }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    /**
     * Getter SDid
     * @return {string}
     */
    public get SDid(): string {
        return this._SDid;
    }

    /**
     * Setter SDid
     * @param {string} value
     */
    public set SDid(value: string) {
        this._SDid = value;
    }

    /**
     * Getter SDversion
     * @return {string}
     */
    public get SDversion(): string {
        return this._SDversion;
    }

    /**
     * Setter SDversion
     * @param {string} value
     */
    public set SDversion(value: string) {
        this._SDversion = value;
    }

    /**
     * Getter SDtype
     * @return {SD_RENDERINGTYPE}
     */
    public get SDtype(): SD_RENDERINGTYPE {
        return this._SDtype;
    }

    // #endregion Public Accessors (4)
}