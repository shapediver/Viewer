import { ISettings as ISettingsV5 } from "../v5/ISettings"
import { ISettings as ISettingsV6 } from "./ISettings"
import { IGlobalSettings } from "../../interfaces/IGlobalSettings";
import { versions } from "../..";

export const convertFromPrevious = (s: IGlobalSettings, v: versions): IGlobalSettings => {
    const oldSettings = <ISettingsV5>s;
    const settings: ISettingsV6 = {
        settings_version: "6.0",
        ar: oldSettings.ar,
        build_date: oldSettings.build_date,
        build_version: oldSettings.build_version,
        camera: oldSettings.camera,
        general: oldSettings.general,
        light: oldSettings.light,
        session: oldSettings.session,
        environment: oldSettings.environment,
        environmentGeometry: oldSettings.environmentGeometry,
        rendering: oldSettings.rendering,
        postprocessing: oldSettings.postprocessing
    };

    /**
     * SETTINGS OBJECTS THAT DID CHANGE
     */

    return <ISettingsV5>settings;
}

export const convertToPrevious = (s: IGlobalSettings, v: versions): IGlobalSettings => {
    const newSettings = <ISettingsV6>s;
    const settings = {
        settings_version: "5.0",
        ar: newSettings.ar,
        build_date: newSettings.build_date,
        build_version: newSettings.build_version,
        camera: newSettings.camera,
        general: newSettings.general,
        light: newSettings.light,
        session: newSettings.session,
        environment: newSettings.environment,
        environmentGeometry: newSettings.environmentGeometry,
        rendering: newSettings.rendering,
        postprocessing: newSettings.postprocessing
    };

    /**
     * SETTINGS OBJECTS THAT DID CHANGE
     */

    return <ISettingsV5>settings;
}