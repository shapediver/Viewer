import {
	IRestriction,
	IVisualizationSettings,
	RayTraceResult,
	RestrictionProperties,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {IMapData} from "@shapediver/viewer.shared.types";

import {vec3} from "gl-matrix";

import {IControl} from "./controls/IControl";

export enum MATERIAL_INDEX {
	DEFAULT = 0,
	HOVERED = 1,
	SELECTED = 2,
	SELECTED_HOVERED = 3,
	INSERTION = 4,
	INSERTION_HOVERED = 5,
	DISABLED = 6,
}

export interface IDrawingToolsManager {
	readonly closed: boolean;
	readonly paused: boolean;
	readonly restrictions: {[key: string]: IRestriction};
	readonly uuid: string;

	showDistanceLabels: boolean;
	showPointLabels: boolean;
	showPointerPosition: boolean;

	pause(): void;
	continue(): void;
	addPoint(
		index: number,
		position?: vec3,
		metaData?: RayTraceResult,
		temporary?: boolean,
	): void;
	addRestriction(
		properties: RestrictionProperties,
		token?: string,
	): string | undefined;
	canRedo(): boolean;
	canUndo(): boolean;
	cancel(): void;
	cancelDrag(): void;
	close(): void;
	getPointsData(): PointsData;
	isInteractionActive(): boolean;
	movePoint(
		index: number,
		position: vec3,
		metaData?: RayTraceResult,
		temporary?: boolean,
		skipConstraints?: boolean,
	): void;
	redo(): void;
	removePoint(index: number, temporary?: boolean): void;
	removePoints(indices: number[]): void;
	removeRestriction(token: string): void;
	undo(): void;
	update(): {
		pointsData: PointsData;
		metaData: (RayTraceResult | undefined)[];
	} | void;
}

/**
 * Per-axis propagation weight from one point to another in local space.
 * When a point is dragged, its delta is multiplied component-wise by these
 * weights before being added to the target point's position.
 */
export type AdjacencyEntry = {
	/**
	 * Whether the weights are applied in the DT's plane local space (U/V/N axes)
	 * or directly to world-space delta XYZ components.
	 * Default is "world".
	 */
	space?: "local" | "world";
	to: number;
	weights: [number, number, number];
};

/**
 * The callbacks of the drawing tool.
 *
 * Here you can define the callbacks that are used when interacting with the drawing tool.
 *
 * @typedef Callbacks
 */
export type Callbacks = {
	/**
	 * The callback that is called when the drawing tool is cancelled.
	 */
	onCancel(): void;

	/**
	 * The callback that is called when the drawing tool is updated.
	 *
	 * @param pointsData The points data of the drawing tool.
	 */
	onUpdate(
		pointsData: PointsData,
		metaData: (RayTraceResult | undefined)[],
	): void;
};

export type DefaultTextures = {
	[key: string]: Promise<IMapData> | IMapData;
};

/**
 * The data of the points.
 * The points are defined as an array of arrays, where each array contains the x, y and z coordinates of the point.
 *
 * @example [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]]
 * @typedef PointsData
 */
export type PointsData = number[][];

/**
 * The initial settings of the drawing tool.
 * Here you can define the initial settings of the drawing tool.
 *
 * @typedef Settings
 *
 */
export type Settings = {
	/**
	 * The controls of the drawing tool.
	 *
	 * Here you can define the controls that are used when interacting with the drawing tool.
	 * Controls are used to manipulate the points of the drawing tool in specific ways, such as moving a point along an edge or within a plane defined by other points.
	 */
	controls?: IControl[];

	/**
	 * The general settings of the drawing tool.
	 *
	 * Here you can define general settings of the drawing tool.
	 */
	general: {
		/**
		 * If the drawing tool is started automatically when no points are defined.
		 *
		 * @default true
		 */
		autoStart: boolean;

		/**
		 * If the drawing tool is updated automatically when the drawing is changed.
		 *
		 * @default false
		 */
		autoUpdate: boolean;
		/**
		 * If the drawing tool is closed when the drawing is updated.
		 *
		 * @default false
		 */
		closeOnUpdate: boolean;

		/**
		 * The unit that will be displayed in the distance and point labels.
		 *
		 * @default ''
		 */
		displayUnit: string;

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
		enableTranslation: boolean;

		/**
		 * If points can be added in general.
		 * If this setting is set to false, the user cannot add new points by clicking or using the insert key.
		 *
		 * @default true
		 */
		enableInsertion: boolean;

		/**
		 * If points can be deleted in general.
		 * If this setting is set to false, the user cannot delete points by using the delete key.
		 *
		 * @default true
		 */
		enableDeletion: boolean;

		/**
		 * If points can be selected in general.
		 * If this setting is set to false, the user cannot select points by clicking or using the select key.
		 *
		 * @default true
		 */
		enableSelection: boolean;
	};

	/**
	 * The geometry settings of the drawing tool.
	 *
	 * Here you can define the points, the mode and specific details of the geometry.
	 */
	geometry: {
		/**
		 * The points that are used when starting the drawing tool.
		 * The points are defined as an array of arrays, where each array contains the x, y and z coordinates of the point.
		 *
		 * If the mode is set to 'lines', the points are connected in the order they are defined.
		 * If the mode is set to 'points', the points are not connected.
		 *
		 * @default []
		 * @example [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]]
		 */
		points: PointsData;

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
		 * If the number of points is strictly checked during the drawing process.
		 * If this setting is set to true, once the minimum or maximum amount of points is reached, the user cannot add or remove points that would violate the restriction.
		 * If this setting is set to false, the user can add or remove points even if the minimum or maximum amount of points is exceeded temporarily.
		 * Once the user tries to update or finish the drawing tool, the amount of points is checked in either case.
		 *
		 * @default true
		 */
		strictMinMaxPoints?: boolean;

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
		weightedAdjacency?: AdjacencyEntry[][];

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
	keyBindings: {
		/**
		 * The key that is used to insert a point.
		 *
		 * @default ['Insert','+']
		 */
		insert: string | string[];

		/**
		 * The key that is used to delete a point.
		 *
		 * @default ['Delete','-']
		 */
		delete: string | string[];

		/**
		 * The key that is used to confirm actions.
		 *
		 * @default 'Enter'
		 */
		confirm: string | string[];

		/**
		 * The key that is used to cancel drawing.
		 *
		 * @default 'Escape'
		 */
		cancel: string | string[];

		/**
		 * The keys that are used to undo the last action.
		 *
		 * @default 'Control+Z'
		 */
		undo: string | string[];

		/**
		 * The keys that are used to redo the last action.
		 *
		 * @default 'Control+Y'
		 */
		redo: string | string[];
	};

	/**
	 * The restrictions of the drawing tool.
	 *
	 * Here you can define the restrictions that are used when interacting with the drawing tool.
	 * At least one restriction is required, the plane restriction is added by default if no restrictions are defined.
	 */
	restrictions: {[key: string]: RestrictionProperties};

	/**
	 * The visualization settings of the drawing tool.
	 *
	 * Here you can define the visualization of the drawing tool.
	 */
	visualization: IVisualizationSettings;
};

export type SettingsOptional = {
	controls?: Partial<Settings["controls"]>;
	general?: Partial<Settings["general"]>;
	geometry?: Partial<Settings["geometry"]>;
	keyBindings?: Partial<Settings["keyBindings"]>;
	restrictions?: Partial<Settings["restrictions"]>;
	visualization?: Partial<Settings["visualization"]>;
};
