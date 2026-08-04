import {z} from "../../zod";

import {type IMaterialBasicLineDataPropertiesDefinition} from "../data/material/IMaterialBasicLineData";
import {type IMaterialMultiPointDataPropertiesDefinition} from "../data/material/IMaterialMultiPointData";
import {type RestrictionDefinition} from "./IRestrictionSettings";

export interface IControlSettings {}

/**
 * General properties of a drawing tools parameter.
 */
export interface IDrawingParameterSettings {
	/**
	 * The controls of the drawing tool.
	 *
	 * Here you can define the controls that are used when interacting with the drawing tool.
	 * Controls are used to manipulate the points of the drawing tool in specific ways, such as moving a point along an edge or within a plane defined by other points.
	 */
	controls?: IControlSettings[];
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
			/** If true, the pointer position is shown. (default: true) */
			showPointerPosition?: boolean;
			/** If true, the snapping to vertices is enabled, if there is a geometry restriction. (default: true) */
			snapToVertices?: boolean;
			/** If true, the snapping to edges is enabled, if there is a geometry restriction. (default: true) */
			snapToEdges?: boolean;
			/** If true, the snapping to faces is enabled, if there is a geometry restriction. (default: true) */
			snapToFaces?: boolean;
		};
		/** Which buttons are available for the interaction parameter. */
		buttons?: {
			/** When true, the clear button is available to reset the parameter. (default: true) */
			clear?: boolean;
		};
		/** The mode to determine when the parameter is active. (default: 'default') */
		activeMode?: "default" | "activeOnStart" | "alwaysActive";
		/** The presentation of the drawing tool. (default: 'toolbar') */
		presentation?: "widget" | "toolbar";
	};
	behavior?: {
		/**
		 * The unit that will be displayed in the distance and point labels.
		 * For some units, special formatting is applied ("mile", "feet", "inches", "kilometer", "meter", "centimeter", "millimeter"),
		 * for other units, the unit is simply appended to the value in the end.
		 *
		 * @default ''
		 */
		displayUnit?: string;

		/**
		 * If points can be translated by dragging them.
		 * If this setting is set to false, the user cannot move existing points by dragging them.
		 *
		 * The pointer is also not changed to a move pointer when hovering over points, since they cannot be moved.
		 *
		 * In this mode, the drawing tools are used for display purposes.
		 *
		 * @default true
		 */
		enableTranslation?: boolean;

		/**
		 * If points can be added in general.
		 * If this setting is set to false, the user cannot add new points by clicking or using the insert key.
		 *
		 * @default true
		 */
		enableInsertion?: boolean;

		/**
		 * If points can be deleted in general.
		 * If this setting is set to false, the user cannot delete points by using the delete key.
		 *
		 * @default true
		 */
		enableDeletion?: boolean;

		/**
		 * If points can be selected in general.
		 * If this setting is set to false, the user cannot select points by clicking or using the select key.
		 *
		 * @default true
		 */
		enableSelection?: boolean;
	};
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

		/**
		 * Per-point adjacency graph. When a real point is dragged, its corrected
		 * delta is propagated to each listed target via component-wise weight
		 * multiplication. Entries with all-zero weights are no-ops and can be omitted.
		 * Processing order follows the array declaration order.
		 */
		weightedAdjacency?: {
			to: number;
			weights: [number, number, number];
		}[][];

		/**
		 * The indices of points that are disabled. Disabled points cannot be moved, selected or deleted, but they can be inserted next to.
		 * This is useful for points that should be fixed in place, such as the endpoints of a line.
		 * The pointer is also not changed to a move pointer when hovering over disabled points, since they cannot be moved.
		 */
		disabledPoints?: number[];

		/**
		 * Constraints on the geometry. This can be used to restrict the movement of points to a specific area.
		 * The constraints are separated into position and size constraints, which can be defined per axis.
		 * Each constraint is defined as a tuple of two numbers, where the first number is the minimum value and the second number is the maximum value.
		 * If a number is number is not defined, there is no constraint on that axis.
		 *
		 * For the size constraints, the constraint is applied to the size of the geometry, which is defined as the distance between the furthest points in each axis.
		 */
		constraints?: {
			position?: {
				x?: [number, number];
				y?: [number, number];
				z?: [number, number];
			};
			size?: {
				x?: [number, number];
				y?: [number, number];
				z?: [number, number];
			};
		};
	};

	/**
	 * The key binding settings of the drawing tool.
	 *
	 * Here you can define which keys are used for the different actions of the drawing tool.
	 */
	keyBindings?: {
		/**
		 * The key that is used to insert a point.
		 *
		 * @default ['Insert','+']
		 */
		insert?: string | string[];

		/**
		 * The key that is used to delete a point.
		 *
		 * @default ['Delete','-']
		 */
		delete?: string | string[];

		/**
		 * The key that is used to confirm actions.
		 *
		 * @default 'Enter'
		 */
		confirm?: string | string[];

		/**
		 * The key that is used to cancel drawing.
		 *
		 * @default 'Escape'
		 */
		cancel?: string | string[];

		/**
		 * The keys that are used to undo the last action.
		 *
		 * @default 'Control+Z'
		 */
		undo?: string | string[];

		/**
		 * The keys that are used to redo the last action.
		 *
		 * @default 'Control+Y'
		 */
		redo?: string | string[];
	};
	restrictions?: RestrictionDefinition[];
	visualization?: Partial<IVisualizationSettings>;
}

