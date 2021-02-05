import * as BABYLON from 'babylonjs';

import { AbstractObjectHelper } from '@shapediver/viewer.visualization-engine.rendering-engine';

import { SDObject } from './SDObject';

export class SDObjectHelper extends AbstractObjectHelper<SDObject> {
    // #region Properties (1)

    private _scene!: BABYLON.Scene;

    // #endregion Properties (1)

    // #region Public Accessors (2)

    /**
     * Getter scene
     * @return {BABYLON.Scene}
     */
    public get scene(): BABYLON.Scene {
        return this._scene;
    }

    /**
     * Setter scene
     * @param {BABYLON.Scene} value
     */
    public set scene(value: BABYLON.Scene) {
        this._scene = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (6)

    public add(obj: SDObject, parent: SDObject): void {
        parent.addChild(obj);
    }

    public addData(data: any, obj: SDObject): void {
        if(!obj.metadata)
            obj.metadata = {};
        obj.metadata.id = data;
    }

    public addToScene(obj: SDObject): void {
        // not needed for babylon js
    }

    public create(...args: any[]): SDObject {
        return new SDObject(args[0], args[1], this._scene);
    }

    public getChildren(obj: SDObject): SDObject[] {
        return <SDObject[]>obj.getChildren();
    }

    public remove(obj: SDObject, parent: SDObject): void {
        parent.removeChild(obj);
        this.scene.removeMesh(obj);
        obj.dispose(false, false);
    }

    // #endregion Public Methods (6)
}