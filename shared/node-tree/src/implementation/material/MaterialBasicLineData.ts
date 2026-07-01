import {
	type IMaterialBasicLineData,
	type IMaterialBasicLineDataProperties,
	MATERIAL_ALPHA,
	MATERIAL_SHADING,
	MATERIAL_SIDE} from "@shapediver/viewer.shared.types";
import {AbstractMaterialData} from "./AbstractMaterialData";

export class MaterialBasicLineData
	extends AbstractMaterialData
	implements IMaterialBasicLineData
{
	// #region Constructors (1)

	/**
	 * Creates a material data object.
	 *
	 * @param _attributes the attributes of the material
	 * @param id the id
	 */
	constructor(
		properties?: IMaterialBasicLineDataProperties,
		id?: string,
		version?: string,
	) {
		super(properties, id, version);
		if (!properties) return;
	}

	// #endregion Constructors (1)

	// #region Public Methods (3)

	public clone(): IMaterialBasicLineData {
		return new MaterialBasicLineData(
			{
				alphaMap: this.alphaMap,
				alphaCutoff: this.alphaCutoff,
				alphaMode: this.alphaMode,
				aoMap: this.aoMap,
				aoMapIntensity: this.aoMapIntensity,
				bumpMap: this.bumpMap,
				bumpScale: this.bumpScale,
				color: this.color,
				depthTest: this.depthTest,
				depthWrite: this.depthWrite,
				emissiveMap: this.emissiveMap,
				emissiveness: this.emissiveness,
				shading: this.shading,
				map: this.map,
				name: this.name,
				normalMap: this.normalMap,
				normalScale: this.normalScale,
				opacity: this.opacity,
				side: this.side,
				transparent: this.transparent,
			},
			this.id,
			this.version,
		);
	}

	public copy(source: MaterialBasicLineData): void {
		this.alphaCutoff = source.alphaCutoff;
		this.alphaMap = source.alphaMap;
		this.alphaMode = source.alphaMode;
		this.aoMap = source.aoMap;
		this.aoMapIntensity = source.aoMapIntensity;
		this.bumpMap = source.bumpMap;
		this.bumpScale = source.bumpScale;
		this.color = source.color;
		this.depthTest = source.depthTest;
		this.depthWrite = source.depthWrite;
		this.emissiveMap = source.emissiveMap;
		this.emissiveness = source.emissiveness;
		this.materialOutput = source.materialOutput;
		this.map = source.map;
		this.normalMap = source.normalMap;
		this.normalScale = source.normalScale;
		this.opacity = source.opacity;
		this.shading = source.shading;
		this.side = source.side;
		this.transparent = source.transparent;
	}

	public reset(): void {
		this.alphaCutoff = 0;
		this.alphaMap = undefined;
		this.alphaMode = MATERIAL_ALPHA.OPAQUE;
		this.aoMap = undefined;
		this.aoMapIntensity = 1.0;
		this.bumpMap = undefined;
		this.bumpScale = 1.0;
		this.color = "#ffffff";
		this.depthTest = undefined;
		this.depthWrite = undefined;
		this.emissiveMap = undefined;
		this.emissiveness = "#000000";
		this.materialOutput = false;
		this.map = undefined;
		this.normalMap = undefined;
		this.normalScale = 1.0;
		this.opacity = 1.0;
		this.shading = MATERIAL_SHADING.SMOOTH;
		this.side = MATERIAL_SIDE.DOUBLE;
		this.transparent = undefined;
	}

	// #endregion Public Methods (3)
}
