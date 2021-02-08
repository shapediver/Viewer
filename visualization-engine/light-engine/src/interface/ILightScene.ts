import { ILight } from "./ILight";

export interface ILightScene {
    id: string,
    lights: {
        [key: string]: ILight
    }
}