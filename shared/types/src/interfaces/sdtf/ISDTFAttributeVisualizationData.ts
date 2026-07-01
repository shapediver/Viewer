import {mat4} from "gl-matrix";
import {type IMaterialAbstractData} from "../data/material/IMaterialAbstractData";

export interface ISDTFAttributeVisualizationData {
	material: IMaterialAbstractData;
	matrix: mat4;
}
