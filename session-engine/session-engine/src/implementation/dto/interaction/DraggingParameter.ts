import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	IDraggableObject,
	IDraggingParameterProps,
	IInteractionParameterSettings,
	InteractionEffect,
	InteractionParameterSettingsType,
	RestrictionDefinition,
	validateDraggingParameterSettings,
} from "@shapediver/viewer.shared.types";

import {IDraggingParameter} from "../../../interfaces/dto/interaction/IDraggingParameter";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class DraggingParameter
	extends Parameter<string>
	implements IDraggingParameter
{
	readonly #parameterManager: ParameterManager;
	readonly #sessionEngineCore: SessionEngineCore;

	constructor(
		paramDef: ResParameter,
		sessionEngineCore: SessionEngineCore,
		parameterManager: ParameterManager,
	) {
		super(paramDef, sessionEngineCore, parameterManager);
		this.#sessionEngineCore = sessionEngineCore;
		this.#parameterManager = parameterManager;
	}

	public get draggingColor(): InteractionEffect | undefined {
		return this.getDraggingProperties()?.draggingColor;
	}

	public get hover(): boolean | undefined {
		return this.getDraggingProperties()?.hover;
	}

	public get hoverColor(): InteractionEffect | undefined {
		return this.getDraggingProperties()?.hoverColor;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "dragging";
	}

	public get objects(): IDraggableObject[] | undefined {
		return this.getDraggingProperties()?.objects;
	}

	public get restrictions(): RestrictionDefinition[] | undefined {
		return this.getDraggingProperties()?.restrictions;
	}

	private getDraggingProperties(): IDraggingParameterProps | undefined {
		const result = validateDraggingParameterSettings(
			this.settings as unknown as IInteractionParameterSettings,
		);
		if (result.success) {
			return (this.settings as unknown as IInteractionParameterSettings)
				.props;
		}
	}
}
