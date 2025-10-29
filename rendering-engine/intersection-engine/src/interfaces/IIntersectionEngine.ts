import {
	IIntersectionDefinition,
	IIntersectionFilter,
	IRay,
} from "@shapediver/viewer.shared.types";
import * as THREE from "three";

export interface IIntersectionEngine {
	// #region Public Methods (1)

	intersect(
		ray: IRay,
		viewportId: string,
		filterCriteria?: IIntersectionFilter[],
		options?: {
			rayCasterParams?: THREE.RaycasterParameters;
			selectionBoxCoordinates?: {
				start: {x: number; y: number};
				end: {x: number; y: number};
			};
		},
	): IIntersectionDefinition[];

	// #endregion Public Methods (1)
}
