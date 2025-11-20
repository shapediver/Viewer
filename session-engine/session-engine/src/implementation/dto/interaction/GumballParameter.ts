import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	IGumballParameterProps,
	IInteractionParameterSettings,
	InteractionEffect,
	InteractionParameterSettingsType,
	validateGumballParameterSettings,
} from "@shapediver/viewer.shared.types";

import {IGumballParameter} from "../../../interfaces/dto/interaction/IGumballParameter";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class GumballParameter
	extends Parameter<string>
	implements IGumballParameter
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

	public get enableRotation(): boolean | undefined {
		return this.getGumballProperties()?.enableRotation;
	}

	public get enableRotationAxes():
		| {x?: boolean; y?: boolean; z?: boolean}
		| undefined {
		return this.getGumballProperties()?.enableRotationAxes;
	}

	public get enableScaling(): boolean | undefined {
		return this.getGumballProperties()?.enableScaling;
	}

	public get enableScalingAxes():
		| {x?: boolean; y?: boolean; z?: boolean}
		| undefined {
		return this.getGumballProperties()?.enableScalingAxes;
	}

	public get enableTranslation(): boolean | undefined {
		return this.getGumballProperties()?.enableTranslation;
	}

	public get enableTranslationAxes():
		| {x?: boolean; y?: boolean; z?: boolean}
		| undefined {
		return this.getGumballProperties()?.enableTranslationAxes;
	}

	public get hover(): boolean | undefined {
		return this.getGumballProperties()?.hover;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "gumball";
	}

	public get nameFilter(): string[] | undefined {
		return this.getGumballProperties()?.nameFilter;
	}

	public get scale(): number | undefined {
		return this.getGumballProperties()?.scale;
	}

	public get selectionColor(): InteractionEffect | undefined {
		return this.getGumballProperties()?.selectionColor;
	}

	public get space(): "local" | "world" | undefined {
		return this.getGumballProperties()?.space;
	}

	private getGumballProperties(): IGumballParameterProps | undefined {
		const result = validateGumballParameterSettings(
			this.settings as unknown as IInteractionParameterSettings,
		);
		if (result.success) {
			return (this.settings as unknown as IInteractionParameterSettings)
				.props;
		}
	}
}
