import {ISettings} from "@shapediver/viewer.settings";

// TODO: drop this file once the @shapediver/viewer.settings pin includes settings 7.2,
// then type the default settings as ISettings directly.

// The 7.1 effect type is not a union discriminated by `type`, so the effects
// that the default settings use are typed here.
type IBloomEffect = {
	type: "bloom";
	properties: {
		intensity?: number;
		luminanceThreshold?: number;
		luminanceSmoothing?: number;
		mipmapBlur?: boolean;
		backgroundBloom: boolean;
		highlightsOnly: boolean;
		highlightLimit?: number;
		additiveBlur?: boolean;
	};
};

type IAmbientOcclusionEffect = {
	type: "hbao" | "ssao";
	properties: {
		[key: string]: number | string | boolean | undefined;
		mode?: "composite" | "shading";
		excludeGems: boolean;
	};
};

type IScreenSpaceReflectionEffect = {
	type: "ssr";
	properties: {
		intensity?: number;
		maxRoughness?: number;
		steps?: number;
		distance?: number;
		thickness?: number;
		enableOnMobile?: boolean;
	};
};

/**
 * The default settings in settings version 7.2.
 * The pinned settings package ends at 7.1, so the 7.2 fields are added here.
 */
export type ISettingsV7_2 = Omit<
	ISettings,
	| "settings_version"
	| "environment"
	| "postprocessing"
	| "material"
	| "rendering"
> & {
	settings_version: "7.2";
	rendering: ISettings["rendering"] & {
		// not set = no frame accumulation
		accumulationFrames?: number;
		accumulationFramesMobile?: number;
		// Without the two values a viewport keeps its maximum rendering size.
		maximumRenderingSize?: {width: number; height: number};
		maximumRenderingSizeMobile?: {width: number; height: number};
	};
	environment: ISettings["environment"] & {
		mapPbrMode: "legacy" | "modern";
		mapOrientation: "legacy" | "threejs";
		mapAnalyticDfg: boolean;
	};
	postprocessing: Omit<ISettings["postprocessing"], "effects"> & {
		effects: (
			| IBloomEffect
			| IAmbientOcclusionEffect
			| IScreenSpaceReflectionEffect
		)[];
		hdr: boolean;
	};
	material: ISettings["material"] & {
		physicalGemDispersion: boolean;
		physicalGemFresnel: boolean;
		gemLighting: "all" | "firstSurface" | "environment";
		gemEnvironmentMapIntensity: number;
		gemClampColor: boolean;
		gemTracing: "sphere" | "facets";
		gemNormalMapResolution: 256 | 512 | 1024;
	};
};

/**
 * The 7.2 values of the new look (epic SS-10469) that every default settings object uses.
 * `hdr` and the effect properties are set per default settings object.
 * Settings converted from before 7.2 get the old look instead.
 */
export const NEW_LOOK_V7_2 = {
	environment: {
		mapPbrMode: "modern",
		mapOrientation: "threejs",
		mapAnalyticDfg: false,
	},
	material: {
		physicalGemDispersion: true,
		physicalGemFresnel: true,
		gemLighting: "environment",
		gemEnvironmentMapIntensity: 1.2,
		gemClampColor: false,
		gemTracing: "facets",
		gemNormalMapResolution: 512,
	},
	// SS-10506: sharper on HiDPI desktops. At 3840x2160 a close-up of the
	// ring example took 125 ms per frame on a mid-range GPU, at 2560x1440 54 ms.
	// A getter, so that every default settings object gets its own size objects.
	get rendering() {
		return {
			maximumRenderingSize: {width: 2560, height: 1440},
			maximumRenderingSizeMobile: {width: 1280, height: 720},
		};
	},
} as const;

/**
 * Returns the 7.2 default settings typed for the pinned settings package (7.1).
 */
export const toSettings = (s: ISettingsV7_2): ISettings =>
	s as unknown as ISettings;
