import {type ISelectionParameterProps} from "@shapediver/viewer.shared.types";
import {type IInteractionParameterApi} from "./IInteractionParameterApi";

export interface ISelectionParameterApi extends IInteractionParameterApi {
	readonly settings: ISelectionParameterProps;
}
