import {type InteractionParameterSettingsType} from "@shapediver/viewer.shared.types";
import {type IParameter} from "./IParameter";

export interface IInteractionParameter extends IParameter<string> {
	// #region Properties (1)

	interactionType: InteractionParameterSettingsType;

	// #endregion Properties (1)
}

export interface ISelectionParameter
	extends IParameter<string>,
		IInteractionParameter {}

export interface IGumballTransformParameter
	extends IParameter<string>,
		IInteractionParameter {}

export interface IDraggingParameter
	extends IParameter<string>,
		IInteractionParameter {}

export interface IRectangleTransformParameter
	extends IParameter<string>,
		IInteractionParameter {}

export interface IDrawingParameter
	extends IParameter<string>,
		IInteractionParameter {}
