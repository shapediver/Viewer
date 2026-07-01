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
	 * Show or hide the Transformation Tools.
	 */
	show: boolean;

	/**
	 * Close the transformation tools and remove it from the viewport.
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
};

export type SettingsOptional = Partial<Settings>;
