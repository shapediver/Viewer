import { IViewportEvent } from "./IViewportEvent";

export interface ICameraEvent extends IViewportEvent {
    cameraId: string,
}