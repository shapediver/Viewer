import {
	Color,
	IMapData,
	IMaterialMultiPointData,
	IMaterialMultiPointDataProperties,
	MATERIAL_ALPHA,
	MATERIAL_SHADING,
	MATERIAL_SIDE,
} from "@shapediver/viewer.shared.types";
import {AbstractMaterialData} from "./AbstractMaterialData";

export class MaterialMultiPointData
	extends AbstractMaterialData
	implements IMaterialMultiPointData
{
	// #region Properties (20)

	#alphaMap_0?: IMapData = undefined;
	#alphaMap_1?: IMapData = undefined;
	#alphaMap_2?: IMapData = undefined;
	#alphaMap_3?: IMapData = undefined;
	#alphaMap_4?: IMapData = undefined;
	#alphaMap_5?: IMapData = undefined;
	#alphaMap_6?: IMapData = undefined;
	#alphaMap_7?: IMapData = undefined;
	#color_0?: Color = "#ffffff";
	#color_1?: Color = "#ffffff";
	#color_2?: Color = "#ffffff";
	#color_3?: Color = "#ffffff";
	#color_4?: Color = "#ffffff";
	#color_5?: Color = "#ffffff";
	#color_6?: Color = "#ffffff";
	#color_7?: Color = "#ffffff";
	#map_0?: IMapData = undefined;
	#map_1?: IMapData = undefined;
	#map_2?: IMapData = undefined;
	#map_3?: IMapData = undefined;
	#map_4?: IMapData = undefined;
	#map_5?: IMapData = undefined;
	#map_6?: IMapData = undefined;
	#map_7?: IMapData = undefined;
	#materialIndexDataMap?: IMapData = undefined;
	#materialIndexDataMapSize?: number = undefined;
	#sizeAttenuation_0?: boolean = undefined;
	#sizeAttenuation_1?: boolean = undefined;
	#sizeAttenuation_2?: boolean = undefined;
	#sizeAttenuation_3?: boolean = undefined;
	#sizeAttenuation_4?: boolean = undefined;
	#sizeAttenuation_5?: boolean = undefined;
	#sizeAttenuation_6?: boolean = undefined;
	#sizeAttenuation_7?: boolean = undefined;
	#size_0?: number = undefined;
	#size_1?: number = undefined;
	#size_2?: number = undefined;
	#size_3?: number = undefined;
	#size_4?: number = undefined;
	#size_5?: number = undefined;
	#size_6?: number = undefined;
	#size_7?: number = undefined;

	// #endregion Properties (20)

	// #region Constructors (1)

	/**
	 * Creates a material data object.
	 *
	 * @param _attributes the attributes of the material
	 * @param id the id
	 */
	constructor(
		properties?: IMaterialMultiPointDataProperties,
		id?: string,
		version?: string,
	) {
		super(properties, id, version);
		if (!properties) return;

		if (properties.materialIndexDataMap !== undefined)
			this.materialIndexDataMap = properties.materialIndexDataMap;
		if (properties.materialIndexDataMapSize !== undefined)
			this.materialIndexDataMapSize = properties.materialIndexDataMapSize;

		if (properties.alphaMap_0 !== undefined)
			this.alphaMap_0 = properties.alphaMap_0;
		else if (properties.alphaMap !== undefined)
			this.alphaMap_0 = properties.alphaMap;
		if (properties.color_0 !== undefined) this.color_0 = properties.color_0;
		else if (properties.color !== undefined)
			this.color_0 = properties.color;
		if (properties.map_0 !== undefined) this.map_0 = properties.map_0;
		else if (properties.map !== undefined) this.map_0 = properties.map;
		if (properties.size_0 !== undefined) this.size_0 = properties.size_0;
		if (properties.sizeAttenuation_0 !== undefined)
			this.sizeAttenuation_0 = properties.sizeAttenuation_0;

		if (properties.alphaMap_1 !== undefined)
			this.alphaMap_1 = properties.alphaMap_1;
		else if (properties.alphaMap !== undefined)
			this.alphaMap_1 = properties.alphaMap;
		if (properties.color_1 !== undefined) this.color_1 = properties.color_1;
		else if (properties.color !== undefined)
			this.color_1 = properties.color;
		if (properties.map_1 !== undefined) this.map_1 = properties.map_1;
		else if (properties.map !== undefined) this.map_1 = properties.map;
		if (properties.size_1 !== undefined) this.size_1 = properties.size_1;
		if (properties.sizeAttenuation_1 !== undefined)
			this.sizeAttenuation_1 = properties.sizeAttenuation_1;

		if (properties.alphaMap_2 !== undefined)
			this.alphaMap_2 = properties.alphaMap_2;
		else if (properties.alphaMap !== undefined)
			this.alphaMap_2 = properties.alphaMap;
		if (properties.color_2 !== undefined) this.color_2 = properties.color_2;
		else if (properties.color !== undefined)
			this.color_2 = properties.color;
		if (properties.map_2 !== undefined) this.map_2 = properties.map_2;
		else if (properties.map !== undefined) this.map_2 = properties.map;
		if (properties.size_2 !== undefined) this.size_2 = properties.size_2;
		if (properties.sizeAttenuation_2 !== undefined)
			this.sizeAttenuation_2 = properties.sizeAttenuation_2;

		if (properties.alphaMap_3 !== undefined)
			this.alphaMap_3 = properties.alphaMap_3;
		else if (properties.alphaMap !== undefined)
			this.alphaMap_3 = properties.alphaMap;
		if (properties.color_3 !== undefined) this.color_3 = properties.color_3;
		else if (properties.color !== undefined)
			this.color_3 = properties.color;
		if (properties.map_3 !== undefined) this.map_3 = properties.map_3;
		else if (properties.map !== undefined) this.map_3 = properties.map;
		if (properties.size_3 !== undefined) this.size_3 = properties.size_3;
		if (properties.sizeAttenuation_3 !== undefined)
			this.sizeAttenuation_3 = properties.sizeAttenuation_3;

		if (properties.alphaMap_4 !== undefined)
			this.alphaMap_4 = properties.alphaMap_4;
		else if (properties.alphaMap !== undefined)
			this.alphaMap_4 = properties.alphaMap;
		if (properties.color_4 !== undefined) this.color_4 = properties.color_4;
		else if (properties.color !== undefined)
			this.color_4 = properties.color;
		if (properties.map_4 !== undefined) this.map_4 = properties.map_4;
		else if (properties.map !== undefined) this.map_4 = properties.map;
		if (properties.size_4 !== undefined) this.size_4 = properties.size_4;
		if (properties.sizeAttenuation_4 !== undefined)
			this.sizeAttenuation_4 = properties.sizeAttenuation_4;

		if (properties.alphaMap_5 !== undefined)
			this.alphaMap_5 = properties.alphaMap_5;
		else if (properties.alphaMap !== undefined)
			this.alphaMap_5 = properties.alphaMap;
		if (properties.color_5 !== undefined) this.color_5 = properties.color_5;
		else if (properties.color !== undefined)
			this.color_5 = properties.color;
		if (properties.map_5 !== undefined) this.map_5 = properties.map_5;
		else if (properties.map !== undefined) this.map_5 = properties.map;
		if (properties.size_5 !== undefined) this.size_5 = properties.size_5;
		if (properties.sizeAttenuation_5 !== undefined)
			this.sizeAttenuation_5 = properties.sizeAttenuation_5;

		if (properties.alphaMap_6 !== undefined)
			this.alphaMap_6 = properties.alphaMap_6;
		else if (properties.alphaMap !== undefined)
			this.alphaMap_6 = properties.alphaMap;
		if (properties.color_6 !== undefined) this.color_6 = properties.color_6;
		else if (properties.color !== undefined)
			this.color_6 = properties.color;
		if (properties.map_6 !== undefined) this.map_6 = properties.map_6;
		else if (properties.map !== undefined) this.map_6 = properties.map;
		if (properties.size_6 !== undefined) this.size_6 = properties.size_6;
		if (properties.sizeAttenuation_6 !== undefined)
			this.sizeAttenuation_6 = properties.sizeAttenuation_6;

		if (properties.alphaMap_7 !== undefined)
			this.alphaMap_7 = properties.alphaMap_7;
		else if (properties.alphaMap !== undefined)
			this.alphaMap_7 = properties.alphaMap;
		if (properties.color_7 !== undefined) this.color_7 = properties.color_7;
		else if (properties.color !== undefined)
			this.color_7 = properties.color;
		if (properties.map_7 !== undefined) this.map_7 = properties.map_7;
		else if (properties.map !== undefined) this.map_7 = properties.map;
		if (properties.size_7 !== undefined) this.size_7 = properties.size_7;
		if (properties.sizeAttenuation_7 !== undefined)
			this.sizeAttenuation_7 = properties.sizeAttenuation_7;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (40)

	public get alphaMap_0(): IMapData | undefined {
		return this.#alphaMap_0;
	}

	public set alphaMap_0(value: IMapData | undefined) {
		this.#alphaMap_0 = value;
	}

	public get alphaMap_1(): IMapData | undefined {
		return this.#alphaMap_1;
	}

	public set alphaMap_1(value: IMapData | undefined) {
		this.#alphaMap_1 = value;
	}

	public get alphaMap_2(): IMapData | undefined {
		return this.#alphaMap_2;
	}

	public set alphaMap_2(value: IMapData | undefined) {
		this.#alphaMap_2 = value;
	}

	public get color_0(): Color | undefined {
		return this.#color_0;
	}

	public set color_0(value: Color | undefined) {
		this.#color_0 = value;
	}

	public get color_1(): Color | undefined {
		return this.#color_1;
	}

	public set color_1(value: Color | undefined) {
		this.#color_1 = value;
	}

	public get color_2(): Color | undefined {
		return this.#color_2;
	}

	public set color_2(value: Color | undefined) {
		this.#color_2 = value;
	}

	public get map_0(): IMapData | undefined {
		return this.#map_0;
	}

	public set map_0(value: IMapData | undefined) {
		this.#map_0 = value;
	}

	public get map_1(): IMapData | undefined {
		return this.#map_1;
	}

	public set map_1(value: IMapData | undefined) {
		this.#map_1 = value;
	}

	public get map_2(): IMapData | undefined {
		return this.#map_2;
	}

	public set map_2(value: IMapData | undefined) {
		this.#map_2 = value;
	}

	public get materialIndexDataMap(): IMapData | undefined {
		return this.#materialIndexDataMap;
	}

	public set materialIndexDataMap(value: IMapData | undefined) {
		this.#materialIndexDataMap = value;
	}

	public get materialIndexDataMapSize(): number | undefined {
		return this.#materialIndexDataMapSize;
	}

	public set materialIndexDataMapSize(value: number | undefined) {
		this.#materialIndexDataMapSize = value;
	}

	public get sizeAttenuation_0(): boolean | undefined {
		return this.#sizeAttenuation_0;
	}

	public set sizeAttenuation_0(value: boolean | undefined) {
		this.#sizeAttenuation_0 = value;
	}

	public get sizeAttenuation_1(): boolean | undefined {
		return this.#sizeAttenuation_1;
	}

	public set sizeAttenuation_1(value: boolean | undefined) {
		this.#sizeAttenuation_1 = value;
	}

	public get sizeAttenuation_2(): boolean | undefined {
		return this.#sizeAttenuation_2;
	}

	public set sizeAttenuation_2(value: boolean | undefined) {
		this.#sizeAttenuation_2 = value;
	}

	public get size_0(): number | undefined {
		return this.#size_0;
	}

	public set size_0(value: number | undefined) {
		this.#size_0 = value;
	}

	public get size_1(): number | undefined {
		return this.#size_1;
	}

	public set size_1(value: number | undefined) {
		this.#size_1 = value;
	}

	public get size_2(): number | undefined {
		return this.#size_2;
	}

	public set size_2(value: number | undefined) {
		this.#size_2 = value;
	}

	public get alphaMap_3(): IMapData | undefined {
		return this.#alphaMap_3;
	}

	public set alphaMap_3(value: IMapData | undefined) {
		this.#alphaMap_3 = value;
	}

	public get color_3(): Color | undefined {
		return this.#color_3;
	}

	public set color_3(value: Color | undefined) {
		this.#color_3 = value;
	}

	public get map_3(): IMapData | undefined {
		return this.#map_3;
	}

	public set map_3(value: IMapData | undefined) {
		this.#map_3 = value;
	}

	public get size_3(): number | undefined {
		return this.#size_3;
	}

	public set size_3(value: number | undefined) {
		this.#size_3 = value;
	}

	public get sizeAttenuation_3(): boolean | undefined {
		return this.#sizeAttenuation_3;
	}

	public set sizeAttenuation_3(value: boolean | undefined) {
		this.#sizeAttenuation_3 = value;
	}

	public get alphaMap_4(): IMapData | undefined {
		return this.#alphaMap_4;
	}

	public set alphaMap_4(value: IMapData | undefined) {
		this.#alphaMap_4 = value;
	}

	public get color_4(): Color | undefined {
		return this.#color_4;
	}

	public set color_4(value: Color | undefined) {
		this.#color_4 = value;
	}

	public get map_4(): IMapData | undefined {
		return this.#map_4;
	}

	public set map_4(value: IMapData | undefined) {
		this.#map_4 = value;
	}

	public get size_4(): number | undefined {
		return this.#size_4;
	}

	public set size_4(value: number | undefined) {
		this.#size_4 = value;
	}

	public get sizeAttenuation_4(): boolean | undefined {
		return this.#sizeAttenuation_4;
	}

	public set sizeAttenuation_4(value: boolean | undefined) {
		this.#sizeAttenuation_4 = value;
	}

	public get alphaMap_5(): IMapData | undefined {
		return this.#alphaMap_5;
	}

	public set alphaMap_5(value: IMapData | undefined) {
		this.#alphaMap_5 = value;
	}

	public get color_5(): Color | undefined {
		return this.#color_5;
	}

	public set color_5(value: Color | undefined) {
		this.#color_5 = value;
	}

	public get map_5(): IMapData | undefined {
		return this.#map_5;
	}

	public set map_5(value: IMapData | undefined) {
		this.#map_5 = value;
	}

	public get size_5(): number | undefined {
		return this.#size_5;
	}

	public set size_5(value: number | undefined) {
		this.#size_5 = value;
	}

	public get sizeAttenuation_5(): boolean | undefined {
		return this.#sizeAttenuation_5;
	}

	public set sizeAttenuation_5(value: boolean | undefined) {
		this.#sizeAttenuation_5 = value;
	}

	public get alphaMap_6(): IMapData | undefined {
		return this.#alphaMap_6;
	}

	public set alphaMap_6(value: IMapData | undefined) {
		this.#alphaMap_6 = value;
	}

	public get color_6(): Color | undefined {
		return this.#color_6;
	}

	public set color_6(value: Color | undefined) {
		this.#color_6 = value;
	}

	public get map_6(): IMapData | undefined {
		return this.#map_6;
	}

	public set map_6(value: IMapData | undefined) {
		this.#map_6 = value;
	}

	public get size_6(): number | undefined {
		return this.#size_6;
	}

	public set size_6(value: number | undefined) {
		this.#size_6 = value;
	}

	public get sizeAttenuation_6(): boolean | undefined {
		return this.#sizeAttenuation_6;
	}

	public set sizeAttenuation_6(value: boolean | undefined) {
		this.#sizeAttenuation_6 = value;
	}

	public get alphaMap_7(): IMapData | undefined {
		return this.#alphaMap_7;
	}

	public set alphaMap_7(value: IMapData | undefined) {
		this.#alphaMap_7 = value;
	}

	public get color_7(): Color | undefined {
		return this.#color_7;
	}

	public set color_7(value: Color | undefined) {
		this.#color_7 = value;
	}

	public get map_7(): IMapData | undefined {
		return this.#map_7;
	}

	public set map_7(value: IMapData | undefined) {
		this.#map_7 = value;
	}

	public get size_7(): number | undefined {
		return this.#size_7;
	}

	public set size_7(value: number | undefined) {
		this.#size_7 = value;
	}

	public get sizeAttenuation_7(): boolean | undefined {
		return this.#sizeAttenuation_7;
	}

	public set sizeAttenuation_7(value: boolean | undefined) {
		this.#sizeAttenuation_7 = value;
	}

	// #endregion Public Getters And Setters (40)

	// #region Public Methods (3)

	public clone(): IMaterialMultiPointData {
		return new MaterialMultiPointData(
			{
				alphaMode: this.alphaMode,
				alphaCutoff: this.alphaCutoff,
				aoMap: this.aoMap,
				aoMapIntensity: this.aoMapIntensity,
				bumpMap: this.bumpMap,
				bumpScale: this.bumpScale,
				depthTest: this.depthTest,
				depthWrite: this.depthWrite,
				emissiveMap: this.emissiveMap,
				emissiveness: this.emissiveness,
				shading: this.shading,
				name: this.name,
				normalMap: this.normalMap,
				normalScale: this.normalScale,
				opacity: this.opacity,
				side: this.side,
				transparent: this.transparent,

				alphaMap_0: this.alphaMap_0,
				alphaMap_1: this.alphaMap_1,
				alphaMap_2: this.alphaMap_2,
				alphaMap_3: this.alphaMap_3,
				alphaMap_4: this.alphaMap_4,
				alphaMap_5: this.alphaMap_5,
				alphaMap_6: this.alphaMap_6,
				alphaMap_7: this.alphaMap_7,
				color_0: this.color_0,
				color_1: this.color_1,
				color_2: this.color_2,
				color_3: this.color_3,
				color_4: this.color_4,
				color_5: this.color_5,
				color_6: this.color_6,
				color_7: this.color_7,
				map_0: this.map_0,
				map_1: this.map_1,
				map_2: this.map_2,
				map_3: this.map_3,
				map_4: this.map_4,
				map_5: this.map_5,
				map_6: this.map_6,
				map_7: this.map_7,
				materialIndexDataMap: this.materialIndexDataMap,
				materialIndexDataMapSize: this.materialIndexDataMapSize,
				size_0: this.size_0,
				size_1: this.size_1,
				size_2: this.size_2,
				size_3: this.size_3,
				size_4: this.size_4,
				size_5: this.size_5,
				size_6: this.size_6,
				size_7: this.size_7,
				sizeAttenuation_0: this.sizeAttenuation_0,
				sizeAttenuation_1: this.sizeAttenuation_1,
				sizeAttenuation_2: this.sizeAttenuation_2,
				sizeAttenuation_3: this.sizeAttenuation_3,
				sizeAttenuation_4: this.sizeAttenuation_4,
				sizeAttenuation_5: this.sizeAttenuation_5,
				sizeAttenuation_6: this.sizeAttenuation_6,
				sizeAttenuation_7: this.sizeAttenuation_7,
			},
			this.id,
			this.version,
		);
	}

	public copy(source: MaterialMultiPointData): void {
		this.alphaCutoff = source.alphaCutoff;
		this.alphaMode = source.alphaMode;
		this.aoMap = source.aoMap;
		this.aoMapIntensity = source.aoMapIntensity;
		this.bumpMap = source.bumpMap;
		this.bumpScale = source.bumpScale;
		this.depthTest = source.depthTest;
		this.depthWrite = source.depthWrite;
		this.emissiveMap = source.emissiveMap;
		this.emissiveness = source.emissiveness;
		this.materialOutput = source.materialOutput;
		this.normalMap = source.normalMap;
		this.normalScale = source.normalScale;
		this.opacity = source.opacity;
		this.shading = source.shading;
		this.side = source.side;
		this.transparent = source.transparent;

		this.alphaMap_0 = source.alphaMap_0;
		this.alphaMap_1 = source.alphaMap_1;
		this.alphaMap_2 = source.alphaMap_2;
		this.alphaMap_3 = source.alphaMap_3;
		this.alphaMap_4 = source.alphaMap_4;
		this.alphaMap_5 = source.alphaMap_5;
		this.alphaMap_6 = source.alphaMap_6;
		this.alphaMap_7 = source.alphaMap_7;
		this.color_0 = source.color_0;
		this.color_1 = source.color_1;
		this.color_2 = source.color_2;
		this.color_3 = source.color_3;
		this.color_4 = source.color_4;
		this.color_5 = source.color_5;
		this.color_6 = source.color_6;
		this.color_7 = source.color_7;
		this.map_0 = source.map_0;
		this.map_1 = source.map_1;
		this.map_2 = source.map_2;
		this.map_3 = source.map_3;
		this.map_4 = source.map_4;
		this.map_5 = source.map_5;
		this.map_6 = source.map_6;
		this.map_7 = source.map_7;
		this.materialIndexDataMap = source.materialIndexDataMap;
		this.materialIndexDataMapSize = source.materialIndexDataMapSize;
		this.size_0 = source.size_0;
		this.size_1 = source.size_1;
		this.size_2 = source.size_2;
		this.size_3 = source.size_3;
		this.size_4 = source.size_4;
		this.size_5 = source.size_5;
		this.size_6 = source.size_6;
		this.size_7 = source.size_7;
		this.sizeAttenuation_0 = source.sizeAttenuation_0;
		this.sizeAttenuation_1 = source.sizeAttenuation_1;
		this.sizeAttenuation_2 = source.sizeAttenuation_2;
		this.sizeAttenuation_3 = source.sizeAttenuation_3;
		this.sizeAttenuation_4 = source.sizeAttenuation_4;
		this.sizeAttenuation_5 = source.sizeAttenuation_5;
		this.sizeAttenuation_6 = source.sizeAttenuation_6;
		this.sizeAttenuation_7 = source.sizeAttenuation_7;
	}

	public reset(): void {
		this.alphaCutoff = 0;
		this.alphaMode = MATERIAL_ALPHA.OPAQUE;
		this.aoMap = undefined;
		this.aoMapIntensity = 1.0;
		this.bumpMap = undefined;
		this.bumpScale = 1.0;
		this.depthTest = undefined;
		this.depthWrite = undefined;
		this.emissiveMap = undefined;
		this.emissiveness = "#000000";
		this.materialOutput = false;
		this.normalMap = undefined;
		this.normalScale = 1.0;
		this.opacity = 1.0;
		this.shading = MATERIAL_SHADING.SMOOTH;
		this.side = MATERIAL_SIDE.DOUBLE;
		this.transparent = undefined;

		this.alphaMap_0 = undefined;
		this.alphaMap_1 = undefined;
		this.alphaMap_2 = undefined;
		this.alphaMap_3 = undefined;
		this.alphaMap_4 = undefined;
		this.alphaMap_5 = undefined;
		this.alphaMap_6 = undefined;
		this.alphaMap_7 = undefined;
		this.color_0 = "#ffffff";
		this.color_1 = "#ffffff";
		this.color_2 = "#ffffff";
		this.color_3 = "#ffffff";
		this.color_4 = "#ffffff";
		this.color_5 = "#ffffff";
		this.color_6 = "#ffffff";
		this.color_7 = "#ffffff";
		this.map_0 = undefined;
		this.map_1 = undefined;
		this.map_2 = undefined;
		this.map_3 = undefined;
		this.map_4 = undefined;
		this.map_5 = undefined;
		this.map_6 = undefined;
		this.map_7 = undefined;
		this.materialIndexDataMap = undefined;
		this.materialIndexDataMapSize = undefined;
		this.size_0 = undefined;
		this.size_1 = undefined;
		this.size_2 = undefined;
		this.size_3 = undefined;
		this.size_4 = undefined;
		this.size_5 = undefined;
		this.size_6 = undefined;
		this.size_7 = undefined;
		this.sizeAttenuation_0 = undefined;
		this.sizeAttenuation_1 = undefined;
		this.sizeAttenuation_2 = undefined;
		this.sizeAttenuation_3 = undefined;
		this.sizeAttenuation_4 = undefined;
		this.sizeAttenuation_5 = undefined;
		this.sizeAttenuation_6 = undefined;
		this.sizeAttenuation_7 = undefined;
	}

	// #endregion Public Methods (3)
}
