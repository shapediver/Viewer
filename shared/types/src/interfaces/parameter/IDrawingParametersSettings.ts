import {z} from "zod";
import {RestrictionDefinition} from "./IRestrictionSettings";

// #region Interfaces (2)

export type DrawingParameterValue = {
	points: number[][];
};

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
			minPoints: z.number().optional(),
			maxPoints: z.number().optional(),
			strictMinMaxPoints: optionalBoolean,
			close: optionalBoolean,
			autoClose: optionalBoolean,
		})
		.optional(),
	restrictions: z.array(z.any()).optional(),
	general: z
		.object({
			prompt: z
				.object({
					inactiveTitle: z.string().optional(),
					activeTitle: z.string().optional(),
					activeText: z.string().optional(),
				})
				.optional(),
			options: z
				.object({
					showDistanceLabels: optionalBoolean,
					showPointLabels: optionalBoolean,
					snapToVertices: optionalBoolean,
					snapToEdges: optionalBoolean,
					snapToFaces: optionalBoolean,
				})
				.optional(),
		})
		.optional(),
});

export const validateDrawingParameterSettings = (param: unknown) => {
	return IDrawingParameterJsonSchema.safeParse(param);
};

// #endregion Variables (2)
