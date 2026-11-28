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
 * How the blurred levels of HDR environment maps are prefiltered:
 * "ggx" with the GGX importance sampling of current three.js,
 * "gaussian" with the Gaussian blur of three.js r160 and older.
 * Settings converted from before 7.2 use "ggx".
 */
export type IEnvironmentMapFiltering = "ggx" | "gaussian";

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

/**
 * Where the jittered frames of a still view are averaged:
 * "display" averages the finished frames on the canvas, after post-processing and tone mapping;
 * "hdr" averages the scene in the high dynamic range buffer of the post-processing,
 * before bloom and tone mapping, which then run once on the average.
 * "hdr" needs post-processing with `postprocessing.hdr`; otherwise "display" is used.
 * Settings converted from before 7.2 use "display".
 */
export type IAccumulationMode = "display" | "hdr";

export interface ISettings extends IGlobalSettings {
	ar: ISettingsV7_1["ar"];
	camera: ISettingsV7_1["camera"];
	environment: ISettingsV7_1["environment"] & {
		mapPbrMode: IEnvironmentMapPbrMode;
		mapOrientation: IEnvironmentMapOrientation;
		/**
		 * Uses the analytic approximation of the environment reflection term (DFG) from older three.js versions instead of the lookup table.
		 * Settings converted from before 7.2 use false.
		 */
		mapAnalyticDfg: boolean;
		mapFiltering: IEnvironmentMapFiltering;
		/**
		 * Bends the reflection vector of rough reflections by roughness² like three.js r162 and older, instead of roughness⁴.
		 * No effect with `mapPbrMode` "legacy", which already does.
		 * Settings converted from before 7.2 use false.
		 */
		mapSquaredRoughnessBend: boolean;
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
		/**
		 * Whether the SMAA/FXAA anti-aliasing pass also runs on the averaged still image of `rendering.accumulationMode` "hdr" once it holds two or more frames.
		 * false skips the pass there (the jittered frames already anti-alias the image); the first frame and frames drawn while the camera moves keep it.
		 * No effect with other accumulation modes, nor with an HBAO/SSAO effect in "composite" mode or an outline effect (drawn after the averaging, they keep the pass).
		 * Settings converted from before 7.2 use true.
		 */
		antiAliasingOnAccumulation: boolean;
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
		 * Where the jittered frames are averaged, see {@link IAccumulationMode}.
		 * Settings converted from before 7.2 use "display".
		 */
		accumulationMode: IAccumulationMode;
		/**
		 * Whether ambient occlusion is drawn while the camera moves.
		 * false: it returns when the beauty rendering starts after the camera stopped.
		 * Settings converted from before 7.2 use true.
		 */
		ambientOcclusionWhileMoving: boolean;
		/**
		 * Whether soft shadows are drawn while the camera moves.
		 * false: hard shadows while the camera moves, the soft shadows fade in after it stopped.
		 * Settings converted from before 7.2 use true.
		 */
		softShadowsWhileMoving: boolean;
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
		 * Whether the light inside gems leaves the stone by the physical Fresnel weights.
		 * Settings converted from before 7.2 use false.
		 */
		physicalGemFresnel: boolean;
		/**
		 * Which lights shade gems: "all" scene lights and the environment map on every surface the ray hits;
		 * "firstSurface" for the point, spot, directional and rect-area lights on the first surface only (the light that bounces inside the stone uses the environment and ambient light);
		 * "environment" for the environment map only, no scene lights at all.
		 * Settings converted from before 7.2 use "all".
		 */
		gemLighting: "all" | "firstSurface" | "environment";
		/**
		 * Factor on the environment light that gems receive.
		 * Settings converted from before 7.2 use 1.
		 */
		gemEnvironmentMapIntensity: number;
		/**
		 * Whether gems clamp their traced colors at 1 when the scene is not rendered into an HDR buffer (no post-processing effect, or `hdr` off).
		 * With the clamp, stones never reach white after tone mapping in viewports without effects.
		 * Settings converted from before 7.2 use true.
		 */
		gemClampColor: boolean;
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
