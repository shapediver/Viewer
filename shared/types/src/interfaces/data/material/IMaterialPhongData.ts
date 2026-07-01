import {type Color} from "../../../types";
import {type IMapData, type IMapDataPropertiesDefinition} from "./IMapData";
import {
	type IMaterialAbstractData,
	type IMaterialAbstractDataPropertiesGeneric} from "./IMaterialAbstractData";

export type IMaterialPhongDataProperties = Partial<
	IMaterialPhongDataPropertiesGeneric<IMapData>
>;
export type IMaterialPhongDataPropertiesDefinition = Partial<
	IMaterialPhongDataPropertiesGeneric<IMapDataPropertiesDefinition>
>;

export interface IMaterialPhongData
	extends IMaterialPhongDataPropertiesGeneric<IMapData>,
		IMaterialAbstractData {
	clone(): IMaterialPhongData;
	copy(source: IMaterialPhongData): void;
}

interface IMaterialPhongDataPropertiesGeneric<T>
	extends IMaterialAbstractDataPropertiesGeneric<T> {
	specular: Color;
	shininess: number;
	displacementBias: number;
	displacementMap?: T;
	displacementScale: number;
	specularMap?: T;
	envMap?: string | string[];
	reflectivity: number;
}
