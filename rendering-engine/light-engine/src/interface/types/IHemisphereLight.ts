import {type Color} from "@shapediver/viewer.shared.types";

import {type ILight} from "../ILight";

export interface IHemisphereLight extends ILight {
	groundColor: Color;

	clone(): IHemisphereLight;
}
