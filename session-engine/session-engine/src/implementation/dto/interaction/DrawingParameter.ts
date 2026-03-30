import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	IDrawingParameterSettings,
	InteractionParameterSettingsType,
} from "@shapediver/viewer.shared.types";
import {IDrawingParameter} from "../../..";
import {ParameterManager} from "../../managers/ParameterManager";
import {SessionEngineCore} from "../../SessionEngineCore";
import {Parameter} from "../Parameter";

export class DrawingParameter
	extends Parameter<string>
	implements IDrawingParameter
{
	readonly #settings: IDrawingParameterSettings;

	constructor(
		paramDef: ResParameter,
		sessionEngineCore: SessionEngineCore,
		parameterManager: ParameterManager,
	) {
		super(paramDef, sessionEngineCore, parameterManager);

		this.#settings = paramDef.settings as IDrawingParameterSettings;
	}

	public get interactionType(): InteractionParameterSettingsType {
		return "drawing";
	}

	public get settings(): IDrawingParameterSettings {
		return this.#settings;
	}
}
