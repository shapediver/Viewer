import { IViewerEvent } from "./IViewerEvent";

export interface IEnvironmentEvent extends IViewerEvent {
    environmentMapId: string,
}