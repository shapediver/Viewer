import { IViewerEvent } from "./IViewerEvent";

export interface ICameraEvent extends IViewerEvent {
    cameraId: string,
}