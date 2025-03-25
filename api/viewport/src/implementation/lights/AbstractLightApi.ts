import {
	ILight,
	LIGHT_TYPE,
} from "@shapediver/viewer.rendering-engine.light-engine";
import {InputValidator, Logger} from "@shapediver/viewer.shared.services";
import {Color} from "@shapediver/viewer.shared.types";
import {IViewportApi} from "../../interfaces/IViewportApi";
import {ILightApi} from "../../interfaces/lights/ILightApi";

export abstract class AbstractLightApi implements ILightApi {
	// #region Properties (5)

	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #light: ILight;
	readonly #logger: Logger = Logger.instance;
	readonly #viewportApi: IViewportApi;

	protected scope: string = "AbstractLightApi";

	// #endregion Properties (5)

	// #region Constructors (1)

	constructor(viewportApi: IViewportApi, light: ILight) {
		this.#viewportApi = viewportApi;
		this.#light = light;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (10)

	public get color(): Color {
		return this.#light.color;
	}

	public set color(value: Color) {
		const scope = "color";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"color",
		);
		this.#light.color = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get id(): string {
		return this.#light.id;
	}

	public get intensity(): number {
		return this.#light.intensity;
	}

	public set intensity(value: number) {
		const scope = "intensity";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#light.intensity = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get name(): string | undefined {
		return this.#light.name;
	}

	public set name(value: string | undefined) {
		const scope = "name";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"string",
			false,
		);
		this.#light.name = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get order(): number | undefined {
		return this.#light.order;
	}

	public set order(value: number | undefined) {
		const scope = "order";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
			false,
		);
		this.#light.order = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get type(): LIGHT_TYPE {
		return this.#light.type;
	}

	// #endregion Public Getters And Setters (10)
}
