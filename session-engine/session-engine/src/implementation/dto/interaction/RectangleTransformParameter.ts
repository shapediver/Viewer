import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	IInteractionParameterSettings,
	InteractionEffect,
	InteractionParameterSettingsType,
	IRectangleTransformParameterProps,
	validateRectangleTransformParameterSettings,
} from "@shapediver/viewer.shared.types";

import {IDraggableObject} from "@shapediver/viewer.shared.types/dist/interfaces/parameter/IRectangleTransformParameterSettings";
import {IPlaneRestrictionDefinition} from "@shapediver/viewer.shared.types/dist/interfaces/parameter/IRestrictionSettings";
import {IRectangleTransformParameter} from "../../../interfaces/dto/interaction/IRectangleTransformParameter";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class RectangleTransformParameter
	extends Parameter<string>
	implements IRectangleTransformParameter
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

	public get corners():
		| {
				bottomLeft?: boolean;
				bottomRight?: boolean;
				topRight?: boolean;
				topLeft?: boolean;
		  }
		| undefined {
		return this.getRectangleTransformProperties()?.corners;
	}

	public get midpoints():
		| {top?: boolean; bottom?: boolean; left?: boolean; right?: boolean}
		| undefined {
		return this.getRectangleTransformProperties()?.midpoints;
	}

	public get objects(): IDraggableObject[] | undefined {
		return this.getRectangleTransformProperties()?.objects;
	}

	public get plane(): IPlaneRestrictionDefinition {
		return this.getRectangleTransformProperties()
			?.plane as IPlaneRestrictionDefinition;
	}

	public get enableRotation(): boolean | undefined {
		return this.getRectangleTransformProperties()?.enableRotation;
	}

	public get enableScaling(): boolean | undefined {
		return this.getRectangleTransformProperties()?.enableScaling;
	}

	public get enableTranslation(): boolean | undefined {
		return this.getRectangleTransformProperties()?.enableTranslation;
	}

	public get hover(): boolean | undefined {
		return this.getRectangleTransformProperties()?.hover;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "rectangleTransform";
	}

	public get nameFilter(): string[] | undefined {
		return this.getRectangleTransformProperties()?.nameFilter;
	}

	public get selectionColor(): InteractionEffect | undefined {
		return this.getRectangleTransformProperties()?.selectionColor;
	}

	private getRectangleTransformProperties():
		| IRectangleTransformParameterProps
		| undefined {
		const result = validateRectangleTransformParameterSettings(
			this.settings as unknown as IInteractionParameterSettings,
		);
		if (result.success) {
			return (
				this.settings as unknown as {
					props: IRectangleTransformParameterProps;
				}
			).props;
		}
	}
}
