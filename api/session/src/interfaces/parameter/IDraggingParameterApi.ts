import {type IDraggingParameterProps} from "@shapediver/viewer.shared.types";
import {type IInteractionParameterApi} from "./IInteractionParameterApi";

export interface IDraggingParameterApi extends IInteractionParameterApi {
	readonly settings: IDraggingParameterProps;
}
