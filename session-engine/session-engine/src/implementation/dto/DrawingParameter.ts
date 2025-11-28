import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	IDrawingParameterSettings,
	validateDrawingParameterSettings,
} from "@shapediver/viewer.shared.types";

import {IDrawingParameter} from "../../interfaces/dto/IDrawingParameter";
import {ParameterManager} from "../managers/ParameterManager";
import {SessionEngineCore} from "../SessionEngineCore";
import {Parameter} from "./Parameter";

export class DrawingParameter
	extends Parameter<string>
	implements IDrawingParameter
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

	public get geometry(): IDrawingParameterSettings["geometry"] | undefined {
		return this.getDrawingProperties()?.geometry;
	}

	public get restrictions():
		| IDrawingParameterSettings["restrictions"]
		| undefined {
		return this.getDrawingProperties()?.restrictions;
	}

	private getDrawingProperties(): IDrawingParameterSettings | undefined {
		const result = validateDrawingParameterSettings(
			this.settings as unknown as IDrawingParameterSettings,
		);
		if (result.success) {
			return this.settings as unknown as IDrawingParameterSettings;
		}
	}
}
