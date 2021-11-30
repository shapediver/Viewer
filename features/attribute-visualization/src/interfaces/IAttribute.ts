import { ATTRIBUTEVISUALIZATION, PRIMITIVETYPEHINT } from "@shapediver/viewer.shared.types";
import { vec3 } from "gl-matrix";

export interface IAttribute {
    key: string,
    type: PRIMITIVETYPEHINT,    
};

export interface IColorAttribute extends IAttribute {
    type: PRIMITIVETYPEHINT.COLOR
};

export interface INumberAttribute extends IAttribute {
    type: PRIMITIVETYPEHINT.DECIMAL | PRIMITIVETYPEHINT.DOUBLE | PRIMITIVETYPEHINT.FLOAT | PRIMITIVETYPEHINT.INT,
    min: number,
    max: number,
    visualization: ATTRIBUTEVISUALIZATION
}

export interface IStringAttribute extends IAttribute {
    type: PRIMITIVETYPEHINT.STRING,
    values: string[],
    visualization: ATTRIBUTEVISUALIZATION
}

export interface IDefaultAttribute extends IAttribute {
    color: string | vec3 | number[]
}