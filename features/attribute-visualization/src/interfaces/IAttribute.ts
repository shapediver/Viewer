import { IMaterialData, PRIMITIVE_TYPEHINT } from "@shapediver/viewer.shared.types";
import { vec3 } from "gl-matrix";
import { mat4 } from "gl-matrix"

export enum ATTRIBUTE_VISUALIZATION {
    GRAYSCALE = 'grayscale',
    OPACITY = 'opacity',
    BLUE_RED = 'blue_red',
    BLUE_WHITE_RED = 'blue_white_red',
    GREEN_RED = 'green_red',
    GREEN_WHITE_RED = 'green_white_red',
    BLUE_GREEN_RED = 'blue_green_red',
    BLUE_GREEN_YELLOW_RED_PURPLE_WHITE = 'blue_green_yellow_red_purple_white',
    HSL = 'hsl'
}
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