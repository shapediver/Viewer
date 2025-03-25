import {Color} from "@shapediver/viewer.shared.types";
import {LIGHT_TYPE} from "../../interface/ILight";
import {IHemisphereLight} from "../../interface/types/IHemisphereLight";
import {AbstractLight} from "../AbstractLight";

export class HemisphereLight extends AbstractLight implements IHemisphereLight {
	// #region Properties (1)

	#groundColor: Color = "#000000";

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(properties: {
		color?: Color;
		groundColor?: Color;
		intensity?: number;
		name?: string;
		order?: number;
		id?: string;
		version?: string;
	}) {
		super({
			color: properties.color || "#ffffff",
			intensity:
				properties.intensity !== undefined ? properties.intensity : 1,
			type: LIGHT_TYPE.HEMISPHERE,
			name: properties.name,
			order: properties.order,
			id: properties.id,
			version: properties.version,
		});

		if (properties.groundColor) this.#groundColor = properties.groundColor;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (2)

	public get groundColor(): Color {
		return this.#groundColor;
	}

	public set groundColor(value: Color) {
		this.#groundColor = value;
		this.updateVersion();
		if (this.parentNode) this.parentNode.updateVersion();
	}

	// #endregion Public Getters And Setters (2)

	// #region Public Methods (1)

	public clone(): IHemisphereLight {
		return new HemisphereLight({
			color: this.color,
			groundColor: this.groundColor,
			intensity: this.intensity,
			name: this.name,
			order: this.order,
			id: this.id,
			version: this.version,
		});
	}

	// #endregion Public Methods (1)
}
