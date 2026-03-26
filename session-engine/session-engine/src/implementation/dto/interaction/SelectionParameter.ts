import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	InteractionParameterSettingsType,
	ISelectionParameterProps,
} from "@shapediver/viewer.shared.types";

import {ISelectionParameter} from "../../../interfaces/dto/IInteractionParameter";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class SelectionParameter
	extends Parameter<string>
	implements ISelectionParameter
{
	constructor(
		paramDef: ResParameter,
		sessionEngineCore: SessionEngineCore,
		parameterManager: ParameterManager,
	) {
		super(paramDef, sessionEngineCore, parameterManager);
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "selection";
	}

	public get settings(): ISelectionParameterProps {
		return this.settings as ISelectionParameterProps;
	}
}
