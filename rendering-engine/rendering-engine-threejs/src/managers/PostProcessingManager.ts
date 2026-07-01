import {type IManager} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {
	Converter,
	EventEngine,
	EVENTTYPE,
	type IEvent,
	SettingsEngine,
	SystemInfo,
	UuidGenerator} from "@shapediver/viewer.shared.services";
import {
	ANTI_ALIASING_TECHNIQUE,
	FLAG_TYPE,
	type IBloomEffectDefinition,
	type IChromaticAberrationEffectDefinition,
	type IDepthOfFieldEffectDefinition,
	type IDotScreenEffectDefinition,
	type IGodRaysEffectDefinition,
	type IGridEffectDefinition,
	type IHBAOEffectDefinition,
	type IHueSaturationEffectDefinition,
	type INoiseEffectDefinition,
	type IOutlineEffectDefinition,
	type IPixelationEffectDefinition,
	type IPostProcessingEffectDefinition,
	type IPostProcessingEffectsArray,
	type IScanlineEffectDefinition,
	type ISceneEvent,
	type ISelectiveBloomEffectDefinition,
	type ISepiaEffectDefinition,
	type ISSAOEffectDefinition,
	type ITiltShiftEffectDefinition,
	type IVignetteEffectDefinition,
	POST_PROCESSING_EFFECT_TYPE,
	TONE_MAPPING} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import {
	BlendFunction,
	BloomEffect,
	ChromaticAberrationEffect,
	DepthOfFieldEffect,
	DotScreenEffect,
	Effect,
	EffectComposer,
	EffectPass,
	FXAAEffect,
	GodRaysEffect,
	GridEffect,
	HueSaturationEffect,
	KernelSize,
	NoiseEffect,
	OutlineEffect,
	OverrideMaterialManager,
	PixelationEffect,
	RenderPass,
	ScanlineEffect,
	SelectiveBloomEffect,
	SepiaEffect,
	SMAAEffect,
	SMAAPreset,
	TiltShiftEffect,
	ToneMappingMode,
	VignetteEffect,
	VignetteTechnique,
} from "postprocessing";
import * as THREE from "three";
import {RenderingEngine} from "../RenderingEngine";
import {HBAOEffect} from "./postprocessing/ao/hbao/HBAOEffect";
import {PoissionDenoisePass} from "./postprocessing/ao/poissionDenoise/PoissionDenoisePass";
import {SSAOEffect} from "./postprocessing/ao/ssao/SSAOEffect";
import {ToneMappingEffect} from "./postprocessing/effects/tone-mapping/ToneMappingEffect";
import {GodRaysManager} from "./postprocessing/GodRaysManager";
import {OutlineManager} from "./postprocessing/OutlineManager";
import {SelectiveBloomManager} from "./postprocessing/SelectiveBloomManager";
import {SSAARenderPass} from "./postprocessing/SSAARenderPass";

export class PostProcessingManager implements IManager {
	// #region Properties (23)

	private readonly _converter: Converter = Converter.instance;
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _systemInfo: SystemInfo = SystemInfo.instance;
	private readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;

	private _antiAliasingTechnique: ANTI_ALIASING_TECHNIQUE =
		ANTI_ALIASING_TECHNIQUE.SMAA;
	private _antiAliasingTechniqueMobile: ANTI_ALIASING_TECHNIQUE =
		ANTI_ALIASING_TECHNIQUE.FXAA;
	private _composer?: EffectComposer;
	private _currentCameraId: string = "";
	private _effectDefinitions: {
		token: string;
		definition: IPostProcessingEffectDefinition;
	}[] = [];
	private _effectPasses?: EffectPass[] = [];
	private _effects: {
		token: string;
		effect: Effect;
	}[] = [];
	private _enablePostProcessingOnMobile: boolean = true;
	private _fxaaEffect?: FXAAEffect;
	private _godRaysManagers: {
		[key: string]: GodRaysManager;
	} = {};
	private _initialized: boolean = false;
	private _manualPostProcessing: boolean = false;
	private _outlineManagers: {
		[key: string]: OutlineManager;
	} = {};
	private _renderPass?: RenderPass;
	private _sceneExtents = 0;
	private _selectiveBloomManagers: {
		[key: string]: SelectiveBloomManager;
	} = {};
	private _smaaEffect?: SMAAEffect;
	private _ssaaRenderPass?: SSAARenderPass;
	private _suspendEffectPassUpdate = false;
	private _toneMappingEffect?: ToneMappingEffect;
	private _continuousRenderingToken?: string;

	// #endregion Properties (23)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {
		this._eventEngine.addListener(
			EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE,
			(e: IEvent) => {
				const viewerEvent = <ISceneEvent>e;
				if (viewerEvent.viewportId === this._renderingEngine.id) {
					this._sceneExtents = vec3.distance(
						viewerEvent.boundingBox!.min,
						viewerEvent.boundingBox!.max,
					);
					this.changeEffectPass();
				}
			},
		);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (16)

	public get antiAliasingTechnique(): ANTI_ALIASING_TECHNIQUE {
		return this._antiAliasingTechnique;
	}

	public set antiAliasingTechnique(value: ANTI_ALIASING_TECHNIQUE) {
		this._antiAliasingTechnique = value;
		this.changeEffectPass();
	}

	public get antiAliasingTechniqueMobile(): ANTI_ALIASING_TECHNIQUE {
		return this._antiAliasingTechniqueMobile;
	}

	public set antiAliasingTechniqueMobile(value: ANTI_ALIASING_TECHNIQUE) {
		this._antiAliasingTechniqueMobile = value;

		// we don't allow SSAA on mobile devices anymore as it is too slow
		if (this._antiAliasingTechniqueMobile === ANTI_ALIASING_TECHNIQUE.SSAA)
			this._antiAliasingTechniqueMobile = ANTI_ALIASING_TECHNIQUE.SMAA;

		this.changeEffectPass();
	}

