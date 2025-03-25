import {InteractionParameterSettingsType} from "@shapediver/viewer.shared.types";
import {IParameter} from "../IParameter";

export interface IInteractionParameter extends IParameter<string> {
	// #region Properties (1)

	interactionType: InteractionParameterSettingsType;

	// #endregion Properties (1)
}
