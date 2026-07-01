import {type IMapData, type IMapDataPropertiesDefinition} from "./IMapData";
import {
	type IMaterialAbstractData,
	type IMaterialAbstractDataPropertiesGeneric} from "./IMaterialAbstractData";

export type IMaterialLambertDataProperties = Partial<
	IMaterialLambertDataPropertiesGeneric<IMapData>
>;
export type IMaterialLambertDataPropertiesDefinition = Partial<
	IMaterialLambertDataPropertiesGeneric<IMapDataPropertiesDefinition>
>;

export interface IMaterialLambertData
	extends IMaterialLambertDataPropertiesGeneric<IMapData>,
		IMaterialAbstractData {
	clone(): IMaterialLambertData;
	copy(source: IMaterialLambertData): void;
}

interface IMaterialLambertDataPropertiesGeneric<T>
	extends IMaterialAbstractDataPropertiesGeneric<T> {
	displacementBias: number;
	displacementMap?: T;
	displacementScale: number;
	specularMap?: T;
	envMap?: string | string[];
	reflectivity: number;
}
