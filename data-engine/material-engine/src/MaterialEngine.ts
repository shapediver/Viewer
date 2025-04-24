import {ShapeDiverResponseOutputContent} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	IMaterialContentData,
	IMaterialContentDataV1,
	IMaterialContentDataV2,
	IMaterialContentDataV3,
	IPresetMaterialDefinition,
	ITexture,
} from "@shapediver/viewer.data-engine.shared-types";
import {ITreeNode, TreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	Converter,
	HttpClient,
	Logger,
	ShapeDiverViewerDataProcessingError,
} from "@shapediver/viewer.shared.services";
import {vec2, vec4} from "gl-matrix";
import {materialDatabase} from "./materialDatabase";
/* eslint-disable no-prototype-builtins */
import {
	IMapDataPropertiesDefinition,
	IMaterialAbstractData,
	IMaterialAbstractDataProperties,
	IMaterialAbstractDataPropertiesDefinition,
	IMaterialGemDataProperties,
	IMaterialGemDataPropertiesDefinition,
	IMaterialLambertDataProperties,
	IMaterialLambertDataPropertiesDefinition,
	IMaterialPhongDataProperties,
	IMaterialPhongDataPropertiesDefinition,
	IMaterialSpecularGlossinessDataProperties,
	IMaterialSpecularGlossinessDataPropertiesDefinition,
	IMaterialStandardDataProperties,
	IMaterialStandardDataPropertiesDefinition,
	IMaterialUnlitDataProperties,
	IMaterialUnlitDataPropertiesDefinition,
	MapData,
	MaterialGemData,
	MaterialLambertData,
	MaterialPhongData,
	MaterialSpecularGlossinessData,
	MaterialStandardData,
	MaterialUnlitData,
	MATERIAL_SIDE,
	MATERIAL_TYPE,
	TEXTURE_FILTERING,
	TEXTURE_WRAPPING,
} from "@shapediver/viewer.shared.types";

export class MaterialEngine {
	// #region Properties (4)

	private readonly _converter: Converter = Converter.instance;
	private readonly _httpClient: HttpClient = HttpClient.instance;
	private readonly _logger: Logger = Logger.instance;

	private static _instance: MaterialEngine;

	// #endregion Properties (4)

	// #region Public Static Getters And Setters (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Getters And Setters (1)

	// #region Public Methods (12)

	/**
	 * Create a material data based on the material properties
	 *
	 * @param materialProperties
	 * @returns
	 */
	public createMaterialData(
		materialProperties: IMaterialAbstractDataProperties,
	): IMaterialAbstractData {
		const materialType = materialProperties.type || MATERIAL_TYPE.STANDARD;
		switch (materialType) {
			case MATERIAL_TYPE.SPECULAR_GLOSSINESS:
				return new MaterialSpecularGlossinessData(materialProperties);
			case MATERIAL_TYPE.UNLIT:
				return new MaterialUnlitData(materialProperties);
			case MATERIAL_TYPE.GEM:
				return new MaterialGemData(materialProperties);
			case MATERIAL_TYPE.PHONG:
				return new MaterialPhongData(materialProperties);
			case MATERIAL_TYPE.LAMBERT:
				return new MaterialLambertData(materialProperties);
			default:
				return new MaterialStandardData(materialProperties);
		}
	}

