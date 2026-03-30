import {ISelectionParameter} from "@shapediver/viewer.session-engine.session-engine";
import {
	InteractionParameterSettingsType,
	ISelectionParameterProps,
} from "@shapediver/viewer.shared.types";

import {ISelectionParameterApi} from "../../interfaces/parameter/ISelectionParameterApi";
import {ParameterApi} from "./ParameterApi";

export class SelectionParameterApi
	extends ParameterApi<string>
	implements ISelectionParameterApi
{
	readonly #parameter: ISelectionParameter;

	constructor(parameter: ISelectionParameter) {
		super(parameter);
		this.#parameter = parameter;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return this.#parameter.interactionType;
	}

	public get settings(): ISelectionParameterProps {
		return this.#parameter.settings as ISelectionParameterProps;
	}
}

export const isSelectionParameterApi = (
	obj: unknown,
): obj is ISelectionParameterApi => obj instanceof SelectionParameterApi;
