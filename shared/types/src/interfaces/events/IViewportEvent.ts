import { IEvent } from "@shapediver/viewer.shared.services";

export interface IViewportEvent extends IEvent {
    viewportId: string,
}