	public async createMaterialDataFromDefinition(
		definition: IMaterialAbstractDataPropertiesDefinition,
	): Promise<IMaterialAbstractData> {
		const materialType = definition.type || MATERIAL_TYPE.STANDARD;

		const promises: Promise<MapData | undefined>[] = [];

		const abstractProperties: IMaterialAbstractDataProperties = {};

		abstractProperties.alphaCutoff = definition.alphaCutoff;
		promises.push(
			this.loadMapFromDefinition(definition.alphaMap).then((map) => {
				if (map) abstractProperties.alphaMap = map;
				return map;
			}),
		);
		abstractProperties.alphaMode = definition.alphaMode;
		promises.push(
			this.loadMapFromDefinition(definition.aoMap).then((map) => {
				if (map) abstractProperties.aoMap = map;
				return map;
			}),
		);
		abstractProperties.aoMapIntensity = definition.aoMapIntensity;
		promises.push(
			this.loadMapFromDefinition(definition.bumpMap).then((map) => {
				if (map) abstractProperties.bumpMap = map;
				return map;
			}),
		);
		abstractProperties.bumpScale = definition.bumpScale;
		abstractProperties.color = definition.color
			? definition.color
			: undefined;
		abstractProperties.depthTest = definition.depthTest;
		abstractProperties.depthWrite = definition.depthWrite;
		promises.push(
			this.loadMapFromDefinition(definition.emissiveMap).then((map) => {
				if (map) abstractProperties.emissiveMap = map;
				return map;
			}),
		);
		abstractProperties.emissiveness = definition.emissiveness
			? definition.emissiveness
			: undefined;
		promises.push(
			this.loadMapFromDefinition(definition.map).then((map) => {
				if (map) abstractProperties.map = map;
				return map;
			}),
		);
		abstractProperties.name = definition.name;
		promises.push(
			this.loadMapFromDefinition(definition.normalMap).then((map) => {
				if (map) abstractProperties.normalMap = map;
				return map;
			}),
		);
		abstractProperties.normalScale = definition.normalScale;
		abstractProperties.opacity = definition.opacity;
		abstractProperties.shading = definition.shading;
		abstractProperties.side = definition.side;
		abstractProperties.transparent = definition.transparent;
		abstractProperties.type = materialType;

		switch (materialType) {
			case MATERIAL_TYPE.SPECULAR_GLOSSINESS: {
				const specularGlossinessProperties: IMaterialSpecularGlossinessDataProperties =
					abstractProperties;
				const specularGlossinessDefinition: IMaterialSpecularGlossinessDataPropertiesDefinition =
					definition as IMaterialSpecularGlossinessDataPropertiesDefinition;

				specularGlossinessProperties.envMap =
					specularGlossinessDefinition.envMap;
				specularGlossinessProperties.glossiness =
					specularGlossinessDefinition.glossiness;
				specularGlossinessProperties.specular =
					specularGlossinessDefinition.specular;

				if (specularGlossinessDefinition.specularGlossinessMap) {
					promises.push(
						this.loadMapFromDefinition(
							specularGlossinessDefinition.specularGlossinessMap,
						).then((map) => {
							if (map)
								specularGlossinessProperties.specularGlossinessMap =
									map;
							return map;
						}),
					);
				} else {
					promises.push(
						this.loadMapFromDefinition(
							specularGlossinessDefinition.specularMap,
						).then((map) => {
							if (map)
								specularGlossinessProperties.specularMap = map;
							return map;
						}),
					);
					promises.push(
						this.loadMapFromDefinition(
							specularGlossinessDefinition.glossinessMap,
						).then((map) => {
							if (map)
								specularGlossinessProperties.glossinessMap =
									map;
							return map;
						}),
					);
				}

				await Promise.all(promises);
				return new MaterialSpecularGlossinessData(
					specularGlossinessProperties,
				);
			}
			case MATERIAL_TYPE.UNLIT: {
				const unlitProperties: IMaterialUnlitDataProperties =
					abstractProperties;
				const unlitDefinition: IMaterialUnlitDataPropertiesDefinition =
					definition;
				unlitProperties.envMap = unlitDefinition.envMap;
				await Promise.all(promises);
				return new MaterialUnlitData(unlitProperties);
			}
			case MATERIAL_TYPE.PHONG: {
				const phongProperties: IMaterialPhongDataProperties =
					abstractProperties;
				const phongDefinition: IMaterialPhongDataPropertiesDefinition =
					definition;
				phongProperties.displacementBias =
					phongDefinition.displacementBias;
				promises.push(
					this.loadMapFromDefinition(
						phongDefinition.displacementMap,
					).then((map) => {
						if (map) phongProperties.displacementMap = map;
						return map;
					}),
				);
				phongProperties.displacementScale =
					phongDefinition.displacementScale;
				phongProperties.envMap = phongDefinition.envMap;
				phongProperties.reflectivity = phongDefinition.reflectivity;
				phongProperties.shininess = phongDefinition.shininess;
				phongProperties.specular = phongDefinition.specular;
				promises.push(
					this.loadMapFromDefinition(
						phongDefinition.specularMap,
					).then((map) => {
						if (map) phongProperties.specularMap = map;
						return map;
					}),
				);

				await Promise.all(promises);
				return new MaterialPhongData(phongProperties);
			}
			case MATERIAL_TYPE.LAMBERT: {
				const lambertProperties: IMaterialLambertDataProperties =
					abstractProperties;
				const lambertDefinition: IMaterialLambertDataPropertiesDefinition =
					definition;
				lambertProperties.displacementBias =
					lambertDefinition.displacementBias;
				promises.push(
					this.loadMapFromDefinition(
						lambertDefinition.displacementMap,
					).then((map) => {
						if (map) lambertProperties.displacementMap = map;
						return map;
					}),
				);
				lambertProperties.displacementScale =
					lambertDefinition.displacementScale;
				lambertProperties.envMap = lambertDefinition.envMap;
				lambertProperties.reflectivity = lambertDefinition.reflectivity;
				promises.push(
					this.loadMapFromDefinition(
						lambertDefinition.specularMap,
					).then((map) => {
						if (map) lambertProperties.specularMap = map;
						return map;
					}),
				);

				await Promise.all(promises);
				return new MaterialLambertData(lambertProperties);
			}

			case MATERIAL_TYPE.GEM: {
				const gemProperties: IMaterialGemDataProperties =
					abstractProperties;
				const gemDefinition: IMaterialGemDataPropertiesDefinition =
					definition;

				gemProperties.brightness = gemDefinition.brightness;
				gemProperties.center = gemDefinition.center;
				gemProperties.colorTransferBegin =
					gemDefinition.colorTransferBegin;
				gemProperties.colorTransferEnd = gemDefinition.colorTransferEnd;
				gemProperties.contrast = gemDefinition.contrast;
				gemProperties.dispersion = gemDefinition.dispersion;
				gemProperties.envMap = gemDefinition.envMap;
				gemProperties.gamma = gemDefinition.gamma;
				promises.push(
					this.loadMapFromDefinition(gemDefinition.impurityMap).then(
						(map) => {
							if (map) gemProperties.impurityMap = map;
							return map;
						},
					),
				);
				gemProperties.impurityScale = gemDefinition.impurityScale;
				gemProperties.radius = gemDefinition.radius;
				gemProperties.refractionIndex = gemDefinition.refractionIndex;
				promises.push(
					this.loadMapFromDefinition(
						gemDefinition.sphericalNormalMap,
					).then((map) => {
						if (map) gemProperties.sphericalNormalMap = map;
						return map;
					}),
				);
				gemProperties.tracingDepth = gemDefinition.tracingDepth;
				gemProperties.tracingOpacity = gemDefinition.tracingOpacity;

				await Promise.all(promises);
				return new MaterialGemData(gemProperties);
			}
			default: {
				const standardProperties: IMaterialStandardDataProperties =
					abstractProperties;
				const standardDefinition: IMaterialStandardDataPropertiesDefinition =
					definition;

				standardProperties.attenuationColor =
					standardDefinition.attenuationColor;
				standardProperties.attenuationDistance =
					standardDefinition.attenuationDistance;
				standardProperties.clearcoat = standardDefinition.clearcoat;
				promises.push(
					this.loadMapFromDefinition(
						standardDefinition.clearcoatMap,
					).then((map) => {
						if (map) standardProperties.clearcoatMap = map;
						return map;
					}),
				);
				promises.push(
					this.loadMapFromDefinition(
						standardDefinition.clearcoatNormalMap,
					).then((map) => {
						if (map) standardProperties.clearcoatNormalMap = map;
						return map;
					}),
				);
				standardProperties.clearcoatRoughness =
					standardDefinition.clearcoatRoughness;
				promises.push(
					this.loadMapFromDefinition(
						standardDefinition.clearcoatRoughnessMap,
					).then((map) => {
						if (map) standardProperties.clearcoatRoughnessMap = map;
						return map;
					}),
				);
				standardProperties.displacementBias =
					standardDefinition.displacementBias;
				promises.push(
					this.loadMapFromDefinition(
						standardDefinition.displacementMap,
					).then((map) => {
						if (map) standardProperties.displacementMap = map;
						return map;
					}),
				);
				standardProperties.displacementScale =
					standardDefinition.displacementScale;
				standardProperties.envMap = standardDefinition.envMap;
				standardProperties.ior = standardDefinition.ior;
				standardProperties.metalness = standardDefinition.metalness;
				if (standardDefinition.metalnessRoughnessMap) {
					promises.push(
						this.loadMapFromDefinition(
							standardDefinition.metalnessMap,
						).then((map) => {
							if (map) standardProperties.metalnessMap = map;
							return map;
						}),
					);
				} else {
					promises.push(
						this.loadMapFromDefinition(
							standardDefinition.metalnessMap,
						).then((map) => {
							if (map) standardProperties.metalnessMap = map;
							return map;
						}),
					);
					promises.push(
						this.loadMapFromDefinition(
							standardDefinition.roughnessMap,
						).then((map) => {
							if (map) standardProperties.roughnessMap = map;
							return map;
						}),
					);
				}
				standardProperties.roughness = standardDefinition.roughness;
				standardProperties.sheen = standardDefinition.sheen;
				standardProperties.sheenColor = standardDefinition.sheenColor;
				promises.push(
					this.loadMapFromDefinition(
						standardDefinition.sheenColorMap,
					).then((map) => {
						if (map) standardProperties.sheenColorMap = map;
						return map;
					}),
				);
				standardProperties.sheenRoughness =
					standardDefinition.sheenRoughness;
				promises.push(
					this.loadMapFromDefinition(
						standardDefinition.sheenRoughnessMap,
					).then((map) => {
						if (map) standardProperties.sheenRoughnessMap = map;
						return map;
					}),
				);
				standardProperties.specularColor =
					standardDefinition.specularColor;
				promises.push(
					this.loadMapFromDefinition(
						standardDefinition.specularColorMap,
					).then((map) => {
						if (map) standardProperties.specularColorMap = map;
						return map;
					}),
				);
				standardProperties.specularIntensity =
					standardDefinition.specularIntensity;
				promises.push(
					this.loadMapFromDefinition(
						standardDefinition.specularIntensityMap,
					).then((map) => {
						if (map) standardProperties.specularIntensityMap = map;
						return map;
					}),
				);
				standardProperties.thickness = standardDefinition.thickness;
				promises.push(
					this.loadMapFromDefinition(
						standardDefinition.thicknessMap,
					).then((map) => {
						if (map) standardProperties.thicknessMap = map;
						return map;
					}),
				);
				standardProperties.transmission =
					standardDefinition.transmission;
				promises.push(
					this.loadMapFromDefinition(
						standardDefinition.transmissionMap,
					).then((map) => {
						if (map) standardProperties.transmissionMap = map;
						return map;
					}),
				);

				await Promise.all(promises);
				return new MaterialStandardData(standardProperties);
			}
		}
	}

