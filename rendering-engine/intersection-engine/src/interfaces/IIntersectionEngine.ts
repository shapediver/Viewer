import {
	IIntersection,
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
		rayCasterParams?: THREE.RaycasterParameters,
	): IIntersection[];

	// #endregion Public Methods (1)
}
