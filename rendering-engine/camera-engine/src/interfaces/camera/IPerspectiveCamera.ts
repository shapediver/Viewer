import { IPerspectiveCameraControls } from '../controls/IPerspectiveCameraControls';
import { ICamera } from './ICamera'

export interface IPerspectiveCamera extends ICamera {  
    readonly controls: IPerspectiveCameraControls;
    
    fov: number;

    clone(): IPerspectiveCamera;
}