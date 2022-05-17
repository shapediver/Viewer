import { IEvent } from "@shapediver/viewer.shared.services";

export interface ISessionEvent extends IEvent {
    sessionId: string,
}