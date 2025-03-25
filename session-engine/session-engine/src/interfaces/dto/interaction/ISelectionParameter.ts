import {ISelectionParameterProps} from "@shapediver/viewer.shared.types";
import {IParameter} from "../IParameter";
import {IInteractionParameter} from "./IInteractionParameter";

export interface ISelectionParameter
	extends IParameter<string>,
		IInteractionParameter,
		ISelectionParameterProps {}
