import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	type InteractionParameterSettingsType,
	type IRectangleTransformParameterProps} from "@shapediver/viewer.shared.types";

import {type IRectangleTransformParameter} from "../../../interfaces/dto/IInteractionParameter";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class RectangleTransformParameter
	extends Parameter<string>
	implements IRectangleTransformParameter
{
	readonly #settings: IRectangleTransformParameterProps;

	constructor(
		paramDef: ResParameter,
		sessionEngineCore: SessionEngineCore,
		parameterManager: ParameterManager,
	) {
		super(paramDef, sessionEngineCore, parameterManager);

		this.#settings = paramDef.settings as IRectangleTransformParameterProps;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "rectangleTransform";
	}

	public get settings(): IRectangleTransformParameterProps {
		return this.#settings;
	}
}
