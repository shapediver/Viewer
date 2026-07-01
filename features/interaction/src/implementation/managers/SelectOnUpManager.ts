import {type IMaterialAbstractData} from "@shapediver/viewer";

import {type IInteractionEffect} from "../../interfaces/utils/IInteractionEffectUtils";
import {SelectManager} from "./SelectManager";

/**
 * SelectOnUpManager is a convenience class that extends SelectManager
 * and automatically configures it to select on pointer up events.
 *
 * This maintains backward compatibility while leveraging the unified
 * SelectManager implementation.
 */
export class SelectOnUpManager extends SelectManager {
	constructor(
		id?: string,
		interactionEffect?: IInteractionEffect | IMaterialAbstractData,
		deselectOnEmpty?: boolean,
	) {
		// Call SelectManager constructor with "up" flag
		super(id, interactionEffect, deselectOnEmpty, "up");
	}
}
