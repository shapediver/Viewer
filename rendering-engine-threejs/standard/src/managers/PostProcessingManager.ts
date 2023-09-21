import * as THREE from 'three';
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
    VignetteEffect,
    VignetteTechnique
} from 'postprocessing';
import {
    Converter,
    SettingsEngine,
    SystemInfo,
    UuidGenerator
} from '@shapediver/viewer.shared.services';
import { GodRaysManager } from './postprocessing/GodRaysManager';
import {
    ANTI_ALIASING_TECHNIQUE,
    IBloomEffectDefinition,
    IChromaticAberrationEffectDefinition,
    IDepthOfFieldEffectDefinition,
    IDotScreenEffectDefinition,
    IGodRaysEffectDefinition,
    IGridEffectDefinition,
    IHBAOEffectDefinition,
    IHueSaturationEffectDefinition,
    INoiseEffectDefinition,
    IOutlineEffectDefinition,
    IPixelationEffectDefinition,
    IPostProcessingEffectDefinition,
    IPostProcessingEffectsArray,
    IScanlineEffectDefinition,
    ISelectiveBloomEffectDefinition,
    ISepiaEffectDefinition,
    ISSAOEffectDefinition,
    ITiltShiftEffectDefinition,
    IVignetteEffectDefinition,
    POST_PROCESSING_EFFECT_TYPE
} from '../interfaces/IPostProcessingEffectDefinitions';
import { IManager } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { OutlineManager } from './postprocessing/OutlineManager';
import { RenderingEngine } from '../RenderingEngine';
import { SelectiveBloomManager } from './postprocessing/SelectiveBloomManager';
import { SSAARenderPass } from './postprocessing/SSAARenderPass';
import { SSAOEffect } from './postprocessing/ao/ssao/SSAOEffect';
import { HBAOEffect } from './postprocessing/ao/hbao/HBAOEffect';


export class PostProcessingManager implements IManager {
    // #region Properties (19)

    private readonly _converter: Converter = Converter.instance;
    private readonly _systemInfo: SystemInfo = SystemInfo.instance;
    private readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;

    private _antiAliasingTechnique: ANTI_ALIASING_TECHNIQUE = ANTI_ALIASING_TECHNIQUE.SMAA;
    private _antiAliasingTechniqueMobile: ANTI_ALIASING_TECHNIQUE = ANTI_ALIASING_TECHNIQUE.FXAA;
    private _composer!: EffectComposer;
    private _effectDefinitions: {
        token: string,
        definition: IPostProcessingEffectDefinition
    }[] = [];
    private _effectPass?: EffectPass;
    private _effects: {
        token: string,
        effect: Effect
    }[] = [];
    private _enablePostProcessingOnMobile: boolean = true;
    private _fxaaEffect!: FXAAEffect;
    private _godRaysManagers: {
        [key: string]: GodRaysManager
    } = {};
    private _manualPostProcessing: boolean = false;
    private _outlineManagers: {
        [key: string]: OutlineManager
    } = {};
    private _renderPass!: RenderPass;
    private _selectiveBloomManagers: {
        [key: string]: SelectiveBloomManager
    } = {};
    private _smaaEffect!: SMAAEffect;
    private _ssaaRenderPass!: SSAARenderPass;

