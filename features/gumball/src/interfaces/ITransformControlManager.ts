import {IDomEventListener} from "@shapediver/viewer";
import {RestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";

export interface ITransformControlManager extends IDomEventListener {
	/**
	 * Check if the Transformations Controls are currently active.
	 */
	readonly closed: boolean;

	/**
	 * Show or hide the Transformation Controls.
	 */
	show: boolean;

	/**
	 * Close the transform controls and remove it from the viewport.
	 */
	close(): void;
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
	 * Restrictions that are applied to the transformation. (default: {})
	 * The key of the restriction is used to identify the restriction and can be used to update or remove the restriction later on.
	 * The value is the properties of the restriction. The type of the restriction is determined by the "type" property of the restriction properties.
	 */
	restrictions: Partial<{[key: string]: RestrictionProperties}>;

	/**
	 * Reuse the transformation that are already applied to the nodes. (default: true)
	 */
	reuseTransformation: boolean;

	/**
	 * The scale of the Transformation Controls compared to the screen size. (default: 0.15)
	 */
	scale: number;
	/**
	 * The space in which the Transformation Controls operates. (default: 'local')
	 */
	space: "local" | "world";
};

export type SettingsOptional = Partial<Settings>;
