import {type IRectangleTransformParameter} from "@shapediver/viewer.session-engine.session-engine";
import {
	type InteractionParameterSettingsType,
	type IRectangleTransformParameterProps} from "@shapediver/viewer.shared.types";

import {type IRectangleTransformParameterApi} from "../../interfaces/parameter/IRectangleTransformParameterApi";
import {ParameterApi} from "./ParameterApi";

export class RectangleTransformParameterApi
	extends ParameterApi<string>
	implements IRectangleTransformParameterApi
{
	readonly #parameter: IRectangleTransformParameter;

	constructor(parameter: IRectangleTransformParameter) {
		super(parameter);
		this.#parameter = parameter;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return this.#parameter.interactionType;
	}

	public get settings(): IRectangleTransformParameterProps {
		return this.#parameter.settings as IRectangleTransformParameterProps;
	}
}

export const isRectangleTransformParameterApi = (
	obj: unknown,
): obj is IRectangleTransformParameterApi =>
	obj instanceof RectangleTransformParameterApi;
