import { ISettings as ISettingsV3_3 } from "../v3_3/ISettings";

export interface ISettings extends ISettingsV3_3 {
    environment: {
        clearAlpha: number,
        clearColor: string,
        map: string | string[],
        mapAsBackground: boolean,
        mapResolution: string,
        rotation: { x: number, y: number, z: number, w: number },
        intensity: number,
        blurriness: number
    },
    general: {
        transformation: {
            scale: { x: number, y: number, z: number },
            translation: { x: number, y: number, z: number },
            rotation: { x: number, y: number, z: number },
        },
        blurWhenBusy: boolean,
        commitSettings: boolean,
        commitParameters: boolean,
        pointSize: number,
        showMessages: boolean,
        defaultMaterialColor: string
    }
}