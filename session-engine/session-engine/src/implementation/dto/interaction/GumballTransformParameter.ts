import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	IGumballTransformParameterProps,
	IInteractionParameterSettings,
	InteractionEffect,
	InteractionParameterSettingsType,
	validateGumballTransformParameterSettings,
} from "@shapediver/viewer.shared.types";

import {IGumballTransformParameter} from "../../../interfaces/dto/interaction/IGumballTransformParameter";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class GumballTransformParameter
	extends Parameter<string>
	implements IGumballTransformParameter
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
		return this.getGumballTransformProperties()?.enableRotation;
	}

	public get enableRotationAxes():
		| {x?: boolean; y?: boolean; z?: boolean}
		| undefined {
		return this.getGumballTransformProperties()?.enableRotationAxes;
	}

	public get enableScaling(): boolean | undefined {
		return this.getGumballTransformProperties()?.enableScaling;
	}

	public get enableScalingAxes():
		| {x?: boolean; y?: boolean; z?: boolean}
		| undefined {
		return this.getGumballTransformProperties()?.enableScalingAxes;
	}

	public get enableTranslation(): boolean | undefined {
		return this.getGumballTransformProperties()?.enableTranslation;
	}

	public get enableTranslationAxes():
		| {x?: boolean; y?: boolean; z?: boolean}
		| undefined {
		return this.getGumballTransformProperties()?.enableTranslationAxes;
	}

	public get hover(): boolean | undefined {
		return this.getGumballTransformProperties()?.hover;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "gumball";
	}

	public get nameFilter(): string[] | undefined {
		return this.getGumballTransformProperties()?.nameFilter;
	}

	public get scale(): number | undefined {
		return this.getGumballTransformProperties()?.scale;
	}

	public get selectionColor(): InteractionEffect | undefined {
		return this.getGumballTransformProperties()?.selectionColor;
	}

	public get space(): "local" | "world" | undefined {
		return this.getGumballTransformProperties()?.space;
	}

	private getGumballTransformProperties():
		| IGumballTransformParameterProps
		| undefined {
		const result = validateGumballTransformParameterSettings(
			this.settings as unknown as IInteractionParameterSettings,
		);
		if (result.success) {
			return (this.settings as unknown as IInteractionParameterSettings)
				.props;
		}
	}
}
