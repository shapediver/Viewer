import { AmbientLight as AmbientLightLogic } from '@shapediver/viewer.rendering-engine.light-engine'

import { AbstractLight } from './AbstractLight'
import { IAmbientLight } from '../../../interfaces/viewer/lights/IAmbientLight'
import { IViewer } from '../../../interfaces/viewer/IViewer'

export class AmbientLight extends AbstractLight implements IAmbientLight {
    // #region Properties (1)

    readonly #light: AmbientLightLogic;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: AmbientLightLogic, viewer: IViewer) {
        super(light, viewer);
        this.#light = light;
    }
    
    // #endregion Constructors (1)
}