import { vec3 } from 'gl-matrix';
import { ICamera } from './ICamera';
export interface ICameraDefinition {
    // #region Properties (2)

    position: vec3;
    target: vec3;

    // #endregion Properties (2)
}

export enum CAMERATYPE {
    PERSPECTIVE = 'perspective',
    ORTHOGRAPHIC = 'orthographic'
}

export interface ICameraEngine {
    assignCamera(id: string): void;
    createCamera(type: CAMERATYPE, id?: string): ICamera;
    getCamera(id?: string): ICamera | null;
    getCameras(): { [key: string]: ICamera };
    hasCamera(): boolean;
}