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
    VignetteEffect
} from 'postprocessing';
import {
    Converter,
    EventEngine,
    EVENTTYPE,
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
    IScanlineEffectDefinition,
    ISelectiveBloomEffectDefinition,
    ISepiaEffectDefinition,
    ISSAOEffectDefinition,
    ITiltShiftEffectDefinition,
    IVignetteEffectDefinition,
    POST_PROCESSING_EFFECT_TYPE
} from '../interfaces/IPostProcessingEffectDefinitions';
import { IManager } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { IViewportEvent } from '@shapediver/viewer.shared.types';
import { OutlineManager } from './postprocessing/OutlineManager';
import { RenderingEngine } from '../RenderingEngine';
import { SelectiveBloomManager } from './postprocessing/SelectiveBloomManager';
import { SSAARenderPass } from './postprocessing/SSAARenderPass';
import { IPostProcessingEffectsArray } from '@shapediver/viewer.settings';
const REALISM_EFFECTS: any = require('realism-effects');

export class PostProcessingManager implements IManager {
    // #region Properties (19)

    private readonly _converter: Converter = Converter.instance;
    private readonly _eventEngine: EventEngine = EventEngine.instance;
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
                    ...effects[i].properties
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
        const activeEffectTokens = this._effectDefinitions.map(e => e.token);
        this._effects = this._effects.filter(e => activeEffectTokens.includes(e.token));
        for (let i = 0; i < this._effectDefinitions.length; i++) {
            // if the effect has already been created, skip
            if (this._effects.find(e => e.token === this._effectDefinitions[i].token)) continue;

            switch (this._effectDefinitions[i].definition.type) {
                case POST_PROCESSING_EFFECT_TYPE.BLOOM:
                    {
                        const definition: IBloomEffectDefinition = this._effectDefinitions[i].definition as IBloomEffectDefinition;
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new BloomEffect({
                                blendFunction: definition.blendFunction,
                                luminanceThreshold: definition.luminanceThreshold,
                                luminanceSmoothing: definition.luminanceSmoothing,
                                mipmapBlur: definition.mipmapBlur,
                                intensity: definition.intensity,
                                kernelSize: definition.kernelSize
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION:
                    {
                        const definition: IChromaticAberrationEffectDefinition = this._effectDefinitions[i].definition as IChromaticAberrationEffectDefinition;
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new ChromaticAberrationEffect({
                                blendFunction: definition.blendFunction,
                                offset: definition.offset ? new THREE.Vector2(...definition.offset) : undefined,
                                radialModulation: definition.radialModulation !== undefined ? definition.radialModulation : false,
                                modulationOffset: definition.modulationOffset !== undefined ? definition.modulationOffset : 0.15
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD:
                    {
                        const definition: IDepthOfFieldEffectDefinition = this._effectDefinitions[i].definition as IDepthOfFieldEffectDefinition;
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new DepthOfFieldEffect(this._renderingEngine.camera, {
                                blendFunction: definition.blendFunction,
                                focusDistance: definition.focusDistance,
                                focusRange: definition.focusRange,
                                bokehScale: definition.bokehScale
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN:
                    {
                        const definition: IDotScreenEffectDefinition = this._effectDefinitions[i].definition as IDotScreenEffectDefinition;
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new DotScreenEffect({
                                blendFunction: definition.blendFunction,
                                scale: definition.scale,
                                angle: definition.angle
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.GOD_RAYS:
                    {
                        const definition: IGodRaysEffectDefinition = this._effectDefinitions[i].definition as IGodRaysEffectDefinition;
                        const godRaysEffect = new GodRaysEffect(this._renderingEngine.camera, new THREE.Mesh(), {
                            blendFunction: definition.blendFunction,
                            density: definition.density,
                            decay: definition.decay,
                            weight: definition.weight,
                            exposure: definition.exposure,
                            clampMax: definition.clampMax,
                            kernelSize: definition.kernelSize,
                            blur: definition.blur
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
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new GridEffect({
                                blendFunction: definition.blendFunction !== undefined ? definition.blendFunction : BlendFunction.MULTIPLY,
                                scale: definition.scale
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.HBAO:
                    {
                        const definition: IHBAOEffectDefinition = this._effectDefinitions[i].definition as IHBAOEffectDefinition;
                        const hbaoEffect = new REALISM_EFFECTS.HBAOEffect(this._composer, this._renderingEngine.camera, this._renderingEngine.scene, {
                            resolutionScale: definition.resolutionScale !== undefined ? definition.resolutionScale : 1,
                            spp: definition.spp !== undefined ? definition.spp : 8,
                            distance: definition.distance !== undefined ? definition.distance : 2,
                            distancePower: definition.distanceIntensity !== undefined ? definition.distanceIntensity : 1,
                            power: definition.intensity !== undefined ? definition.intensity : 5,
                            bias: definition.bias !== undefined ? definition.bias : 40,
                            thickness: definition.thickness !== undefined ? definition.thickness : 0.075,
                            color: definition.color !== undefined ? new THREE.Color(this._converter.toHexColor(definition.color).substring(0, 7)) : new THREE.Color("black"),
                            iterations: definition.iterations !== undefined ? definition.iterations : 1,
                            radius: definition.radius !== undefined ? definition.radius : 8,
                            rings: definition.rings !== undefined ? definition.rings : 5.625,
                            lumaPhi: definition.lumaPhi !== undefined ? definition.lumaPhi : 10,
                            depthPhi: definition.depthPhi !== undefined ? definition.depthPhi : 2,
                            normalPhi: definition.normalPhi !== undefined ? definition.normalPhi : 3.25,
                            samples: definition.samples !== undefined ? definition.samples : 16
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
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new HueSaturationEffect({
                                blendFunction: definition.blendFunction,
                                hue: definition.hue,
                                saturation: definition.saturation
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.NOISE:
                    {
                        const definition: INoiseEffectDefinition = this._effectDefinitions[i].definition as INoiseEffectDefinition;
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new NoiseEffect({
                                blendFunction: definition.blendFunction,
                                premultiply: definition.premultiply
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.OUTLINE:
                    {
                        const definition: IOutlineEffectDefinition = this._effectDefinitions[i].definition as IOutlineEffectDefinition;
                        const outlineEffect = new OutlineEffect(this._renderingEngine.scene, this._renderingEngine.camera, {
                            blendFunction: definition.blendFunction !== undefined ? definition.blendFunction : BlendFunction.SCREEN,
                            edgeStrength: definition.edgeStrength,
                            pulseSpeed: definition.pulseSpeed,
                            visibleEdgeColor: <any>new THREE.Color(this._converter.toHexColor(definition.visibleEdgeColor).substring(0, 7)),
                            hiddenEdgeColor: <any>new THREE.Color(this._converter.toHexColor(definition.hiddenEdgeColor).substring(0, 7)),
                            kernelSize: definition.kernelSize,
                            blur: definition.blur,
                            xRay: definition.xRay,
                            multisampling: definition.multisampling
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
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new PixelationEffect(definition.granularity)
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SSAO:
                    {
                        const definition: ISSAOEffectDefinition = this._effectDefinitions[i].definition as ISSAOEffectDefinition;
                        const ssaoEffect = new REALISM_EFFECTS.SSAOEffect(this._composer, this._renderingEngine.camera, this._renderingEngine.scene, {
                            resolutionScale: definition.resolutionScale !== undefined ? definition.resolutionScale : 1,
                            spp: definition.spp !== undefined ? definition.spp : 8,
                            distance: definition.distance !== undefined ? definition.distance : 2,
                            distancePower: definition.distanceIntensity !== undefined ? definition.distanceIntensity : 1,
                            power: definition.intensity !== undefined ? definition.intensity : 5,
                            color: definition.color !== undefined ? new THREE.Color(this._converter.toHexColor(definition.color).substring(0, 7)) : new THREE.Color("black"),
                            iterations: definition.iterations !== undefined ? definition.iterations : 1,
                            radius: definition.radius !== undefined ? definition.radius : 8,
                            rings: definition.rings !== undefined ? definition.rings : 5.625,
                            lumaPhi: definition.lumaPhi !== undefined ? definition.lumaPhi : 10,
                            depthPhi: definition.depthPhi !== undefined ? definition.depthPhi : 2,
                            normalPhi: definition.normalPhi !== undefined ? definition.normalPhi : 3.25,
                            samples: definition.samples !== undefined ? definition.samples : 16
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
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new ScanlineEffect({
                                blendFunction: definition.blendFunction,
                                density: definition.density
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM:
                    {
                        const definition: ISelectiveBloomEffectDefinition = this._effectDefinitions[i].definition as ISelectiveBloomEffectDefinition;
                        const selectiveBloomEffect = new SelectiveBloomEffect(this._renderingEngine.scene, this._renderingEngine.camera, {
                            blendFunction: definition.blendFunction,
                            mipmapBlur: definition.mipmapBlur,
                            luminanceThreshold: definition.luminanceThreshold,
                            luminanceSmoothing: definition.luminanceSmoothing,
                            intensity: definition.intensity,
                            kernelSize: definition.kernelSize
                        });
                        selectiveBloomEffect.ignoreBackground = definition.ignoreBackground !== undefined ? definition.ignoreBackground : true;
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
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new SepiaEffect({
                                blendFunction: definition.blendFunction
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT:
                    {
                        const definition: ITiltShiftEffectDefinition = this._effectDefinitions[i].definition as ITiltShiftEffectDefinition;
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new TiltShiftEffect({
                                blendFunction: definition.blendFunction,
                                offset: definition.offset,
                                rotation: definition.rotation,
                                focusArea: definition.focusArea,
                                feather: definition.feather,
                                kernelSize: definition.kernelSize
                            })
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.VIGNETTE:
                    {
                        const definition: IVignetteEffectDefinition = this._effectDefinitions[i].definition as IVignetteEffectDefinition;
                        this._effects.push({
                            token: this._effectDefinitions[i].token,
                            effect: new VignetteEffect({
                                blendFunction: definition.blendFunction,
                                technique: definition.technique,
                                offset: definition.offset,
                                darkness: definition.darkness,
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

    public getEffect(token: string): Effect {
        return this._effects.find(e => e.token === token)!.effect;
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

        const effects: IPostProcessingEffectsArray = [];

        for (let i = 0; i < this._effectDefinitions.length; i++) {
            switch (this._effectDefinitions[i].definition.type) {
                case POST_PROCESSING_EFFECT_TYPE.BLOOM:
                    {
                        const definition: IBloomEffectDefinition = this._effectDefinitions[i].definition as IBloomEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.BLOOM,
                            properties: {
                                blendFunction: definition.blendFunction,
                                luminanceThreshold: definition.luminanceThreshold,
                                luminanceSmoothing: definition.luminanceSmoothing,
                                mipmapBlur: definition.mipmapBlur,
                                intensity: definition.intensity,
                                kernelSize: definition.kernelSize
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION:
                    {
                        const definition: IChromaticAberrationEffectDefinition = this._effectDefinitions[i].definition as IChromaticAberrationEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION,
                            properties: {
                                blendFunction: definition.blendFunction,
                                offset: definition.offset ? { x: definition.offset[0], y: definition.offset[1] } : undefined,
                                radialModulation: definition.radialModulation,
                                modulationOffset: definition.modulationOffset
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD:
                    {
                        const definition: IDepthOfFieldEffectDefinition = this._effectDefinitions[i].definition as IDepthOfFieldEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD,
                            properties: {
                                blendFunction: definition.blendFunction,
                                focusDistance: definition.focusDistance,
                                focusRange: definition.focusRange,
                                bokehScale: definition.bokehScale
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN:
                    {
                        const definition: IDotScreenEffectDefinition = this._effectDefinitions[i].definition as IDotScreenEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN,
                            properties: {
                                blendFunction: definition.blendFunction,
                                scale: definition.scale,
                                angle: definition.angle
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.GRID:
                    {
                        const definition: IGridEffectDefinition = this._effectDefinitions[i].definition as IGridEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.GRID,
                            properties: {
                                blendFunction: definition.blendFunction,
                                scale: definition.scale
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.HBAO:
                    {
                        const definition: IHBAOEffectDefinition = this._effectDefinitions[i].definition as IHBAOEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.HBAO,
                            properties: {
                                resolutionScale: definition.resolutionScale,
                                spp: definition.spp,
                                distance: definition.distance,
                                distanceIntensity: definition.distanceIntensity,
                                intensity: definition.intensity,
                                bias: definition.bias,
                                thickness: definition.thickness,
                                color: definition.color !== undefined ? this._converter.toHexColor(definition.color) : undefined,
                                iterations: definition.iterations,
                                radius: definition.radius,
                                rings: definition.rings,
                                lumaPhi: definition.lumaPhi,
                                depthPhi: definition.depthPhi,
                                normalPhi: definition.normalPhi,
                                samples: definition.samples
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION:
                    {
                        const definition: IHueSaturationEffectDefinition = this._effectDefinitions[i].definition as IHueSaturationEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION,
                            properties: {
                                blendFunction: definition.blendFunction,
                                hue: definition.hue,
                                saturation: definition.saturation
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.NOISE:
                    {
                        const definition: INoiseEffectDefinition = this._effectDefinitions[i].definition as INoiseEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.NOISE,
                            properties: {
                                blendFunction: definition.blendFunction,
                                premultiply: definition.premultiply
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.PIXELATION:
                    {
                        const definition: IPixelationEffectDefinition = this._effectDefinitions[i].definition as IPixelationEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.PIXELATION,
                            properties: {
                                granularity: definition.granularity
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SSAO:
                    {
                        const definition: ISSAOEffectDefinition = this._effectDefinitions[i].definition as ISSAOEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.SSAO,
                            properties: {
                                resolutionScale: definition.resolutionScale,
                                spp: definition.spp,
                                distance: definition.distance,
                                distanceIntensity: definition.distanceIntensity,
                                intensity: definition.intensity,
                                color: definition.color !== undefined ? this._converter.toHexColor(definition.color) : undefined,
                                iterations: definition.iterations,
                                radius: definition.radius,
                                rings: definition.rings,
                                lumaPhi: definition.lumaPhi,
                                depthPhi: definition.depthPhi,
                                normalPhi: definition.normalPhi,
                                samples: definition.samples
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SCANLINE:
                    {
                        const definition: IScanlineEffectDefinition = this._effectDefinitions[i].definition as IScanlineEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.SCANLINE,
                            properties: {
                                blendFunction: definition.blendFunction,
                                density: definition.density
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.SEPIA:
                    {
                        const definition: ISepiaEffectDefinition = this._effectDefinitions[i].definition as ISepiaEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.SEPIA,
                            properties: {
                                blendFunction: definition.blendFunction
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT:
                    {
                        const definition: ITiltShiftEffectDefinition = this._effectDefinitions[i].definition as ITiltShiftEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT,
                            properties: {
                                blendFunction: definition.blendFunction,
                                offset: definition.offset,
                                rotation: definition.rotation,
                                focusArea: definition.focusArea,
                                feather: definition.feather,
                                kernelSize: definition.kernelSize
                            }
                        });
                    }
                    break;

                case POST_PROCESSING_EFFECT_TYPE.VIGNETTE:
                    {
                        const definition: IVignetteEffectDefinition = this._effectDefinitions[i].definition as IVignetteEffectDefinition;
                        effects.push({
                            type: POST_PROCESSING_EFFECT_TYPE.VIGNETTE,
                            properties: {
                                blendFunction: definition.blendFunction,
                                technique: definition.technique,
                                offset: definition.offset,
                                darkness: definition.darkness,
                            }
                        });
                    }
                    break;

                default:
            }
        }

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