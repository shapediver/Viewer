import { mat4 } from "gl-matrix";
import { IMaterialData } from "../data/material/IMaterialData";

export interface ISDTFAttributeVisualizationData {
    material: IMaterialData,
    matrix: mat4
}