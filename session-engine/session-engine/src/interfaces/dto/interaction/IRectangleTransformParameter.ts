import {IRectangleTransformParameterProps} from "@shapediver/viewer.shared.types";
import {IParameter} from "../IParameter";
import {IInteractionParameter} from "./IInteractionParameter";

export interface IRectangleTransformParameter
	extends IParameter<string>,
		IInteractionParameter,
		IRectangleTransformParameterProps {}