	/**
	 * Load the material content into a scene graph node.
	 *
	 * @param content the material content
	 * @returns the scene graph node
	 */
	public async loadContent(
		content: ShapeDiverResponseOutputContent,
	): Promise<ITreeNode> {
		const node = new TreeNode(content.name || "material");
		if (!content)
			throw new ShapeDiverViewerDataProcessingError(
				"MaterialEngine.loadContent: Invalid content was provided to material engine.",
			);

		let material = new MaterialStandardData();

		if (content.data) {
			const data: IMaterialContentData = content.data;
			let presetData: IMaterialContentDataV3 | undefined;
			if (data.materialpreset)
				presetData = this.loadPresetMaterialDefinition(
					data.materialpreset,
				);

			if (data.materialType && data.materialType !== "standard") {
				// gem material https://shapediver.atlassian.net/browse/SS-2514
			} else {
				if (data.version) {
					if (data.version === "1.0") {
						material = await this.loadMaterialV3(
							this.loadMaterialDefinitionV1(data, presetData),
						);
					} else if (data.version === "2.0") {
						material = await this.loadMaterialV3(
							this.loadMaterialDefinitionV2(data, presetData),
						);
					} else if (data.version === "3.0") {
						material = await this.loadMaterialV3(
							this.loadMaterialDefinitionV3(data, presetData),
						);
					} else {
						throw new ShapeDiverViewerDataProcessingError(
							"MaterialEngine.loadContent: Material data version not supported.",
						);
					}
				}
			}
		} else {
			throw new ShapeDiverViewerDataProcessingError(
				"MaterialEngine.loadContent: No material data was provided to material engine.",
			);
		}

		node.data.push(material);
		return node;
	}

