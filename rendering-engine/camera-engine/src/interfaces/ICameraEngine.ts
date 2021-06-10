import { vec3 } from 'gl-matrix';
import { ICamera } from './camera/ICamera';

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