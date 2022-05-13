import { ATTRIBUTE_VISUALIZATION, PRIMITIVE_TYPEHINT } from "@shapediver/viewer.shared.types";
import { vec3 } from "gl-matrix";

export interface IAttribute {
    key: string,
    type: PRIMITIVE_TYPEHINT,    
};

export interface IColorAttribute extends IAttribute {
    type: PRIMITIVE_TYPEHINT.COLOR
};

export interface INumberAttribute extends IAttribute {
    type: PRIMITIVE_TYPEHINT.DECIMAL | PRIMITIVE_TYPEHINT.DOUBLE | PRIMITIVE_TYPEHINT.FLOAT | PRIMITIVE_TYPEHINT.INT,
    min: number,
    max: number,
    visualization: ATTRIBUTE_VISUALIZATION
}

export interface IStringAttribute extends IAttribute {
    type: PRIMITIVE_TYPEHINT.STRING,
    values: string[],
    visualization: ATTRIBUTE_VISUALIZATION
}

export interface IDefaultAttribute extends IAttribute {
    color: string | vec3 | number[]
}