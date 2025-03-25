import {InteractionParameterSettingsType} from "@shapediver/viewer.shared.types";
import {IParameterApi} from "./IParameterApi";

export interface IInteractionParameterApi extends IParameterApi<string> {
	// #region Properties (1)

	interactionType: InteractionParameterSettingsType;

	// #endregion Properties (1)
}
