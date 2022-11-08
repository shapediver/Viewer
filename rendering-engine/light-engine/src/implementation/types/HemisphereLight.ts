import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

import { LIGHT_TYPE } from '../../interface/ILight'
import { IHemisphereLight } from '../../interface/types/IHemisphereLight';
import { AbstractLight } from '../AbstractLight'

export class HemisphereLight extends AbstractLight implements IHemisphereLight {
    // #region Properties (1)

    #groundColor: string = '#000000';
    #threeJsObject: { [key: string]: THREE.HemisphereLight } = {};

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(properties: {
        color?: string,
        groundColor?: string,
        intensity?: number,
        name?: string,
        order?: number,
        id?: string
    }) {
        super({
            color: properties.color || '#ffffff',
            intensity: properties.intensity !== undefined ? properties.intensity : 1,
            type: LIGHT_TYPE.HEMISPHERE,
            name: properties.name,
            order: properties.order,
            id: properties.id
        });

        if (properties.groundColor) this.#groundColor = properties.groundColor;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get groundColor(): string {
        return this.#groundColor;
    }

    public set groundColor(value: string) {
        this.#groundColor = value;
        this.updateVersion();
    }

    public get threeJsObject(): { [key: string]: THREE.HemisphereLight } {
        return this.#threeJsObject;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): IHemisphereLight {
        return new HemisphereLight({
            color: this.color,
            groundColor: this.groundColor,
            intensity: this.intensity,
            name: this.name,
            order: this.order
        });
    }

    // #endregion Public Methods (1)
}