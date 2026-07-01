import {type IRectangleTransformParameterProps} from "@shapediver/viewer.shared.types";
import {type IInteractionParameterApi} from "./IInteractionParameterApi";

export interface IRectangleTransformParameterApi
	extends IInteractionParameterApi {
	readonly settings: IRectangleTransformParameterProps;
}
