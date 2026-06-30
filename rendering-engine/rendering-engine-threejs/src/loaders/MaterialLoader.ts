import {
	GeometryData,
	ITreeNodeData,
	MaterialBasicLineData,
	MaterialGemData,
	MaterialLambertData,
	MaterialMultiPointData,
	MaterialPhongData,
	MaterialPointData,
	MaterialShadowData,
	MaterialSpecularGlossinessData,
	MaterialStandardData,
	MaterialUnlitData,
	Tree,
} from "@shapediver/viewer.shared.node-tree";
import {btoaCustom, Converter} from "@shapediver/viewer.shared.services";
import {
	IMapData,
	IMaterialAbstractData,
	MATERIAL_ALPHA,
	MATERIAL_SIDE,
	MATERIAL_TYPE,
	PRIMITIVE_MODE,
	TEXTURE_FILTERING,
	TEXTURE_WRAPPING,
} from "@shapediver/viewer.shared.types";
import {mat4, quat} from "gl-matrix";
import * as THREE from "three";
import {ILoader} from "../interfaces/ILoader";
import {GemMaterial, GemMaterialParameters} from "../materials/GemMaterial";
import {MeshUnlitMaterialParameters} from "../materials/MeshUnlitMaterialParameters";
import {
	MultiPointsMaterial,
	MultiPointsMaterialParameters,
} from "../materials/MultiPointsMaterial";
import {
	SpecularGlossinessMaterial,
	SpecularGlossinessMaterialParameters,
} from "../materials/SpecularGlossinessMaterial";
import {SDColor} from "../objects/SDColor";
import {RenderingEngine} from "../RenderingEngine";
import {getShadow, main} from "../shaders/PCSS";
import {ENVIRONMENT_MAP_TYPE} from "./EnvironmentMapLoader";

// #region Type aliases (6)

type MaterialDataMeshTypes =
	| MaterialStandardData
	| MaterialGemData
	| MaterialSpecularGlossinessData
	| MaterialUnlitData
	| MaterialLambertData
	| MaterialPhongData;
export type MaterialSettings = {
	mode: PRIMITIVE_MODE;
	useVertexTangents: boolean;
	useVertexColors: boolean;
	useFlatShading: boolean;
	useMorphTargets: boolean;
	useMorphNormals: boolean;
};

type ThreeJsMaterialParameterTypes =
	| THREE.PointsMaterialParameters
	| MultiPointsMaterialParameters
	| THREE.LineBasicMaterialParameters
	| MeshUnlitMaterialParameters
	| THREE.MeshPhysicalMaterialParameters
	| SpecularGlossinessMaterialParameters
	| GemMaterialParameters
	| THREE.ShadowMaterialParameters
	| THREE.MeshLambertMaterialParameters
	| THREE.MeshPhongMaterialParameters;
type ThreeJsMaterialTypes =
	| THREE.Material
	| THREE.MeshPhysicalMaterial
	| THREE.MeshBasicMaterial
	| GemMaterial
	| THREE.PointsMaterial
	| MultiPointsMaterial
	| THREE.LineBasicMaterial
	| THREE.ShadowMaterial
	| THREE.MeshLambertMaterial
	| THREE.MeshPhongMaterial;
type ThreeJsMeshMaterialTypes =
	| THREE.MeshPhysicalMaterial
	| THREE.MeshStandardMaterial
	| THREE.MeshBasicMaterial
	| THREE.MeshLambertMaterial
	| THREE.MeshPhongMaterial;

type ThreeJsTextureCacheObject = {
	texture: THREE.Texture;
	usage: number;
	initialized: boolean;
};

// #endregion Type aliases (6)

// #region Classes (1)

export class MaterialLoader implements ILoader {
	// #region Properties (16)

	private readonly _converter: Converter = Converter.instance;
	private readonly _sceneTree: Tree = Tree.instance;

	private _blending: number = 0.0;
	private _defaultLineMaterialData: MaterialBasicLineData =
		new MaterialBasicLineData({color: "#199b9b"});
	private _defaultMaterialData: MaterialStandardData =
		new MaterialStandardData({
			color: "#199b9b",
			side: MATERIAL_SIDE.DOUBLE,
			metalness: 0.0,
		});
	private _defaultPointMaterialData: MaterialPointData =
		new MaterialPointData({color: "#199b9b"});
	private _envMap: THREE.CubeTexture | THREE.Texture | null = null;
	private _envMapIntensity: number = 1;
	private _envMapType: ENVIRONMENT_MAP_TYPE = ENVIRONMENT_MAP_TYPE.NULL;
	private _environmentMapRotationEuler: THREE.Euler = new THREE.Euler();
	private _height: number = 1020;
	private _lightSizeUV: number = 0.025;
	private _materialOverrideType: MATERIAL_TYPE | undefined = undefined;
	private _materialCache: {
		[key: string]: {
			materialData: IMaterialAbstractData | null;
			material: ThreeJsMaterialTypes;
			materialSettings?: MaterialSettings;
		};
	} = {};
	private _shaderProgramCache: Map<string, ThreeJsMaterialTypes> = new Map();
	private _compiledShaderSignatures: Set<string> = new Set();
	private _maxMapCount: number = 0;
	private _pointSize: number = 1.0;
	private _textureEncoding: THREE.ColorSpace = THREE.SRGBColorSpace;
	private _threeJsTextureCache: {[key: string]: ThreeJsTextureCacheObject} =
		{};

	// #endregion Properties (16)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (12)

	public get defaultLineMaterialData(): MaterialBasicLineData {
		return this._defaultLineMaterialData;
	}

	public set defaultLineMaterialData(value: MaterialBasicLineData) {
		this._defaultLineMaterialData = value;
		this.assignDefaultLineMaterial();
	}

	public get defaultMaterialData(): MaterialStandardData {
		return this._defaultMaterialData;
	}

	public set defaultMaterialData(value: MaterialStandardData) {
		this._defaultMaterialData = value;
		this.assignDefaultMaterial();
	}

	public get defaultPointMaterialData(): MaterialPointData {
		return this._defaultPointMaterialData;
	}

	public set defaultPointMaterialData(value: MaterialPointData) {
		this._defaultPointMaterialData = value;
		this.assignDefaultPointMaterial();
	}

	public get materialOverrideType(): MATERIAL_TYPE | undefined {
		return this._materialOverrideType;
	}

	public set materialOverrideType(value: MATERIAL_TYPE | undefined) {
		if (this._materialOverrideType === value) return;

		this._materialOverrideType = value;
		for (const key in this._materialCache) {
			this._materialCache[key].material.dispose();
			delete this._materialCache[key];
		}
		this._sceneTree.root.updateVersion();
	}

	public get maxMapCount(): number {
		return this._maxMapCount;
	}

	public set maxMapCount(value: number) {
		this._maxMapCount = value;
	}

	public get textureEncoding(): THREE.ColorSpace {
		return this._textureEncoding;
	}

	public set textureEncoding(value: THREE.ColorSpace) {
		this._textureEncoding = value;
		this.assignTextureEncoding();
	}

	public get threeJsTextureCache(): {
		[key: string]: ThreeJsTextureCacheObject;
	} {
		return this._threeJsTextureCache;
	}

	public set threeJsTextureCache(value: {
		[key: string]: ThreeJsTextureCacheObject;
	}) {
		this._threeJsTextureCache = value;
	}

	// #endregion Public Getters And Setters (12)

	// #region Public Methods (18)

