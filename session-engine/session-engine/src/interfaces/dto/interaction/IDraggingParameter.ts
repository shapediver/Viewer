import {IDraggingParameterProps} from "@shapediver/viewer.shared.types";
import {IParameter} from "../IParameter";
import {IInteractionParameter} from "./IInteractionParameter";

export interface IDraggingParameter
	extends IParameter<string>,
		IInteractionParameter,
		IDraggingParameterProps {}
