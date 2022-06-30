import { mat4, vec2, vec3 } from 'gl-matrix'
import { ITreeNode, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

import { ICameraControls } from '../controls/ICameraControls'
import { CAMERA_TYPE } from '../ICameraEngine'
import { IBox } from '@shapediver/viewer.shared.math'
import { SettingsEngine } from '@shapediver/viewer.shared.services'

export interface ICameraOptions {
    easing?: string | Function; 
    duration?: number; 
    default?: boolean; 
    coordinates?: string; 
    interpolation?: string | Function
}

export interface ICamera extends ITreeNodeData {
    // #region Properties (13)

    readonly controls: ICameraControls;
    readonly id: string;
    readonly type: CAMERA_TYPE;

    autoAdjust: boolean;
    boundingBox: IBox;
    cameraMovementDuration: number;
    defaultPosition: vec3;
    defaultTarget: vec3;
    enableCameraControls: boolean;
    position: vec3;
    name?: string;
    node?: ITreeNode;
    order?: number;
    revertAtMouseUp: boolean;
    revertAtMouseUpDuration: number;
    target: vec3;
    useNodeData: boolean;
    zoomExtentsFactor: number;

    // #endregion Properties (13)

    // #region Public Methods (6)

    animate(path: { position: vec3, target: vec3 }[], options?: ICameraOptions): Promise<boolean>;
    applySettings(settingsEngine: SettingsEngine): void;
    reset(options?: ICameraOptions): Promise<boolean>;
    set(position: vec3, target: vec3, options?: ICameraOptions): Promise<boolean>;
    zoomTo(zoomTarget?: IBox, options?: ICameraOptions): Promise<boolean>;
    calculateZoomTo(zoomTarget?: IBox, startingPosition?: vec3, startingTarget?: vec3): { position: vec3; target: vec3; };
    project(p: vec3): vec2;
    unproject(p: vec3): vec3;

    // #endregion Public Methods (6)
}