	public get effectComposer(): EffectComposer | undefined {
		return this._composer;
	}

	public get effects(): {token: string; effect: Effect}[] {
		return this._effects;
	}

	public get enablePostProcessingOnMobile(): boolean {
		return this._enablePostProcessingOnMobile;
	}

	public set enablePostProcessingOnMobile(value: boolean) {
		this._enablePostProcessingOnMobile = value;
	}

	public get godRaysManagers(): {
		[key: string]: GodRaysManager;
	} {
		return this._godRaysManagers;
	}

	public get initialized(): boolean {
		return this._initialized;
	}

	public get manualPostProcessing(): boolean {
		return this._manualPostProcessing;
	}

	public set manualPostProcessing(value: boolean) {
		this._manualPostProcessing = value;
		if (this._composer && this._manualPostProcessing === true)
			this._composer.removeAllPasses();
	}

	public get outlineManagers(): {
		[key: string]: OutlineManager;
	} {
		return this._outlineManagers;
	}

	public get selectiveBloomManagers(): {
		[key: string]: SelectiveBloomManager;
	} {
		return this._selectiveBloomManagers;
	}

	public get ssaaSampleLevel(): number {
		return this._ssaaRenderPass ? this._ssaaRenderPass.sampleLevel : 2;
	}

	public set ssaaSampleLevel(value: number) {
		if (this._ssaaRenderPass) this._ssaaRenderPass.sampleLevel = value;
	}

	// #endregion Public Getters And Setters (16)

	// #region Public Methods (13)

	public addEffect(
		definition: IPostProcessingEffectDefinition,
		t?: string,
	): string {
		const token = t || this._uuidGenerator.create();
		this._effectDefinitions.push({token, definition});

		switch (definition.type) {
			case POST_PROCESSING_EFFECT_TYPE.GOD_RAYS:
				if (!this._godRaysManagers[token])
					this._godRaysManagers[token] = new GodRaysManager(
						this._renderingEngine,
					);
				break;

			case POST_PROCESSING_EFFECT_TYPE.OUTLINE:
				if (!this._outlineManagers[token])
					this._outlineManagers[token] = new OutlineManager(
						this._renderingEngine,
					);
				break;

			case POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM:
				if (!this._selectiveBloomManagers[token])
					this._selectiveBloomManagers[token] =
						new SelectiveBloomManager(this._renderingEngine);
				break;

			default:
		}

		this.changeEffectPass();
		return token;
	}

	public applySettings(settingsEngine: SettingsEngine) {
		this._suspendEffectPassUpdate = true;

		this.antiAliasingTechnique = settingsEngine.settings.postprocessing
			.antiAliasingTechnique as ANTI_ALIASING_TECHNIQUE;
		this.antiAliasingTechniqueMobile = settingsEngine.settings
			.postprocessing
			.antiAliasingTechniqueMobile as ANTI_ALIASING_TECHNIQUE;

		// we don't allow SSAA on mobile devices anymore as it is too slow
		if (this._antiAliasingTechniqueMobile === ANTI_ALIASING_TECHNIQUE.SSAA)
			this._antiAliasingTechniqueMobile = ANTI_ALIASING_TECHNIQUE.SMAA;

		this.enablePostProcessingOnMobile =
			settingsEngine.settings.postprocessing.enablePostProcessingOnMobile;
		this.ssaaSampleLevel =
			settingsEngine.settings.postprocessing.ssaaSampleLevel;

		this._effectDefinitions = [];
		const effects = settingsEngine.settings.postprocessing.effects;
		for (let i = 0; i < effects.length; i++) {
			const token = this._uuidGenerator.create();

			this._effectDefinitions.push({
				token,
				definition: {
					type: effects[i].type as POST_PROCESSING_EFFECT_TYPE,
					properties: effects[i].properties,
				},
			});
		}
		this._suspendEffectPassUpdate = false;
		this.changeEffectPass();
	}

