import {IDrawingParameterSettings} from "@shapediver/viewer.shared.types";
import {IParameter} from "./IParameter";

export interface IDrawingParameter
	extends IParameter<string>,
		IDrawingParameterSettings {}
