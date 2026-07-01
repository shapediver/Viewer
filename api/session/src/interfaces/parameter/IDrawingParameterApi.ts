import {type IDrawingParameterSettings} from "@shapediver/viewer.shared.types";
import {type IInteractionParameterApi} from "./IInteractionParameterApi";

export interface IDrawingParameterApi extends IInteractionParameterApi {
	readonly settings: IDrawingParameterSettings;
}
