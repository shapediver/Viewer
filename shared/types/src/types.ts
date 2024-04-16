import { ShapeDiverResponseParameterType, ShapeDiverResponseParameterVisualization } from '@shapediver/sdk.geometry-api-sdk-v2';
import { vec3, vec4 } from 'gl-matrix';

export type Color = string | number | number[] | vec3 | vec4;

/**
 * The type of the parameter.
 */
export {
    ShapeDiverResponseParameterType as PARAMETER_TYPE,
    ShapeDiverResponseParameterVisualization as PARAMETER_VISUALIZATION
};

export interface ISettingsSections {
    // #region Properties (2)

    session?: ISessionSettingsSections,
    viewport?: IViewportSettingsSections

    // #endregion Properties (2)
}

export interface ISessionSettingsSections {
    // #region Properties (2)

    export?: {
        /** Option to update the displayname of the exports (default: false) */
        displayname?: boolean,
        /** Option to update the order of the exports (default: false) */
        order?: boolean,
        /** Option to update the hidden state of the exports (default: false) */
        hidden?: boolean
    }

    parameter?: {
        /** Option to update the displayname of the parameters (default: false) */
        displayname?: boolean,
        /** Option to update the order of the parameters (default: false) */
        order?: boolean,
        /** Option to update the hidden state of the parameters (default: false) */
        hidden?: boolean,
        /** Option to update the value of the parameters (default: false) */
        value?: boolean
    },

    // #endregion Properties (2)
}

export interface IViewportSettingsSections {
    // #region Properties (7)

    /** Option to update the ar settings (default: false) */
    ar?: boolean,
    /** Option to update the camera settings (default: false) */
    camera?: boolean,
    /** Option to update the environment settings (default: false) */
    environment?: boolean
    /** Option to update the general settings (default: false) */
    general?: boolean
    /** Option to update the light settings (default: false) */
    light?: boolean,
    /** Option to update the postprocessing settings (default: false) */
    postprocessing?: boolean
    /** Option to update the scene settings (default: false) */
    scene?: boolean,

    // #endregion Properties (7)
}