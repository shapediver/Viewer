import {IDraggingParameter} from "@shapediver/viewer.session-engine.session-engine";
import {
	IDraggingParameterProps,
	InteractionParameterSettingsType,
} from "@shapediver/viewer.shared.types";

import {IDraggingParameterApi} from "../../interfaces/parameter/IDraggingParameterApi";
import {ParameterApi} from "./ParameterApi";

export class DraggingParameterApi
	extends ParameterApi<string>
	implements IDraggingParameterApi
{
	readonly #parameter: IDraggingParameter;

	constructor(parameter: IDraggingParameter) {
		super(parameter);
		this.#parameter = parameter;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return this.#parameter.interactionType;
	}

	public get settings(): IDraggingParameterProps {
		return this.#parameter.settings as IDraggingParameterProps;
	}
}

export const isDraggingParameterApi = (
	obj: unknown,
): obj is IDraggingParameterApi => obj instanceof DraggingParameterApi;