	public async loadMap(
		url: string,
		id?: string,
	): Promise<MapData | undefined> {
		let response;
		if (!id) {
			response = await this._httpClient.loadTexture(url);
		} else {
			response = await this._httpClient.loadTexture(
				"https://viewer.shapediver.com/v2/materials/1024/" +
					id +
					"/" +
					url,
			);
		}

		if (!response) return;

		if (response.data.image) {
			return new MapData(response.data.image, {blob: response.data.blob});
		} else {
			return new MapData(response.data.buffer, {
				blob: response.data.blob,
			});
		}
	}

	/**
	 * Load a map from a definition.
	 *
	 * @param definition
	 * @returns
	 */
	public async loadMapFromDefinition(
		definition?: IMapDataPropertiesDefinition,
	): Promise<MapData | undefined> {
		if (!definition) return undefined;

		if (typeof definition === "string") {
			return this.loadMap(definition);
		} else if (definition.image) {
			if (typeof definition.image === "string") {
				return this.loadMapWithProperties({
					href: definition.image,
					wrapS: definition.wrapS,
					wrapT: definition.wrapT,
					center: definition.center as number[] | undefined,
					color: definition.color
						? this._converter.toColorArray(definition.color)
						: undefined,
					offset: definition.offset as number[] | undefined,
					repeat: definition.repeat as number[] | undefined,
					rotation: definition.rotation,
				});
			} else {
				return new MapData(definition.image);
			}
		}
		return;
	}

