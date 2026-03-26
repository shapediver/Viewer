import {ISelectionParameterProps} from "@shapediver/viewer.shared.types";
import {IInteractionParameterApi} from "./IInteractionParameterApi";

export interface ISelectionParameterApi extends IInteractionParameterApi {
	readonly settings: ISelectionParameterProps;
}
