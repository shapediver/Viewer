import {Color} from "../../../types";
import {IMapData, IMapDataPropertiesDefinition} from "./IMapData";
import {
	IMaterialAbstractData,
	IMaterialAbstractDataPropertiesGeneric,
} from "./IMaterialAbstractData";

// #region Type aliases (2)

export type IMaterialStandardDataProperties = Partial<
	IMaterialStandardDataPropertiesGeneric<IMapData>
>;
export type IMaterialStandardDataPropertiesDefinition = Partial<
	IMaterialStandardDataPropertiesGeneric<IMapDataPropertiesDefinition>
>;

// #endregion Type aliases (2)

// #region Interfaces (2)

export interface IMaterialStandardData
	extends IMaterialStandardDataPropertiesGeneric<IMapData>,
		IMaterialAbstractData {
	// #region Public Methods (2)

	clone(): IMaterialStandardData;
	copy(source: IMaterialStandardData): void;

	// #endregion Public Methods (2)
}

interface IMaterialStandardDataPropertiesGeneric<T>
	extends IMaterialAbstractDataPropertiesGeneric<T> {
	// #region Properties (30)

	attenuationColor: Color;
	attenuationDistance: number;
	clearcoat: number;
	clearcoatMap?: T;
	clearcoatNormalMap?: T;
	clearcoatRoughness: number;
	clearcoatRoughnessMap?: T;
	displacementBias: number;
	displacementMap?: T;
	displacementScale: number;
	envMap?: string | string[];
	ior: number;
	metalness: number;
	metalnessMap?: T;
	metalnessRoughnessMap?: T;
	roughness: number;
	roughnessMap?: T;
	sheen: number;
	sheenColor: Color;
	sheenColorMap?: T;
	sheenRoughness: number;
	sheenRoughnessMap?: T;
	specularColor: Color;
	specularColorMap?: T;
	specularIntensity: number;
	specularIntensityMap?: T;
	thickness: number;
	thicknessMap?: T;
	transmission: number;
	transmissionMap?: T;

	// #endregion Properties (30)
}

// #endregion Interfaces (2)