	public async loadMapWithProperties(
		texture: ITexture,
	): Promise<MapData | undefined> {
		const response = await this._httpClient.loadTexture(texture.href!);

		if (!response) return;

		const wrapS =
			texture.wrapS === 1
				? TEXTURE_WRAPPING.CLAMP_TO_EDGE
				: texture.wrapS === 2
					? TEXTURE_WRAPPING.MIRRORED_REPEAT
					: TEXTURE_WRAPPING.REPEAT;
		const wrapT =
			texture.wrapT === 1
				? TEXTURE_WRAPPING.CLAMP_TO_EDGE
				: texture.wrapT === 2
					? TEXTURE_WRAPPING.MIRRORED_REPEAT
					: TEXTURE_WRAPPING.REPEAT;
		const center = texture.center
			? vec2.fromValues(texture.center[0], texture.center[1])
			: vec2.fromValues(0, 0);
		const color = texture.color
			? vec4.fromValues(
					texture.color[0] / 255,
					texture.color[1] / 255,
					texture.color[2] / 255,
					texture.color[3] / 255,
				)
			: vec4.fromValues(1, 1, 1, 1);
		const offset = texture.offset
			? vec2.fromValues(texture.offset[0], texture.offset[1])
			: vec2.fromValues(0, 0);
		const repeat = texture.repeat
			? vec2.fromValues(texture.repeat[0], texture.repeat[1])
			: vec2.fromValues(1, 1);

		return new MapData(response.data.image ?? response.data.buffer, {
			blob: response.data.blob,
			wrapS,
			wrapT,
			minFilter: TEXTURE_FILTERING.LINEAR_MIPMAP_LINEAR,
			magFilter: TEXTURE_FILTERING.LINEAR,
			center,
			color,
			offset,
			repeat,
			rotation: texture.rotation || 0,
		});
	}

	public loadMaterialDefinitionV1(
		data: IMaterialContentDataV1,
		presetData: IMaterialContentDataV3 = {},
	): IMaterialContentDataV3 {
		// ambient is ignored

		if (data.color) {
			presetData.color = this.multiplyColors(
				data.color,
				presetData.color,
			);
		} else if (data.diffuse) {
			// multiply color with diffuse
			presetData.color = this.multiplyColors(
				data.diffuse,
				presetData.color,
			);
		}

		// emission is ignored

		// specular is ignored

		if (data.shine || data.shine === 0) {
			presetData.metalness = Math.min(1, data.shine);
			presetData.roughness = 1 - Math.min(1, data.shine);
		}

		if (data.hasOwnProperty("transparency"))
			presetData.transparency = data.transparency!;

		if (data.bitmaptexture)
			presetData.bitmaptexture = {
				href: data.bitmaptexture,
			};

		if (data.bumptexture)
			presetData.bumptexture = {
				href: data.bumptexture,
			};

		if (data.transparencytexture)
			presetData.transparencytexture = {
				href: data.transparencytexture,
			};

		return presetData;
	}

