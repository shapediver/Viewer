import {type IRay} from "@shapediver/viewer.shared.types";
import {
	type DraggingRestrictionMetaData,
	type DrawingRestrictionMetaData,
	type IRestriction,
	type RayTraceResult,
	type RestrictionProperties,
	type TransformationToolsRestrictionMetaData} from "./IRestriction";

export interface IRestrictionManager {
	// #region Properties (2)

	readonly restrictions: {[token: string]: IRestriction};

	showRestrictionVisualization: boolean;

	// #endregion Properties (2)

	// #region Public Methods (5)

	addRestriction(properties: RestrictionProperties): string | undefined;
	close(): void;
	getRestriction(token: string): IRestriction | undefined;
	rayTrace(
		ray: IRay,
		metaData?:
			| DrawingRestrictionMetaData
			| DraggingRestrictionMetaData
			| TransformationToolsRestrictionMetaData,
	): RayTraceResult | undefined;
	removeRestriction(token: string): boolean;

	// #endregion Public Methods (5)
}
