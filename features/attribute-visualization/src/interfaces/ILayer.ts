import {type Color} from "@shapediver/viewer.shared.types";

export interface ILayer {
	// #region Properties (2)

	enabled: boolean;
	opacity: number;
	color: Color;

	// #endregion Properties (2)
}
