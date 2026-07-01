import {type IDrawingParameter} from "@shapediver/viewer.session-engine.session-engine";

import {type IDrawingParameterSettings} from "@shapediver/viewer.shared.types";
import {type IDrawingParameterApi} from "../../interfaces/parameter/IDrawingParameterApi";
import {ParameterApi} from "./ParameterApi";

export class DrawingParameterApi
	extends ParameterApi<string>
	implements IDrawingParameterApi
{
	readonly #parameter: IDrawingParameter;

	constructor(parameter: IDrawingParameter) {
		super(parameter);
		this.#parameter = parameter;
	}

	public get interactionType() {
		return this.#parameter.interactionType;
	}

	public get settings(): IDrawingParameterSettings {
		return this.#parameter.settings as IDrawingParameterSettings;
	}
}

export const isDrawingParameterApi = (
	obj: unknown,
): obj is IDrawingParameterApi => obj instanceof DrawingParameterApi;