	public changeEffectPass() {
		if (!this._composer) return;
		if (this._suspendEffectPassUpdate === true) return;
		if (
			this._systemInfo.isMobile === true &&
			this._enablePostProcessingOnMobile === false
		)
			return;
		if (this._manualPostProcessing) return;

		for (let i = 0; i < this._composer.passes.length; i++)
			this._composer.passes[i].dispose();
		this._composer.removeAllPasses();

		const antiAliasingTechnique =
			this._systemInfo.isMobile === true
				? this._antiAliasingTechniqueMobile
				: this._antiAliasingTechnique;
		if (antiAliasingTechnique === ANTI_ALIASING_TECHNIQUE.SSAA) {
			this.addPassToEffectComposer(this._ssaaRenderPass!);
		} else {
			this.addPassToEffectComposer(this._renderPass!);
		}

		// remove the effects where the tokens are not in the effectDefinitions
		this._effects.forEach((e) => {
			// Clear selection layer bits from meshes before disposing,
			// otherwise stale layer bits remain on meshes and get picked up
			// when layers are reused by newly created effects.
			if (e.effect instanceof OutlineEffect) e.effect.selection.clear();
			e.effect.dispose();
		});
		this._effects = [];

		for (let i = 0; i < this._effectDefinitions.length; i++) {
			switch (this._effectDefinitions[i].definition.type) {
				case POST_PROCESSING_EFFECT_TYPE.BLOOM:
					{
						const definition: IBloomEffectDefinition = this
							._effectDefinitions[i]
							.definition as IBloomEffectDefinition;
						const properties = definition.properties || {};
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new BloomEffect({
								blendFunction: properties.blendFunction,
								luminanceThreshold:
									properties.luminanceThreshold,
								luminanceSmoothing:
									properties.luminanceSmoothing,
								mipmapBlur: properties.mipmapBlur,
								intensity: properties.intensity,
								kernelSize: properties.kernelSize,
							}),
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION:
					{
						const definition: IChromaticAberrationEffectDefinition =
							this._effectDefinitions[i]
								.definition as IChromaticAberrationEffectDefinition;
						const properties = definition.properties || {};
						const offsetArray =
							properties.offset !== undefined
								? Array.isArray(properties.offset)
									? properties.offset
									: [
											(<{x: number}>properties.offset).x,
											(<{y: number}>properties.offset).y,
										]
								: undefined;

						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new ChromaticAberrationEffect({
								blendFunction: properties.blendFunction,
								offset: offsetArray
									? new THREE.Vector2(...offsetArray)
									: undefined,
								radialModulation:
									properties.radialModulation !== undefined
										? properties.radialModulation
										: false,
								modulationOffset:
									properties.modulationOffset !== undefined
										? properties.modulationOffset
										: 0.15,
							}),
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD:
					{
						const definition: IDepthOfFieldEffectDefinition = this
							._effectDefinitions[i]
							.definition as IDepthOfFieldEffectDefinition;
						const properties = definition.properties || {};

						const depthOfFieldEffect = new DepthOfFieldEffect(
							this._renderingEngine.camera,
							{
								blendFunction: properties.blendFunction,
								focusDistance:
									properties.focusDistance !== undefined
										? properties.focusDistance
										: 0,
								focusRange:
									properties.focusRange !== undefined
										? properties.focusRange
										: 0.01,
								bokehScale:
									properties.bokehScale !== undefined
										? properties.bokehScale
										: 5,
								resolutionScale: 1,
							},
						);

						depthOfFieldEffect.resolution.height = 1080;
						depthOfFieldEffect.blurPass.kernelSize =
							KernelSize.HUGE;

						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: depthOfFieldEffect,
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN:
					{
						const definition: IDotScreenEffectDefinition = this
							._effectDefinitions[i]
							.definition as IDotScreenEffectDefinition;
						const properties = definition.properties || {};
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new DotScreenEffect({
								blendFunction: properties.blendFunction,
								scale: properties.scale,
								angle: properties.angle,
							}),
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.GOD_RAYS:
					{
						const definition: IGodRaysEffectDefinition = this
							._effectDefinitions[i]
							.definition as IGodRaysEffectDefinition;
						const properties = definition.properties || {};
						const godRaysEffect = new GodRaysEffect(
							this._renderingEngine.camera,
							new THREE.Mesh(),
							{
								blendFunction: properties.blendFunction,
								density: properties.density,
								decay: properties.decay,
								weight: properties.weight,
								exposure: properties.exposure,
								clampMax: properties.clampMax,
								kernelSize: properties.kernelSize,
								blur: properties.blur,
							},
						);
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: godRaysEffect,
						});

						this._godRaysManagers[
							this._effectDefinitions[i].token
						].setEffect(godRaysEffect);
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.GRID:
					{
						const definition: IGridEffectDefinition = this
							._effectDefinitions[i]
							.definition as IGridEffectDefinition;
						const properties = definition.properties || {};
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new GridEffect({
								blendFunction:
									properties.blendFunction !== undefined
										? properties.blendFunction
										: BlendFunction.MULTIPLY,
								scale: properties.scale,
							}),
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.HBAO:
					{
						// we currently do not support devices with WebGL 1: https://shapediver.atlassian.net/browse/SS-7069
						if (
							this._renderingEngine.renderer.capabilities
								.isWebGL2 === false
						)
							break;

						const definition: IHBAOEffectDefinition = this
							._effectDefinitions[i]
							.definition as IHBAOEffectDefinition;
						const properties = definition.properties || {};

						// we adjust the scene size slightly to make the factor fit our requirements
						// with this adjusted factor, a distance value of 1 fits well as a default
						const sceneSizeFactor = this._sceneExtents / 10.0;

						const hbaoEffect = new HBAOEffect(
							this._composer,
							this._renderingEngine.camera,
							this._renderingEngine.scene,
							{
								resolutionScale:
									properties.resolutionScale !== undefined
										? properties.resolutionScale
										: 1,
								spp:
									properties.spp !== undefined
										? properties.spp
										: 16,
								distance:
									properties.distance !== undefined
										? properties.distance * sceneSizeFactor
										: sceneSizeFactor,
								distancePower:
									properties.distanceIntensity !== undefined
										? properties.distanceIntensity
										: 1,
								power:
									properties.intensity !== undefined
										? properties.intensity
										: 2.5,
								bias:
									properties.bias !== undefined
										? properties.bias
										: 10,
								thickness:
									properties.thickness !== undefined
										? properties.thickness
										: 0.5,
								color:
									properties.color !== undefined
										? new THREE.Color(
												this._converter
													.toHexColor(
														properties.color,
													)
													.substring(0, 7),
											)
										: new THREE.Color("black"),
								iterations:
									properties.iterations !== undefined
										? properties.iterations
										: 1,
								radius:
									properties.radius !== undefined
										? properties.radius
										: 12,
								rings:
									properties.rings !== undefined
										? properties.rings
										: 11,
								lumaPhi:
									properties.lumaPhi !== undefined
										? properties.lumaPhi
										: 10,
								depthPhi:
									properties.depthPhi !== undefined
										? properties.depthPhi
										: 2,
								normalPhi:
									properties.normalPhi !== undefined
										? properties.normalPhi
										: 3.25,
								samples:
									properties.samples !== undefined
										? properties.samples
										: 16,
							},
						);
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: hbaoEffect,
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION:
					{
						const definition: IHueSaturationEffectDefinition = this
							._effectDefinitions[i]
							.definition as IHueSaturationEffectDefinition;
						const properties = definition.properties || {};
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new HueSaturationEffect({
								blendFunction: properties.blendFunction,
								hue: properties.hue,
								saturation: properties.saturation,
							}),
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.NOISE:
					{
						const definition: INoiseEffectDefinition = this
							._effectDefinitions[i]
							.definition as INoiseEffectDefinition;
						const properties = definition.properties || {};
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new NoiseEffect({
								blendFunction: properties.blendFunction,
								premultiply: properties.premultiply,
							}),
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.OUTLINE:
					{
						const definition: IOutlineEffectDefinition = this
							._effectDefinitions[i]
							.definition as IOutlineEffectDefinition;
						const properties = definition.properties || {};
						const token = this._effectDefinitions[i].token;
						const manager = this._outlineManagers[token];
						const separateObjects =
							properties.separateObjects === true;

						manager.configure(separateObjects, () =>
							this.changeEffectPass(),
						);

						const effectOptions = {
							blendFunction:
								properties.blendFunction !== undefined
									? properties.blendFunction
									: BlendFunction.SCREEN,
							edgeStrength: properties.edgeStrength,
							pulseSpeed: properties.pulseSpeed,
							visibleEdgeColor: <number>(
								(<unknown>(
									new THREE.Color(
										this._converter
											.toHexColor(
												properties.visibleEdgeColor,
											)
											.substring(0, 7),
									)
								))
							),
							hiddenEdgeColor: <number>(
								(<unknown>(
									new THREE.Color(
										this._converter
											.toHexColor(
												properties.hiddenEdgeColor,
											)
											.substring(0, 7),
									)
								))
							),
							kernelSize: properties.kernelSize,
							blur: properties.blur,
							xRay: properties.xRay,
							multisampling: properties.multisampling,
							resolutionScale: properties.resolutionScale ?? 1,
							resolutionX: properties.resolution ?? -1,
							resolutionY: properties.resolution ?? -1,
						};

						// Replaces lowp precision qualifiers with highp in
						// the outline shaders. The library defaults to lowp
						// which on mobile/integrated GPUs is 8-10 bits per
						// channel and amplifies edge-detection noise.
						const upgradePrecision = (effect: OutlineEffect) => {
							const oe = effect as unknown as {
								outlinePass: {
									fullscreenMaterial: THREE.ShaderMaterial;
								};
							};
							const mat = oe.outlinePass?.fullscreenMaterial;
							if (mat instanceof THREE.ShaderMaterial) {
								mat.fragmentShader = mat.fragmentShader.replace(
									/lowp /g,
									"highp ",
								);
								mat.needsUpdate = true;
							}
						};

						// Returns the next unused selection layer (1-9 are reserved).
						const allocateLayer = () => {
							let layer = 10;
							while (
								this._effects
									.filter(
										(e) =>
											e.effect instanceof OutlineEffect,
									)
									.some(
										(o) =>
											(o.effect as OutlineEffect)
												.selection.layer === layer,
									)
							) {
								layer++;
							}
							return layer;
						};

						if (separateObjects) {
							const nodes = manager.selectedNodes();
							const perNodeEffects = new Map(
								nodes.map((node) => {
									const nodeEffect = new OutlineEffect(
										this._renderingEngine.scene,
										this._renderingEngine.camera,
										effectOptions,
									);
									nodeEffect.selection.layer =
										allocateLayer();
									upgradePrecision(nodeEffect);
									this._effects.push({
										token,
										effect: nodeEffect,
									});
									return [node, nodeEffect] as const;
								}),
							);
							manager.setPerNodeEffects(perNodeEffects);
						} else {
							const outlineEffect = new OutlineEffect(
								this._renderingEngine.scene,
								this._renderingEngine.camera,
								effectOptions,
							);
							outlineEffect.selection.layer = allocateLayer();
							upgradePrecision(outlineEffect);
							this._effects.push({token, effect: outlineEffect});
							manager.setEffect(outlineEffect);
						}
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.PIXELATION:
					{
						const definition: IPixelationEffectDefinition = this
							._effectDefinitions[i]
							.definition as IPixelationEffectDefinition;
						const properties = definition.properties || {};
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new PixelationEffect(
								properties.granularity,
							),
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.SSAO:
					{
						// we currently do not support devices with WebGL 1: https://shapediver.atlassian.net/browse/SS-7069
						if (
							this._renderingEngine.renderer.capabilities
								.isWebGL2 === false
						)
							break;

						const definition: ISSAOEffectDefinition = this
							._effectDefinitions[i]
							.definition as ISSAOEffectDefinition;
						const properties = definition.properties || {};

						// we adjust the scene size slightly to make the factor fit our requirements
						// with this adjusted factor, a distance value of 1 fits well as a default
						const sceneSizeFactor = this._sceneExtents / 50.0;
						const ssaoEffect = new SSAOEffect(
							this._composer,
							this._renderingEngine.camera,
							this._renderingEngine.scene,
							{
								resolutionScale:
									properties.resolutionScale !== undefined
										? properties.resolutionScale
										: 1,
								spp:
									properties.spp !== undefined
										? properties.spp
										: 16,
								distance:
									properties.distance !== undefined
										? properties.distance * sceneSizeFactor
										: sceneSizeFactor,
								distancePower:
									properties.distanceIntensity !== undefined
										? properties.distanceIntensity
										: 1,
								power:
									properties.intensity !== undefined
										? properties.intensity
										: 2.5,
								color:
									properties.color !== undefined
										? new THREE.Color(
												this._converter
													.toHexColor(
														properties.color,
													)
													.substring(0, 7),
											)
										: new THREE.Color("black"),
								iterations:
									properties.iterations !== undefined
										? properties.iterations
										: 1,
								radius:
									properties.radius !== undefined
										? properties.radius
										: 12,
								rings:
									properties.rings !== undefined
										? properties.rings
										: 11,
								lumaPhi:
									properties.lumaPhi !== undefined
										? properties.lumaPhi
										: 10,
								depthPhi:
									properties.depthPhi !== undefined
										? properties.depthPhi
										: 2,
								normalPhi:
									properties.normalPhi !== undefined
										? properties.normalPhi
										: 3.25,
								samples:
									properties.samples !== undefined
										? properties.samples
										: 16,
							},
						);

						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: ssaoEffect,
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.SCANLINE:
					{
						const definition: IScanlineEffectDefinition = this
							._effectDefinitions[i]
							.definition as IScanlineEffectDefinition;
						const properties = definition.properties || {};
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new ScanlineEffect({
								blendFunction: properties.blendFunction,
								density: properties.density,
							}),
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM:
					{
						const definition: ISelectiveBloomEffectDefinition = this
							._effectDefinitions[i]
							.definition as ISelectiveBloomEffectDefinition;
						const properties = definition.properties || {};
						const selectiveBloomEffect = new SelectiveBloomEffect(
							this._renderingEngine.scene,
							this._renderingEngine.camera,
							{
								blendFunction: properties.blendFunction,
								mipmapBlur: properties.mipmapBlur,
								luminanceThreshold:
									properties.luminanceThreshold,
								luminanceSmoothing:
									properties.luminanceSmoothing,
								intensity: properties.intensity,
								kernelSize: properties.kernelSize,
							},
						);
						selectiveBloomEffect.ignoreBackground =
							properties.ignoreBackground !== undefined
								? properties.ignoreBackground
								: true;
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: selectiveBloomEffect,
						});

						this._selectiveBloomManagers[
							this._effectDefinitions[i].token
						].setEffect(selectiveBloomEffect);
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.SEPIA:
					{
						const definition: ISepiaEffectDefinition = this
							._effectDefinitions[i]
							.definition as ISepiaEffectDefinition;
						const properties = definition.properties || {};
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new SepiaEffect({
								blendFunction: properties.blendFunction,
							}),
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT:
					{
						const definition: ITiltShiftEffectDefinition = this
							._effectDefinitions[i]
							.definition as ITiltShiftEffectDefinition;
						const properties = definition.properties || {};
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new TiltShiftEffect({
								blendFunction: properties.blendFunction,
								offset: properties.offset,
								rotation: properties.rotation,
								focusArea: properties.focusArea,
								feather: properties.feather,
								kernelSize: properties.kernelSize,
							}),
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.VIGNETTE:
					{
						const definition: IVignetteEffectDefinition = this
							._effectDefinitions[i]
							.definition as IVignetteEffectDefinition;
						const properties = definition.properties || {};
						this._effects.push({
							token: this._effectDefinitions[i].token,
							effect: new VignetteEffect({
								blendFunction: properties.blendFunction,
								technique: properties.technique,
								offset: properties.offset,
								darkness: properties.darkness,
							}),
						});
					}
					break;

				default:
			}
		}

		// sort effects by order in effectDefinitions
		this._effects.sort(
			(a, b) =>
				this._effectDefinitions.indexOf(
					this._effectDefinitions.find((e) => e.token === a.token)!,
				) -
				this._effectDefinitions.indexOf(
					this._effectDefinitions.find((e) => e.token === b.token)!,
				),
		);

		const effectArray = this._effects.map((v) => v.effect);
		if (antiAliasingTechnique === ANTI_ALIASING_TECHNIQUE.FXAA) {
			effectArray.unshift(this._fxaaEffect!);
		} else if (antiAliasingTechnique === ANTI_ALIASING_TECHNIQUE.SMAA) {
			effectArray.unshift(this._smaaEffect!);
		}

		this._effectPasses = [];
		/**
		 * For every 3 effects we add another effects pass.
		 * We split it like this to avoid issues with maximum number of textures in one pass.
		 *
		 * Note that this could be refined in the future to count the number of textures used by the effects
		 * instead of just counting the number of effects and compare them to the maximum number of textures
		 * supported by the device, but for now this is a good enough solution.
		 **/
		for (let i = 0; i < this._effects.length; i += 5) {
			const effectsForPass = this._effects.slice(i, i + 5);
			const effectPass = new EffectPass(
				this._renderingEngine.camera,
				...effectsForPass.map((v) => v.effect),
			);
			this._effectPasses?.push(effectPass);
			this.addPassToEffectComposer(effectPass);
		}

		// for the AO effects we need to add a separate AA pass at the end that anti-aliases the AO effect
		if (
			this._effectDefinitions.find(
				(e) =>
					e.definition.type === POST_PROCESSING_EFFECT_TYPE.HBAO ||
					e.definition.type === POST_PROCESSING_EFFECT_TYPE.SSAO,
			)
		) {
			// respect the AA choice if one of the effects was selected, use SMAA otherwise
			this.addPassToEffectComposer(
				new EffectPass(
					this._renderingEngine.camera,
					antiAliasingTechnique === ANTI_ALIASING_TECHNIQUE.FXAA
						? this._fxaaEffect!
						: this._smaaEffect!,
				),
			);
		}

		if (this._renderingEngine.toneMapping !== TONE_MAPPING.NONE) {
			const mode = (() => {
				switch (this._renderingEngine.toneMapping) {
					case TONE_MAPPING.ACES_FILMIC:
						return ToneMappingMode.ACES_FILMIC;
					case TONE_MAPPING.CINEON:
						return ToneMappingMode.OPTIMIZED_CINEON;
					case TONE_MAPPING.REINHARD:
						return ToneMappingMode.REINHARD;
					default:
						return ToneMappingMode.LINEAR;
				}
			})();
			this._toneMappingEffect = new ToneMappingEffect({mode});
			const effectPass = new EffectPass(
				this._renderingEngine.camera,
				this._toneMappingEffect,
			);
			this.addPassToEffectComposer(effectPass);
		}

		// if there is at least one outline effect, with a pulse speed > 0, we need to enable continuous rendering
		if (
			this._effectDefinitions.find(
				(e) =>
					e.definition.type === POST_PROCESSING_EFFECT_TYPE.OUTLINE &&
					((<IOutlineEffectDefinition>e.definition).properties
						?.pulseSpeed || 0) > 0,
			)
		) {
			if (this._continuousRenderingToken === undefined)
				this._continuousRenderingToken = this._renderingEngine.addFlag(
					FLAG_TYPE.CONTINUOUS_RENDERING,
				);
		} else if (this._continuousRenderingToken !== undefined) {
			this._renderingEngine.removeFlag(this._continuousRenderingToken);
			this._continuousRenderingToken = undefined;
		}
	}

	public getDefaultEffectProperties(type: POST_PROCESSING_EFFECT_TYPE) {
		switch (type) {
			case POST_PROCESSING_EFFECT_TYPE.BLOOM:
				return {
					blendFunction: BlendFunction.ADD,
					intensity: 1.0,
					kernelSize: KernelSize.LARGE,
					luminanceSmoothing: 0.025,
					luminanceThreshold: 0.9,
					mipmapBlur: false,
				};
			case POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION:
				return {
					blendFunction: BlendFunction.NORMAL,
					modulationOffset: 0.15,
					offset: {x: 0.001, y: 0.0005},
					radialModulation: false,
				};

			case POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD:
				return {
					blendFunction: BlendFunction.NORMAL,
					bokehScale: 5.0,
					focusDistance: 0.0,
					focusRange: 0.01,
				};
			case POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN:
				return {
					angle: 1.57,
					blendFunction: BlendFunction.NORMAL,
					scale: 1.0,
				};
			case POST_PROCESSING_EFFECT_TYPE.GOD_RAYS:
				return {
					blendFunction: BlendFunction.SCREEN,
					blur: true,
					clampMax: 1.0,
					decay: 0.9,
					density: 0.96,
					exposure: 0.6,
					kernelSize: KernelSize.SMALL,
					weight: 0.4,
				};
			case POST_PROCESSING_EFFECT_TYPE.GRID:
				return {
					blendFunction: BlendFunction.MULTIPLY,
					scale: 1.0,
				};
			case POST_PROCESSING_EFFECT_TYPE.HBAO:
				return {
					resolutionScale: 1,
					spp: 16,
					distance: 1,
					distanceIntensity: 1,
					intensity: 2.5,
					color: "#000000",
					bias: 10,
					thickness: 0.5,

					iterations: 1,
					radius: 12,
					rings: 11,
					lumaPhi: 10,
					depthPhi: 2,
					normalPhi: 3.25,
					samples: 16,
				};

			case POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION:
				return {
					blendFunction: BlendFunction.NORMAL,
					hue: 0.0,
					saturation: 0.0,
				};
			case POST_PROCESSING_EFFECT_TYPE.NOISE:
				return {
					blendFunction: BlendFunction.SCREEN,
					premultiply: false,
				};
			case POST_PROCESSING_EFFECT_TYPE.OUTLINE:
				return {
					blendFunction: BlendFunction.SCREEN,
					blur: false,
					edgeStrength: 1.0,
					hiddenEdgeColor: "#22090a",
					kernelSize: KernelSize.VERY_SMALL,
					multisampling: 0,
					pulseSpeed: 0.0,
					resolution: 480,
					visibleEdgeColor: "#ffffff",
					xRay: true,
				};
			case POST_PROCESSING_EFFECT_TYPE.PIXELATION:
				return {
					granularity: 30.0,
				};
			case POST_PROCESSING_EFFECT_TYPE.SSAO:
				return {
					resolutionScale: 1,
					spp: 16,
					distance: 1,
					distanceIntensity: 1,
					intensity: 2.5,
					color: "#000000",

					iterations: 1,
					radius: 12,
					rings: 11,
					lumaPhi: 10,
					depthPhi: 2,
					normalPhi: 3.25,
					samples: 16,
				};
			case POST_PROCESSING_EFFECT_TYPE.SCANLINE:
				return {
					blendFunction: BlendFunction.OVERLAY,
					density: 1.25,
				};
			case POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM:
				return {
					blendFunction: BlendFunction.ADD,
					intensity: 1.0,
					kernelSize: KernelSize.LARGE,
					luminanceSmoothing: 0.025,
					luminanceThreshold: 0.9,
					mipmapBlur: false,
					ignoreBackground: true,
				};
			case POST_PROCESSING_EFFECT_TYPE.SEPIA:
				return {
					blendFunction: BlendFunction.NORMAL,
				};
			case POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT:
				return {
					blendFunction: BlendFunction.NORMAL,
					feather: 0.3,
					focusArea: 0.4,
					kernelSize: KernelSize.MEDIUM,
					offset: 0.0,
					rotation: 0.0,
				};
			case POST_PROCESSING_EFFECT_TYPE.VIGNETTE:
				return {
					blendFunction: BlendFunction.NORMAL,
					darkness: 0.5,
					offset: 0.5,
					technique: VignetteTechnique.DEFAULT,
				};
			default:
				return {};
		}
	}

	public async initialize(): Promise<void> {
		if (this._initialized) return;

		// wait for the blue noise texture to be loaded before initializing the composer
		await PoissionDenoisePass.loadBlueNoiseTexture();
		await new Promise((resolve) => setTimeout(resolve, 0));
		this._initialized = true;
		return;
	}

	public getEffect(token: string): Effect {
		return this._effects.find((e) => e.token === token)!.effect;
	}

	public getEffectTokens(): {[key: string]: POST_PROCESSING_EFFECT_TYPE} {
		return Object.assign(
			{},
			...this._effectDefinitions.map((e) => ({
				[e.token]: e.definition.type,
			})),
		);
	}

	public getPostProcessingEffectsArray(): IPostProcessingEffectsArray {
		const effects: IPostProcessingEffectsArray = [];

		for (let i = 0; i < this._effectDefinitions.length; i++) {
			switch (this._effectDefinitions[i].definition.type) {
				case POST_PROCESSING_EFFECT_TYPE.BLOOM:
					{
						const definition: IBloomEffectDefinition = this
							._effectDefinitions[i]
							.definition as IBloomEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.BLOOM,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
								luminanceThreshold:
									properties.luminanceThreshold,
								luminanceSmoothing:
									properties.luminanceSmoothing,
								mipmapBlur: properties.mipmapBlur,
								intensity: properties.intensity,
								kernelSize: properties.kernelSize,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION:
					{
						const definition: IChromaticAberrationEffectDefinition =
							this._effectDefinitions[i]
								.definition as IChromaticAberrationEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
								offset: properties.offset
									? Array.isArray(properties.offset)
										? {
												x: properties.offset[0],
												y: properties.offset[1],
											}
										: properties.offset
									: undefined,
								radialModulation: properties.radialModulation,
								modulationOffset: properties.modulationOffset,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD:
					{
						const definition: IDepthOfFieldEffectDefinition = this
							._effectDefinitions[i]
							.definition as IDepthOfFieldEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
								focusDistance: properties.focusDistance,
								focusRange: properties.focusRange,
								bokehScale: properties.bokehScale,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN:
					{
						const definition: IDotScreenEffectDefinition = this
							._effectDefinitions[i]
							.definition as IDotScreenEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
								scale: properties.scale,
								angle: properties.angle,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.GRID:
					{
						const definition: IGridEffectDefinition = this
							._effectDefinitions[i]
							.definition as IGridEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.GRID,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
								scale: properties.scale,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.HBAO:
					{
						const definition: IHBAOEffectDefinition = this
							._effectDefinitions[i]
							.definition as IHBAOEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.HBAO,
							token: this._effectDefinitions[i].token,
							properties: {
								resolutionScale: properties.resolutionScale,
								spp: properties.spp,
								distance: properties.distance,
								distanceIntensity: properties.distanceIntensity,
								intensity: properties.intensity,
								bias: properties.bias,
								thickness: properties.thickness,
								color:
									properties.color !== undefined
										? this._converter.toHexColor(
												properties.color,
											)
										: undefined,
								iterations: properties.iterations,
								radius: properties.radius,
								rings: properties.rings,
								lumaPhi: properties.lumaPhi,
								depthPhi: properties.depthPhi,
								normalPhi: properties.normalPhi,
								samples: properties.samples,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION:
					{
						const definition: IHueSaturationEffectDefinition = this
							._effectDefinitions[i]
							.definition as IHueSaturationEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
								hue: properties.hue,
								saturation: properties.saturation,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.NOISE:
					{
						const definition: INoiseEffectDefinition = this
							._effectDefinitions[i]
							.definition as INoiseEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.NOISE,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
								premultiply: properties.premultiply,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.PIXELATION:
					{
						const definition: IPixelationEffectDefinition = this
							._effectDefinitions[i]
							.definition as IPixelationEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.PIXELATION,
							token: this._effectDefinitions[i].token,
							properties: {
								granularity: properties.granularity,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.SSAO:
					{
						const definition: ISSAOEffectDefinition = this
							._effectDefinitions[i]
							.definition as ISSAOEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.SSAO,
							token: this._effectDefinitions[i].token,
							properties: {
								resolutionScale: properties.resolutionScale,
								spp: properties.spp,
								distance: properties.distance,
								distanceIntensity: properties.distanceIntensity,
								intensity: properties.intensity,
								color:
									properties.color !== undefined
										? this._converter.toHexColor(
												properties.color,
											)
										: undefined,
								iterations: properties.iterations,
								radius: properties.radius,
								rings: properties.rings,
								lumaPhi: properties.lumaPhi,
								depthPhi: properties.depthPhi,
								normalPhi: properties.normalPhi,
								samples: properties.samples,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.SCANLINE:
					{
						const definition: IScanlineEffectDefinition = this
							._effectDefinitions[i]
							.definition as IScanlineEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.SCANLINE,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
								density: properties.density,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.SEPIA:
					{
						const definition: ISepiaEffectDefinition = this
							._effectDefinitions[i]
							.definition as ISepiaEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.SEPIA,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT:
					{
						const definition: ITiltShiftEffectDefinition = this
							._effectDefinitions[i]
							.definition as ITiltShiftEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
								offset: properties.offset,
								rotation: properties.rotation,
								focusArea: properties.focusArea,
								feather: properties.feather,
								kernelSize: properties.kernelSize,
							},
						});
					}
					break;

				case POST_PROCESSING_EFFECT_TYPE.VIGNETTE:
					{
						const definition: IVignetteEffectDefinition = this
							._effectDefinitions[i]
							.definition as IVignetteEffectDefinition;
						const properties = definition.properties || {};
						effects.push({
							type: POST_PROCESSING_EFFECT_TYPE.VIGNETTE,
							token: this._effectDefinitions[i].token,
							properties: {
								blendFunction: properties.blendFunction,
								technique: properties.technique,
								offset: properties.offset,
								darkness: properties.darkness,
							},
						});
					}
					break;

				default:
			}
		}

		return effects;
	}

	public init(): void {
		OverrideMaterialManager.workaroundEnabled = true;

		const initComposer = () => {
			this._composer = new EffectComposer(this._renderingEngine.renderer);
			// EffectComposer disables autoClear, we enable/disable this in the postprocessing render loop
			this._renderingEngine.renderer.autoClear = true;

			// create anti-aliasing effects and passes
			this._fxaaEffect = new FXAAEffect();
			this._smaaEffect = new SMAAEffect({preset: SMAAPreset.ULTRA});
			this._renderPass = new RenderPass(
				this._renderingEngine.scene,
				this._renderingEngine.camera,
			);
			this._ssaaRenderPass = new SSAARenderPass(
				this._renderingEngine.scene,
				this._renderingEngine.camera,
			);
		};

		if (this._sceneExtents === 0) {
			const token = this._eventEngine.addListener(
				EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE,
				async (e: IEvent) => {
					const viewerEvent = <ISceneEvent>e;
					if (viewerEvent.viewportId === this._renderingEngine.id) {
						if (
							vec3.distance(
								viewerEvent.boundingBox!.min,
								viewerEvent.boundingBox!.max,
							) > 0
						) {
							initComposer();
							this.changeEffectPass();
							this._eventEngine.removeListener(token);
						}
					}
				},
			);
		} else {
			initComposer();
		}
	}

	public removeEffect(token: string): boolean {
		const effectToRemove = this._effectDefinitions.find(
			(e) => e.token === token,
		);
		if (effectToRemove)
			this._effectDefinitions.splice(
				this._effectDefinitions.indexOf(effectToRemove),
				1,
			);

		if (this._godRaysManagers[token]) delete this._godRaysManagers[token];
		if (this._outlineManagers[token]) {
			this._outlineManagers[token].clearSelection();
			delete this._outlineManagers[token];
		}
		if (this._selectiveBloomManagers[token]) {
			this._selectiveBloomManagers[token].clearSelection();
			delete this._selectiveBloomManagers[token];
		}

		this.changeEffectPass();
		return true;
	}

	public render(deltaTime: number, camera: THREE.Camera) {
		if (!this._composer) return;

		const cameraId = `${camera.id}_${camera.type}${camera.type === "PerspectiveCamera" ? "" : "_" + camera.up.toArray().toString()}`;
		if (cameraId !== this._currentCameraId) {
			this._currentCameraId = cameraId;
			this.changeEffectPass();
		}
		const currentToneMapping = this._renderingEngine.renderer.toneMapping;
		const currentClearColor = this._renderingEngine.renderer.getClearColor(
			new THREE.Color(),
		);
		const convertedClearColor = currentClearColor
			.clone()
			.convertSRGBToLinear();

		this._renderingEngine.renderer.toneMapping = THREE.NoToneMapping;
		this._renderingEngine.renderer.setClearColor(convertedClearColor);
		this._renderingEngine.renderer.setClearAlpha(
			this._renderingEngine.clearAlpha,
		);
		this._renderingEngine.renderer.autoClear = false;

		this._composer.setMainCamera(camera);
		this._composer.render();

		this._renderingEngine.renderer.toneMapping = currentToneMapping;
		this._renderingEngine.renderer.autoClear = true;
		this._renderingEngine.renderer.setClearColor(currentClearColor);
	}

	public resize(width: number, height: number) {
		if (!this._composer) return;

		this.effects.forEach((e) => {
			if (e.effect.setSize) e.effect.setSize(width, height);
		});

		this._renderPass!.setSize(width, height);
		this._ssaaRenderPass!.setSize(width, height);
		this._effectPasses?.forEach((pass) => pass.setSize(width, height));
		this._composer.setSize(width, height);
	}

	public saveSettings(settingsEngine: SettingsEngine) {
		settingsEngine.settings.postprocessing.antiAliasingTechnique =
			this.antiAliasingTechnique;
		settingsEngine.settings.postprocessing.antiAliasingTechniqueMobile =
			this.antiAliasingTechniqueMobile;
		settingsEngine.settings.postprocessing.enablePostProcessingOnMobile =
			this.enablePostProcessingOnMobile;
		settingsEngine.settings.postprocessing.ssaaSampleLevel =
			this.ssaaSampleLevel;
		const effects = this.getPostProcessingEffectsArray();
		// delete the tokens as we don't want to save them
		effects.forEach((e) => delete e.token);
		settingsEngine.settings.postprocessing.effects = effects;
	}

	public updateEffect(
		token: string,
		definition: IPostProcessingEffectDefinition,
	) {
		const effectDefinition = this._effectDefinitions.find(
			(e) => e.token === token,
		);
		if (!effectDefinition) return;
		this.removeEffect(token);
		this.addEffect(definition, token);
	}

	// #endregion Public Methods (13)

	// #region Private Methods (1)

	private addPassToEffectComposer(
		pass: EffectPass | RenderPass | SSAARenderPass,
	) {
		if (this._composer) {
			try {
				this._composer.addPass(pass);
			} catch (e) {
				// in this case a WebGL error is thrown, when the WebGL context is lost
				// as we already throw an error in the rendering engine, we can ignore this error here
				// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getContextAttributes
			}
		}
	}

	// #endregion Private Methods (1)
}
