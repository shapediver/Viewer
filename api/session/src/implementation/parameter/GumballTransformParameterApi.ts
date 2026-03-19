import {IGumballTransformParameter} from "@shapediver/viewer.session-engine.session-engine";
import {
	InteractionEffect,
	InteractionParameterSettingsType,
} from "@shapediver/viewer.shared.types";
import {IGumballTransformParameterApi} from "../../interfaces/parameter/IGumballTransformParameterApi";
import {ParameterApi} from "./ParameterApi";

export class GumballTransformParameterApi
	extends ParameterApi<string>
	implements IGumballTransformParameterApi
{
	// #region Properties (1)

	readonly #parameter: IGumballTransformParameter;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(parameter: IGumballTransformParameter) {
		super(parameter);
		this.#parameter = parameter;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (9)

	public get availableColor(): InteractionEffect | undefined {
		return this.#parameter.availableColor;
	}

	public get enableRotation(): boolean | undefined {
		return this.#parameter.enableRotation;
	}

	public get enableScaling(): boolean | undefined {
		return this.#parameter.enableScaling;
	}

	public get enableTranslation(): boolean | undefined {
		return this.#parameter.enableTranslation;
	}

	public get hover(): boolean | undefined {
		return this.#parameter.hover;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return this.#parameter.interactionType;
	}

	public get nameFilter(): string[] | undefined {
		return this.#parameter.nameFilter;
	}

	public get scale(): number | undefined {
		return this.#parameter.scale;
	}

	public get selectionColor(): InteractionEffect | undefined {
		return this.#parameter.selectionColor;
	}

	public get space(): "local" | "world" | undefined {
		return this.#parameter.space;
	}

	// #endregion Public Getters And Setters (9)
}

export const isGumballTransformParameterApi = (
	obj: unknown,
): obj is IGumballTransformParameterApi => obj instanceof GumballTransformParameterApi;
