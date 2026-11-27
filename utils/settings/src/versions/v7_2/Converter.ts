import {type versions} from "../..";
import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {type ISettings as ISettingsV7_1} from "../v7_1/ISettings";
import {type ISettings as ISettingsV7_2} from "./ISettings";

/**
 * Values that reproduce the look of settings before 7.2.
 * Add every new 7.2 rendering option here.
 */
export const OLD_LOOK_V7_2 = {
	/** `postprocessing.hdr` */
	hdr: false,
	/** bloom `properties.backgroundBloom` */
	backgroundBloom: true,
	/** bloom `properties.highlightsOnly` */
	highlightsOnly: false,
	/** HBAO/SSAO `properties.excludeGems` */
	excludeGems: false,
	/** `environment.mapPbrMode` */
	mapPbrMode: "legacy",
	/** `environment.mapOrientation` */
	mapOrientation: "legacy",
	/** `environment.mapAnalyticDfg` */
	mapAnalyticDfg: false,
	/** `environment.mapFiltering` */
	mapFiltering: "ggx",
	/** `environment.mapSquaredRoughnessBend` */
	mapSquaredRoughnessBend: false,
	/** `material.physicalGemDispersion` */
	physicalGemDispersion: false,
	/** `material.physicalGemFresnel` */
	physicalGemFresnel: false,
	/** `material.gemLighting` */
	gemLighting: "all",
	/** `material.gemEnvironmentMapIntensity` */
	gemEnvironmentMapIntensity: 1,
	/** `material.gemClampColor` */
	gemClampColor: true,
	/** `material.gemTracing` */
	gemTracing: "sphere",
	/** `material.gemNormalMapResolution` */
	gemNormalMapResolution: 1024,
	/** `rendering.accumulationFrames` */
	accumulationFrames: 0,
	/** `rendering.accumulationFramesMobile` */
	accumulationFramesMobile: 0,
	/** `rendering.accumulationMode` */
	accumulationMode: "display",
	/** `rendering.maximumRenderingSize` */
	maximumRenderingSize: {width: 1920, height: 1080},
	/** `rendering.maximumRenderingSizeMobile` */
	maximumRenderingSizeMobile: {width: 1280, height: 720},
} as const;

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const oldSettings = <ISettingsV7_1>s;

	// Fill the old-look value of every new option, so that existing models render unchanged.
	// Only fill missing values: the Viewer already saves these keys into 7.1-labelled settings.
	const effects = oldSettings.postprocessing.effects.map((effect) => {
		if (effect.type === "bloom" && effect.properties) {
			const existing: any = effect.properties;
			return {
				...effect,
				properties: {
					...effect.properties,
					backgroundBloom:
						existing.backgroundBloom ??
						OLD_LOOK_V7_2.backgroundBloom,
					highlightsOnly:
						existing.highlightsOnly ?? OLD_LOOK_V7_2.highlightsOnly,
				},
			};
		}
		if (
			(effect.type === "hbao" || effect.type === "ssao") &&
			effect.properties
		) {
			return {
				...effect,
				properties: {
					...effect.properties,
					excludeGems:
						(effect.properties as any).excludeGems ??
						OLD_LOOK_V7_2.excludeGems,
				},
			};
		}
		return effect;
	});

	const oldEnvironment: any = oldSettings.environment;
	const oldPostprocessing: any = oldSettings.postprocessing;
	const oldMaterial: any = oldSettings.material;
	const oldRendering: any = oldSettings.rendering;

	const settings = {
		...oldSettings,
		settings_version: "7.2",
		rendering: {
			...oldSettings.rendering,
			accumulationFrames:
				oldRendering.accumulationFrames ??
				OLD_LOOK_V7_2.accumulationFrames,
			accumulationFramesMobile:
				oldRendering.accumulationFramesMobile ??
				OLD_LOOK_V7_2.accumulationFramesMobile,
			accumulationMode:
				oldRendering.accumulationMode ?? OLD_LOOK_V7_2.accumulationMode,
			maximumRenderingSize: oldRendering.maximumRenderingSize ?? {
				...OLD_LOOK_V7_2.maximumRenderingSize,
			},
			maximumRenderingSizeMobile:
				oldRendering.maximumRenderingSizeMobile ?? {
					...OLD_LOOK_V7_2.maximumRenderingSizeMobile,
				},
		},
		environment: {
			...oldSettings.environment,
			mapPbrMode: oldEnvironment.mapPbrMode ?? OLD_LOOK_V7_2.mapPbrMode,
			mapOrientation:
				oldEnvironment.mapOrientation ?? OLD_LOOK_V7_2.mapOrientation,
			mapAnalyticDfg:
				oldEnvironment.mapAnalyticDfg ?? OLD_LOOK_V7_2.mapAnalyticDfg,
			mapFiltering:
				oldEnvironment.mapFiltering ?? OLD_LOOK_V7_2.mapFiltering,
			mapSquaredRoughnessBend:
				oldEnvironment.mapSquaredRoughnessBend ??
				OLD_LOOK_V7_2.mapSquaredRoughnessBend,
		},
		material: {
			...oldSettings.material,
			physicalGemDispersion:
				oldMaterial.physicalGemDispersion ??
				OLD_LOOK_V7_2.physicalGemDispersion,
			physicalGemFresnel:
				oldMaterial.physicalGemFresnel ??
				OLD_LOOK_V7_2.physicalGemFresnel,
			gemLighting: oldMaterial.gemLighting ?? OLD_LOOK_V7_2.gemLighting,
			gemEnvironmentMapIntensity:
				oldMaterial.gemEnvironmentMapIntensity ??
				OLD_LOOK_V7_2.gemEnvironmentMapIntensity,
			gemClampColor:
				oldMaterial.gemClampColor ?? OLD_LOOK_V7_2.gemClampColor,
			gemTracing: oldMaterial.gemTracing ?? OLD_LOOK_V7_2.gemTracing,
			gemNormalMapResolution:
				oldMaterial.gemNormalMapResolution ??
				OLD_LOOK_V7_2.gemNormalMapResolution,
		},
		postprocessing: {
			...oldSettings.postprocessing,
			effects,
			hdr: oldPostprocessing.hdr ?? OLD_LOOK_V7_2.hdr,
		},
	};

	return <ISettingsV7_2>(<unknown>settings);
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const newSettings = <ISettingsV7_2>s;

	// Drop every option that does not exist in 7.1. Add new 7.2 options here.
	// - postprocessing.hdr
	// - environment.mapPbrMode, environment.mapOrientation, environment.mapAnalyticDfg,
	//   environment.mapFiltering, environment.mapSquaredRoughnessBend
	// - material.physicalGemDispersion, material.physicalGemFresnel, material.gemLighting,
	//   material.gemEnvironmentMapIntensity, material.gemClampColor,
	//   material.gemTracing, material.gemNormalMapResolution
	// - rendering.accumulationFrames, rendering.accumulationFramesMobile, rendering.accumulationMode
	// - rendering.maximumRenderingSize, rendering.maximumRenderingSizeMobile
	// - bloom properties: backgroundBloom, highlightsOnly, highlightLimit, filter (mipmapBlur is required in 7.1)
	// - HBAO/SSAO properties: mode, specularOcclusion, excludeGems
	// - the SSR effect
	const oldEffects = newSettings.postprocessing.effects
		.filter((effect) => effect.type !== "ssr")
		.map((effect) => {
			if (effect.type === "bloom" && effect.properties) {
				const properties: any = {...effect.properties};
				delete properties.backgroundBloom;
				delete properties.highlightsOnly;
				delete properties.highlightLimit;
				delete properties.filter;
				properties.mipmapBlur = properties.mipmapBlur ?? false;
				return {...effect, properties};
			}
			if (
				(effect.type === "hbao" || effect.type === "ssao") &&
				effect.properties
			) {
				const properties: any = {...effect.properties};
				delete properties.mode;
				delete properties.specularOcclusion;
				delete properties.excludeGems;
				return {...effect, properties};
			}
			return effect;
		});

	const environment: any = {...newSettings.environment};
	delete environment.mapPbrMode;
	delete environment.mapOrientation;
	delete environment.mapAnalyticDfg;
	delete environment.mapFiltering;
	delete environment.mapSquaredRoughnessBend;

	const material: any = {...newSettings.material};
	delete material.physicalGemDispersion;
	delete material.physicalGemFresnel;
	delete material.gemLighting;
	delete material.gemEnvironmentMapIntensity;
	delete material.gemClampColor;
	delete material.gemTracing;
	delete material.gemNormalMapResolution;

	const rendering: any = {...newSettings.rendering};
	delete rendering.accumulationFrames;
	delete rendering.accumulationFramesMobile;
	delete rendering.accumulationMode;
	delete rendering.maximumRenderingSize;
	delete rendering.maximumRenderingSizeMobile;

	const postprocessing: any = {
		...newSettings.postprocessing,
		effects: oldEffects,
	};
	delete postprocessing.hdr;

	const settings = {
		...newSettings,
		settings_version: "7.1",
		environment,
		material,
		rendering,
		postprocessing,
	};

	return <ISettingsV7_1>(<unknown>settings);
};