	public assignColorCorrection(value: boolean) {
		const convertColor = (
			c: THREE.Color | SDColor | undefined,
			toggle: boolean,
		): THREE.Color | SDColor | undefined => {
			if (!c) return;

			if (c instanceof SDColor) {
				c.colorCorrection(toggle);
				return c;
			} else {
				const sdColor = this._renderingEngine.colorCache.find((color) =>
					color.equals(c),
				);
				if (sdColor) {
					sdColor.colorCorrection(toggle);
					return sdColor;
				} else {
					// we check in this case if the converted color has been stored already
					const clone = c.clone();
					toggle === true
						? clone.convertSRGBToLinear()
						: clone.convertLinearToSRGB();
					const sdColorClone = this._renderingEngine.colorCache.find(
						(color) => color.equals(clone),
					);

					if (sdColorClone) {
						sdColorClone.colorCorrection(toggle);
						return sdColorClone;
					} else {
						// some colors may not have been set by us, but have been set automatically
						// in this case we expect the color to be linear either way and therefore omit a color correction
						return c;
					}
				}
			}
		};

		for (const cacheKey in this._materialCache) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const material: any = this._materialCache[cacheKey].material;

			if (material.color)
				material.color = convertColor(material.color, value);
			if (material.specular)
				material.specular = convertColor(material.specular, value);
			if (material.emissive)
				material.emissive = convertColor(material.emissive, value);
			if (material.colorTransferBegin)
				material.colorTransferBegin = convertColor(
					material.colorTransferBegin,
					value,
				);
			if (material.colorTransferEnd)
				material.colorTransferEnd = convertColor(
					material.colorTransferEnd,
					value,
				);
			if (material.attenuationColor)
				material.attenuationColor = convertColor(
					material.attenuationColor,
					value,
				);
			if (material.sheencolor)
				material.sheencolor = convertColor(material.sheencolor, value);
			if (material.specularColor)
				material.specularColor = convertColor(
					material.specularColor,
					value,
				);

			material.needsUpdate = true;
		}
	}

	public assignDefaultLineMaterial() {
		for (const cacheKey in this._materialCache) {
			if (
				this._materialCache[cacheKey].material instanceof
					THREE.LineBasicMaterial &&
				this._materialCache[cacheKey].materialData === null
			) {
				const material: THREE.LineBasicMaterial = this._materialCache[
					cacheKey
				].material as THREE.LineBasicMaterial;
				const {properties, mapCount} = this.getMaterialProperties(
					this._defaultLineMaterialData,
					GEOMETRY_MATERIAL_TYPE.LINE,
					undefined,
				);
				this.maxMapCount = Math.max(this.maxMapCount, mapCount);
				material.copy(new THREE.LineBasicMaterial(properties));
				material.needsUpdate = true;
			}
		}
	}

	public assignDefaultMaterial() {
		for (const cacheKey in this._materialCache) {
			if (this._materialCache[cacheKey].materialData === null) {
				const material = this._materialCache[cacheKey].material;
				const {properties, mapCount} = this.getMaterialProperties(
					this._defaultMaterialData,
					GEOMETRY_MATERIAL_TYPE.MESH,
					this._materialCache[cacheKey].materialSettings,
				);
				this.maxMapCount = Math.max(this.maxMapCount, mapCount);
				if (material instanceof THREE.MeshBasicMaterial) {
					material.copy(new THREE.MeshBasicMaterial(properties));
				} else if (material instanceof THREE.MeshPhongMaterial) {
					material.copy(new THREE.MeshPhongMaterial(properties));
				} else if (material instanceof THREE.MeshLambertMaterial) {
					material.copy(
						new THREE.MeshLambertMaterial(
							properties as THREE.MeshLambertMaterialParameters,
						),
					);
				} else if (material instanceof SpecularGlossinessMaterial) {
					material.copy(new SpecularGlossinessMaterial(properties));
				} else {
					material.copy(new THREE.MeshPhysicalMaterial(properties));
				}
				material.needsUpdate = true;
			}
		}
	}

	public assignDefaultPointMaterial() {
		for (const cacheKey in this._materialCache) {
			if (
				this._materialCache[cacheKey].material instanceof
					THREE.PointsMaterial &&
				this._materialCache[cacheKey].materialData === null
			) {
				const material: THREE.PointsMaterial = <THREE.PointsMaterial>(
					this._materialCache[cacheKey].material
				);
				const {properties, mapCount} = this.getMaterialProperties(
					this._defaultPointMaterialData,
					GEOMETRY_MATERIAL_TYPE.POINT,
					undefined,
				);
				this.maxMapCount = Math.max(this.maxMapCount, mapCount);
				material.copy(new THREE.PointsMaterial(properties));
				material.needsUpdate = true;
			}
		}
	}

	public assignEnvironmentMap(
		e: THREE.CubeTexture | THREE.Texture | null,
		type: ENVIRONMENT_MAP_TYPE,
	) {
		this._envMap = e;
		this._envMapType = type;
		for (const cacheKey in this._materialCache) {
			if (
				this._materialCache[cacheKey].material instanceof
					THREE.MeshPhysicalMaterial ||
				this._materialCache[cacheKey].material instanceof
					THREE.MeshStandardMaterial ||
				this._materialCache[cacheKey].material instanceof
					THREE.MeshBasicMaterial ||
				this._materialCache[cacheKey].material instanceof
					THREE.MeshLambertMaterial ||
				this._materialCache[cacheKey].material instanceof
					THREE.MeshPhongMaterial
			) {
				const material: ThreeJsMeshMaterialTypes = this._materialCache[
					cacheKey
				].material as ThreeJsMeshMaterialTypes;
				if (
					this._materialCache[cacheKey].materialData &&
					(this._materialCache[cacheKey].materialData instanceof
						MaterialStandardData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialGemData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialSpecularGlossinessData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialUnlitData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialLambertData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialPhongData) &&
					(<MaterialDataMeshTypes>(
						this._materialCache[cacheKey].materialData
					)).envMap !== undefined
				)
					continue;

				if (
					(this._materialCache[cacheKey].materialData instanceof
						MaterialUnlitData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialLambertData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialPhongData) &&
					this._renderingEngine.environmentMapForUnlitMaterials ===
						false
				)
					return;

				material.envMap = e;
				material.needsUpdate = true;
				for (const d in material.defines) {
					if (d.startsWith("ENVMAP_TYPE_"))
						delete material.defines[d];
				}
				if (material.defines)
					material.defines[
						"ENVMAP_TYPE_" + this._envMapType.toUpperCase()
					] = "";

				this.assignEnvironmentMapRotation(
					this._renderingEngine.environmentMapRotation,
				);
			}
		}
	}

	public assignEnvironmentMapForUnlitMaterials(toggle: boolean) {
		for (const cacheKey in this._materialCache) {
			if (
				this._materialCache[cacheKey].material instanceof
					THREE.MeshBasicMaterial ||
				this._materialCache[cacheKey].material instanceof
					THREE.MeshLambertMaterial ||
				this._materialCache[cacheKey].material instanceof
					THREE.MeshPhongMaterial
			) {
				const material:
					| THREE.MeshBasicMaterial
					| THREE.MeshLambertMaterial
					| THREE.MeshPhongMaterial = this._materialCache[cacheKey]
					.material as
					| THREE.MeshBasicMaterial
					| THREE.MeshLambertMaterial
					| THREE.MeshPhongMaterial;
				if (
					this._materialCache[cacheKey].materialData &&
					(this._materialCache[cacheKey].materialData instanceof
						MaterialUnlitData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialLambertData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialPhongData) &&
					(
						this._materialCache[cacheKey].materialData as
							| MaterialUnlitData
							| MaterialLambertData
							| MaterialPhongData
					).envMap !== undefined
				)
					continue;

				if (toggle) {
					material.envMap = this._envMap;
					material.needsUpdate = true;
					for (const d in material.defines) {
						if (d.startsWith("ENVMAP_TYPE_"))
							delete material.defines[d];
					}
					if (material.defines)
						material.defines[
							"ENVMAP_TYPE_" + this._envMapType.toUpperCase()
						] = "";
				} else {
					material.envMap = null;
					material.needsUpdate = true;
				}
			}
		}
	}

	public assignEnvironmentMapIntensity(value: number) {
		this._envMapIntensity = value;
		for (const cacheKey in this._materialCache) {
			if (
				this._materialCache[cacheKey].material instanceof
					THREE.MeshPhysicalMaterial ||
				this._materialCache[cacheKey].material instanceof
					THREE.MeshStandardMaterial
			) {
				const material:
					| THREE.MeshPhysicalMaterial
					| THREE.MeshStandardMaterial = this._materialCache[cacheKey]
					.material as
					| THREE.MeshPhysicalMaterial
					| THREE.MeshStandardMaterial;
				if (
					this._materialCache[cacheKey].materialData &&
					(this._materialCache[cacheKey].materialData instanceof
						MaterialStandardData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialGemData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialSpecularGlossinessData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialUnlitData) &&
					(<MaterialDataMeshTypes>(
						this._materialCache[cacheKey].materialData
					)).envMap !== undefined
				)
					continue;

				material.envMapIntensity = value;
				material.needsUpdate = true;
			}
		}
	}

	public assignEnvironmentMapRotation(value: quat) {
		// we switch the y and z axis to match the three.js coordinate system
		const rotationMatrix = new THREE.Matrix4()
			.fromArray(
				mat4.fromQuat(
					mat4.create(),
					quat.fromValues(value[0], value[2], -value[1], value[3]),
				),
			)
			.transpose();
		this._environmentMapRotationEuler =
			new THREE.Euler().setFromRotationMatrix(rotationMatrix);
		this._renderingEngine.scene.backgroundRotation =
			this._environmentMapRotationEuler;

		for (const cacheKey in this._materialCache) {
			if (
				this._materialCache[cacheKey].material instanceof
					THREE.MeshPhysicalMaterial ||
				this._materialCache[cacheKey].material instanceof
					THREE.MeshStandardMaterial
			) {
				const material:
					| THREE.MeshPhysicalMaterial
					| THREE.MeshStandardMaterial = this._materialCache[cacheKey]
					.material as
					| THREE.MeshPhysicalMaterial
					| THREE.MeshStandardMaterial;
				if (
					this._materialCache[cacheKey].materialData &&
					(this._materialCache[cacheKey].materialData instanceof
						MaterialStandardData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialGemData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialSpecularGlossinessData ||
						this._materialCache[cacheKey].materialData instanceof
							MaterialUnlitData) &&
					(
						this._materialCache[cacheKey].materialData as
							| MaterialStandardData
							| MaterialGemData
							| MaterialSpecularGlossinessData
							| MaterialUnlitData
					).envMap !== undefined
				)
					continue;

				material.envMapRotation = this._environmentMapRotationEuler;
				material.needsUpdate = true;
			}
		}
	}

	public assignPointSize(p: number) {
		const height = this._renderingEngine.renderer
			? this._renderingEngine.renderer.getSize(new THREE.Vector2()).y
			: 1080;
		if (
			height === this._height &&
			p * (this._height / 1080) === this._pointSize
		)
			return;
		this._height = height;
		this._pointSize = p * (this._height / 1080);

		for (const cacheKey in this._materialCache) {
			if (
				this._materialCache[cacheKey].material instanceof
				MultiPointsMaterial
			) {
				const material: MultiPointsMaterial = <MultiPointsMaterial>(
					this._materialCache[cacheKey].material
				);

				if (
					this._materialCache[cacheKey].material.userData
						.customPointSize_0Enabled &&
					this._materialCache[cacheKey].material.userData
						.customPointSize_0Enabled === true
				) {
					material.size_0 =
						this._pointSize *
						this._materialCache[cacheKey].material.userData
							.customPointSize_0;
					material.needsUpdate = true;
				} else {
					material.size_0 = this._pointSize;
					material.needsUpdate = true;
				}

				if (
					this._materialCache[cacheKey].material.userData
						.customPointSize_1Enabled &&
					this._materialCache[cacheKey].material.userData
						.customPointSize_1Enabled === true
				) {
					material.size_1 =
						this._pointSize *
						this._materialCache[cacheKey].material.userData
							.customPointSize_1;
					material.needsUpdate = true;
				} else {
					material.size_1 = this._pointSize;
					material.needsUpdate = true;
				}

				if (
					this._materialCache[cacheKey].material.userData
						.customPointSize_2Enabled &&
					this._materialCache[cacheKey].material.userData
						.customPointSize_2Enabled === true
				) {
					material.size_2 =
						this._pointSize *
						this._materialCache[cacheKey].material.userData
							.customPointSize_2;
					material.needsUpdate = true;
				} else {
					material.size_2 = this._pointSize;
					material.needsUpdate = true;
				}

				if (
					this._materialCache[cacheKey].material.userData
						.customPointSize_3Enabled &&
					this._materialCache[cacheKey].material.userData
						.customPointSize_3Enabled === true
				) {
					material.size_3 =
						this._pointSize *
						this._materialCache[cacheKey].material.userData
							.customPointSize_3;
					material.needsUpdate = true;
				} else {
					material.size_3 = this._pointSize;
					material.needsUpdate = true;
				}

				if (
					this._materialCache[cacheKey].material.userData
						.customPointSize_4Enabled &&
					this._materialCache[cacheKey].material.userData
						.customPointSize_4Enabled === true
				) {
					material.size_4 =
						this._pointSize *
						this._materialCache[cacheKey].material.userData
							.customPointSize_4;
					material.needsUpdate = true;
				} else {
					material.size_4 = this._pointSize;
					material.needsUpdate = true;
				}

				if (
					this._materialCache[cacheKey].material.userData
						.customPointSize_5Enabled &&
					this._materialCache[cacheKey].material.userData
						.customPointSize_5Enabled === true
				) {
					material.size_5 =
						this._pointSize *
						this._materialCache[cacheKey].material.userData
							.customPointSize_5;
					material.needsUpdate = true;
				} else {
					material.size_5 = this._pointSize;
					material.needsUpdate = true;
				}

				if (
					this._materialCache[cacheKey].material.userData
						.customPointSize_6Enabled &&
					this._materialCache[cacheKey].material.userData
						.customPointSize_6Enabled === true
				) {
					material.size_6 =
						this._pointSize *
						this._materialCache[cacheKey].material.userData
							.customPointSize_6;
					material.needsUpdate = true;
				} else {
					material.size_6 = this._pointSize;
					material.needsUpdate = true;
				}

				if (
					this._materialCache[cacheKey].material.userData
						.customPointSize_7Enabled &&
					this._materialCache[cacheKey].material.userData
						.customPointSize_7Enabled === true
				) {
					material.size_7 =
						this._pointSize *
						this._materialCache[cacheKey].material.userData
							.customPointSize_7;
					material.needsUpdate = true;
				} else {
					material.size_7 = this._pointSize;
					material.needsUpdate = true;
				}
			} else if (
				this._materialCache[cacheKey].material instanceof
				THREE.PointsMaterial
			) {
				const material: THREE.PointsMaterial = <THREE.PointsMaterial>(
					this._materialCache[cacheKey].material
				);

				if (
					this._materialCache[cacheKey].material.userData
						.customPointSizeEnabled &&
					this._materialCache[cacheKey].material.userData
						.customPointSizeEnabled === true
				) {
					material.size =
						this._pointSize *
						this._materialCache[cacheKey].material.userData
							.customPointSize;
					material.needsUpdate = true;
				} else {
					material.size = this._pointSize;
					material.needsUpdate = true;
				}
			}
		}
	}

	public cacheSize() {
		return Object.entries(this._materialCache).length;
	}

	public createMaterial(
		type: GEOMETRY_MATERIAL_TYPE,
		incomingData: IMaterialAbstractData | GeometryData,
		materialData: IMaterialAbstractData | null,
		materialSettings?: MaterialSettings,
	) {
		const {properties, mapCount} = this.getMaterialProperties(
			materialData,
			type,
			materialSettings,
		);
		this.maxMapCount = Math.max(this.maxMapCount, mapCount);

		let material: ThreeJsMaterialTypes;
		if (type === GEOMETRY_MATERIAL_TYPE.POINT) {
			if (materialData instanceof MaterialMultiPointData) {
				material = new MultiPointsMaterial(properties);
			} else {
				material = new THREE.PointsMaterial(properties);
			}
		} else if (type === GEOMETRY_MATERIAL_TYPE.LINE) {
			material = new THREE.LineBasicMaterial(
				properties as THREE.LineBasicMaterialParameters,
			);
		} else {
			if (materialData instanceof MaterialUnlitData) {
				material = new THREE.MeshBasicMaterial(properties);
			} else {
				if (materialData instanceof MaterialShadowData) {
					material = new THREE.ShadowMaterial({
						opacity: properties.opacity,
						color: properties.color,
						transparent: true,
						depthWrite: false,
					});
				} else {
					if (this._materialOverrideType !== undefined) {
						if (
							this._materialOverrideType === MATERIAL_TYPE.UNLIT
						) {
							material = new THREE.MeshBasicMaterial(properties);
						} else if (
							this._materialOverrideType ===
							MATERIAL_TYPE.SPECULAR_GLOSSINESS
						) {
							material = new SpecularGlossinessMaterial(
								properties,
							);
						} else if (
							this._materialOverrideType === MATERIAL_TYPE.LAMBERT
						) {
							material = new THREE.MeshLambertMaterial(
								properties as THREE.MeshLambertMaterialParameters,
							);
						} else if (
							this._materialOverrideType === MATERIAL_TYPE.PHONG
						) {
							material = new THREE.MeshPhongMaterial(properties);
						} else {
							material = new THREE.MeshPhysicalMaterial(
								properties,
							);
						}
					} else if (
						materialData instanceof MaterialSpecularGlossinessData
					) {
						material = new SpecularGlossinessMaterial(properties);
					} else if (materialData instanceof MaterialGemData) {
						material = new GemMaterial(properties);
					} else if (materialData instanceof MaterialLambertData) {
						material = new THREE.MeshLambertMaterial(
							properties as THREE.MeshLambertMaterialParameters,
						);
					} else if (materialData instanceof MaterialPhongData) {
						material = new THREE.MeshPhongMaterial(properties);
					} else {
						material = new THREE.MeshPhysicalMaterial(properties);
					}
				}
				const before = material.onBeforeCompile;
				material.onBeforeCompile = (
					shader: THREE.WebGLProgramParametersWithUniforms,
					renderer: THREE.WebGLRenderer,
				) => {
					before(shader, renderer);
					// Only add uniforms once per shader program to improve performance
					if (!shader.uniforms.lightSizeUV) {
						shader.uniforms.lightSizeUV = {
							value: this._lightSizeUV,
						};
						shader.uniforms.blending = {value: this._blending};
					}
					material.userData.shader = shader;
				};
				if (
					material instanceof SpecularGlossinessMaterial ||
					material instanceof THREE.MeshPhysicalMaterial
				) {
					material.defines ??= {};
					material.defines[
						"ENVMAP_TYPE_" + this._envMapType.toUpperCase()
					] = "";

					if (materialSettings && materialSettings.useVertexTangents)
						material.normalScale.y *= -1;
					if (
						materialSettings &&
						materialSettings.useVertexTangents &&
						material instanceof THREE.MeshPhysicalMaterial
					)
						material.clearcoatNormalScale.y *= -1;
					if (materialSettings && materialSettings.useFlatShading)
						material.flatShading = true;
				}
			}
		}

		if (materialSettings && materialSettings.useVertexColors)
			material.vertexColors = true;

		if (
			materialData instanceof MaterialStandardData ||
			materialData instanceof MaterialGemData ||
			materialData instanceof MaterialSpecularGlossinessData ||
			materialData instanceof MaterialUnlitData ||
			materialData instanceof MaterialLambertData ||
			materialData instanceof MaterialPhongData
		) {
			if (materialData.envMap !== undefined) {
				const envMapInput = (<MaterialDataMeshTypes>materialData)
					.envMap;
				if (envMapInput !== undefined) {
					const envMapResult =
						this._renderingEngine.environmentMapLoader.loadEnvMap(
							envMapInput,
						);
					envMapResult.map.then((envMap) => {
						if (
							(material instanceof THREE.MeshBasicMaterial ||
								material instanceof THREE.MeshLambertMaterial ||
								material instanceof THREE.MeshPhongMaterial) &&
							this._renderingEngine
								.environmentMapForUnlitMaterials === false
						)
							return;

						(<ThreeJsMeshMaterialTypes>material).envMap = envMap;

						const envMapType =
							(<ThreeJsMeshMaterialTypes>material)
								.envMap instanceof THREE.CubeTexture
								? ENVIRONMENT_MAP_TYPE.LDR
								: ENVIRONMENT_MAP_TYPE.HDR;
						for (const d in material.defines) {
							if (d.startsWith("ENVMAP_TYPE_"))
								delete material.defines[d];
						}
						if (material.defines)
							material.defines[
								"ENVMAP_TYPE_" + envMapType.toUpperCase()
							] = "";

						material.needsUpdate = true;
					});
				}
			}
		}

		if (materialData)
			materialData.convertedObject[this._renderingEngine.id] = material;

		material.needsUpdate = true;

		if (material.userData) {
			material.userData.SDid = incomingData.id;
			material.userData.SDversion = incomingData.version;
		} else {
			material.userData = {
				SDid: incomingData.id,
				SDversion: incomingData.version,
			};
		}

		return material;
	}

	public emptyMaterialCache() {
		this._materialCache = {};
		this._shaderProgramCache.clear();
		this._compiledShaderSignatures.clear();
	}

	public getMaterialProperties(
		materialData: IMaterialAbstractData | null,
		type: GEOMETRY_MATERIAL_TYPE,
		materialSettings?: MaterialSettings,
	): {
		properties: ThreeJsMaterialParameterTypes;
		mapCount: number;
	} {
		const generalProperties: ThreeJsMaterialParameterTypes = {};

		let mapCount = 0;

		// if no MaterialStandardData is provided, we return our default
		if (!materialData) {
			if (type === GEOMETRY_MATERIAL_TYPE.POINT) {
				return this.getMaterialProperties(
					this._defaultPointMaterialData,
					type,
					materialSettings,
				);
			} else if (type === GEOMETRY_MATERIAL_TYPE.LINE) {
				return this.getMaterialProperties(
					this._defaultLineMaterialData,
					type,
					materialSettings,
				);
			} else {
				if (
					materialSettings !== undefined &&
					materialSettings.useVertexColors
				) {
					const currentDefaultMaterialColor =
						this._defaultMaterialData.color;
					this._defaultMaterialData.color = "#d3d3d3";
					const properties = this.getMaterialProperties(
						this._defaultMaterialData,
						type,
						materialSettings,
					);
					this._defaultMaterialData.color =
						currentDefaultMaterialColor;
					return properties;
				} else {
					return this.getMaterialProperties(
						this._defaultMaterialData,
						type,
						materialSettings,
					);
				}
			}
		}

		/**
		 * We know evaluate properties that can be applied to all materials
		 */

		generalProperties.alphaTest = materialData.alphaCutoff;

		if (materialData.opacity !== undefined) {
			generalProperties.opacity = materialData.opacity;
			generalProperties.transparent = generalProperties.opacity < 1;
		}

		if (materialData.alphaMode === MATERIAL_ALPHA.BLEND) {
			generalProperties.transparent = true;
			generalProperties.depthWrite = false;
		} else if (!generalProperties.transparent) {
			generalProperties.transparent = false;
		}

		if (materialData.depthTest !== undefined) {
			generalProperties.depthTest = materialData.depthTest;
		}

		if (materialData.depthWrite !== undefined) {
			generalProperties.depthWrite = materialData.depthWrite;
		}

		if (materialData.transparent !== undefined) {
			generalProperties.transparent = materialData.transparent;
		}

		if (materialData.color !== undefined)
			generalProperties.color = this._renderingEngine.createThreeJsColor(
				materialData.color,
			);

		if (
			materialData.color === undefined &&
			materialData.map !== undefined &&
			materialData.map.color !== undefined
		)
			generalProperties.color = this._renderingEngine.createThreeJsColor(
				materialData.map.color,
			);

		if (
			materialData.color === undefined &&
			materialData.map !== undefined &&
			materialData.map.color === undefined &&
			!(
				materialSettings !== undefined &&
				materialSettings.useVertexColors
			)
		)
			generalProperties.color = this._renderingEngine.createThreeJsColor(
				this._renderingEngine.defaultMaterialColor,
			);

		if (
			materialSettings !== undefined &&
			materialSettings.useVertexColors &&
			(materialData.color ===
				this._converter.toHexColor(
					this._renderingEngine.defaultMaterialColor,
				) ||
				materialData.color + "ff" ===
					this._converter.toHexColor(
						this._renderingEngine.defaultMaterialColor,
					) ||
				materialData.color ===
					this._renderingEngine.defaultMaterialColor ||
				materialData.color ===
					this._renderingEngine.defaultMaterialColor + "ff" ||
				materialData.color === undefined)
		)
			generalProperties.color =
				this._renderingEngine.createThreeJsColor("#d3d3d3");

		if (materialData.side !== undefined)
			generalProperties.side =
				materialData.side === MATERIAL_SIDE.BACK
					? THREE.BackSide
					: materialData.side === MATERIAL_SIDE.FRONT
						? THREE.FrontSide
						: THREE.DoubleSide;

		/**
		 *
		 * First exit, lines ans points
		 *
		 */

		if (type === GEOMETRY_MATERIAL_TYPE.POINT) {
			if (materialData instanceof MaterialPointData) {
				const pointMaterialProperties: THREE.PointsMaterialParameters =
					generalProperties;

				pointMaterialProperties.size =
					materialData.size !== undefined
						? materialData.size
						: this._pointSize;
				pointMaterialProperties.userData = {
					customPointSizeEnabled: materialData.size !== undefined,
					customPointSize: materialData.size,
				};
				pointMaterialProperties.sizeAttenuation =
					materialData.sizeAttenuation !== undefined
						? materialData.sizeAttenuation
						: true;

				if (materialData.map !== undefined) {
					pointMaterialProperties.map = this.createTexture(
						materialData.map,
					);
					mapCount++;
				}

				if (materialData.alphaMap !== undefined) {
					pointMaterialProperties.alphaMap = this.createTexture(
						materialData.alphaMap,
					);
					pointMaterialProperties.transparent = true;
					pointMaterialProperties.depthWrite = false;
					mapCount++;
				}
			} else if (materialData instanceof MaterialMultiPointData) {
				const multiPointMaterialProperties: MultiPointsMaterialParameters =
					generalProperties;

				if (materialData.materialIndexDataMap) {
					multiPointMaterialProperties.materialIndexDataTexture =
						this.createTexture(
							materialData.materialIndexDataMap,
						) as THREE.DataTexture;
				} else {
					multiPointMaterialProperties.materialIndexDataTexture =
						new THREE.DataTexture(
							new Uint8Array(
								multiPointMaterialProperties.materialIndexDataTextureSize ||
									1024,
							),
							multiPointMaterialProperties.materialIndexDataTextureSize ||
								1024,
							1,
							THREE.RedIntegerFormat,
							THREE.UnsignedIntType,
						);
					multiPointMaterialProperties.materialIndexDataTexture.internalFormat =
						"R32UI";
				}

				multiPointMaterialProperties.size_0 =
					materialData.size_0 !== undefined
						? this._pointSize * materialData.size_0
						: this._pointSize;
				multiPointMaterialProperties.size_1 =
					materialData.size_1 !== undefined
						? this._pointSize * materialData.size_1
						: this._pointSize;
				multiPointMaterialProperties.size_2 =
					materialData.size_2 !== undefined
						? this._pointSize * materialData.size_2
						: this._pointSize;
				multiPointMaterialProperties.size_3 =
					materialData.size_3 !== undefined
						? this._pointSize * materialData.size_3
						: this._pointSize;
				multiPointMaterialProperties.size_4 =
					materialData.size_4 !== undefined
						? this._pointSize * materialData.size_4
						: this._pointSize;
				multiPointMaterialProperties.size_5 =
					materialData.size_5 !== undefined
						? this._pointSize * materialData.size_5
						: this._pointSize;
				multiPointMaterialProperties.size_6 =
					materialData.size_6 !== undefined
						? this._pointSize * materialData.size_6
						: this._pointSize;
				multiPointMaterialProperties.size_7 =
					materialData.size_7 !== undefined
						? this._pointSize * materialData.size_7
						: this._pointSize;

				multiPointMaterialProperties.userData = {
					customPointSize_0Enabled: materialData.size_0 !== undefined,
					customPointSize_1Enabled: materialData.size_1 !== undefined,
					customPointSize_2Enabled: materialData.size_2 !== undefined,
					customPointSize_3Enabled: materialData.size_3 !== undefined,
					customPointSize_4Enabled: materialData.size_4 !== undefined,
					customPointSize_5Enabled: materialData.size_5 !== undefined,
					customPointSize_6Enabled: materialData.size_6 !== undefined,
					customPointSize_7Enabled: materialData.size_7 !== undefined,
					customPointSize_0: materialData.size_0,
					customPointSize_1: materialData.size_1,
					customPointSize_2: materialData.size_2,
					customPointSize_3: materialData.size_3,
					customPointSize_4: materialData.size_4,
					customPointSize_5: materialData.size_5,
					customPointSize_6: materialData.size_6,
					customPointSize_7: materialData.size_7,
				};

				multiPointMaterialProperties.sizeAttenuation_0 =
					materialData.sizeAttenuation_0 !== undefined
						? materialData.sizeAttenuation_0
						: false;
				multiPointMaterialProperties.sizeAttenuation_1 =
					materialData.sizeAttenuation_1 !== undefined
						? materialData.sizeAttenuation_1
						: false;
				multiPointMaterialProperties.sizeAttenuation_2 =
					materialData.sizeAttenuation_2 !== undefined
						? materialData.sizeAttenuation_2
						: false;
				multiPointMaterialProperties.sizeAttenuation_3 =
					materialData.sizeAttenuation_3 !== undefined
						? materialData.sizeAttenuation_3
						: false;
				multiPointMaterialProperties.sizeAttenuation_4 =
					materialData.sizeAttenuation_4 !== undefined
						? materialData.sizeAttenuation_4
						: false;
				multiPointMaterialProperties.sizeAttenuation_5 =
					materialData.sizeAttenuation_5 !== undefined
						? materialData.sizeAttenuation_5
						: false;
				multiPointMaterialProperties.sizeAttenuation_6 =
					materialData.sizeAttenuation_6 !== undefined
						? materialData.sizeAttenuation_6
						: false;
				multiPointMaterialProperties.sizeAttenuation_7 =
					materialData.sizeAttenuation_7 !== undefined
						? materialData.sizeAttenuation_7
						: false;

				if (materialData.map_0 !== undefined) {
					multiPointMaterialProperties.map_0 = this.createTexture(
						materialData.map_0,
					);
					multiPointMaterialProperties.map =
						multiPointMaterialProperties.map_0;
					mapCount++;
				}

				if (materialData.map_1 !== undefined) {
					multiPointMaterialProperties.map_1 = this.createTexture(
						materialData.map_1,
					);
					multiPointMaterialProperties.map =
						multiPointMaterialProperties.map_0;
					mapCount++;
				}

				if (materialData.map_2 !== undefined) {
					multiPointMaterialProperties.map_2 = this.createTexture(
						materialData.map_2,
					);
					multiPointMaterialProperties.map =
						multiPointMaterialProperties.map_0;
					mapCount++;
				}

				if (materialData.map_3 !== undefined) {
					multiPointMaterialProperties.map_3 = this.createTexture(
						materialData.map_3,
					);
					multiPointMaterialProperties.map =
						multiPointMaterialProperties.map_0;
					mapCount++;
				}

				if (materialData.map_4 !== undefined) {
					multiPointMaterialProperties.map_4 = this.createTexture(
						materialData.map_4,
					);
					multiPointMaterialProperties.map =
						multiPointMaterialProperties.map_0;
					mapCount++;
				}

				if (materialData.map_5 !== undefined) {
					multiPointMaterialProperties.map_5 = this.createTexture(
						materialData.map_5,
					);
					multiPointMaterialProperties.map =
						multiPointMaterialProperties.map_0;
					mapCount++;
				}

				if (materialData.map_6 !== undefined) {
					multiPointMaterialProperties.map_6 = this.createTexture(
						materialData.map_6,
					);
					multiPointMaterialProperties.map =
						multiPointMaterialProperties.map_0;
					mapCount++;
				}

				if (materialData.map_7 !== undefined) {
					multiPointMaterialProperties.map_7 = this.createTexture(
						materialData.map_7,
					);
					multiPointMaterialProperties.map =
						multiPointMaterialProperties.map_0;
					mapCount++;
				}

				if (materialData.alphaMap_0 !== undefined) {
					multiPointMaterialProperties.alphaMap_0 =
						this.createTexture(materialData.alphaMap_0);
					multiPointMaterialProperties.alphaMap =
						multiPointMaterialProperties.alphaMap_0;
					multiPointMaterialProperties.transparent = true;
					multiPointMaterialProperties.depthWrite = false;
					mapCount++;
				}

				if (materialData.alphaMap_1 !== undefined) {
					multiPointMaterialProperties.alphaMap_1 =
						this.createTexture(materialData.alphaMap_1);
					multiPointMaterialProperties.alphaMap =
						multiPointMaterialProperties.alphaMap_0;
					multiPointMaterialProperties.transparent = true;
					multiPointMaterialProperties.depthWrite = false;
					mapCount++;
				}

				if (materialData.alphaMap_2 !== undefined) {
					multiPointMaterialProperties.alphaMap_2 =
						this.createTexture(materialData.alphaMap_2);
					multiPointMaterialProperties.alphaMap =
						multiPointMaterialProperties.alphaMap_0;
					multiPointMaterialProperties.transparent = true;
					multiPointMaterialProperties.depthWrite = false;
					mapCount++;
				}

				if (materialData.alphaMap_3 !== undefined) {
					multiPointMaterialProperties.alphaMap_3 =
						this.createTexture(materialData.alphaMap_3);
					multiPointMaterialProperties.alphaMap =
						multiPointMaterialProperties.alphaMap_0;
					multiPointMaterialProperties.transparent = true;
					multiPointMaterialProperties.depthWrite = false;
					mapCount++;
				}

				if (materialData.alphaMap_4 !== undefined) {
					multiPointMaterialProperties.alphaMap_4 =
						this.createTexture(materialData.alphaMap_4);
					multiPointMaterialProperties.alphaMap =
						multiPointMaterialProperties.alphaMap_0;
					multiPointMaterialProperties.transparent = true;
					multiPointMaterialProperties.depthWrite = false;
					mapCount++;
				}

				if (materialData.alphaMap_5 !== undefined) {
					multiPointMaterialProperties.alphaMap_5 =
						this.createTexture(materialData.alphaMap_5);
					multiPointMaterialProperties.alphaMap =
						multiPointMaterialProperties.alphaMap_0;
					multiPointMaterialProperties.transparent = true;
					multiPointMaterialProperties.depthWrite = false;
					mapCount++;
				}

				if (materialData.alphaMap_6 !== undefined) {
					multiPointMaterialProperties.alphaMap_6 =
						this.createTexture(materialData.alphaMap_6);
					multiPointMaterialProperties.alphaMap =
						multiPointMaterialProperties.alphaMap_0;
					multiPointMaterialProperties.transparent = true;
					multiPointMaterialProperties.depthWrite = false;
					mapCount++;
				}

				if (materialData.alphaMap_7 !== undefined) {
					multiPointMaterialProperties.alphaMap_7 =
						this.createTexture(materialData.alphaMap_7);
					multiPointMaterialProperties.alphaMap =
						multiPointMaterialProperties.alphaMap_0;
					multiPointMaterialProperties.transparent = true;
					multiPointMaterialProperties.depthWrite = false;
					mapCount++;
				}

				if (materialData.color_0 !== undefined) {
					multiPointMaterialProperties.color_0 =
						this._renderingEngine.createThreeJsColor(
							materialData.color_0,
						);
				}

				if (materialData.color_1 !== undefined) {
					multiPointMaterialProperties.color_1 =
						this._renderingEngine.createThreeJsColor(
							materialData.color_1,
						);
				}

				if (materialData.color_2 !== undefined) {
					multiPointMaterialProperties.color_2 =
						this._renderingEngine.createThreeJsColor(
							materialData.color_2,
						);
				}

				if (materialData.color_3 !== undefined) {
					multiPointMaterialProperties.color_3 =
						this._renderingEngine.createThreeJsColor(
							materialData.color_3,
						);
				}

				if (materialData.color_4 !== undefined) {
					multiPointMaterialProperties.color_4 =
						this._renderingEngine.createThreeJsColor(
							materialData.color_4,
						);
				}

				if (materialData.color_5 !== undefined) {
					multiPointMaterialProperties.color_5 =
						this._renderingEngine.createThreeJsColor(
							materialData.color_5,
						);
				}

				if (materialData.color_6 !== undefined) {
					multiPointMaterialProperties.color_6 =
						this._renderingEngine.createThreeJsColor(
							materialData.color_6,
						);
				}

				if (materialData.color_7 !== undefined) {
					multiPointMaterialProperties.color_7 =
						this._renderingEngine.createThreeJsColor(
							materialData.color_7,
						);
				}
			} else {
				const pointMaterialProperties: THREE.PointsMaterialParameters =
					generalProperties;
				pointMaterialProperties.size = this._pointSize;
			}
			return {properties: generalProperties, mapCount};
		} else if (type === GEOMETRY_MATERIAL_TYPE.LINE) {
			return {properties: generalProperties, mapCount};
		}

		/**
		 *
		 * Second exit, the shadow material
		 *
		 */

		if (materialData instanceof MaterialShadowData)
			return {properties: generalProperties, mapCount};

		/**
		 * We know evaluate properties that can be applied to basic mesh materials (and the ones extending from them)
		 */

		const basicProperties:
			| MeshUnlitMaterialParameters
			| THREE.MeshPhysicalMaterialParameters
			| SpecularGlossinessMaterialParameters = generalProperties;

		if (materialData.alphaMap !== undefined) {
			basicProperties.alphaMap = this.createTexture(
				materialData.alphaMap,
			);
			basicProperties.transparent = true;
			basicProperties.depthWrite = false;
			mapCount++;
		}

		if (materialData.aoMap !== undefined) {
			basicProperties.aoMap = this.createTexture(materialData.aoMap);
			mapCount++;
		}

		if (materialData.aoMapIntensity !== undefined) {
			basicProperties.aoMapIntensity = materialData.aoMapIntensity;
		}

		if (materialData.map !== undefined) {
			basicProperties.map = this.createTexture(materialData.map);
			basicProperties.map.colorSpace = this._textureEncoding;
			mapCount++;
		}

		/**
		 *
		 * Third exit, the unlit material
		 *
		 */

		if (
			materialData instanceof MaterialUnlitData ||
			this._materialOverrideType === MATERIAL_TYPE.UNLIT ||
			this._materialOverrideType === MATERIAL_TYPE.LAMBERT ||
			this._materialOverrideType === MATERIAL_TYPE.PHONG
		)
			return {properties: basicProperties, mapCount};

		if (
			materialData instanceof MaterialPhongData &&
			this._materialOverrideType === undefined
		) {
			const phongProperties: THREE.MeshPhongMaterialParameters =
				basicProperties;

			phongProperties.shininess = materialData.shininess;

			if (materialData.specular !== undefined)
				phongProperties.specular =
					this._renderingEngine.createThreeJsColor(
						materialData.specular,
					);

			if (materialData.specularMap !== undefined) {
				phongProperties.specularMap = this.createTexture(
					materialData.specularMap,
				);
				mapCount++;
			}

			phongProperties.displacementBias = materialData.displacementBias;

			if (materialData.displacementMap !== undefined) {
				phongProperties.displacementMap = this.createTexture(
					materialData.displacementMap,
				);
				mapCount++;
			}

			phongProperties.displacementScale = materialData.displacementScale;

			phongProperties.reflectivity = materialData.reflectivity;

			return {properties: phongProperties, mapCount};
		}

		if (
			materialData instanceof MaterialLambertData &&
			this._materialOverrideType === undefined
		) {
			const lambertProperties: THREE.MeshLambertMaterialParameters =
				basicProperties as THREE.MeshLambertMaterialParameters;

			if (materialData.specularMap !== undefined) {
				lambertProperties.specularMap = this.createTexture(
					materialData.specularMap,
				);
				mapCount++;
			}

			lambertProperties.displacementBias = materialData.displacementBias;

			if (materialData.displacementMap !== undefined) {
				lambertProperties.displacementMap = this.createTexture(
					materialData.displacementMap,
				);
				mapCount++;
			}

			lambertProperties.displacementScale =
				materialData.displacementScale;

			lambertProperties.reflectivity = materialData.reflectivity;

			return {properties: lambertProperties, mapCount};
		}

		/**
		 * We know evaluate properties that can be applied to MeshPhysicalMaterials, SpecularGlossinessMaterials and GemMaterialParameters
		 */

		const standardProperties:
			| THREE.MeshPhysicalMaterialParameters
			| SpecularGlossinessMaterialParameters
			| GemMaterialParameters = basicProperties;

		if (materialData.shading !== undefined)
			standardProperties.flatShading = materialData.shading !== "smooth";

		if (materialData.bumpMap !== undefined) {
			standardProperties.bumpMap = this.createTexture(
				materialData.bumpMap,
			);
			mapCount++;
		}

		standardProperties.bumpScale = materialData.bumpScale;

		if (materialData.emissiveness !== undefined)
			standardProperties.emissive =
				this._renderingEngine.createThreeJsColor(
					materialData.emissiveness,
				);

		if (materialData.emissiveMap !== undefined) {
			standardProperties.emissiveMap = this.createTexture(
				materialData.emissiveMap,
			);
			standardProperties.emissiveMap.colorSpace = this._textureEncoding;
			mapCount++;
		}

		standardProperties.envMap = this._envMap;
		standardProperties.envMapIntensity = this._envMapIntensity;
		standardProperties.envMapRotation = this._environmentMapRotationEuler;

		if (materialData.normalMap !== undefined) {
			standardProperties.normalMap = this.createTexture(
				materialData.normalMap,
			);
			mapCount++;
		}

		if (materialData.normalScale !== undefined)
			standardProperties.normalScale = new THREE.Vector2(
				materialData.normalScale,
				-materialData.normalScale,
			);

		/**
		 *
		 * Fourth exit, the specular-glossiness material
		 *
		 */

		if (
			this._materialOverrideType === MATERIAL_TYPE.SPECULAR_GLOSSINESS &&
			!(materialData instanceof MaterialSpecularGlossinessData)
		)
			return {properties: standardProperties, mapCount};

		if (materialData instanceof MaterialSpecularGlossinessData) {
			const specularGlossinessProperties: SpecularGlossinessMaterialParameters =
				standardProperties;

			specularGlossinessProperties.specular =
				this._renderingEngine.createThreeJsColor(materialData.specular);
			specularGlossinessProperties.glossiness = materialData.glossiness;

			if (materialData.specularGlossinessMap !== undefined) {
				specularGlossinessProperties.specularMap2 = this.createTexture(
					materialData.specularGlossinessMap,
				);
				specularGlossinessProperties.specularMap2.colorSpace =
					THREE.SRGBColorSpace;
				specularGlossinessProperties.glossinessMap =
					specularGlossinessProperties.specularMap2;
				mapCount++;
			} else {
				if (materialData.specularMap !== undefined) {
					specularGlossinessProperties.specularMap2 =
						this.createTexture(materialData.specularMap);
					specularGlossinessProperties.specularMap2.colorSpace =
						THREE.SRGBColorSpace;
					mapCount++;
				}
				if (materialData.glossinessMap !== undefined) {
					specularGlossinessProperties.glossinessMap =
						this.createTexture(materialData.glossinessMap);
					mapCount++;
				}
			}

			return {properties: specularGlossinessProperties, mapCount};
		}

		/**
		 *
		 * Fourth exit, the gem material
		 *
		 */
		if (
			materialData instanceof MaterialGemData &&
			this._materialOverrideType === undefined
		) {
			const gemProperties: GemMaterialParameters = standardProperties;

			gemProperties.refractionIndex = materialData.refractionIndex;

			if (materialData.impurityMap !== undefined) {
				gemProperties.impurityMap = this.createTexture(
					materialData.impurityMap,
				);
				mapCount++;
			}

			gemProperties.impurityScale = materialData.impurityScale;

			if (materialData.colorTransferBegin !== undefined) {
				gemProperties.colorTransferBegin =
					this._renderingEngine.createThreeJsColor(
						materialData.colorTransferBegin,
					);
			}

			if (materialData.colorTransferEnd !== undefined) {
				gemProperties.colorTransferEnd =
					this._renderingEngine.createThreeJsColor(
						materialData.colorTransferEnd,
					);
			}

			gemProperties.center = new THREE.Vector3(
				materialData.center[0],
				materialData.center[1],
				materialData.center[2],
			);

			gemProperties.tracingDepth = materialData.tracingDepth;

			gemProperties.radius = materialData.radius;

			gemProperties.sphericalNormalMap = <THREE.CubeTexture>(
				(<unknown>materialData.sphericalNormalMap)
			);

			gemProperties.gamma = materialData.gamma;

			gemProperties.contrast = materialData.contrast;

			gemProperties.brightness = materialData.brightness;

			gemProperties.dispersion = materialData.dispersion;

			gemProperties.tracingOpacity = materialData.tracingOpacity;

			gemProperties.roughness = 0;
			gemProperties.metalness = 1;

			gemProperties.transparent = true;
			gemProperties.opacity = 1.0;

			gemProperties.side = THREE.FrontSide;

			return {properties: gemProperties, mapCount};
		}

		/**
		 *
		 * the final exit, the MeshPhysicalMaterial
		 *
		 */

		if (!(materialData instanceof MaterialStandardData))
			return {properties: standardProperties, mapCount};

		const meshPhysicalProperties: THREE.MeshPhysicalMaterialParameters =
			standardProperties;

		meshPhysicalProperties.clearcoat = materialData.clearcoat;

		if (materialData.clearcoatMap !== undefined) {
			meshPhysicalProperties.clearcoatMap = this.createTexture(
				materialData.clearcoatMap,
			);
			mapCount++;
		}

		if (materialData.clearcoatNormalMap !== undefined) {
			meshPhysicalProperties.clearcoatNormalMap = this.createTexture(
				materialData.clearcoatNormalMap,
			);
			mapCount++;
		}

		meshPhysicalProperties.clearcoatRoughness =
			materialData.clearcoatRoughness;

		if (materialData.clearcoatRoughnessMap !== undefined) {
			meshPhysicalProperties.clearcoatRoughnessMap = this.createTexture(
				materialData.clearcoatRoughnessMap,
			);
			mapCount++;
		}

		if (materialData.displacementMap !== undefined) {
			meshPhysicalProperties.displacementMap = this.createTexture(
				materialData.displacementMap,
			);
			mapCount++;
		}

		meshPhysicalProperties.displacementScale =
			materialData.displacementScale;

		meshPhysicalProperties.displacementBias = materialData.displacementBias;

		meshPhysicalProperties.ior = materialData.ior;

		meshPhysicalProperties.transmission = materialData.transmission;

		if (materialData.transmissionMap !== undefined) {
			meshPhysicalProperties.transmissionMap = this.createTexture(
				materialData.transmissionMap,
			);
			mapCount++;
		}

		(<THREE.MeshPhysicalMaterial>meshPhysicalProperties).thickness =
			materialData.thickness;

		if (materialData.thicknessMap !== undefined) {
			(<THREE.MeshPhysicalMaterial>meshPhysicalProperties).thicknessMap =
				this.createTexture(materialData.thicknessMap);
			mapCount++;
		}

		meshPhysicalProperties.attenuationDistance =
			materialData.attenuationDistance;
		meshPhysicalProperties.attenuationColor =
			this._renderingEngine.createThreeJsColor(
				materialData.attenuationColor,
			);

		meshPhysicalProperties.sheen = materialData.sheen;
		meshPhysicalProperties.sheenColor =
			this._renderingEngine.createThreeJsColor(materialData.sheenColor);
		meshPhysicalProperties.sheenRoughness = materialData.sheenRoughness;

		if (materialData.sheenColorMap !== undefined) {
			(<THREE.MeshPhysicalMaterial>meshPhysicalProperties).sheenColorMap =
				this.createTexture(materialData.sheenColorMap);
			mapCount++;
		}

		if (materialData.sheenRoughnessMap !== undefined) {
			(<THREE.MeshPhysicalMaterial>(
				meshPhysicalProperties
			)).sheenRoughnessMap = this.createTexture(
				materialData.sheenRoughnessMap,
			);
			mapCount++;
		}

		meshPhysicalProperties.specularIntensity =
			materialData.specularIntensity;

		if (materialData.specularIntensityMap !== undefined) {
			meshPhysicalProperties.specularIntensityMap = this.createTexture(
				materialData.specularIntensityMap,
			);
			mapCount++;
		}

		meshPhysicalProperties.specularColor =
			this._renderingEngine.createThreeJsColor(
				materialData.specularColor,
			);

		if (materialData.specularColorMap !== undefined) {
			meshPhysicalProperties.specularColorMap = this.createTexture(
				materialData.specularColorMap,
			);
			mapCount++;
		}

		meshPhysicalProperties.metalness = materialData.metalness;
		meshPhysicalProperties.roughness = materialData.roughness;

		if (materialData.metalnessRoughnessMap !== undefined) {
			meshPhysicalProperties.metalnessMap = this.createTexture(
				materialData.metalnessRoughnessMap,
			);
			meshPhysicalProperties.roughnessMap =
				meshPhysicalProperties.metalnessMap;
			mapCount++;
		} else {
			if (materialData.metalnessMap !== undefined) {
				meshPhysicalProperties.metalnessMap = this.createTexture(
					materialData.metalnessMap,
				);
				mapCount++;
			}
			if (materialData.roughnessMap !== undefined) {
				meshPhysicalProperties.roughnessMap = this.createTexture(
					materialData.roughnessMap,
				);
				mapCount++;
			}
		}
		return {properties: meshPhysicalProperties, mapCount};
	}

	public init(): void {}

	/**
	 * Get a shader signature based on properties that affect shader compilation.
	 * Materials with the same signature can share compiled shader programs.
	 */
	private getShaderSignature(
		type: GEOMETRY_MATERIAL_TYPE,
		materialData: IMaterialAbstractData | null,
		materialSettings?: MaterialSettings,
	): string {
		// Use a simple string concatenation for better performance than JSON.stringify
		return `${type}_${materialData?.constructor.name || "default"}_${this._materialOverrideType || "none"}_${materialSettings?.useVertexColors ? "vc" : ""}_${materialSettings?.useFlatShading ? "fs" : ""}_${materialSettings?.useMorphTargets ? "mt" : ""}_${this._envMapType}`;
	}

	/**
	 * Precompile shaders for a batch of materials to avoid runtime compilation costs.
	 * This should be called during initialization or loading phases.
	 */
	public precompileShaders(
		materials: THREE.Material[],
		scene: THREE.Scene,
		camera: THREE.Camera,
	): void {
		if (!this._renderingEngine.renderer) return;

		const compiler = this._renderingEngine.renderer;
		const dummyGeometry = new THREE.PlaneGeometry(1, 1);

		for (const material of materials) {
			// Skip if already compiled
			const signature = material.userData.shaderSignature;
			if (signature && this._compiledShaderSignatures.has(signature)) {
				continue;
			}

			const dummyMesh = new THREE.Mesh(dummyGeometry, material);
			scene.add(dummyMesh);
			compiler.compile(scene, camera);
			scene.remove(dummyMesh);

			if (signature) {
				this._compiledShaderSignatures.add(signature);
			}
		}

		dummyGeometry.dispose();
	}

	/**
	 * Create a material object with the provided material data.
	 *
	 * @param material the material data
	 * @returns the material object
	 */
	public load(
		incomingData: IMaterialAbstractData | GeometryData,
		materialSettings?: MaterialSettings,
	): THREE.Material {
		let materialData: IMaterialAbstractData | null = null;
		if (!(incomingData instanceof GeometryData))
			materialData = incomingData;

		// evaluate which type of material properties we are constructing
		let type: GEOMETRY_MATERIAL_TYPE;
		if (materialSettings && materialSettings.mode === 0) {
			type = GEOMETRY_MATERIAL_TYPE.POINT;
		} else if (
			materialSettings &&
			(materialSettings.mode === 1 ||
				materialSettings.mode === 2 ||
				materialSettings.mode === 3)
		) {
			type = GEOMETRY_MATERIAL_TYPE.LINE;
		} else {
			type = GEOMETRY_MATERIAL_TYPE.MESH;
		}

		const cacheKey = this.createDataKeyFromMaterial(
			incomingData,
			type,
			materialSettings,
		);

		// Check material cache first
		if (this._materialCache[cacheKey]) {
			return this._materialCache[cacheKey].material;
		}

		// Create new material
		const material = this.createMaterial(
			type,
			incomingData,
			materialData,
			materialSettings,
		);

		// Track shader signature for potential future optimizations
		const shaderSignature = this.getShaderSignature(
			type,
			materialData,
			materialSettings,
		);
		material.userData.cacheKey = cacheKey;
		material.userData.shaderSignature = shaderSignature;

		// Store in shader program cache for precompilation tracking
		if (!this._shaderProgramCache.has(shaderSignature)) {
			this._shaderProgramCache.set(shaderSignature, material);
		}

		this._materialCache[cacheKey] = {
			material,
			materialData,
			materialSettings,
		};

		return material;
	}

	public removeFromMaterialCache(cacheKey: string): void {
		if (!this._materialCache[cacheKey]) return;
		this._materialCache[cacheKey].material.dispose();
		delete this._materialCache[cacheKey];
	}

	public updateMaterials(): void {
		for (const cacheKey in this._materialCache)
			this._materialCache[cacheKey].material.needsUpdate = true;
	}

	public updateSoftShadow(lightSizeUV: number, blending: number) {
		this._lightSizeUV = lightSizeUV;
		this._blending = blending;
		for (const cacheKey in this._materialCache) {
			if (this._materialCache[cacheKey].material.userData.shader) {
				this._materialCache[
					cacheKey
				].material.userData.shader.uniforms.lightSizeUV.value =
					lightSizeUV;
				this._materialCache[
					cacheKey
				].material.userData.shader.uniforms.blending.value = blending;
			}
		}
	}

	// #endregion Public Methods (18)

	// #region Private Methods (4)

	private assignTextureEncoding() {
		for (const cacheKey in this._materialCache) {
			if (
				this._materialCache[cacheKey].material instanceof
					THREE.MeshPhysicalMaterial ||
				this._materialCache[cacheKey].material instanceof
					THREE.MeshStandardMaterial
			) {
				const material:
					| THREE.MeshPhysicalMaterial
					| THREE.MeshStandardMaterial = <
					THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial
				>this._materialCache[cacheKey].material;
				if (material.emissiveMap) {
					material.emissiveMap!.colorSpace = this._textureEncoding;
					material.emissiveMap!.needsUpdate = true;
				}
				if (material.map) {
					material.map!.colorSpace = this._textureEncoding;
					material.map!.needsUpdate = true;
				}
				material.needsUpdate = true;
			}
		}
	}

	private createDataKeyFromMap(map: IMapData): string {
		let id = "";
		if (map.asData === true) {
			id = map.id;
		} else if (map.image instanceof HTMLImageElement) {
			id = map.image.src;
		} else if (map.image instanceof ImageBitmap) {
			id = map.image.id;
		} else {
			id = String(map.data);
		}
		return btoaCustom(
			`${id}_${map.center}_${map.color}_${map.flipY}_${map.magFilter}_${map.minFilter}_${map.offset}_${map.repeat}_${map.rotation}_${map.texCoord}_${map.wrapS}_${map.wrapT}`,
		);
	}

	private createDataKeyFromMaterial(
		data: ITreeNodeData,
		type: GEOMETRY_MATERIAL_TYPE,
		materialSettings?: MaterialSettings,
	): string {
		return btoaCustom(
			data.id +
				"_" +
				data.version +
				"_" +
				type +
				"_" +
				JSON.stringify(materialSettings),
		);
	}

	private createTexture(map: IMapData): THREE.Texture {
		if (map.image instanceof ArrayBuffer) return new THREE.Texture();

		const key = this.createDataKeyFromMap(map);

		// texture in this structure are only stored until the next scene tree update call
		// therefore no cache management is needed, as these textures need to be created either way
		// the cache is cleared in updateSceneTree
		if (this._threeJsTextureCache[key]) {
			this._threeJsTextureCache[key].usage++;
			return this._threeJsTextureCache[key].texture;
		}

		let texture: THREE.Texture;
		if (map.asData === true) {
			texture = new THREE.DataTexture(
				new Uint32Array(map.data!),
				map.data!.length,
				1,
				THREE.RedIntegerFormat,
				THREE.UnsignedIntType,
			);
			texture.internalFormat = "R32UI";
		} else {
			texture = new THREE.Texture(map.image);
			texture.format = THREE.RGBAFormat;
			texture.minFilter = (() => {
				switch (map.minFilter) {
					case TEXTURE_FILTERING.NEAREST:
						return THREE.NearestFilter;
					case TEXTURE_FILTERING.NEAREST_MIPMAP_NEAREST:
						return THREE.NearestMipMapNearestFilter;
					case TEXTURE_FILTERING.LINEAR_MIPMAP_NEAREST:
						return THREE.LinearMipMapNearestFilter;
					case TEXTURE_FILTERING.NEAREST_MIPMAP_LINEAR:
						return THREE.NearestMipMapLinearFilter;
					case TEXTURE_FILTERING.LINEAR:
						return THREE.LinearFilter;
					case TEXTURE_FILTERING.LINEAR_MIPMAP_LINEAR:
					default:
						return THREE.LinearMipMapLinearFilter;
				}
			})();
			texture.magFilter = (() => {
				switch (map.magFilter) {
					case TEXTURE_FILTERING.NEAREST:
						return THREE.NearestFilter;
					case TEXTURE_FILTERING.LINEAR:
					default:
						return THREE.LinearFilter;
				}
			})();
			texture.wrapS = (() => {
				switch (map.wrapS) {
					case TEXTURE_WRAPPING.CLAMP_TO_EDGE:
						return THREE.ClampToEdgeWrapping;
					case TEXTURE_WRAPPING.MIRRORED_REPEAT:
						return THREE.MirroredRepeatWrapping;
					case TEXTURE_WRAPPING.REPEAT:
					default:
						return THREE.RepeatWrapping;
				}
			})();
			texture.wrapT = (() => {
				switch (map.wrapT) {
					case TEXTURE_WRAPPING.CLAMP_TO_EDGE:
						return THREE.ClampToEdgeWrapping;
					case TEXTURE_WRAPPING.MIRRORED_REPEAT:
						return THREE.MirroredRepeatWrapping;
					case TEXTURE_WRAPPING.REPEAT:
					default:
						return THREE.RepeatWrapping;
				}
			})();

			texture.center = new THREE.Vector2(map.center[0], map.center[1]);
			texture.offset = new THREE.Vector2(map.offset[0], map.offset[1]);
			texture.repeat = new THREE.Vector2(map.repeat[0], map.repeat[1]);
			texture.rotation = map.rotation;
			if (map.texCoord !== undefined) texture.channel = map.texCoord;

			texture.flipY = map.flipY;
		}

		texture.needsUpdate = true;

		texture.userData.cacheKey = key;

		this._threeJsTextureCache[key] = {
			texture,
			usage: 1,
			initialized: false,
		};
		return this._threeJsTextureCache[key].texture;
	}

	// #endregion Private Methods (4)
}

