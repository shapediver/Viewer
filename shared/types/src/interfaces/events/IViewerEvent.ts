import { IEvent } from "@shapediver/viewer.shared.services";

export interface IViewerEvent extends IEvent {
    viewerId: string,
}