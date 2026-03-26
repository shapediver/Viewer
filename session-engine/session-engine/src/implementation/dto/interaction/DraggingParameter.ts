import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	IDraggingParameterProps,
	InteractionParameterSettingsType,
} from "@shapediver/viewer.shared.types";

import {IDraggingParameter} from "../../../interfaces/dto/IInteractionParameter";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class DraggingParameter
	extends Parameter<string>
	implements IDraggingParameter
{
	constructor(
		paramDef: ResParameter,
		sessionEngineCore: SessionEngineCore,
		parameterManager: ParameterManager,
	) {
		super(paramDef, sessionEngineCore, parameterManager);
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "dragging";
	}

	public get settings(): IDraggingParameterProps {
		return this.settings as IDraggingParameterProps;
	}
}
