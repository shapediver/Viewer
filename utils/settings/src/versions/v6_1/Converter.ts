import {versions} from "../..";
import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {ISettings as ISettingsV6} from "../v6/ISettings";
import {ISettings as ISettingsV6_1} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const oldSettings = <ISettingsV6>s;
	const settings: ISettingsV6_1 = {
		settings_version: "6.1",
		ar: oldSettings.ar,
		build_date: oldSettings.build_date,
		build_version: oldSettings.build_version,
		camera: oldSettings.camera,
		general: oldSettings.general,
		light: oldSettings.light,
		session: oldSettings.session,
		environment: oldSettings.environment,
		environmentGeometry: {
			gridColor: oldSettings.environmentGeometry.gridColor,
			gridVisibility: oldSettings.environmentGeometry.gridVisibility,
			groundPlaneColor: oldSettings.environmentGeometry.groundPlaneColor,
			groundPlaneVisibility:
				oldSettings.environmentGeometry.groundPlaneVisibility,
			groundPlaneShadowColor:
				oldSettings.environmentGeometry.groundPlaneShadowColor,
			groundPlaneShadowVisibility:
				oldSettings.environmentGeometry.groundPlaneShadowVisibility,
			contactShadowVisibility: false,
			contactShadowOpacity: 1,
			contactShadowBlur: 1.5,
			contactShadowHeight: 0.05,
			contactShadowDarkness: 2.5,
		},
		rendering: oldSettings.rendering,
		postprocessing: oldSettings.postprocessing,
		material: oldSettings.material
			? oldSettings.material
			: {
					defaultMaterialColor:
						oldSettings.general.defaultMaterialColor!,
					materialOverrideType: undefined,
				},
	};

	return <ISettingsV6_1>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const newSettings = <ISettingsV6_1>s;
	const settings: ISettingsV6 = {
		settings_version: "6.0",
		ar: newSettings.ar,
		build_date: newSettings.build_date,
		build_version: newSettings.build_version,
		camera: newSettings.camera,
		general: newSettings.general,
		light: newSettings.light,
		session: newSettings.session,
		environment: newSettings.environment,
		environmentGeometry: {
			gridColor: newSettings.environmentGeometry.gridColor,
			gridVisibility: newSettings.environmentGeometry.gridVisibility,
			groundPlaneColor: newSettings.environmentGeometry.groundPlaneColor,
			groundPlaneVisibility:
				newSettings.environmentGeometry.groundPlaneVisibility,
			groundPlaneShadowColor:
				newSettings.environmentGeometry.groundPlaneShadowColor,
			groundPlaneShadowVisibility:
				newSettings.environmentGeometry.groundPlaneShadowVisibility,
		},
		rendering: newSettings.rendering,
		postprocessing: newSettings.postprocessing,
		material: newSettings.material,
	};

	return <ISettingsV6>settings;
};
