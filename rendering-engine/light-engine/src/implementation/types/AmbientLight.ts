import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

import { LIGHT_TYPE } from '../../interface/ILight'
import { IAmbientLight } from '../../interface/types/IAmbientLight';
import { AbstractLight } from '../AbstractLight'

export class AmbientLight extends AbstractLight implements IAmbientLight {
    // #region Properties (1)

    #threeJsObject: { [key: string]: THREE.AmbientLight } = {};

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(properties: {
        color?: string,
        intensity?: number,
        name?: string,
        order?: number,
        id?: string
    }) {
        super({
            color: properties.color || '#ffffff', 
            intensity: properties.intensity !== undefined ? properties.intensity : 1, 
            type: LIGHT_TYPE.AMBIENT,
            name: properties.name,
            order: properties.order,
            id: properties.id
        });
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get threeJsObject(): { [key: string]: THREE.AmbientLight } {
        return this.#threeJsObject;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (1)

    public clone(): IAmbientLight {
        return new AmbientLight({
            color: this.color || '#ffffff', 
            intensity: this.intensity || 0.5, 
            name: this.name,
            order: this.order
        });
    }

    // #endregion Public Methods (1)
}