import { ILight } from '../ILight'

export interface IAmbientLight extends ILight {
    clone(): IAmbientLight;
}