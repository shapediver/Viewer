import {IGumballParameterProps} from "@shapediver/viewer.shared.types";
import {IParameter} from "../IParameter";
import {IInteractionParameter} from "./IInteractionParameter";

export interface IGumballParameter
	extends IParameter<string>,
		IInteractionParameter,
		IGumballParameterProps {}