    // #endregion Properties (19)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Accessors (15)

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
        this.changeEffectPass();
    }

    public get effectComposer(): EffectComposer {
        return this._composer;
    }

    public get effects(): { token: string, effect: Effect }[] {
        return this._effects;
    }

    public get enablePostProcessingOnMobile(): boolean {
        return this._enablePostProcessingOnMobile;
    }

    public set enablePostProcessingOnMobile(value: boolean) {
        this._enablePostProcessingOnMobile = value;
    }

    public get godRaysManagers(): {
        [key: string]: GodRaysManager
    } {
        return this._godRaysManagers;
    }

    public get manualPostProcessing(): boolean {
        return this._manualPostProcessing;
    }

    public set manualPostProcessing(value: boolean) {
        this._manualPostProcessing = value;
        if (this._manualPostProcessing === true)
            this._composer.removeAllPasses();
    }

    public get outlineManagers(): {
        [key: string]: OutlineManager
    } {
        return this._outlineManagers;
    }

    public get selectiveBloomManagers(): {
        [key: string]: SelectiveBloomManager
    } {
        return this._selectiveBloomManagers;
    }

    public get ssaaSampleLevel(): number {
        return this._ssaaRenderPass.sampleLevel;
    }

    public set ssaaSampleLevel(value: number) {
        this._ssaaRenderPass.sampleLevel = value;
    }

    // #endregion Public Accessors (15)

    // #region Public Methods (10)

    public addEffect(definition: IPostProcessingEffectDefinition, t?: string): string {
        const token = t || this._uuidGenerator.create();
        this._effectDefinitions.push({ token, definition });
        this.changeEffectPass();
        return token;
    }

    public applySettings(settingsEngine: SettingsEngine) {
        this.antiAliasingTechnique = settingsEngine.settings.postprocessing.antiAliasingTechnique as ANTI_ALIASING_TECHNIQUE;
        this.antiAliasingTechniqueMobile = settingsEngine.settings.postprocessing.antiAliasingTechniqueMobile as ANTI_ALIASING_TECHNIQUE;
        this.enablePostProcessingOnMobile = settingsEngine.settings.postprocessing.enablePostProcessingOnMobile;
        this.ssaaSampleLevel = settingsEngine.settings.postprocessing.ssaaSampleLevel;

        const effects = settingsEngine.settings.postprocessing.effects;
        for(let i = 0; i < effects.length; i++) {
            const token = this._uuidGenerator.create();
            
            this._effectDefinitions.push({
                token,
                definition: {
                    type: effects[i].type as POST_PROCESSING_EFFECT_TYPE,
                    properties: effects[i].properties
                }
            });
        }
        this.changeEffectPass();
    }

    public changeEffectPass() {
        if (this._systemInfo.isMobile === true && this._enablePostProcessingOnMobile === false) return;
        if (this._manualPostProcessing) return;

        this._composer.removeAllPasses();

        const antiAliasingTechnique = this._systemInfo.isMobile === true ? this._antiAliasingTechniqueMobile : this._antiAliasingTechnique;
        if (antiAliasingTechnique === ANTI_ALIASING_TECHNIQUE.SSAA) {
            this._composer.addPass(this._ssaaRenderPass);
        } else {
            this._composer.addPass(this._renderPass);
        }

        // remove the effects where the tokens are not in the effectDefinitions
        this._effects.forEach(e => e.effect.dispose());
        this._effects = [];

        for (let i = 0; i < this._effectDefinitions.length; i++) {
            switch (this._effectDefinitions[i].definition.type) {
                case POST_PROCESSING_EFFECT_TYPE.BLOOM:
                    {
                        const definition: IBloomEffectDefinition = this._effectDefinitions[i].definition as IBloomEffectDefinition;
                        const properties = definition.properties || {};
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new BloomEffect({
                                blendFunction: properties.blendFunction,
                                luminanceThreshold: properties.luminanceThreshold,
                                luminanceSmoothing: properties.luminanceSmoothing,
                                mipmapBlur: properties.mipmapBlur,
                                intensity: properties.intensity,
                                kernelSize: properties.kernelSize
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION:
                    {
                        const definition: IChromaticAberrationEffectDefinition = this._effectDefinitions[i].definition as IChromaticAberrationEffectDefinition;
                        const properties = definition.properties || {};
                        const offsetArray = properties.offset !== undefined ? Array.isArray(properties.offset) ? properties.offset : [(<any>properties.offset).x, (<any>properties.offset).y] : undefined;

                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new ChromaticAberrationEffect({
                                blendFunction: properties.blendFunction,
                                offset: offsetArray ? new THREE.Vector2(...offsetArray) : undefined,
                                radialModulation: properties.radialModulation !== undefined ? properties.radialModulation : false,
                                modulationOffset: properties.modulationOffset !== undefined ? properties.modulationOffset : 0.15
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD:
                    {
                        const definition: IDepthOfFieldEffectDefinition = this._effectDefinitions[i].definition as IDepthOfFieldEffectDefinition;
                        const properties = definition.properties || {};

                        const depthOfFieldEffect = new DepthOfFieldEffect(this._renderingEngine.camera, {
                            blendFunction: properties.blendFunction,
                            focusDistance: properties.focusDistance !== undefined ? properties.focusDistance : 0,
                            focusRange: properties.focusRange !== undefined ? properties.focusRange : 0.01,
                            bokehScale: properties.bokehScale !== undefined ? properties.bokehScale : 5,
                            resolutionScale: 1
                        });

                        depthOfFieldEffect.resolution.height = 1080;
                        depthOfFieldEffect.blurPass.kernelSize = KernelSize.HUGE;

                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: depthOfFieldEffect
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN:
                    {
                        const definition: IDotScreenEffectDefinition = this._effectDefinitions[i].definition as IDotScreenEffectDefinition;
                        const properties = definition.properties || {};
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new DotScreenEffect({
                                blendFunction: properties.blendFunction,
                                scale: properties.scale,
                                angle: properties.angle
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.GOD_RAYS:
                    {
                        const definition: IGodRaysEffectDefinition = this._effectDefinitions[i].definition as IGodRaysEffectDefinition;
                        const properties = definition.properties || {};
                        const godRaysEffect = new GodRaysEffect(this._renderingEngine.camera, new THREE.Mesh(), {
                            blendFunction: properties.blendFunction,
                            density: properties.density,
                            decay: properties.decay,
                            weight: properties.weight,
                            exposure: properties.exposure,
                            clampMax: properties.clampMax,
                            kernelSize: properties.kernelSize,
                            blur: properties.blur
                        });
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: godRaysEffect
                        });
                        this._godRaysManagers[this._effectDefinitions[i].token] = new GodRaysManager(this._renderingEngine, godRaysEffect);
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.GRID:
                    {
                        const definition: IGridEffectDefinition = this._effectDefinitions[i].definition as IGridEffectDefinition;
                        const properties = definition.properties || {};
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new GridEffect({
                                blendFunction: properties.blendFunction !== undefined ? properties.blendFunction : BlendFunction.MULTIPLY,
                                scale: properties.scale
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.HBAO:
                    {
                        if(this._systemInfo.isMobile === true) break;
                        const definition: IHBAOEffectDefinition = this._effectDefinitions[i].definition as IHBAOEffectDefinition;
                        const properties = definition.properties || {};
                        const hbaoEffect = new HBAOEffect(this._composer, this._renderingEngine.camera, this._renderingEngine.scene, {
                            resolutionScale: properties.resolutionScale !== undefined ? properties.resolutionScale : 1,
                            spp: properties.spp !== undefined ? properties.spp : 8,
                            distance: properties.distance !== undefined ? properties.distance : 2,
                            distancePower: properties.distanceIntensity !== undefined ? properties.distanceIntensity : 1,
                            power: properties.intensity !== undefined ? properties.intensity : 5,
                            bias: properties.bias !== undefined ? properties.bias : 10,
                            thickness: properties.thickness !== undefined ? properties.thickness : 0.5,
                            color: properties.color !== undefined ? new THREE.Color(this._converter.toHexColor(properties.color).substring(0, 7)) : new THREE.Color("black"),
                            iterations: properties.iterations !== undefined ? properties.iterations : 1,
                            radius: properties.radius !== undefined ? properties.radius : 15,
                            rings: properties.rings !== undefined ? properties.rings : 4,
                            lumaPhi: properties.lumaPhi !== undefined ? properties.lumaPhi : 10,
                            depthPhi: properties.depthPhi !== undefined ? properties.depthPhi : 2,
                            normalPhi: properties.normalPhi !== undefined ? properties.normalPhi : 3.25,
                            samples: properties.samples !== undefined ? properties.samples : 16
                        });
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: hbaoEffect
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION:
                    {
                        const definition: IHueSaturationEffectDefinition = this._effectDefinitions[i].definition as IHueSaturationEffectDefinition;
                        const properties = definition.properties || {};
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new HueSaturationEffect({
                                blendFunction: properties.blendFunction,
                                hue: properties.hue,
                                saturation: properties.saturation
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.NOISE:
                    {
                        const definition: INoiseEffectDefinition = this._effectDefinitions[i].definition as INoiseEffectDefinition;
                        const properties = definition.properties || {};
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new NoiseEffect({
                                blendFunction: properties.blendFunction,
                                premultiply: properties.premultiply
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.OUTLINE:
                    {
                        const definition: IOutlineEffectDefinition = this._effectDefinitions[i].definition as IOutlineEffectDefinition;
                        const properties = definition.properties || {};
                        const outlineEffect = new OutlineEffect(this._renderingEngine.scene, this._renderingEngine.camera, {
                            blendFunction: properties.blendFunction !== undefined ? properties.blendFunction : BlendFunction.SCREEN,
                            edgeStrength: properties.edgeStrength,
                            pulseSpeed: properties.pulseSpeed,
                            visibleEdgeColor: <any>new THREE.Color(this._converter.toHexColor(properties.visibleEdgeColor).substring(0, 7)),
                            hiddenEdgeColor: <any>new THREE.Color(this._converter.toHexColor(properties.hiddenEdgeColor).substring(0, 7)),
                            kernelSize: properties.kernelSize,
                            blur: properties.blur,
                            xRay: properties.xRay,
                            multisampling: properties.multisampling
                        })
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: outlineEffect
                        });
                        this._outlineManagers[this._effectDefinitions[i].token] = new OutlineManager(this._renderingEngine, outlineEffect);
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.PIXELATION:
                    {
                        const definition: IPixelationEffectDefinition = this._effectDefinitions[i].definition as IPixelationEffectDefinition;
                        const properties = definition.properties || {};
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new PixelationEffect(properties.granularity)
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SSAO:
                    {
                        if(this._systemInfo.isMobile === true) break;
                        const definition: ISSAOEffectDefinition = this._effectDefinitions[i].definition as ISSAOEffectDefinition;
                        const properties = definition.properties || {};
                        const ssaoEffect = new SSAOEffect(this._composer, this._renderingEngine.camera, this._renderingEngine.scene, {
                            resolutionScale: properties.resolutionScale !== undefined ? properties.resolutionScale : 1,
                            spp: properties.spp !== undefined ? properties.spp : 8,
                            distance: properties.distance !== undefined ? properties.distance : 3,
                            distancePower: properties.distanceIntensity !== undefined ? properties.distanceIntensity : 0.5,
                            power: properties.intensity !== undefined ? properties.intensity : 10,
                            color: properties.color !== undefined ? new THREE.Color(this._converter.toHexColor(properties.color).substring(0, 7)) : new THREE.Color("black"),
                            iterations: properties.iterations !== undefined ? properties.iterations : 1,
                            radius: properties.radius !== undefined ? properties.radius : 15,
                            rings: properties.rings !== undefined ? properties.rings : 4,
                            lumaPhi: properties.lumaPhi !== undefined ? properties.lumaPhi : 10,
                            depthPhi: properties.depthPhi !== undefined ? properties.depthPhi : 2,
                            normalPhi: properties.normalPhi !== undefined ? properties.normalPhi : 3.25,
                            samples: properties.samples !== undefined ? properties.samples : 16
                        });

                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: ssaoEffect
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SCANLINE:
                    {
                        const definition: IScanlineEffectDefinition = this._effectDefinitions[i].definition as IScanlineEffectDefinition;
                        const properties = definition.properties || {};
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new ScanlineEffect({
                                blendFunction: properties.blendFunction,
                                density: properties.density
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM:
                    {
                        const definition: ISelectiveBloomEffectDefinition = this._effectDefinitions[i].definition as ISelectiveBloomEffectDefinition;
                        const properties = definition.properties || {};
                        const selectiveBloomEffect = new SelectiveBloomEffect(this._renderingEngine.scene, this._renderingEngine.camera, {
                            blendFunction: properties.blendFunction,
                            mipmapBlur: properties.mipmapBlur,
                            luminanceThreshold: properties.luminanceThreshold,
                            luminanceSmoothing: properties.luminanceSmoothing,
                            intensity: properties.intensity,
                            kernelSize: properties.kernelSize
                        });
                        selectiveBloomEffect.ignoreBackground = properties.ignoreBackground !== undefined ? properties.ignoreBackground : true;
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: selectiveBloomEffect
                        });
                        this._selectiveBloomManagers[this._effectDefinitions[i].token] = new SelectiveBloomManager(this._renderingEngine, selectiveBloomEffect);
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SEPIA:
                    {
                        const definition: ISepiaEffectDefinition = this._effectDefinitions[i].definition as ISepiaEffectDefinition;
                        const properties = definition.properties || {};
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new SepiaEffect({
                                blendFunction: properties.blendFunction
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT:
                    {
                        const definition: ITiltShiftEffectDefinition = this._effectDefinitions[i].definition as ITiltShiftEffectDefinition;
                        const properties = definition.properties || {};
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new TiltShiftEffect({
                                blendFunction: properties.blendFunction,
                                offset: properties.offset,
                                rotation: properties.rotation,
                                focusArea: properties.focusArea,
                                feather: properties.feather,
                                kernelSize: properties.kernelSize
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.VIGNETTE:
                    {
                        const definition: IVignetteEffectDefinition = this._effectDefinitions[i].definition as IVignetteEffectDefinition;
                        const properties = definition.properties || {};
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new VignetteEffect({
                                blendFunction: properties.blendFunction,
                                technique: properties.technique,
                                offset: properties.offset,
                                darkness: properties.darkness,
                            })
                        });
                    }
                    break;

                default:
            }
        }

        // sort effects by order in effectDefinitions
        this._effects.sort((a, b) => this._effectDefinitions.indexOf(this._effectDefinitions.find(e => e.token === a.token)!) - this._effectDefinitions.indexOf(this._effectDefinitions.find(e => e.token === b.token)!));

        const effectArray = this._effects.map(v => v.effect);
        if (antiAliasingTechnique === ANTI_ALIASING_TECHNIQUE.FXAA) {
            effectArray.unshift(this._fxaaEffect)
        } else if (antiAliasingTechnique === ANTI_ALIASING_TECHNIQUE.SMAA) {
            effectArray.unshift(this._smaaEffect)
        }

        this._effectPass = new EffectPass(this._renderingEngine.camera, ...this._effects.map(v => v.effect));
        this._composer.addPass(this._effectPass)

        // for the AO effects we need to add a separate AA pass at the end that anti-aliases the AO effect
        if (this._effectDefinitions.find(e => e.definition.type === POST_PROCESSING_EFFECT_TYPE.HBAO || e.definition.type === POST_PROCESSING_EFFECT_TYPE.SSAO)) {
            // respect the AA choice if one of the effects was selected, use SMAA otherwise
            this._composer.addPass(new EffectPass(this._renderingEngine.camera, antiAliasingTechnique === ANTI_ALIASING_TECHNIQUE.FXAA ? this._fxaaEffect : this._smaaEffect))
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
                    offset: { x: 0.001, y: 0.0005 },
                    radialModulation: false,
                }

            case POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD:
                return {
                    blendFunction: BlendFunction.NORMAL,
                    bokehScale: 5.0,
                    focusDistance: 0.0,
                    focusRange: 0.01,
                }
            case POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN:
                return {
                    angle: 1.57,
                    blendFunction: BlendFunction.NORMAL,
                    scale: 1.0,
                }
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
                }
            case POST_PROCESSING_EFFECT_TYPE.GRID:
                return {
                    blendFunction: BlendFunction.MULTIPLY,
                    scale: 1.0,
                }
            case POST_PROCESSING_EFFECT_TYPE.HBAO:
                return {
                    resolutionScale: 1,
                    spp: 8,
                    distance: 2,
                    distanceIntensity: 1,
                    intensity: 5,
                    color: '#000000',
                    bias: 10,
                    thickness: 0.5,

                    iterations: 1,
                    radius: 15,
                    rings: 4,
                    lumaPhi: 10,
                    depthPhi: 2,
                    normalPhi: 3.25,
                    samples: 16,
                }

            case POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION:
                return {
                    blendFunction: BlendFunction.NORMAL,
                    hue: 0.0,
                    saturation: 0.0,
                }
            case POST_PROCESSING_EFFECT_TYPE.NOISE:
                return {
                    blendFunction: BlendFunction.SCREEN,
                    premultiply: false,
                }
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
                }
            case POST_PROCESSING_EFFECT_TYPE.PIXELATION:
                return {
                    granularity: 30.0,
                }
            case POST_PROCESSING_EFFECT_TYPE.SSAO:
                return {
                    resolutionScale: 1,
                    spp: 8,
                    distance: 3,
                    distanceIntensity: 0.5,
                    intensity: 10,
                    color: '#000000',

                    iterations: 1,
                    radius: 15,
                    rings: 4,
                    lumaPhi: 10,
                    depthPhi: 2,
                    normalPhi: 3.25,
                    samples: 16,
                }
            case POST_PROCESSING_EFFECT_TYPE.SCANLINE:
                return {
                    blendFunction: BlendFunction.OVERLAY,
                    density: 1.25,
                }
            case POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM:
                return {
                    blendFunction: BlendFunction.ADD,
                    intensity: 1.0,
                    kernelSize: KernelSize.LARGE,
                    luminanceSmoothing: 0.025,
                    luminanceThreshold: 0.9,
                    mipmapBlur: false,
                    ignoreBackground: true,
                }
            case POST_PROCESSING_EFFECT_TYPE.SEPIA:
                return {
                    blendFunction: BlendFunction.NORMAL,
                }
            case POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT:
                return {
                    blendFunction: BlendFunction.NORMAL,
                    feather: 0.3,
                    focusArea: 0.4,
                    kernelSize: KernelSize.MEDIUM,
                    offset: 0.0,
                    rotation: 0.0,
                }
            case POST_PROCESSING_EFFECT_TYPE.VIGNETTE:
                return {
                    blendFunction: BlendFunction.NORMAL,
                    darkness: 0.5,
                    offset: 0.5,
                    technique: VignetteTechnique.DEFAULT,
                }
            default:
                return {}
        }
    }

    public getEffect(token: string): Effect {
        return this._effects.find(e => e.token === token)!.effect;
    }

    public getPostProcessingEffectsArray(): IPostProcessingEffectsArray {
        const effects: IPostProcessingEffectsArray = [];

        for (let i = 0; i < this._effectDefinitions.length; i++) {
            switch (this._effectDefinitions[i].definition.type) {
                case POST_PROCESSING_EFFECT_TYPE.BLOOM:
                    {
                        const definition: IBloomEffectDefinition = this._effectDefinitions[i].definition as IBloomEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.BLOOM,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                blendFunction: properties.blendFunction,
                                luminanceThreshold: properties.luminanceThreshold,
                                luminanceSmoothing: properties.luminanceSmoothing,
                                mipmapBlur: properties.mipmapBlur,
                                intensity: properties.intensity,
                                kernelSize: properties.kernelSize
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION:
                    {
                        const definition: IChromaticAberrationEffectDefinition = this._effectDefinitions[i].definition as IChromaticAberrationEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                blendFunction: properties.blendFunction,
                                offset: properties.offset ? Array.isArray(properties.offset) ? { x: properties.offset[0], y: properties.offset[1] } : properties.offset : undefined,
                                radialModulation: properties.radialModulation,
                                modulationOffset: properties.modulationOffset
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD:
                    {
                        const definition: IDepthOfFieldEffectDefinition = this._effectDefinitions[i].definition as IDepthOfFieldEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                blendFunction: properties.blendFunction,
                                focusDistance: properties.focusDistance,
                                focusRange: properties.focusRange,
                                bokehScale: properties.bokehScale
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN:
                    {
                        const definition: IDotScreenEffectDefinition = this._effectDefinitions[i].definition as IDotScreenEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                blendFunction: properties.blendFunction,
                                scale: properties.scale,
                                angle: properties.angle
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.GRID:
                    {
                        const definition: IGridEffectDefinition = this._effectDefinitions[i].definition as IGridEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.GRID,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                blendFunction: properties.blendFunction,
                                scale: properties.scale
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.HBAO:
                    {
                        const definition: IHBAOEffectDefinition = this._effectDefinitions[i].definition as IHBAOEffectDefinition;
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
                                color: properties.color !== undefined ? this._converter.toHexColor(properties.color) : undefined,
                                iterations: properties.iterations,
                                radius: properties.radius,
                                rings: properties.rings,
                                lumaPhi: properties.lumaPhi,
                                depthPhi: properties.depthPhi,
                                normalPhi: properties.normalPhi,
                                samples: properties.samples
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION:
                    {
                        const definition: IHueSaturationEffectDefinition = this._effectDefinitions[i].definition as IHueSaturationEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                blendFunction: properties.blendFunction,
                                hue: properties.hue,
                                saturation: properties.saturation
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.NOISE:
                    {
                        const definition: INoiseEffectDefinition = this._effectDefinitions[i].definition as INoiseEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.NOISE,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                blendFunction: properties.blendFunction,
                                premultiply: properties.premultiply
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.PIXELATION:
                    {
                        const definition: IPixelationEffectDefinition = this._effectDefinitions[i].definition as IPixelationEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.PIXELATION,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                granularity: properties.granularity
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SSAO:
                    {
                        const definition: ISSAOEffectDefinition = this._effectDefinitions[i].definition as ISSAOEffectDefinition;
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
                                color: properties.color !== undefined ? this._converter.toHexColor(properties.color) : undefined,
                                iterations: properties.iterations,
                                radius: properties.radius,
                                rings: properties.rings,
                                lumaPhi: properties.lumaPhi,
                                depthPhi: properties.depthPhi,
                                normalPhi: properties.normalPhi,
                                samples: properties.samples
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SCANLINE:
                    {
                        const definition: IScanlineEffectDefinition = this._effectDefinitions[i].definition as IScanlineEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.SCANLINE,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                blendFunction: properties.blendFunction,
                                density: properties.density
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SEPIA:
                    {
                        const definition: ISepiaEffectDefinition = this._effectDefinitions[i].definition as ISepiaEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.SEPIA,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                blendFunction: properties.blendFunction
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT:
                    {
                        const definition: ITiltShiftEffectDefinition = this._effectDefinitions[i].definition as ITiltShiftEffectDefinition;
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
                                kernelSize: properties.kernelSize
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.VIGNETTE:
                    {
                        const definition: IVignetteEffectDefinition = this._effectDefinitions[i].definition as IVignetteEffectDefinition;
                        const properties = definition.properties || {};
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.VIGNETTE,
                            token: this._effectDefinitions[i].token,
                            properties: {
                                blendFunction: properties.blendFunction,
                                technique: properties.technique,
                                offset: properties.offset,
                                darkness: properties.darkness,
                            }
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
        this._composer = new EffectComposer(this._renderingEngine.renderer);
        // EffectComposer disables autoClear, we enable/disable this in the postprocessing render loop
        this._renderingEngine.renderer.autoClear = true;

        // create anti-aliasing effects and passes
        this._fxaaEffect = new FXAAEffect();
        this._smaaEffect = new SMAAEffect({ preset: SMAAPreset.ULTRA });
        this._renderPass = new RenderPass(this._renderingEngine.scene, this._renderingEngine.camera);
        this._ssaaRenderPass = new SSAARenderPass(this._renderingEngine.scene, this._renderingEngine.camera);
    }

    public removeEffect(token: string): boolean {
        const effectToRemove = this._effectDefinitions.find(e => e.token === token);
        if (effectToRemove)
            this._effectDefinitions.splice(this._effectDefinitions.indexOf(effectToRemove), 1);
        this.changeEffectPass();
        return true;
    }

    public render(deltaTime: number, camera: THREE.Camera) {
        const currentClearColor = this._renderingEngine.renderer.getClearColor(new THREE.Color())
        const convertedClearColor = currentClearColor.clone().convertSRGBToLinear();
        this._renderingEngine.renderer.setClearColor(convertedClearColor);
        this._renderingEngine.renderer.autoClear = false;

        this._composer.setMainCamera(camera);
        this._composer.render();
        
        this._renderingEngine.renderer.autoClear = true;
        this._renderingEngine.renderer.setClearColor(currentClearColor)
    }

    public resize(width: number, height: number) {
        this._renderPass.setSize(width, height);
        this._ssaaRenderPass.setSize(width, height);
        this._effectPass?.setSize(width, height);
        this._composer.setSize(width, height);
    }

    public saveSettings(settingsEngine: SettingsEngine) {
        settingsEngine.settings.postprocessing.antiAliasingTechnique = this.antiAliasingTechnique;
        settingsEngine.settings.postprocessing.antiAliasingTechniqueMobile = this.antiAliasingTechniqueMobile;
        settingsEngine.settings.postprocessing.enablePostProcessingOnMobile = this.enablePostProcessingOnMobile;
        settingsEngine.settings.postprocessing.ssaaSampleLevel = this.ssaaSampleLevel;
        const effects = this.getPostProcessingEffectsArray();
        // delete the tokens as we don't want to save them
        effects.forEach(e => delete e.token);
        settingsEngine.settings.postprocessing.effects = effects;
    }

    public updateEffect(token: string, definition: IPostProcessingEffectDefinition) {
        const effectDefinition = this._effectDefinitions.find(e => e.token === token);
        if (!effectDefinition) return;
        this.removeEffect(token);
        this.addEffect(definition, token);
    }

    // #endregion Public Methods (10)
}