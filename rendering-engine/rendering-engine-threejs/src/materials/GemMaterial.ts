import * as THREE from "three";
import {MeshPhysicalMaterial, MeshPhysicalMaterialParameters} from "three";
import {frag, vert} from "../shaders/gem";

/**
 * Which lights shade a gem.
 * "all": point, spot, directional, rect-area, ambient and hemisphere lights
 * and the environment map, on every surface the traced ray hits.
 * "firstSurface": the direct lights only on the first surface; the internal
 * bounces use the environment and ambient light. This makes the shader smaller.
 * "environment": no scene lights at all; the environment map lights the first
 * surface and the bounces.
 */
export type GemLighting = "all" | "firstSurface" | "environment";

const GEM_LIGHTING_DEFINES: {[key in GemLighting]?: string} = {
	firstSurface: "GEM_LIGHTING_FIRST_SURFACE",
	environment: "GEM_LIGHTING_ENVIRONMENT",
};

export interface GemMaterialParameters extends MeshPhysicalMaterialParameters {
	// #region Properties (4)

	refractionIndex?: number | undefined;
	impurityMap?: THREE.Texture | null | undefined;
	impurityScale?: number | undefined;
	colorTransferBegin?: THREE.Color | undefined;
	colorTransferEnd?: THREE.Color | undefined;
	center?: THREE.Vector3 | undefined;
	radius?: number | undefined;
	sphericalNormalMap?: THREE.CubeTexture | null | undefined;
	gamma?: number | undefined;
	contrast?: number | undefined;
	brightness?: number | undefined;
	/** See {@link GemMaterial.dispersion}. */
	dispersion?: number | undefined;
	/** See {@link GemMaterial.physicalDispersion}. */
	physicalDispersion?: boolean | undefined;
	/** See {@link GemMaterial.physicalFresnel}. */
	physicalFresnel?: boolean | undefined;
	/** See {@link GemMaterial.lighting}. */
	lighting?: GemLighting | undefined;
	/** See {@link GemMaterial.gemEnvMapIntensity}. */
	gemEnvMapIntensity?: number | undefined;
	tracingDepth?: number | undefined;
	tracingOpacity?: number | undefined;

	// #endregion Properties (4)
}

export class GemMaterial extends MeshPhysicalMaterial {
	// #region Properties (1)

	/** Shared by all gem materials. Set to 1 by the post-processing manager while it renders into half-float (HDR) buffers, so traced colors may exceed 1. */
	public static readonly hdrOutputUniform: {value: number} = {value: 0};
	/** Shared by all gem materials. 1 (the legacy look) clamps traced colors at 1 outside the HDR composer, 0 lets them exceed 1 so that tone mapping can bring highlights to white. Set by `RenderingEngine.gemClampColor`. */
	public static readonly clampColorUniform: {value: number} = {value: 1};

	public isGemMaterial: boolean;

