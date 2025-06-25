import {versions} from "../..";
import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {ISettings as ISettingsV5} from "../v5/ISettings";
import {ISettings as ISettingsV6} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const oldSettings = <ISettingsV5>s;
	const settings: ISettingsV6 = {
		settings_version: "6.0",
		ar: oldSettings.ar,
		build_date: oldSettings.build_date,
		build_version: oldSettings.build_version,
		camera: oldSettings.camera,
		general: {
			transformation: oldSettings.general.transformation,
			blurWhenBusy: oldSettings.general.blurWhenBusy,
			commitSettings: oldSettings.general.commitSettings,
			commitParameters: oldSettings.general.commitParameters,
			pointSize: oldSettings.general.pointSize,
			showMessages: oldSettings.general.showMessages,
		},
		light: oldSettings.light,
		session: oldSettings.session,
		environment: oldSettings.environment,
		environmentGeometry: oldSettings.environmentGeometry,
		rendering: oldSettings.rendering,
		postprocessing: oldSettings.postprocessing,
		material: {
			defaultMaterialColor: oldSettings.general.defaultMaterialColor,
			materialOverrideType: undefined,
		},
	};

	return <ISettingsV6>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const newSettings = <ISettingsV6>s;
	const settings: ISettingsV5 = {
		settings_version: "5.0",
		ar: newSettings.ar,
		build_date: newSettings.build_date,
		build_version: newSettings.build_version,
		camera: newSettings.camera,
		general: {
			transformation: newSettings.general.transformation,
			blurWhenBusy: newSettings.general.blurWhenBusy,
			commitSettings: newSettings.general.commitSettings,
			commitParameters: newSettings.general.commitParameters,
			pointSize: newSettings.general.pointSize,
			showMessages: newSettings.general.showMessages,
			defaultMaterialColor:
				newSettings.material &&
				newSettings.material.defaultMaterialColor
					? newSettings.material.defaultMaterialColor
					: newSettings.general.defaultMaterialColor
						? newSettings.general.defaultMaterialColor
						: "#199b9b",
		},
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
	};

	return <ISettingsV5>settings;
};
