import {
	type IIntersectionDefinition,
	type IIntersectionFilter,
	type IRay} from "@shapediver/viewer.shared.types";
import * as THREE from "three";
import {SelectionBox} from "../implementation/SelectionBox";

export interface IIntersectionEngine {
	// #region Public Methods (1)

	intersect(
		ray: IRay,
		viewportId: string,
		filterCriteria?: IIntersectionFilter[],
		options?: {
			rayCasterParams?: THREE.RaycasterParameters;
			selectionBox?: SelectionBox;
		},
	): IIntersectionDefinition[];

	// #endregion Public Methods (1)
}
