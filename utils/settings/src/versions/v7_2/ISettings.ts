import {type ISettingsV7_1} from "../..";
import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {type IPostProcessingEffectsArray} from "./IPostProcessingEffectSettings";

/**
 * How the environment map is used by physically based materials.
 * Settings converted from before 7.2 use "legacy".
 */
export type IEnvironmentMapPbrMode = "legacy" | "modern";

/**
 * Orientation convention of the environment map.
 * Settings converted from before 7.2 use "legacy".
 */
export type IEnvironmentMapOrientation = "legacy" | "threejs";

/**
 * How gems are traced: against a sphere approximation or against the facet planes.
 * Settings converted from before 7.2 use "sphere".
 */
export type IGemTracing = "sphere" | "facets";

/**
 * Resolution in pixels of the gem normal maps.
 * Settings converted from before 7.2 use 1024.
 */
export type IGemNormalMapResolution = 256 | 512 | 1024;

/**
 * A drawing buffer size in physical pixels. Both values are whole numbers of at least 1.
 */
export type IRenderingSize = {width: number; height: number};

export interface ISettings extends IGlobalSettings {
	ar: ISettingsV7_1["ar"];
	camera: ISettingsV7_1["camera"];
	environment: ISettingsV7_1["environment"] & {
		mapPbrMode: IEnvironmentMapPbrMode;
		mapOrientation: IEnvironmentMapOrientation;
	};
	environmentGeometry: ISettingsV7_1["environmentGeometry"];
	general: ISettingsV7_1["general"];
	light: ISettingsV7_1["light"];
	postprocessing: Omit<ISettingsV7_1["postprocessing"], "effects"> & {
		effects: IPostProcessingEffectsArray;
		/**
		 * Whether the post processing renders in high dynamic range.
		 * Settings converted from before 7.2 use false.
		 */
		hdr: boolean;
	};
	rendering: ISettingsV7_1["rendering"] & {
		/**
		 * The number of jittered frames averaged while nothing changes (desktop).
		 * 0 and 1 turn the accumulation off.
		 * Settings converted from before 7.2 use 0.
		 */
		accumulationFrames: number;
		/**
		 * The number of jittered frames averaged while nothing changes on mobile devices.
		 * 0 and 1 turn the accumulation off.
		 * Settings converted from before 7.2 use 0.
		 */
		accumulationFramesMobile: number;
		/**
		 * The largest drawing buffer on desktop devices, in physical pixels
		 * (after the device pixel ratio). A larger viewport is rendered at this size and scaled up.
		 * Settings converted from before 7.2 use 1920x1080.
		 */
		maximumRenderingSize: IRenderingSize;
		/**
		 * The largest drawing buffer on mobile devices, in physical pixels.
		 * Settings converted from before 7.2 use 1280x720.
		 */
		maximumRenderingSizeMobile: IRenderingSize;
	};
	session: ISettingsV7_1["session"];
	material: ISettingsV7_1["material"] & {
		/**
		 * Whether gems use a physical dispersion with one refraction index per colour channel.
		 * Settings converted from before 7.2 use false.
		 */
		physicalGemDispersion: boolean;
		/**
		 * How gems are traced.
		 * Settings converted from before 7.2 use "sphere".
		 */
		gemTracing: IGemTracing;
		/**
		 * Resolution of the gem normal maps.
		 * Settings converted from before 7.2 use 1024.
		 */
		gemNormalMapResolution: IGemNormalMapResolution;
	};
	configuration: ISettingsV7_1["configuration"];
}