// #endregion Classes (1)

// #region Enums (1)

/* eslint-disable @typescript-eslint/no-empty-function */
enum GEOMETRY_MATERIAL_TYPE {
	POINT = "point",
	LINE = "line",
	MESH = "mesh",
}

// #endregion Enums (1)

// #region Variables (1)

const replaceShaderFunction = (
	shader: string,
	signature: string,
	replacement: string,
): string => {
	const start = shader.lastIndexOf(signature);
	if (start === -1) return shader;

	const bodyStart = shader.indexOf("{", start);
	if (bodyStart === -1) return shader;

	let depth = 0;
	for (let i = bodyStart; i < shader.length; i++) {
		if (shader[i] === "{") depth++;
		else if (shader[i] === "}") {
			depth--;
			if (depth === 0) {
				return (
					shader.substring(0, start) +
					replacement +
					shader.substring(i + 1)
				);
			}
		}
	}

	return shader;
};

export const adaptShaders = () => {
	let shader = THREE.ShaderChunk.shadowmap_pars_fragment;
	if (!shader.includes("PCSS implementation")) {
		const getShadowSignature =
			"float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord )";
		const adaptedShader = replaceShaderFunction(
			shader,
			getShadowSignature,
			getShadow,
		);

		if (adaptedShader !== shader) {
			shader = adaptedShader.replace(
				"#ifdef USE_SHADOWMAP",
				"#ifdef USE_SHADOWMAP" + main,
			);
			THREE.ShaderChunk.shadowmap_pars_fragment = shader;
		}
	}

	// here we replace in the background cube fragment shader the y component of the reflection vector with the negative y component and inverse the rotation in the case of a LDR environment map
	// console.log(THREE.ShaderChunk.backgroundCube_frag.includes('vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );'))
	THREE.ShaderChunk.backgroundCube_frag =
		THREE.ShaderChunk.backgroundCube_frag.replace(
			"vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );",
			"vec4 texColor = textureCube( envMap, inverse(backgroundRotation) * vec3( flipEnvMap * vWorldDirection.x, -vWorldDirection.y, vWorldDirection.z ) );",
		);
	THREE.ShaderLib.backgroundCube.fragmentShader =
		THREE.ShaderChunk.backgroundCube_frag;

	// here we replace in the envmap_physical_pars_fragment the z component of the reflection vector with the negative z component in the case of a LDR environment map
	// console.log(THREE.ShaderChunk.envmap_physical_pars_fragment, THREE.ShaderChunk.envmap_physical_pars_fragment.includes('vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );'));
	THREE.ShaderChunk.envmap_physical_pars_fragment =
		THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
			"vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );",
			`
            #ifdef ENVMAP_TYPE_LDR
                vec3 rotatedReflectVec = vec3(envMapRotation * worldNormal).xzy;
                vec4 envMapColor = textureCubeUV( envMap, vec3(rotatedReflectVec.xy, -rotatedReflectVec.z), 1.0 );
            #else
                vec3 rotatedReflectVec = vec3(envMapRotation * worldNormal);
                vec4 envMapColor = textureCubeUV( envMap, vec3(-rotatedReflectVec.x, rotatedReflectVec.y, rotatedReflectVec.z), 1.0 );
            #endif
            `,
		);

	// here we replace in the envmap_fragment the z component of the reflection vector with the negative z component in the case of a LDR environment map
	// console.log(THREE.ShaderChunk.envmap_physical_pars_fragment, THREE.ShaderChunk.envmap_physical_pars_fragment.includes('vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );'));
	THREE.ShaderChunk.envmap_physical_pars_fragment =
		THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
			"vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );",
			`
            #ifdef ENVMAP_TYPE_LDR
                vec3 rotatedReflectVec = vec3(envMapRotation * reflectVec).xzy;
                vec4 envMapColor = textureCubeUV( envMap, vec3(rotatedReflectVec.xy, -rotatedReflectVec.z), roughness );
            #else
                vec3 rotatedReflectVec = vec3(envMapRotation * reflectVec);
                vec4 envMapColor = textureCubeUV( envMap, vec3(rotatedReflectVec.x, rotatedReflectVec.y, rotatedReflectVec.z), roughness );
            #endif
            `,
		);

	// here we replace in the envmap_fragment the z component of the reflection vector with the negative z component in the case of a LDR environment map
	// console.log(THREE.ShaderChunk.envmap_fragment, THREE.ShaderChunk.envmap_fragment.includes('vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );'));
	THREE.ShaderChunk.envmap_fragment =
		THREE.ShaderChunk.envmap_fragment.replace(
			"vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );",
			`
        #ifdef ENVMAP_TYPE_LDR
            vec4 envColor = textureCube( envMap, envMapRotation * vec3(flipEnvMap * reflectVec.x, reflectVec.y, -reflectVec.z ) );
        #else
            vec4 envColor = textureCube( envMap, envMapRotation * vec3(flipEnvMap * reflectVec.x, reflectVec.zy ) );
        #endif
        `,
		);

	// here we replace the z and y component of the sampleDir in the cube_uv_reflection_fragment
	// console.log(THREE.ShaderChunk.cube_uv_reflection_fragment.includes('vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );'))
	THREE.ShaderChunk.cube_uv_reflection_fragment =
		THREE.ShaderChunk.cube_uv_reflection_fragment.replace(
			"vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );",
			`
        #ifdef ENVMAP_TYPE_LDR
            vec3 color0 = bilinearCubeUV( envMap, sampleDir.xzy, mipInt );
        #else
            vec3 color0 = bilinearCubeUV( envMap, vec3(sampleDir.y, sampleDir.z, sampleDir.x), mipInt );
        #endif
        `,
		);

	// here we replace the z and y component of the sampleDir in the cube_uv_reflection_fragment
	// console.log(THREE.ShaderChunk.cube_uv_reflection_fragment)
	THREE.ShaderChunk.cube_uv_reflection_fragment =
		THREE.ShaderChunk.cube_uv_reflection_fragment.replace(
			"vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );",
			`
        #ifdef ENVMAP_TYPE_LDR
            vec3 color1 = bilinearCubeUV( envMap, sampleDir.xzy, mipInt + 1.0 );
        #else
            vec3 color1 = bilinearCubeUV( envMap, vec3(sampleDir.y, sampleDir.z, sampleDir.x), mipInt + 1.0 );
        #endif
        `,
		);

	// here we create a new case in the lights_fragment_maps for the case of ENVMAP_TYPE_NONE
	if (!THREE.ShaderChunk.lights_fragment_maps.includes("vec3 reflectVec")) {
		const index =
			THREE.ShaderChunk.lights_fragment_maps.lastIndexOf("#endif");
		THREE.ShaderChunk.lights_fragment_maps =
			THREE.ShaderChunk.lights_fragment_maps.substring(0, index) +
			`#else
            #ifdef ENVMAP_TYPE_NONE
                vec3 reflectVec = reflect( -geometryViewDir, geometryNormal );
                reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
                vec4 adjustedEnvReflectVector = vec4(reflectVec, 1.0);
                radiance += (vec3((adjustedEnvReflectVector.z + 1.0) / 2.0) + 0.5) / 1.5;
            #endif
        #endif
        ` +
			THREE.ShaderChunk.lights_fragment_maps.substring(
				index + "#endif".length,
			);
	}
};

// #endregion Variables (1)
