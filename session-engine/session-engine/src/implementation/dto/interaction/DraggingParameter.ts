import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	type IDraggingParameterProps,
	type InteractionParameterSettingsType} from "@shapediver/viewer.shared.types";

import {type IDraggingParameter} from "../../../interfaces/dto/IInteractionParameter";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class DraggingParameter
	extends Parameter<string>
	implements IDraggingParameter
{
	readonly #settings: IDraggingParameterProps;

	constructor(
		paramDef: ResParameter,
		sessionEngineCore: SessionEngineCore,
		parameterManager: ParameterManager,
	) {
		super(paramDef, sessionEngineCore, parameterManager);

		this.#settings = paramDef.settings as IDraggingParameterProps;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "dragging";
	}

	public get settings(): IDraggingParameterProps {
		return this.#settings;
	}
}
