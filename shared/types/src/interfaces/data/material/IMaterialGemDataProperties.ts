import {vec3} from "gl-matrix";
import {type Color} from "../../../types";
import {type IMapData, type IMapDataPropertiesDefinition} from "./IMapData";
import {
	type IMaterialAbstractData,
	type IMaterialAbstractDataPropertiesGeneric} from "./IMaterialAbstractData";

// #region Type aliases (2)

export type IMaterialGemDataProperties = Partial<
	IMaterialGemDataPropertiesGeneric<IMapData>
>;
export type IMaterialGemDataPropertiesDefinition = Partial<
	IMaterialGemDataPropertiesGeneric<IMapDataPropertiesDefinition>
>;

// #endregion Type aliases (2)

// #region Interfaces (2)

export interface IMaterialGemData
	extends IMaterialAbstractData,
		IMaterialGemDataPropertiesGeneric<IMapData> {
	// #region Public Methods (2)

	clone(): IMaterialGemData;
	copy(source: IMaterialGemData): void;

	// #endregion Public Methods (2)
}

interface IMaterialGemDataPropertiesGeneric<T>
	extends IMaterialAbstractDataPropertiesGeneric<T> {
	// #region Properties (15)

	brightness?: number;
	center?: vec3;
	colorTransferBegin?: Color;
	colorTransferEnd?: Color;
	contrast?: number;
	dispersion?: number;
	envMap?: string | string[];
	gamma?: number;
	impurityMap?: T;
	impurityScale?: number;
	radius?: number;
	refractionIndex?: number;
	sphericalNormalMap?: T;
	tracingDepth?: number;
	tracingOpacity?: number;

	// #endregion Properties (15)
}

// #endregion Interfaces (2)
