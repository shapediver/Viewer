// #region Type aliases (2)

export type RestrictionDefinition =
	| IPointRestrictionDefinition
	| ILineRestrictionDefinition
	| IPlaneRestrictionDefinition
	| ICameraPlaneRestrictionDefinition
	| IGeometryRestrictionDefinition;
/**
 * Rotation defined by an angle and an axis.
 */
export type Rotation = {
	/** The angle of the rotation. */
	angle: number;
	/** The axis of the rotation. */
	axis: number[];
};

// #endregion Type aliases (2)

// #region Interfaces (6)

interface ICameraPlaneRestrictionDefinition extends IRestrictionDefinition {
	// #region Properties (1)

	type: "camera_plane";

	// #endregion Properties (1)
}

interface IGeometryRestrictionDefinition extends IRestrictionDefinition {
	// #region Properties (2)

	/** The name filter for the objects that can be dragged with the defined settings. */
	nameFilter: string[];
	type: "geometry";

	// #endregion Properties (2)
}

interface ILineRestrictionDefinition extends IRestrictionDefinition {
	// #region Properties (4)

	/** The first point of the restriction. */
	point1: number[];
	/** The second point of the restriction. */
	point2: number[];
	/** The radius of the restriction. */
	radius: number;
	type: "line";

	// #endregion Properties (4)
}

interface IPlaneRestrictionDefinition extends IRestrictionDefinition {
	// #region Properties (4)

	/** The origin of the plane. */
	origin: number[];
	type: "plane";
	/** The first vector of the plane. */
	vector_u: number[];
	/** The second vector of the plane. */
	vector_v: number[];
	/** Optional grid snap restriction properties. */
	gridSnapRestriction?: {
		/** Size of the grid unit. */
		gridUnit?: number;
	};
	// #endregion Properties (4)
}

interface IPointRestrictionDefinition extends IRestrictionDefinition {
	// #region Properties (3)

	/** The point of the restriction. */
	point: number[];
	/** The radius of the restriction. */
	radius: number;
	type: "point";

	// #endregion Properties (3)
}

interface IRestrictionDefinition {
	// #region Properties (3)

	/** The unique id of the restriction. */
	id: string;
	/** Optional rotation of the restriction. */
	rotation?: Rotation;
	/** The type of the restriction. */
	type: "point" | "line" | "plane" | "camera_plane" | "geometry";

	// #endregion Properties (3)
}

// #endregion Interfaces (6)
