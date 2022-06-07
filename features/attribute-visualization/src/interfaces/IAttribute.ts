import { ATTRIBUTEVISUALIZATION, SdtfTypeHintName } from "@shapediver/viewer.shared.types";
import { vec3 } from "gl-matrix";

export interface IAttribute {
    key: string,
    type: SdtfTypeHintName,    
};

export interface IColorAttribute extends IAttribute {};

export interface INumberAttribute extends IAttribute {
    min: number,
    max: number,
    visualization: ATTRIBUTEVISUALIZATION
}

export interface IStringAttribute extends IAttribute {
    values: string[],
    visualization: ATTRIBUTEVISUALIZATION
}
export interface IDefaultAttribute extends IAttribute {
    color: string | vec3 | number[]
}