import { vec3 } from 'gl-matrix'

import { ICamera } from './camera/ICamera'

export enum CAMERA_TYPE {
    PERSPECTIVE = 'perspective',
    ORTHOGRAPHIC = 'orthographic'
}

export interface ICameraEngine {
    update?: () => void;

    assignCamera(id: string): boolean;
    createCamera(type: CAMERA_TYPE, id?: string): ICamera;
    removeCamera(id: string): boolean;

    activateCameraEvents(): void;
    deactivateCameraEvents(): void;
    createDefaultCameras(): void;
}