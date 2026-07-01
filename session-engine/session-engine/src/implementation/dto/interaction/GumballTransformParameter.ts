import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	type IGumballTransformParameterProps,
	type InteractionParameterSettingsType} from "@shapediver/viewer.shared.types";

import {type IGumballTransformParameter} from "../../../interfaces/dto/IInteractionParameter";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class GumballTransformParameter
	extends Parameter<string>
	implements IGumballTransformParameter
{
	readonly #settings: IGumballTransformParameterProps;

	constructor(
		paramDef: ResParameter,
		sessionEngineCore: SessionEngineCore,
		parameterManager: ParameterManager,
	) {
		super(paramDef, sessionEngineCore, parameterManager);

		this.#settings = paramDef.settings as IGumballTransformParameterProps;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "gumball";
	}

	public get settings(): IGumballTransformParameterProps {
		return this.#settings;
	}
}
