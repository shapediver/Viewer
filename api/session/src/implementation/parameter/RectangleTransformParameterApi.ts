import {IRectangleTransformParameter} from "@shapediver/viewer.session-engine.session-engine";
import {
	InteractionEffect,
	InteractionParameterSettingsType,
} from "@shapediver/viewer.shared.types";
import {IPlaneRestrictionDefinition} from "@shapediver/viewer.shared.types/dist/interfaces/parameter/IRestrictionSettings";
import {IRectangleTransformParameterApi} from "../../interfaces/parameter/IRectangleTransformParameterApi";
import {ParameterApi} from "./ParameterApi";

export class RectangleTransformParameterApi
	extends ParameterApi<string>
	implements IRectangleTransformParameterApi
{
	// #region Properties (1)

	readonly #parameter: IRectangleTransformParameter;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(parameter: IRectangleTransformParameter) {
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

	public get selectionColor(): InteractionEffect | undefined {
		return this.#parameter.selectionColor;
	}

	public get plane(): IPlaneRestrictionDefinition {
		return this.#parameter.plane;
	}

	// #endregion Public Getters And Setters (9)
}

export const isRectangleTransformParameterApi = (
	obj: unknown,
): obj is IRectangleTransformParameterApi =>
	obj instanceof RectangleTransformParameterApi;
