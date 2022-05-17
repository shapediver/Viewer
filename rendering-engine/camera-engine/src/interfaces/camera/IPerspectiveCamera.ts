import { ICamera } from './ICamera'

export interface IPerspectiveCamera extends ICamera {  
    fov: number;

    clone(): IPerspectiveCamera;
}