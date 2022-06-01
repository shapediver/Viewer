import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

import { ILight } from './ILight'

export interface ILightScene {
    // #region Properties (4)

    id: string;
    lights: { [key: string]: ILight; };
    name?: string
    node: ITreeNode;
    update?: () => void;

    // #endregion Properties (4)

    // #region Public Methods (6)

    addAmbientLight(properties: {color?: string | number | vec3, intensity?: number, id?: string, name?: string}): ILight;
    addDirectionalLight(properties: {color?: string | number | vec3, intensity?: number, direction?: vec3, castShadow?: boolean, shadowMapResolution?: number, shadowMapBias?: number, id?: string, name?: string}): ILight;
    addHemisphereLight(properties: {color?: string | number | vec3, intensity?: number, groundColor?: string | number | vec3, id?: string, name?: string}): ILight;
    addPointLight(properties: {color?: string | number | vec3, intensity?: number, position?: vec3, distance?: number, decay?: number, id?: string, name?: string}): ILight;
    addSpotLight(properties: {color?: string | number | vec3, intensity?: number, position?: vec3, target?: vec3, distance?: number, decay?: number, angle?: number, penumbra?: number, id?: string, name?: string}): ILight;
    removeLight(id: string): boolean;

    // #endregion Public Methods (6)
}