import { vec3 } from "gl-matrix";
import { LIGHT_TYPE } from "../interface/ILight";
import { AbstractLight } from "./AbstractLight";

export class AmbientLight extends AbstractLight {
    constructor(
        color: vec3,
        intensity: number,
        name?: string
    ) {
        super(color, intensity, LIGHT_TYPE.AMBIENT, name);
    }
}