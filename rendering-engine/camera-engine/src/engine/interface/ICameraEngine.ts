import { vec3 } from 'gl-matrix';
import { AbstractCamera as Camera } from '../implementation/AbstractCamera';
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
    createCamera(type: CAMERATYPE, id?: string): Camera;
    getCamera(id?: string): Camera;
    getCameras(): { [key: string]: Camera };
}