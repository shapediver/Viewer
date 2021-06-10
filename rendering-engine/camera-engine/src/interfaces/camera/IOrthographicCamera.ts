import { IOrthographicCameraControls } from "../controls/IOrthographicCameraControls";
import { ICamera } from "./ICamera";

export interface IOrthographicCamera extends ICamera {
    readonly controls: IOrthographicCameraControls;
}