	public loadMaterialDefinitionV2(
		data: IMaterialContentDataV2,
		presetData: IMaterialContentDataV3 = {},
	): IMaterialContentDataV3 {
		// ambient is ignored

		if (data.color)
			presetData.color = this.multiplyColors(
				data.color,
				presetData.color,
			);

		presetData.side = data.side;

		if (data.metalness || data.metalness === 0)
			presetData.metalness = data.metalness;

		if (data.roughness || data.roughness === 0)
			presetData.roughness = data.roughness;

		if (data.hasOwnProperty("transparency"))
			presetData.transparency = data.transparency!;

		if (data.alphaThreshold || data.alphaThreshold === 0)
			presetData.alphaThreshold = data.alphaThreshold;

		if (data.bitmaptexture)
			presetData.bitmaptexture = {
				href: data.bitmaptexture,
			};

		if (data.metalnesstexture)
			presetData.metalnesstexture = {
				href: data.metalnesstexture,
			};

		if (data.roughnesstexture)
			presetData.roughnesstexture = {
				href: data.roughnesstexture,
			};

		if (data.bumptexture)
			presetData.bumptexture = {
				href: data.bumptexture,
			};

		if (data.normaltexture)
			presetData.normaltexture = {
				href: data.normaltexture,
			};

		if (data.transparencytexture)
			presetData.transparencytexture = {
				href: data.transparencytexture,
			};

		return presetData;
	}

	public loadMaterialDefinitionV3(
		data: IMaterialContentDataV3,
		presetData: IMaterialContentDataV3 = {},
	): IMaterialContentDataV3 {
		// ambient is ignored

		if (data.color)
			presetData.color = this.multiplyColors(
				data.color,
				presetData.color,
			);

		presetData.side = data.side;

		if (data.metalness || data.metalness === 0)
			presetData.metalness = data.metalness;

		if (data.roughness || data.roughness === 0)
			presetData.roughness = data.roughness;

		if (data.hasOwnProperty("transparency"))
			presetData.transparency = data.transparency!;

		if (data.alphaThreshold || data.alphaThreshold === 0)
			presetData.alphaThreshold = data.alphaThreshold;

		if (data.bumpAmplitude || data.bumpAmplitude === 0)
			presetData.bumpAmplitude = data.bumpAmplitude;

		if (data.bitmaptexture) presetData.bitmaptexture = data.bitmaptexture;

		if (data.metalnesstexture)
			presetData.metalnesstexture = data.metalnesstexture;

		if (data.roughnesstexture)
			presetData.roughnesstexture = data.roughnesstexture;

		if (data.bumptexture) presetData.bumptexture = data.bumptexture;

		if (data.normaltexture) presetData.normaltexture = data.normaltexture;

		if (data.transparencytexture)
			presetData.transparencytexture = data.transparencytexture;

		// line material https://shapediver.atlassian.net/browse/SS-2272

		return presetData;
	}

	public async loadMaterialV3(
		data: IMaterialContentDataV3,
	): Promise<MaterialStandardData> {
		const material = new MaterialStandardData();
		const promises: Promise<MapData | undefined>[] = [];
		// ambient is ignored

		if (data.color) material.color = data.color;

		material.side =
			data.side === "front"
				? MATERIAL_SIDE.FRONT
				: data.side === "back"
					? MATERIAL_SIDE.BACK
					: MATERIAL_SIDE.DOUBLE;

		if (data.metalness || data.metalness === 0)
			material.metalness = data.metalness;

		if (data.roughness || data.roughness === 0)
			material.roughness = data.roughness;

		if (data.hasOwnProperty("transparency"))
			material.opacity = 1 - data.transparency!;

		if (data.alphaThreshold || data.alphaThreshold === 0)
			material.alphaCutoff = data.alphaThreshold;

		if (data.bumpAmplitude || data.bumpAmplitude === 0)
			material.bumpScale = data.bumpAmplitude;

		if (data.bitmaptexture) {
			promises.push(
				this.loadMapWithProperties(data.bitmaptexture).then((map) => {
					if (map) material.map = map;
					return map;
				}),
			);
		}

		if (data.metalnesstexture) {
			promises.push(
				this.loadMapWithProperties(data.metalnesstexture).then(
					(map) => {
						if (map) material.metalnessMap = map;
						return map;
					},
				),
			);
		}

		if (data.roughnesstexture) {
			promises.push(
				this.loadMapWithProperties(data.roughnesstexture).then(
					(map) => {
						if (map) material.roughnessMap = map;
						return map;
					},
				),
			);
		}

		if (data.bumptexture) {
			promises.push(
				this.loadMapWithProperties(data.bumptexture).then((map) => {
					if (map) material.bumpMap = map;
					return map;
				}),
			);
		}

		if (data.normaltexture) {
			promises.push(
				this.loadMapWithProperties(data.normaltexture).then((map) => {
					if (map) material.normalMap = map;
					return map;
				}),
			);
		}

		if (data.transparencytexture) {
			promises.push(
				this.loadMapWithProperties(data.transparencytexture).then(
					(map) => {
						if (map) material.alphaMap = map;
						return map;
					},
				),
			);
		}

		// line material https://shapediver.atlassian.net/browse/SS-2272
		await Promise.all(promises);

		return material;
	}

