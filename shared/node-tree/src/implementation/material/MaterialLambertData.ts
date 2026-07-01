import {
	type IMapData,
	type IMaterialLambertData,
	type IMaterialLambertDataProperties,
	MATERIAL_ALPHA,
	MATERIAL_SHADING,
	MATERIAL_SIDE} from "@shapediver/viewer.shared.types";
import {AbstractMaterialData} from "./AbstractMaterialData";

export class MaterialLambertData
	extends AbstractMaterialData
	implements IMaterialLambertData
{
	#displacementBias: number = 0;
	#displacementMap?: IMapData;
	#displacementScale: number = 1;
	#specularMap?: IMapData;
	#envMap?: string | string[];
	#reflectivity: number = 1;

	constructor(
		properties?: IMaterialLambertDataProperties,
		id?: string,
		version?: string,
	) {
		super(properties, id, version);
		if (!properties) return;
		if (properties.displacementBias !== undefined)
			this.displacementBias = properties.displacementBias;
		if (properties.displacementMap !== undefined)
			this.displacementMap = properties.displacementMap;
		if (properties.displacementScale !== undefined)
			this.displacementScale = properties.displacementScale;
		if (properties.specularMap !== undefined)
			this.specularMap = properties.specularMap;
		if (properties.envMap !== undefined) this.envMap = properties.envMap;
		if (properties.reflectivity !== undefined)
			this.reflectivity = properties.reflectivity;
	}

	public get displacementBias(): number {
		return this.#displacementBias;
	}

	public set displacementBias(value: number) {
		this.#displacementBias = value;
	}

	public get displacementMap(): IMapData | undefined {
		return this.#displacementMap;
	}

	public set displacementMap(value: IMapData | undefined) {
		this.#displacementMap = value;
	}

	public get displacementScale(): number {
		return this.#displacementScale;
	}

	public set displacementScale(value: number) {
		this.#displacementScale = value;
	}

	public get specularMap(): IMapData | undefined {
		return this.#specularMap;
	}

	public set specularMap(value: IMapData | undefined) {
		this.#specularMap = value;
	}

	public get envMap(): string | string[] | undefined {
		return this.#envMap;
	}

	public set envMap(value: string | string[] | undefined) {
		this.#envMap = value;
	}

	public get reflectivity(): number {
		return this.#reflectivity;
	}

	public set reflectivity(value: number) {
		this.#reflectivity = value;
	}

	public clone(): IMaterialLambertData {
		return new MaterialLambertData(
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
				displacementMap: this.displacementMap,
				displacementScale: this.displacementScale,
				displacementBias: this.displacementBias,
				envMap: this.envMap,
				reflectivity: this.reflectivity,
				specularMap: this.specularMap,
			},
			this.id,
			this.version,
		);
	}

	public copy(source: IMaterialLambertData): void {
		this.displacementBias = source.displacementBias;
		this.displacementMap = source.displacementMap;
		this.displacementScale = source.displacementScale;
		this.specularMap = source.specularMap;
		this.envMap = source.envMap;
		this.reflectivity = source.reflectivity;
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

		this.displacementBias = 0;
		this.displacementMap = undefined;
		this.displacementScale = 1;
		this.specularMap = undefined;
		this.envMap = undefined;
		this.reflectivity = 1;
	}
}
