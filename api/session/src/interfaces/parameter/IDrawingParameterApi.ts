import {IDrawingParameterSettings} from "@shapediver/viewer.shared.types";
import {IInteractionParameterApi} from "./IInteractionParameterApi";

export interface IDrawingParameterApi extends IInteractionParameterApi {
	readonly settings: IDrawingParameterSettings;
}
