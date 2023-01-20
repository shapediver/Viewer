import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'
import { Color } from '@shapediver/viewer.shared.types'

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

    addAmbientLight(properties: {color?: Color, intensity?: number, id?: string, name?: string}): ILight;
    addDirectionalLight(properties: {color?: Color, intensity?: number, direction?: vec3, castShadow?: boolean, shadowMapResolution?: number, shadowMapBias?: number, id?: string, name?: string}): ILight;
    addHemisphereLight(properties: {color?: Color, intensity?: number, groundColor?: Color, id?: string, name?: string}): ILight;
    addPointLight(properties: {color?: Color, intensity?: number, position?: vec3, distance?: number, decay?: number, id?: string, name?: string}): ILight;
    addSpotLight(properties: {color?: Color, intensity?: number, position?: vec3, target?: vec3, distance?: number, decay?: number, angle?: number, penumbra?: number, id?: string, name?: string}): ILight;
    removeLight(id: string): boolean;

    // #endregion Public Methods (6)
}