import {IEvent} from "./IEvent";

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