export interface IVisualizationSettings {
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
	 * The visualization settings for the edge control of the geometry restrictions.
	 * If not defined, the edge control visualization is determined by the general line and point visualization settings.
	 */
	edgeControlVisualization?: Pick<
		Partial<IVisualizationSettings>,
		"points" | "lines"
	>;

	/**
	 * The material properties of the lines.
	 */
	lines: IMaterialBasicLineDataPropertiesDefinition;

	/**
	 * If the point labels are shown.
	 * The point labels display the position of the points.
	 *
	 * @default false
	 */
	pointLabels: boolean;

	/**
	 * If the pointer position is shown.
	 * The pointer position displays the position of the pointer.
	 *
	 * @default true
	 */
	pointerPosition: boolean;

	/**
	 * The material properties of the points.
	 */
	points: IMaterialMultiPointDataPropertiesDefinition;

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
}

export type DrawingParameterValue = {
	points: number[][];
};

export const validateDrawingParameterSettings = (param: unknown) => {
	return IDrawingParameterJsonSchema.safeParse(param);
};

const optionalBoolean = z.preprocess((val) => {
	if (val === "true") return true;
	if (val === "false") return false;
	if (val === null) return undefined;
	return val;
}, z.boolean().optional());

export const IDrawingParameterVisualizationSettingsJsonSchema = z
	.object({
		distanceLabels: optionalBoolean,
		pointLabels: optionalBoolean,
		pointerPosition: optionalBoolean,
		distanceMultiplicationFactor: z.number().nullable().optional(),
		lines: z.any().nullable().optional(),
		points: z.any().nullable().optional(),
		wireframe: optionalBoolean,
		wireframeColor: z.string().nullable().optional(),
		edgeControlVisualization: z
			.object({
				lines: z.any().nullable().optional(),
				points: z.any().nullable().optional(),
			})
			.nullable()
			.optional(),
	})
	.nullable()
	.optional();
const stringOrStringArray = z
	.union([z.string(), z.array(z.string())])
	.optional();

export const IDrawingParameterJsonSchema = z.object({
	controls: z.array(z.any()).nullable().optional(),
	geometry: z
		.object({
			mode: z.enum(["points", "lines"]),
			minPoints: z.number().nullable().optional(),
			maxPoints: z.number().nullable().optional(),
			strictMinMaxPoints: optionalBoolean,
			close: optionalBoolean,
			autoClose: optionalBoolean,
			weightedAdjacency: z
				.array(
					z.array(
						z.object({
							to: z.number(),
							weights: z.tuple([
								z.number(),
								z.number(),
								z.number(),
							]),
						}),
					),
				)
				.nullable()
				.optional(),
			disabledPoints: z.array(z.number()).nullable().optional(),
			constraints: z
				.object({
					position: z
						.object({
							x: z
								.tuple([z.number(), z.number()])
								.nullable()
								.optional(),
							y: z
								.tuple([z.number(), z.number()])
								.nullable()
								.optional(),
							z: z
								.tuple([z.number(), z.number()])
								.nullable()
								.optional(),
						})
						.nullable()
						.optional(),
					size: z
						.object({
							x: z
								.tuple([z.number(), z.number()])
								.nullable()
								.optional(),
							y: z
								.tuple([z.number(), z.number()])
								.nullable()
								.optional(),
							z: z
								.tuple([z.number(), z.number()])
								.nullable()
								.optional(),
						})
						.nullable()
						.optional(),
				})
				.nullable()
				.optional(),
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
					showPointerPosition: optionalBoolean,
					snapToVertices: optionalBoolean,
					snapToEdges: optionalBoolean,
					snapToFaces: optionalBoolean,
				})
				.nullable()
				.optional(),
			buttons: z
				.object({
					clear: optionalBoolean,
				})
				.nullable()
				.optional(),
			activeMode: z
				.enum(["default", "activeOnStart", "alwaysActive"])
				.optional(),
			presentation: z.enum(["widget", "toolbar"]).optional(),
		})
		.nullable()
		.optional(),
	behavior: z
		.object({
			displayUnit: z.string().nullable().optional(),
			enableTranslation: optionalBoolean,
			enableInsertion: optionalBoolean,
			enableDeletion: optionalBoolean,
			enableSelection: optionalBoolean,
		})
		.nullable()
		.optional(),
	keyBindings: z
		.object({
			insert: stringOrStringArray,
			delete: stringOrStringArray,
			confirm: stringOrStringArray,
			cancel: stringOrStringArray,
			undo: stringOrStringArray,
			redo: stringOrStringArray,
		})
		.nullable()
		.optional(),
	visualization: IDrawingParameterVisualizationSettingsJsonSchema,
});
