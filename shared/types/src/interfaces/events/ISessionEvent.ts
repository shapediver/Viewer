import {IEvent} from "@shapediver/viewer.shared.services";

export interface ISessionErrorEvent extends ISessionEvent {
	/**
	 * The error that occurred in the session.
	 */
	error: Error;
}

/**
 * Definition of the session event.
 * These events are sent for session specific events ({@link EVENTTYPE_SESSION}).
 */
export interface ISessionEvent extends IEvent {
	/**
	 * The id of the session.
	 */
	sessionId: string;
}
