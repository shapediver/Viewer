import * as THREE from 'three';

import { AbstractObjectHelper } from '@shapediver/viewer.visualization-engine.rendering-engine';

import { SDObject } from './SDObject';

export class SDObjectHelper extends AbstractObjectHelper<SDObject> {
    // #region Properties (1)

    private _scene!: THREE.Scene;

    // #endregion Properties (1)

    // #region Public Accessors (2)

    /**
     * Getter scene
     * @return {THREE.Scene}
     */
    public get scene(): THREE.Scene {
        return this._scene;
    }

    /**
     * Setter scene
     * @param {THREE.Scene} value
     */
    public set scene(value: THREE.Scene) {
        this._scene = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (6)

    public add(obj: SDObject, parent: SDObject): void {
        parent.add(obj);
    }

    public addData(data: any, obj: SDObject): void {
        if(!obj.userData)
            obj.userData = {};
        obj.userData.id = data;
    }

    public addToScene(obj: SDObject): void {
        this._scene.add(obj);
    }

    public create(...args: any[]): SDObject {
        return new SDObject(args[0], args[1]);
    }

    public getChildren(obj: SDObject): SDObject[] {
        return <SDObject[]>obj.children;
    }

    public remove(obj: SDObject, parent: SDObject): void {
        parent.remove(obj);
    }

    // #endregion Public Methods (6)
}