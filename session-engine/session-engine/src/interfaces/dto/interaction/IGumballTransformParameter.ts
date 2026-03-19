import {IGumballTransformParameterProps} from "@shapediver/viewer.shared.types";
import {IParameter} from "../IParameter";
import {IInteractionParameter} from "./IInteractionParameter";

export interface IGumballTransformParameter
	extends IParameter<string>,
		IInteractionParameter,
		IGumballTransformParameterProps {}
