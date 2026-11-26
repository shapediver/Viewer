import {
	type IVisualizationSettings,
	type PlaneRestrictionProperties,
	type RestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	type ITransformationToolsManager,
	type Settings} from "../ITransformationToolsManager";

export interface IRectangleTransform extends ITransformationToolsManager {
	/**
	 * Whether this rectangle transform is a preview, see
	 * {@link RectangleTransformSettings.preview} and {@link promote}.
	 */
	readonly preview: boolean;

	/**
	 * Whether the pointer of the event is over the area of this rectangle
	 * transform: its objects, its rectangle, its handles, and the gap up to
	 * the rotation handle. False while hidden (see {@link show}).
	 */
	containsPointer(event: PointerEvent): boolean;

	/**
	 * Whether a handle, the plane or (with
	 * {@link RectangleTransformSettings.translateOnObjects}) an object of this
	 * rectangle transform is under the pointer of the event, regardless of
	 * the other tools. False while hidden or paused.
	 */
	hitsPointer(event: PointerEvent): boolean;

	/**
	 * Turn a preview into a regular rectangle transform with the given id
	 * (the id of the events it sends), e.g. once a gesture on the preview
	 * selected its object (see EVENTTYPE_TRANSFORMATION_TOOLS.GESTURE_START).
	 * A gesture in progress continues.
	 */
	promote(id: string): void;

	/**
	 * Place the rectangle transform on other nodes, e.g. move a preview to
	 * the hovered object instead of creating a new one. The transformation
	 * starts from the current placement of the nodes, like for a new
	 * rectangle transform. A gesture in progress is cancelled.
	 *
	 * @param nodes the new nodes
	 * @param restrictions replace the restrictions of the translation
	 * (see {@link Settings.restrictions}), the current ones are kept if
	 * undefined
	 */
	setNodes(
		nodes: ITreeNode[],
		restrictions?: Partial<{[key: string]: RestrictionProperties}>,
	): void;

	/**
	 * Start the translation with a gesture which started before this
	 * rectangle transform existed, e.g. the press which selected its object
	 * (on touch there is no hover to show a preview before the press). The
	 * translation starts at the position of the event and follows the
	 * pointer until it is released, like a press on the plane.
	 *
	 * @param event the pointerdown of the gesture
	 * @returns false if the translation did not start, e.g. the pointer was
	 * released already, the rectangle transform is paused or hidden, or the
	 * translation is disabled.
	 */
	startTranslation(event: PointerEvent): boolean;
}

export type RectangleTransformSettings = {
	/**
	 * Create the rectangle transform as a preview (default: false): a
	 * rectangle shown while the pointer hovers an object, before it is
	 * selected. A preview
	 * - sends EVENTTYPE_TRANSFORMATION_TOOLS.HOVER_CHANGED when the pointer
	 *   leaves or enters its area (see {@link IRectangleTransform.containsPointer}),
	 * - does not claim the hover, so its objects keep their hover effect,
	 * - gives a press to a rectangle transform of the viewport which is not
	 *   a preview where they overlap (its objects still compete by distance).
	 * A gesture on a preview sends EVENTTYPE_TRANSFORMATION_TOOLS.GESTURE_START
	 * like any rectangle transform, see {@link IRectangleTransform.promote}.
	 */
	preview?: boolean;
	/**
	 * A press on the transformed objects starts the translation too, not
	 * only a press on the plane, and the camera does not move (default:
	 * false). With this setting a press becomes a drag once the pointer moved
	 * by 4 CSS px (mouse and pen) or 10 CSS px (touch) from the pointerdown;
	 * a shorter press changes nothing.
	 */
	translateOnObjects?: boolean;
	/**
	 * The plane restriction for the RectangleTransform.
	 * This is required for the RectangleTransform to work, as it determines the plane on which the RectangleTransform will be displayed and interacted with.
	 */
	plane: PlaneRestrictionProperties;
	/**
	 * Options to disable specific points of the rectangle.
	 * Disabled points are not interactive but still visible as locked handles.
	 * By default, all points are enabled.
	 */
	corners?: {
		bottomLeft?: boolean;
		bottomRight?: boolean;
		topRight?: boolean;
		topLeft?: boolean;
	};
	/**
	 * Options to disable specific edgeControls of the rectangle.
	 * Disabled edgeControls are not interactive but still visible as locked handles.
	 * By default, all edgeControls are enabled.
	 */
	edgeControls?: {
		top?: boolean;
		bottom?: boolean;
		left?: boolean;
		right?: boolean;
	};
	/**
	 * Scaling options for the RectangleTransform.
	 */
	scaling?: {
		/**
		 * If true, the RectangleTransform will maintain a uniform scale, meaning it will scale equally in all directions based on the average of the local x and y scales.
		 * If false or undefined, the RectangleTransform will scale independently in the local x and y directions.
		 * Default is false (non-uniform scaling).
		 */
		uniform?: boolean;
		/**
		 * The minimum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no minimum length).
		 */
		uMin?: number;
		/**
		 * The maximum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no maximum length).
		 */
		uMax?: number;
		/**
		 * The minimum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no minimum length).
		 */
		vMin?: number;
		/**
		 * The maximum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no maximum length).
		 */
		vMax?: number;
		/**
		 * The step size for scaling in the local x and y directions. The step is provided in world units.
		 * With this setting, it's possible to snap the scaling to specific increments.
		 * Default is undefined (no snapping).
		 */
		step?: number;
		/**
		 * The visualization settings for the main scaling handles and the outline.
		 * This allows customizing the appearance of the scaling handles and the outline, such as their color, size, and shape.
		 * Default is undefined (uses default visualization settings).
		 */
		visualization?: Partial<IVisualizationSettings>;
	};
	rotation?: {
		/**
		 * The step size for rotation around the plane normal. The step is provided in degrees for easier configuration but will be converted to radians internally.
		 * With this setting, it's possible to snap the rotation to specific increments.
		 * Default is undefined (no snapping).
		 */
		step?: number;
		/**
		 * The threshold for snapping during rotation around the plane normal. With this setting, it's possible to define how close the rotation needs to be to a snap point for it to snap.
		 * Default is undefined (no snapping threshold).
		 */
		stepThreshold?: number;
		/**
		 * The minimum allowed rotation angle around the plane normal. The angle is provided in degrees for easier configuration but will be converted to radians internally.
		 * With this setting, it's possible to restrict the rotation to a certain range.
		 * Default is undefined (no minimum angle).
		 */
		min?: number;
		/**
		 * The maximum allowed rotation angle around the plane normal. The angle is provided in degrees for easier configuration but will be converted to radians internally.
		 * With this setting, it's possible to restrict the rotation to a certain range.
		 * Default is undefined (no maximum angle).
		 */
		max?: number;
		/**
		 * Distance of the rotation handle above the top edge of the rectangle, expressed as a fraction of the rectangle's height.
		 * Default is 0.25.
		 */
		handleDistance?: number;
		/**
		 * The visualization settings for the rotation handle.
		 * This allows customizing the appearance of the rotation handle, such as its color, size, and shape.
		 * Default is undefined (uses default visualization settings).
		 */
		visualization?: Partial<IVisualizationSettings>;
	};
} & Settings;

export type RectangleTransformSettingsOptional =
	Partial<RectangleTransformSettings>;
