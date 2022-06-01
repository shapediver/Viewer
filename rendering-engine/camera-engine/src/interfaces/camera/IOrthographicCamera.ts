import { IOrthographicCameraControls } from '../controls/IOrthographicCameraControls';
import { ICamera } from './ICamera'

export enum ORTHOGRAPHIC_CAMERA_DIRECTION {
    TOP = 'top',
    BOTTOM = 'bottom',
    LEFT = 'left',
    RIGHT = 'right',
    FRONT = 'front',
    BACK = 'back',
 }
export interface IOrthographicCamera extends ICamera {
    readonly controls: IOrthographicCameraControls;
    
    direction: ORTHOGRAPHIC_CAMERA_DIRECTION;

    clone(): IOrthographicCamera;
}