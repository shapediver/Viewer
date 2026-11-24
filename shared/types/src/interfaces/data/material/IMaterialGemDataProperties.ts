import {vec3} from "gl-matrix";
import {type Color} from "../../../types";
import {type IMapData, type IMapDataPropertiesDefinition} from "./IMapData";
import {
	type IMaterialAbstractData,
	type IMaterialAbstractDataPropertiesGeneric,
} from "./IMaterialAbstractData";

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
	extends IMaterialAbstractData, IMaterialGemDataPropertiesGeneric<IMapData> {
	// #region Public Methods (2)

	clone(): IMaterialGemData;
	copy(source: IMaterialGemData): void;

	// #endregion Public Methods (2)
}

interface IMaterialGemDataPropertiesGeneric<
	T,
> extends IMaterialAbstractDataPropertiesGeneric<T> {
	// #region Properties (18)

	/**
	 * The color that white light takes on after it has traveled
	 * {@link attenuationDistance} through the stone (absorption by path
	 * length, Beer-Lambert per channel). Same meaning as three.js
	 * `MeshPhysicalMaterial.attenuationColor` and the glTF volume extension.
	 * Applied on top of the color transfer. Default white.
	 */
	attenuationColor?: Color;
	/**
	 * The distance, in model units, after which light inside the stone has the
	 * {@link attenuationColor}. Thicker parts of the stone absorb more and look
	 * more saturated. Default `Infinity`: no absorption.
	 */
	attenuationDistance?: number;
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
	/**
	 * Resolution per cube face of the map that captures the facets of the gem.
	 * Allowed values are 256, 512 and 1024. When not set, the viewport's
	 * `gemNormalMapResolution` is used (default 1024). Higher values are
	 * sharper and use more memory.
	 */
	normalMapResolution?: number;
	radius?: number;
	refractionIndex?: number;
	sphericalNormalMap?: T;
	tracingDepth?: number;
	tracingOpacity?: number;

	// #endregion Properties (18)
}

// #endregion Interfaces (2)
