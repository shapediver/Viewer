import { CAMERA_TYPE } from '../ICameraEngine';
import { IBox, ISphere } from '@shapediver/viewer.shared.math';
import { ICameraControls } from '../controls/ICameraControls';
import { ITreeNode, ITreeNodeData } from '@shapediver/viewer.shared.node-tree';
import { SettingsEngine } from '@shapediver/viewer.shared.services';
import { vec2, vec3 } from 'gl-matrix';

// #region Interfaces (2)

export interface ICamera extends ITreeNodeData {
    // #region Properties (21)

    readonly controls: ICameraControls;
    readonly id: string;
    readonly type: CAMERA_TYPE;
    readonly isDefault: boolean;

    active: boolean;
    autoAdjust: boolean;
    boundingBox: IBox;
    cameraMovementDuration: number;
    defaultPosition: vec3;
    defaultTarget: vec3;
    domEventListenerToken?: string;
    enableCameraControls: boolean;
    name?: string;
    node?: ITreeNode;
    order?: number;
    position: vec3;
    revertAtMouseUp: boolean;
    revertAtMouseUpDuration: number;
    sceneRotation: vec2;
    target: vec3;
    useNodeData: boolean;
    zoomExtentsFactor: number;

    // #endregion Properties (21)

    // #region Public Methods (8)

    animate(path: { position: vec3, target: vec3 }[], options?: ICameraOptions): Promise<boolean>;
    applySettings(settingsEngine: SettingsEngine): void;
    boundingSphereVisible(sphere: ISphere): boolean;
    calculateZoomTo(zoomTarget?: IBox, startingPosition?: vec3, startingTarget?: vec3): { position: vec3; target: vec3; };
    project(p: vec3): vec2;
    reset(options?: ICameraOptions): Promise<boolean>;
    set(position: vec3, target: vec3, options?: ICameraOptions): Promise<boolean>;
    unproject(p: vec3): vec3;
    zoomTo(zoomTarget?: IBox, options?: ICameraOptions): Promise<boolean>;

    // #endregion Public Methods (8)
}

/* eslint-disable @typescript-eslint/ban-types */
export interface ICameraOptions {
    // #region Properties (4)

    /**
     * The coordinate type of the camera interpolation. (default: 'cylindrical')
     */
    coordinates?: 'spherical' | 'linear' | 'cylindrical';
    /**
     * The duration of the camera movement. (default: cameraMovementDuration set in the settings)
     * When set to 0, the camera is immediately updated to the specified position and target.
     */
    duration?: number;
    /**
     * The easing type of the camera interpolation. (default: 'Quadratic.InOut')
     */
    easing?: 'Linear.None' |
    'Quadratic.In' | 'Quadratic.Out' | 'Quadratic.InOut' |
    'Cubic.In' | 'Cubic.Out' | 'Cubic.InOut' |
    'Quartic.In' | 'Quartic.Out' | 'Quartic.InOut' |
    'Quintic.In' | 'Quintic.Out' | 'Quintic.InOut' |
    'Sinusoidal.In' | 'Sinusoidal.Out' | 'Sinusoidal.InOut' |
    'Exponential.In' | 'Exponential.Out' | 'Exponential.InOut' |
    'Circular.In' | 'Circular.Out' | 'Circular.InOut' |
    'Elastic.In' | 'Elastic.Out' | 'Elastic.InOut' |
    'Back.In' | 'Back.Out' | 'Back.InOut' |
    'Bounce.In' | 'Bounce.Out' | 'Bounce.InOut' | Function;
    /**
     * The interpolation type of the camera interpolation. (default: 'CatmullRom')
     */
    interpolation?: 'Linear' | 'Bezier' | 'CatmullRom' | Function

    // #endregion Properties (4)
}

// #endregion Interfaces (2)
