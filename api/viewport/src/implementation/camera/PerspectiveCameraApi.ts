import {type IPerspectiveCamera} from "@shapediver/viewer.rendering-engine.camera-engine";
import {InputValidator, Logger} from "@shapediver/viewer.shared.services";
import {type IPerspectiveCameraApi} from "../../interfaces/camera/IPerspectiveCameraApi";
import {type IViewportApi} from "../../interfaces/IViewportApi";
import {AbstractCameraApi} from "./AbstractCameraApi";

export class PerspectiveCameraApi
	extends AbstractCameraApi
	implements IPerspectiveCameraApi
{
	// #region Properties (4)

	readonly #camera: IPerspectiveCamera;
	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #viewportApi: IViewportApi;

	// #endregion Properties (4)

	// #region Constructors (1)

	constructor(viewportApi: IViewportApi, camera: IPerspectiveCamera) {
		super(viewportApi, camera);
		this.#viewportApi = viewportApi;
		this.#camera = camera;
		this.scope = "PerspectiveCameraApi";
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (2)

	public get fov(): number {
		return this.#camera.fov;
	}

	public set fov(value: number) {
		const scope = "fov";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.fov = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	// #endregion Public Getters And Setters (2)
}
