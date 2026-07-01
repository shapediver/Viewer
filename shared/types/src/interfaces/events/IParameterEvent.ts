import {type ISessionEvent} from "./ISessionEvent";

/**
 * Definition of the parameter event.
 * These events are sent when a parameter changes ({@link EVENTTYPE_PARAMETER}).
 */
export interface IParameterEvent extends ISessionEvent {
	// #region Properties (1)

	/**
	 * The id of the parameter.
	 */
	parameterId: string;

	/**
	 * The value of the parameter.
	 */
	value: unknown;

	// #endregion Properties (1)
}
