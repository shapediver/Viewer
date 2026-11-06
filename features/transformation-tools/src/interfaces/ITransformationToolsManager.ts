import {type IDomEventListener} from "@shapediver/viewer";
import {type RestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";

export interface ITransformationToolsManager extends IDomEventListener {
	/**
	 * Check if the Transformations Tools are currently active.
	 */
	readonly closed: boolean;

	/**
	 * The id of the transformation tools instance.
	 * This can be used to identify the transformation tools instance and is useful when working with multiple transformation tools instances.
	 */
	readonly id: string;

	/**
	 * Whether the Transformation Tools are paused: by {@link pause}, or while
	 * the viewport is busy if {@link pauseWhileBusy} is set. A change of the
	 * busy mode (and the setting at creation) is applied asynchronously, right
	 * after the current call stack.
	 */
	readonly paused: boolean;

	/**
	 * Pause the Transformation Tools while the viewport is busy (busy mode,
	 * e.g. a session computes), like {@link pause}; they continue when the
	 * busy mode ends (unless paused by {@link pause}). (default: false, see
	 * also the setting of the same name)
	 */
	pauseWhileBusy: boolean;

	/**
	 * Show or hide the Transformation Tools.
	 */
	show: boolean;

	/**
	 * Close the transformation tools and remove it from the viewport.
	 */
	close(): void;

	/**
	 * Pause the Transformation Tools, e.g. while a computation runs: they stay
	 * visible, but ignore all user interactions until {@link continue} is
	 * called. A transformation in progress is cancelled: the nodes return to
	 * their placement before it, without a matrix change being reported. The
	 * camera is not affected. See also {@link pauseWhileBusy}.
	 */
	pause(): void;

	/**
	 * Resume the Transformation Tools after {@link pause} (they stay paused
	 * while the viewport is busy if {@link pauseWhileBusy} is set).
	 */
	continue(): void;
}

export type Settings = {
	/**
	 * Enable or disable rotation. (default: true)
	 */
	enableRotation: boolean;

	/**
	 * Enable or disable scaling. (default: true)
	 */
	enableScaling: boolean;

	/**
	 * Enable or disable translation. (default: true)
	 */
	enableTranslation: boolean;

	/**
	 * Pause the Transformation Tools while the viewport is busy, see
	 * {@link ITransformationToolsManager.pauseWhileBusy}. (default: false)
	 */
	pauseWhileBusy: boolean;

	/**
	 * Restrictions that are applied to the transformation. (default: {})
	 * The key of the restriction is used to identify the restriction and can be used to update or remove the restriction later on.
	 * The value is the properties of the restriction. The type of the restriction is determined by the "type" property of the restriction properties.
	 */
	restrictions: Partial<{[key: string]: RestrictionProperties}>;

	/**
	 * Reuse the transformation that are already applied to the nodes. (default: true)
	 */
	reuseTransformation: boolean;
};

export type SettingsOptional = Partial<Settings>;
