import {type IGumballTransformParameter} from "@shapediver/viewer.session-engine.session-engine";

import {type IGumballTransformParameterProps} from "@shapediver/viewer.shared.types";
import {type IGumballTransformParameterApi} from "../../interfaces/parameter/IGumballTransformParameterApi";
import {ParameterApi} from "./ParameterApi";

export class GumballTransformParameterApi
	extends ParameterApi<string>
	implements IGumballTransformParameterApi
{
	readonly #parameter: IGumballTransformParameter;

	constructor(parameter: IGumballTransformParameter) {
		super(parameter);
		this.#parameter = parameter;
	}

	public get interactionType() {
		return this.#parameter.interactionType;
	}

	public get settings(): IGumballTransformParameterProps {
		return this.#parameter.settings as IGumballTransformParameterProps;
	}
}

export const isGumballTransformParameterApi = (
	obj: unknown,
): obj is IGumballTransformParameterApi =>
	obj instanceof GumballTransformParameterApi;
