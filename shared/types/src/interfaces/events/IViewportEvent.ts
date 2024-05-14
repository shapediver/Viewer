import { IEvent } from '@shapediver/viewer.shared.services';

/**
 * Definition of the viewport event.
 * These events are sent for viewport specific events ({@link EVENTTYPE_VIEWPORT}).
 */
export interface IViewportEvent extends IEvent {
    // #region Properties (1)

    viewportId: string,

    // #endregion Properties (1)
}