	public async loadPresetMaterial(
		preset: number,
	): Promise<MaterialStandardData> {
		return this.loadMaterialV3(this.loadPresetMaterialDefinition(preset));
	}

	public loadPresetMaterialDefinition(
		preset: number,
	): IMaterialContentDataV3 {
		const definition: IMaterialContentDataV3 = {};
		const idStrings = this.getClassAndSpecificId(preset);
		if (
			materialDatabase[idStrings.class] &&
			materialDatabase[idStrings.class][idStrings.specific]
		) {
			this.assignSpecificDefinition(
				idStrings,
				materialDatabase[idStrings.class][idStrings.specific],
				definition,
			);
			this.assignGeneralDefinition(
				idStrings,
				materialDatabase[idStrings.class].properties,
				materialDatabase[idStrings.class][idStrings.specific],
				definition,
			);
		} else if (
			materialDatabase[idStrings.class] &&
			materialDatabase[idStrings.class]["00"]
		) {
			this.assignSpecificDefinition(
				{class: idStrings.class, specific: "00"},
				materialDatabase[idStrings.class]["00"],
				definition,
			);
			this.assignGeneralDefinition(
				{class: idStrings.class, specific: "00"},
				materialDatabase[idStrings.class].properties,
				materialDatabase[idStrings.class]["00"],
				definition,
			);
		} else {
			this.assignSpecificDefinition(
				{class: "00", specific: "00"},
				materialDatabase["00"]["00"],
				definition,
			);
			this.assignGeneralDefinition(
				{class: "00", specific: "00"},
				materialDatabase["00"].properties,
				materialDatabase["00"]["00"],
				definition,
			);
		}
		return definition;
	}

	// #endregion Public Methods (12)

	// #region Private Methods (4)

	private assignGeneralDefinition(
		id: {class: string; specific: string},
		generalDefinition: IPresetMaterialDefinition,
		specificDefinition: IPresetMaterialDefinition,
		definition: IMaterialContentDataV3,
	) {
		if (
			generalDefinition.transparencytexture &&
			!specificDefinition.transparencytexture
		)
			definition.transparencytexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					generalDefinition.transparencytexture,
			};

		if (
			generalDefinition.hasOwnProperty("alphaThreshold") &&
			!specificDefinition.hasOwnProperty("alphaThreshold")
		)
			definition.alphaThreshold = generalDefinition.alphaThreshold;

