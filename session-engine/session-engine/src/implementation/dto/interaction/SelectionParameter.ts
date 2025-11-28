import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	IInteractionParameterSettings,
	InteractionEffect,
	InteractionParameterSettingsType,
	ISelectionParameterProps,
	validateSelectionParameterSettings,
} from "@shapediver/viewer.shared.types";

import {ISelectionParameter} from "../../../interfaces/dto/interaction/ISelectionParameter";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class SelectionParameter
	extends Parameter<string>
	implements ISelectionParameter
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

	public get hover(): boolean | undefined {
		return this.getSelectionProperties()?.hover;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "selection";
	}

	public get maximumSelection(): number | undefined {
		return this.getSelectionProperties()?.maximumSelection;
	}

	public get minimumSelection(): number | undefined {
		return this.getSelectionProperties()?.minimumSelection;
	}

	public get nameFilter(): string[] | undefined {
		return this.getSelectionProperties()?.nameFilter;
	}

	public get selectionColor(): InteractionEffect | undefined {
		return this.getSelectionProperties()?.selectionColor;
	}

	private getSelectionProperties(): ISelectionParameterProps | undefined {
		const result = validateSelectionParameterSettings(
			this.settings as unknown as IInteractionParameterSettings,
		);
		if (result.success) {
			return (this.settings as unknown as IInteractionParameterSettings)
				.props;
		}
	}
}
