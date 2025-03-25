import {
	IOrthographicCamera,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
} from "@shapediver/viewer.rendering-engine.camera-engine";
import {InputValidator, Logger} from "@shapediver/viewer.shared.services";
import {IOrthographicCameraApi} from "../../interfaces/camera/IOrthographicCameraApi";
import {IViewportApi} from "../../interfaces/IViewportApi";
import {AbstractCameraApi} from "./AbstractCameraApi";

export class OrthographicCameraApi
	extends AbstractCameraApi
	implements IOrthographicCameraApi
{
	// #region Properties (4)

	readonly #camera: IOrthographicCamera;
	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #viewportApi: IViewportApi;

	// #endregion Properties (4)

	// #region Constructors (1)

	constructor(viewportApi: IViewportApi, camera: IOrthographicCamera) {
		super(viewportApi, camera);
		this.#viewportApi = viewportApi;
		this.#camera = camera;
		this.scope = "OrthographicCameraApi";
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (2)

	public get direction(): ORTHOGRAPHIC_CAMERA_DIRECTION {
		return this.#camera.direction;
	}

	public set direction(value: ORTHOGRAPHIC_CAMERA_DIRECTION) {
		const scope = "direction";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"enum",
			true,
			Object.values(ORTHOGRAPHIC_CAMERA_DIRECTION),
		);
		this.#camera.direction = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	// #endregion Public Getters And Setters (2)
}