		if (generalDefinition.bumptexture && !specificDefinition.bumptexture)
			definition.bumptexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					generalDefinition.bumptexture,
			};

		if (
			generalDefinition.hasOwnProperty("bumpAmplitude") &&
			!specificDefinition.hasOwnProperty("bumpAmplitude")
		)
			definition.bumpAmplitude = generalDefinition.bumpAmplitude!;

		if (generalDefinition.color && !specificDefinition.color)
			definition.color = generalDefinition.color;

		if (
			generalDefinition.bitmaptexture &&
			!specificDefinition.bitmaptexture
		)
			definition.bitmaptexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					generalDefinition.bitmaptexture,
			};

		if (
			generalDefinition.hasOwnProperty("metalness") &&
			!specificDefinition.hasOwnProperty("metalness")
		)
			definition.metalness = generalDefinition.metalness!;

		if (
			generalDefinition.metalnesstexture &&
			!specificDefinition.metalnesstexture
		)
			definition.metalnesstexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					generalDefinition.metalnesstexture,
			};

		if (
			generalDefinition.normaltexture &&
			!specificDefinition.normaltexture
		)
			definition.normaltexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					generalDefinition.normaltexture,
			};

		if (
			generalDefinition.hasOwnProperty("transparency") &&
			!specificDefinition.hasOwnProperty("transparency")
		)
			definition.transparency = generalDefinition.transparency;

		if (
			generalDefinition.hasOwnProperty("roughness") &&
			!specificDefinition.hasOwnProperty("roughness")
		)
			definition.roughness = generalDefinition.roughness!;

		if (
			generalDefinition.roughnesstexture &&
			!specificDefinition.roughnesstexture
		)
			definition.roughnesstexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					generalDefinition.roughnesstexture,
			};

		if (generalDefinition.side && !specificDefinition.side)
			definition.side = generalDefinition.side;
	}

	private assignSpecificDefinition(
		id: {class: string; specific: string},
		specificDefinition: IPresetMaterialDefinition,
		definition: IMaterialContentDataV3,
	) {
		if (specificDefinition.transparencytexture)
			definition.transparencytexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					id.specific +
					"/" +
					specificDefinition.transparencytexture,
			};

		if (specificDefinition.hasOwnProperty("alphaThreshold"))
			definition.alphaThreshold = specificDefinition.alphaThreshold!;

		if (specificDefinition.bumptexture)
			definition.bumptexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					id.specific +
					"/" +
					specificDefinition.bumptexture,
			};

		if (specificDefinition.hasOwnProperty("bumpAmplitude"))
			definition.bumpAmplitude = specificDefinition.bumpAmplitude!;

		if (specificDefinition.color)
			definition.color = specificDefinition.color;

		if (specificDefinition.bitmaptexture)
			definition.bitmaptexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					id.specific +
					"/" +
					specificDefinition.bitmaptexture,
			};

		if (specificDefinition.hasOwnProperty("metalness"))
			definition.metalness = specificDefinition.metalness!;

		if (specificDefinition.metalnesstexture)
			definition.metalnesstexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					id.specific +
					"/" +
					specificDefinition.metalnesstexture,
			};

		if (specificDefinition.normaltexture)
			definition.normaltexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					id.specific +
					"/" +
					specificDefinition.normaltexture,
			};

		if (specificDefinition.hasOwnProperty("transparency"))
			definition.transparency = specificDefinition.transparency!;

		if (specificDefinition.hasOwnProperty("roughness"))
			definition.roughness = specificDefinition.roughness!;

		if (specificDefinition.roughnesstexture)
			definition.roughnesstexture = {
				href:
					"https://viewer.shapediver.com/v2/materials/1024/" +
					id.class +
					"/" +
					id.specific +
					"/" +
					specificDefinition.roughnesstexture,
			};

		if (specificDefinition.side) definition.side = specificDefinition.side;
	}

	private getClassAndSpecificId(id: number): {
		class: string;
		specific: string;
	} {
		// for a while, we had documented the presets to be 10, 20, 30 and 40 here, we allow for the few cases where this was used to succeed
		if (id < 100 && id % 10 == 0) id /= 10;

		// if the id is less than 10, multiply it by 100
		if (id < 10) id *= 100;

		const cast = (id: number): string => {
			const idString = String(id);
			return idString.padStart(2, "0").slice(0, 2);
		};

		return {
			class: cast(Math.floor(id / 100)),
			specific: cast(id - Math.floor(id / 100) * 100),
		};
	}

	/**
	 * Multiply two colors
	 *
	 * @param color1
	 * @param color2
	 * @returns
	 */
	private multiplyColors(color1: number[], color2?: number[]): number[] {
		if (!color2) return color1;
		return [
			Math.min(255, (color1[0] * color2[0]) / 255),
			Math.min(255, (color1[1] * color2[1]) / 255),
			Math.min(255, (color1[2] * color2[2]) / 255),
			Math.min(
				255,
				((color1[3] !== undefined ? color1[3] : 255) *
					(color2[3] !== undefined ? color2[3] : 255)) /
					255,
			),
		];
	}

	// #endregion Private Methods (4)
}
