import {type IHemisphereLight} from "@shapediver/viewer.rendering-engine.light-engine";
import {InputValidator, Logger} from "@shapediver/viewer.shared.services";
import {type Color} from "@shapediver/viewer.shared.types";
import {type IViewportApi} from "../../../interfaces/IViewportApi";
import {type IHemisphereLightApi} from "../../../interfaces/lights/types/IHemisphereLightApi";
import {AbstractLightApi} from "../AbstractLightApi";

export class HemisphereLightApi
	extends AbstractLightApi
	implements IHemisphereLightApi
{
	// #region Properties (4)

	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #light: IHemisphereLight;
	readonly #logger: Logger = Logger.instance;
	readonly #viewportApi: IViewportApi;

	// #endregion Properties (4)

	// #region Constructors (1)

	constructor(viewportApi: IViewportApi, light: IHemisphereLight) {
		super(viewportApi, light);
		this.#viewportApi = viewportApi;
		this.#light = light;
		this.scope = "HemisphereLightApi";
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (2)

	public get groundColor(): Color {
		return this.#light.groundColor;
	}

	public set groundColor(value: Color) {
		const scope = "groundColor";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"color",
		);
		this.#light.groundColor = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	// #endregion Public Getters And Setters (2)
}
