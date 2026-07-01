import {type Color} from "../../../types";
import {type IMapData, type IMapDataPropertiesDefinition} from "./IMapData";
import {
	type IMaterialAbstractData,
	type IMaterialAbstractDataPropertiesGeneric} from "./IMaterialAbstractData";

// #region Type aliases (2)

export type IMaterialSpecularGlossinessDataProperties = Partial<
	IMaterialSpecularGlossinessDataPropertiesGeneric<IMapData>
>;
export type IMaterialSpecularGlossinessDataPropertiesDefinition = Partial<
	IMaterialSpecularGlossinessDataPropertiesGeneric<IMapDataPropertiesDefinition>
>;

// #endregion Type aliases (2)

// #region Interfaces (2)

export interface IMaterialSpecularGlossinessData
	extends IMaterialSpecularGlossinessDataPropertiesGeneric<IMapData>,
		IMaterialAbstractData {
	// #region Public Methods (2)

	clone(): IMaterialSpecularGlossinessData;
	copy(source: IMaterialSpecularGlossinessData): void;

	// #endregion Public Methods (2)
}

interface IMaterialSpecularGlossinessDataPropertiesGeneric<T>
	extends IMaterialAbstractDataPropertiesGeneric<T> {
	// #region Properties (6)

	envMap?: string | string[];
	glossiness?: number;
	glossinessMap?: T;
	specular?: Color;
	specularGlossinessMap?: T;
	specularMap?: T;

	// #endregion Properties (6)
}

// #endregion Interfaces (2)
