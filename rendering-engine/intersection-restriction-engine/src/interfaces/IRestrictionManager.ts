import {IRay} from "@shapediver/viewer.shared.types";
import {
	DraggingRestrictionMetaData,
	DrawingRestrictionMetaData,
	GumballRestrictionMetaData,
	IRestriction,
	RayTraceResult,
	RestrictionProperties,
} from "./IRestriction";

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
			| GumballRestrictionMetaData,
	): RayTraceResult | undefined;
	removeRestriction(token: string): boolean;

	// #endregion Public Methods (5)
}
