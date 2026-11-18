import {type versions} from "../..";
import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {type ISettings as ISettingsV7_1} from "../v7_1/ISettings";
import {type ISettings as ISettingsV7_2} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const oldSettings = <ISettingsV7_1>s;

	const settings: ISettingsV7_2 = {
		...oldSettings,
		settings_version: "7.2",
	};

	return <ISettingsV7_2>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const newSettings = <ISettingsV7_2>s;

	// the `mode` of the ambient occlusion effects does not exist in 7.1
	const oldEffects = newSettings.postprocessing.effects.map((effect) => {
		if (
			(effect.type === "hbao" || effect.type === "ssao") &&
			effect.properties
		) {
			const properties = {...effect.properties};
			delete (properties as any).mode;
			return {...effect, properties};
		}
		return effect;
	});

	const settings: ISettingsV7_1 = {
		...newSettings,
		settings_version: "7.1",
		postprocessing: {
			...newSettings.postprocessing,
			effects: oldEffects,
		},
	};

	return <ISettingsV7_1>settings;
};
