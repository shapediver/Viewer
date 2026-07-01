import {type IAmbientLight} from "@shapediver/viewer.rendering-engine.light-engine";
import {type IViewportApi} from "../../../interfaces/IViewportApi";
import {type IAmbientLightApi} from "../../../interfaces/lights/types/IAmbientLightApi";
import {AbstractLightApi} from "../AbstractLightApi";

export class AmbientLightApi
	extends AbstractLightApi
	implements IAmbientLightApi
{
	// #region Properties (2)

	readonly #light: IAmbientLight;
	readonly #viewportApi: IViewportApi;

	// #endregion Properties (2)

	// #region Constructors (1)

	constructor(viewportApi: IViewportApi, light: IAmbientLight) {
		super(viewportApi, light);
		this.#viewportApi = viewportApi;
		this.#light = light;
		this.scope = "AmbientLightApi";
	}

	// #endregion Constructors (1)
}