	public refractionIndex: number = 2.4;
	public impurityMap: THREE.Texture | null = null;
	public impurityScale: number = 1.0;
	public colorTransferBegin: THREE.Color = new THREE.Color(0xffffff);
	public colorTransferEnd: THREE.Color = new THREE.Color(0xffffff);
	public center: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
	public tracingDepth: number = 5;
	public radius: number = 1.0;
	public sphericalNormalMap: THREE.CubeTexture | null = null;
	public gamma: number = 1.0;
	public contrast: number = 1.0;
	public brightness: number = 0.0;
	/**
	 * Legacy mode (physicalDispersion false): per-channel offset of 1/IOR by
	 * dispersion * 0.025, applied at entry only.
	 * Physical mode (physicalDispersion true): the difference n(G line) - n(B line),
	 * 0.044 for diamond, see {@link physicalDispersion}.
	 */
	public dispersion: number = 0.0;
	/**
	 * Legacy mode (false): see {@link dispersion}.
	 * Physical mode (true): refractionIndex is the IOR at the D line, dispersion is
	 * n(G line) - n(B line) (diamond 0.044), and each color channel uses its own IOR
	 * at entry, inside the stone and at exit.
	 */
	public physicalDispersion: boolean = false;
	/**
	 * How much of the light inside the stone leaves at each facet it hits.
	 * Legacy mode (false): the Fresnel reflectance, so most light keeps bouncing
	 * and the facet pattern gets finer.
	 * Physical mode (true): 1 - Fresnel reflectance, so most light leaves at the
	 * first facet it can pass.
	 */
	public physicalFresnel: boolean = false;
	/** Which lights shade the gem, see {@link GemLighting}. */
	public lighting: GemLighting = "all";
	/** Factor on the environment reflections the gem traces, on top of envMapIntensity. */
	public gemEnvMapIntensity: number = 1.0;
	public tracingOpacity: number = 0.0;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(params: GemMaterialParameters = {}) {
		super();

		this.isGemMaterial = true;

		const uniforms: {[key: string]: {value: any}} = {
			refractionIndex: {value: 2.4},
			impurityMap: {value: null},
			impurityScale: {value: 1.0},
			colorTransferBegin: {value: new THREE.Color(0xffffff)},
			colorTransferEnd: {value: new THREE.Color(0xffffff)},
			center: {value: new THREE.Vector3(0, 0, 0)},
			tracingDepth: {value: 5},
			radius: {value: 1.0},
			sphericalNormalMap: {value: null},
			gamma: {value: 1.0},
			contrast: {value: 1.0},
			brightness: {value: 0.0},
			dispersion: {value: 0.0},
			tracingOpacity: {value: 0.0},
			gemEnvMapIntensity: {value: 1.0},
			hdrOutput: GemMaterial.hdrOutputUniform,
			clampColor: GemMaterial.clampColorUniform,
		};

		let physicalDispersion = false;
		let physicalFresnel = false;
		let lighting: GemLighting = "all";

		(<any>this)._extraUniforms = uniforms;

		this.onBeforeCompile = function (shader) {
			for (const uniformName in uniforms) {
				shader.uniforms[uniformName] = uniforms[uniformName];
			}
			shader.vertexShader = vert;
			shader.fragmentShader = frag;
		};

		Object.defineProperties(this, {
			tracingDepth: {
				get: function () {
					return uniforms.tracingDepth.value;
				},
				set: function (v) {
					uniforms.tracingDepth.value = v;

					if (v) {
						this.defines.TRACING_DEPTH = Math.floor(v);
					} else {
						delete this.defines.TRACING_DEPTH;
					}
				},
			},
			refractionIndex: {
				get: function () {
					return uniforms.refractionIndex.value;
				},
				set: function (v) {
					uniforms.refractionIndex.value = v;
				},
			},
			impurityMap: {
				get: function () {
					return uniforms.impurityMap.value;
				},
				set: function (v) {
					uniforms.impurityMap.value = v;

					if (v) {
						this.defines.USE_IMPURITYMAP = "";
						this.defines.USE_UV = "";
					} else {
						delete this.defines.USE_IMPURITYMAP;
						delete this.defines.USE_UV;
					}
				},
			},
			impurityScale: {
				get: function () {
					return uniforms.impurityScale.value;
				},
				set: function (v) {
					uniforms.impurityScale.value = v;
				},
			},
			colorTransferBegin: {
				get: function () {
					return uniforms.colorTransferBegin.value;
				},
				set: function (v) {
					uniforms.colorTransferBegin.value = v;
				},
			},
			colorTransferEnd: {
				get: function () {
					return uniforms.colorTransferEnd.value;
				},
				set: function (v) {
					uniforms.colorTransferEnd.value = v;
				},
			},
			center: {
				get: function () {
					return uniforms.center.value;
				},
				set: function (v) {
					uniforms.center.value = v;
				},
			},
			radius: {
				get: function () {
					return uniforms.radius.value;
				},
				set: function (v) {
					uniforms.radius.value = v;
				},
			},
			sphericalNormalMap: {
				get: function () {
					return uniforms.sphericalNormalMap.value;
				},
				set: function (v) {
					uniforms.sphericalNormalMap.value = v;

					if (v) {
						this.defines.USE_UV = "";
					} else {
						delete this.defines.USE_UV;
					}

					const hadPlaneTracing =
						this.defines.GEM_PLANE_TRACING !== undefined;
					const hasPlaneTracing =
						!!v && v.type === THREE.HalfFloatType;
					if (hasPlaneTracing) {
						this.defines.GEM_PLANE_TRACING = "";
					} else {
						delete this.defines.GEM_PLANE_TRACING;
					}
					if (hadPlaneTracing !== hasPlaneTracing)
						this.needsUpdate = true;
				},
			},
			gamma: {
				get: function () {
					return uniforms.gamma.value;
				},
				set: function (v) {
					uniforms.gamma.value = v;
				},
			},
			contrast: {
				get: function () {
					return uniforms.contrast.value;
				},
				set: function (v) {
					uniforms.contrast.value = v;
				},
			},
			brightness: {
				get: function () {
					return uniforms.brightness.value;
				},
				set: function (v) {
					uniforms.brightness.value = v;
				},
			},
			dispersion: {
				get: function () {
					return uniforms.dispersion.value;
				},
				set: function (v) {
					uniforms.dispersion.value = v;
					if (v !== 0) {
						this.defines.DISPERSION = "";
					} else {
						delete this.defines.DISPERSION;
					}
				},
			},
			physicalDispersion: {
				get: function () {
					return physicalDispersion;
				},
				set: function (v) {
					physicalDispersion = !!v;
					// compare with the define, not the old value: copy()
					// replaces the defines before it sets this property
					const defined = "PHYSICAL_DISPERSION" in this.defines;
					if (physicalDispersion === defined) return;
					if (physicalDispersion) {
						this.defines.PHYSICAL_DISPERSION = "";
					} else {
						delete this.defines.PHYSICAL_DISPERSION;
					}
					this.needsUpdate = true;
				},
			},
			physicalFresnel: {
				get: function () {
					return physicalFresnel;
				},
				set: function (v) {
					physicalFresnel = !!v;
					// compare with the define, see physicalDispersion
					const defined = "PHYSICAL_FRESNEL" in this.defines;
					if (physicalFresnel === defined) return;
					if (physicalFresnel) {
						this.defines.PHYSICAL_FRESNEL = "";
					} else {
						delete this.defines.PHYSICAL_FRESNEL;
					}
					this.needsUpdate = true;
				},
			},
			lighting: {
				get: function () {
					return lighting;
				},
				set: function (v) {
					lighting =
						v === "firstSurface" || v === "environment" ? v : "all";
					// compare with the defines, see physicalDispersion
					let changed = false;
					for (const key in GEM_LIGHTING_DEFINES) {
						const define =
							GEM_LIGHTING_DEFINES[key as GemLighting]!;
						const wanted = key === lighting;
						if (wanted === define in this.defines) continue;
						if (wanted) {
							this.defines[define] = "";
						} else {
							delete this.defines[define];
						}
						changed = true;
					}
					if (changed) this.needsUpdate = true;
				},
			},
			gemEnvMapIntensity: {
				get: function () {
					return uniforms.gemEnvMapIntensity.value;
				},
				set: function (v) {
					uniforms.gemEnvMapIntensity.value = v;
				},
			},
			tracingOpacity: {
				get: function () {
					return uniforms.tracingOpacity.value;
				},
				set: function (v) {
					uniforms.tracingOpacity.value = v;
				},
			},
		});

		this.refractionIndex = params.refractionIndex || 2.4;
		this.impurityMap = params.impurityMap || null;
		this.impurityScale = params.impurityScale || 1;
		this.colorTransferBegin.copy(
			params.colorTransferBegin || new THREE.Color(0xffffff),
		);
		this.colorTransferEnd.copy(
			params.colorTransferEnd || new THREE.Color(0xffffff),
		);
		this.center.copy(params.center || new THREE.Vector3(0, 0, 0));
		this.tracingDepth = params.tracingDepth || 5;
		this.radius = params.radius || 1;
		this.sphericalNormalMap = params.sphericalNormalMap || null;
		this.gamma = params.gamma || 1;
		this.contrast = params.contrast || 1;
		this.brightness = params.brightness || 0;
		this.dispersion = params.dispersion || 0;
		this.physicalDispersion = params.physicalDispersion || false;
		this.physicalFresnel = params.physicalFresnel || false;
		this.lighting = params.lighting || "all";
		this.gemEnvMapIntensity = params.gemEnvMapIntensity ?? 1;
		this.tracingOpacity = params.tracingOpacity || 0;

		this.setValues(params);
	}

	// #endregion Constructors (1)

	// #region Public Methods (1)

	public copy(s: THREE.Material) {
		super.copy(s);

		const source = s as GemMaterial;

		this.refractionIndex = source.refractionIndex;
		this.impurityMap = source.impurityMap;
		this.impurityScale = source.impurityScale;
		this.colorTransferBegin.copy(source.colorTransferBegin);
		this.colorTransferEnd.copy(source.colorTransferEnd);
		this.center.copy(source.center);
		this.tracingDepth = source.tracingDepth;
		this.radius = source.radius;
		this.sphericalNormalMap = source.sphericalNormalMap;
		this.gamma = source.gamma;
		this.contrast = source.contrast;
		this.brightness = source.brightness;
		this.dispersion = source.dispersion;
		this.physicalDispersion = source.physicalDispersion;
		this.physicalFresnel = source.physicalFresnel;
		this.lighting = source.lighting;
		this.gemEnvMapIntensity = source.gemEnvMapIntensity;
		this.tracingOpacity = source.tracingOpacity;

		return this;
	}

	// #endregion Public Methods (1)
}
