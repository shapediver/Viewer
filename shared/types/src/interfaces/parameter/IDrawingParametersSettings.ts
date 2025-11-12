import {z} from "zod";
import {IMaterialBasicLineDataProperties} from "../data/material/IMaterialBasicLineData";
import {IMaterialMultiPointDataProperties} from "../data/material/IMaterialMultiPointData";
import {RestrictionDefinition} from "./IRestrictionSettings";

// #region Interfaces (2)

export type DrawingParameterValue = {
	points: number[][];
};

export interface IVisualizationSettings {
	// #region Properties (5)

	/**
	 * If the distance labels are shown.
	 * The distance labels display the distance between the points.
	 *
	 * @default true
	 */
	distanceLabels: boolean;
	/**
	 * The multiplication factor of the point size when interactions are performed.
	 * If the factor is set to 2, the point size is doubled when interacting.
	 *
	 * @default 2
	 */
	distanceMultiplicationFactor: number;
	/**
	 * The material properties of the lines.
	 */
	lines: IMaterialBasicLineDataProperties;
	/**
	 * If the point labels are shown.
	 * The point labels display the position of the points.
	 *
	 * @default false
	 */
	pointLabels: boolean;
	/**
	 * The material properties of the points.
	 */
	points: IMaterialMultiPointDataProperties;
	/**
	 * If the geometry restrictions should display a wireframe.
	 *
	 * This settings is only applied to geometry restrictions that
	 * do not have this settings defined already.
	 *
	 * @default undefined
	 */
	wireframe?: boolean;
	/**
	 * The color of the wireframe.
	 *
	 * This settings is only applied to geometry restrictions that
	 * do not have this settings defined already.
	 *
	 * @default undefined
	 */
	wireframeColor?: string;

	// #endregion Properties (5)
}

/**
 * General properties of a drawing tools parameter.
 */
export interface IDrawingParameterSettings {
	// #region Properties (2)

	geometry?: {
		/**
		 * The mode of the geometry.
		 *
		 * If the mode is set to 'lines', the points are connected in the order they are defined.
		 * If the mode is set to 'points', the points are not connected.
		 *
		 * @default 'lines'
		 */
		mode: "points" | "lines";

		/**
		 * The minimum amount of points, if undefined, the geometry is not restricted.
		 * This value is checked whenever the user tries to update or finish the drawing tool.
		 *
		 * @default undefined
		 */
		minPoints?: number;

		/**
		 * The maximum amount of points, if undefined, the geometry is not restricted.
		 * This value is checked whenever the user tries to update or finish the drawing tool.
		 *
		 * @default undefined
		 */
		maxPoints?: number;

		/**
		 * If the mode is set to 'lines', if it is a closed line or not.
		 * If the mode is set to 'points', this setting is ignored.
		 *
		 * A line can be closed by connecting the last point with the first point.
		 *
		 * @default true
		 */
		close: boolean;

		/**
		 * If the mode is set to 'lines', if the line is automatically closed.
		 * If the mode is set to 'points', this setting is ignored.
		 *
		 * The first and last point are always connected if the line is automatically closed.
		 *
		 * @default true
		 */
		autoClose: boolean;
	};
	restrictions?: RestrictionDefinition[];
	general?: {
		/** A prompt that can be defined which is displayed instead of the default prompt. */
		prompt?: {
			/** The title when the parameter is inactive. */
			inactiveTitle?: string;
			/** The title when the parameter is active. */
			activeTitle?: string;
			/** The text when the parameter is inactive. */
			activeText?: string;
		};
		options?: {
			/** If true, the distance labels are shown. (default: true) */
			showDistanceLabels?: boolean;
			/** If true, the point labels are shown. (default: false) */
			showPointLabels?: boolean;
			/** If true, the snapping to vertices is enabled, if there is a geometry restriction. (default: true) */
			snapToVertices?: boolean;
			/** If true, the snapping to edges is enabled, if there is a geometry restriction. (default: true) */
			snapToEdges?: boolean;
			/** If true, the snapping to faces is enabled, if there is a geometry restriction. (default: true) */
			snapToFaces?: boolean;
		};
	};
	display?: Partial<IVisualizationSettings>;

	// #endregion Properties (2)
}

// #endregion Interfaces (2)

// #region Variables (2)

const optionalBoolean = z.preprocess((val) => {
	if (val === "true") return true;
	if (val === "false") return false;
	if (val === null) return undefined;
	return val;
}, z.boolean().optional());

export const IDrawingParameterJsonSchema = z.object({
	geometry: z
		.object({
			mode: z.enum(["points", "lines"]),
			minPoints: z.number().nullable().optional(),
			maxPoints: z.number().nullable().optional(),
			strictMinMaxPoints: optionalBoolean,
			close: optionalBoolean,
			autoClose: optionalBoolean,
		})
		.nullable()
		.optional(),
	restrictions: z.array(z.any()).nullable().optional(),
	general: z
		.object({
			prompt: z
				.object({
					inactiveTitle: z.string().nullable().optional(),
					activeTitle: z.string().nullable().optional(),
					activeText: z.string().nullable().optional(),
				})
				.nullable()
				.optional(),
			options: z
				.object({
					showDistanceLabels: optionalBoolean,
					showPointLabels: optionalBoolean,
					snapToVertices: optionalBoolean,
					snapToEdges: optionalBoolean,
					snapToFaces: optionalBoolean,
				})
				.nullable()
				.optional(),
		})
		.nullable()
		.optional(),
	display: z
		.object({
			distanceLabels: optionalBoolean,
			distanceMultiplicationFactor: z.number().nullable().optional(),
			lines: z.any().nullable().optional(),
			points: z.any().nullable().optional(),
			wireframe: optionalBoolean,
			wireframeColor: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
});

export const validateDrawingParameterSettings = (param: unknown) => {
	return IDrawingParameterJsonSchema.safeParse(param);
};

// #endregion Variables (2)
