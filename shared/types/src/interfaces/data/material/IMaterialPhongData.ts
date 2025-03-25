import {Color} from "../../../types";
import {IMapData, IMapDataPropertiesDefinition} from "./IMapData";
import {
	IMaterialAbstractData,
	IMaterialAbstractDataPropertiesGeneric,
} from "./IMaterialAbstractData";

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
