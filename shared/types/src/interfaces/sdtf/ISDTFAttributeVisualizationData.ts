import { mat4 } from "gl-matrix";
import { IMaterialAbstractData } from "../data/material/IMaterialAbstractData";

export interface ISDTFAttributeVisualizationData {
    material: IMaterialAbstractData,
    matrix: mat4
}