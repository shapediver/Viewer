import {type IGumballTransformParameterProps} from "@shapediver/viewer.shared.types";
import {type IInteractionParameterApi} from "./IInteractionParameterApi";

export interface IGumballTransformParameterApi
	extends IInteractionParameterApi {
	readonly settings: IGumballTransformParameterProps;
}
