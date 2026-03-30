import {IDraggingParameterProps} from "@shapediver/viewer.shared.types";
import {IInteractionParameterApi} from "./IInteractionParameterApi";

export interface IDraggingParameterApi extends IInteractionParameterApi {
	readonly settings: IDraggingParameterProps;
}
