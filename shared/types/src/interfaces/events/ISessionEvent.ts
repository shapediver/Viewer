import {IEvent} from "@shapediver/viewer.shared.services";

/**
 * Definition of the session event.
 * These events are sent for session specific events ({@link EVENTTYPE_SESSION}).
 */
export interface ISessionEvent extends IEvent {
	// #region Properties (1)

	/**
	 * The id of the session.
	 */
	sessionId: string;

	// #endregion Properties (1)
}
