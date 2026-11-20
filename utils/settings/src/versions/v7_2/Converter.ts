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
	/** `material.physicalGemDispersion` */
	physicalGemDispersion: false,
	/** `material.gemTracing` */
	gemTracing: "sphere",
	/** `material.gemNormalMapResolution` */
	gemNormalMapResolution: 1024,
	/** `rendering.accumulationFrames` */
	accumulationFrames: 0,
	/** `rendering.accumulationFramesMobile` */
	accumulationFramesMobile: 0,
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
		},
		environment: {
			...oldSettings.environment,
			mapPbrMode: oldEnvironment.mapPbrMode ?? OLD_LOOK_V7_2.mapPbrMode,
			mapOrientation:
				oldEnvironment.mapOrientation ?? OLD_LOOK_V7_2.mapOrientation,
		},
		material: {
			...oldSettings.material,
			physicalGemDispersion:
				oldMaterial.physicalGemDispersion ??
				OLD_LOOK_V7_2.physicalGemDispersion,
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
	// - environment.mapPbrMode, environment.mapOrientation
	// - material.physicalGemDispersion, material.gemTracing, material.gemNormalMapResolution
	// - rendering.accumulationFrames, rendering.accumulationFramesMobile
	// - bloom properties: backgroundBloom, highlightsOnly (mipmapBlur is required in 7.1)
	// - HBAO/SSAO properties: mode, excludeGems
	const oldEffects = newSettings.postprocessing.effects.map((effect) => {
		if (effect.type === "bloom" && effect.properties) {
			const properties: any = {...effect.properties};
			delete properties.backgroundBloom;
			delete properties.highlightsOnly;
			properties.mipmapBlur = properties.mipmapBlur ?? false;
			return {...effect, properties};
		}
		if (
			(effect.type === "hbao" || effect.type === "ssao") &&
			effect.properties
		) {
			const properties: any = {...effect.properties};
			delete properties.mode;
			delete properties.excludeGems;
			return {...effect, properties};
		}
		return effect;
	});

	const environment: any = {...newSettings.environment};
	delete environment.mapPbrMode;
	delete environment.mapOrientation;

	const material: any = {...newSettings.material};
	delete material.physicalGemDispersion;
	delete material.gemTracing;
	delete material.gemNormalMapResolution;

	const rendering: any = {...newSettings.rendering};
	delete rendering.accumulationFrames;
	delete rendering.accumulationFramesMobile;

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
