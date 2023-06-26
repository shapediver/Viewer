import * as THREE from 'three';
import {
    BlendFunction,
    BloomEffect,
    ChromaticAberrationEffect,
    DepthDownsamplingPass,
    DepthOfFieldEffect,
    DotScreenEffect,
    Effect,
    EffectComposer,
    EffectPass,
    GodRaysEffect,
    GridEffect,
    HueSaturationEffect,
    NoiseEffect,
    NormalPass,
    OutlineEffect,
    OverrideMaterialManager,
    PixelationEffect,
    ScanlineEffect,
    SelectiveBloomEffect,
    SepiaEffect,
    SSAOEffect,
    TiltShiftEffect,
    VignetteEffect
    } from 'postprocessing';
import {
    Converter,
    EventEngine,
    EVENTTYPE,
    UuidGenerator
    } from '@shapediver/viewer.shared.services';
import { GodRaysManager } from './postprocessing/GodRaysManager';
import {
    IBloomEffectDefinition,
    IChromaticAberrationEffectDefinition,
    IDepthOfFieldEffectDefinition,
    IDotScreenEffectDefinition,
    IGodRaysEffectDefinition,
    IGridEffectDefinition,
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
export class PostProcessingManager implements IManager {
    // #region Properties (14)

    private readonly _converter: Converter = Converter.instance;
    private readonly _eventEngine: EventEngine = EventEngine.instance;
    private readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;

    private _composer!: EffectComposer;
    private _depthDownsamplingPass!: DepthDownsamplingPass;
    private _effectDefinitions: {
        token: string,
        definition: IPostProcessingEffectDefinition
    }[] = [];
    private _effectPass?: EffectPass;
    private _effects: {
        token: string,
        effect: Effect
    }[] = [];
    private _godRaysManagers: {
        [key: string]: GodRaysManager
    } = {};
    private _normalPass!: NormalPass;
    private _normalPassScene: THREE.Scene = new THREE.Scene();
    private _outlineManagers: {
        [key: string]: OutlineManager
    } = {};
    private _selectiveBloomManagers: {
        [key: string]: SelectiveBloomManager
    } = {};
    private _manualPostProcessing: boolean = false;
    private _ssaaRenderPass!: SSAARenderPass;

    // #endregion Properties (14)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    public get effects(): { token: string, effect: Effect }[] {
        return this._effects;
    }

    public get godRaysManagers(): {
        [key: string]: GodRaysManager
    } {
        return this._godRaysManagers;
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

    public get effectComposer(): EffectComposer {
        return this._composer;
    }

    public get manualPostProcessing(): boolean {
        return this._manualPostProcessing;
    }

    public set manualPostProcessing(value: boolean) {
        this._manualPostProcessing = value;
        if(this._manualPostProcessing === true) {
            this._composer.removeAllPasses();
        } else {
            this._composer.addPass(this._ssaaRenderPass);
        }
    }

    public get ssaaSampleLevel(): number {
        return this._ssaaRenderPass.sampleLevel;
    }

    public set ssaaSampleLevel(value: number) {
        this._ssaaRenderPass.sampleLevel = value;
    }

    // #endregion Public Accessors (4)

    // #region Public Methods (7)

    public addEffect(definition: IPostProcessingEffectDefinition, t?: string): string {
        const token = t || this._uuidGenerator.create();
        this._effectDefinitions.push({ token, definition });
        this.changeEffectPass();
        return token;
    }

    public updateEffect(token: string, definition: IPostProcessingEffectDefinition) {
        const effectDefinition = this._effectDefinitions.find(e => e.token === token);
        if(!effectDefinition) return;
        this.removeEffect(token);
        this.addEffect(definition, token);
    }

    public changeEffectPass() {
        if(this._manualPostProcessing) return;

        this._composer.removeAllPasses();
        this._composer.addPass(this._ssaaRenderPass);
        // this._composer.addPass(new RenderPass(this._renderingEngine.scene, this._renderingEngine.camera));
        // this._composer.addPass(new DepthPass(this._renderingEngine.scene, this._renderingEngine.camera))

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
                                radialModulation: definition.radialModulation || false,
                                modulationOffset: definition.modulationOffset || 0.15
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
                                focalLength: definition.focalLength,
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
                                blendFunction: definition.blendFunction || BlendFunction.MULTIPLY,
                                scale: definition.scale
                            })
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
                            blendFunction: definition.blendFunction || BlendFunction.SCREEN,
                            edgeStrength: definition.edgeStrength,
                            pulseSpeed: definition.pulseSpeed,
                            visibleEdgeColor: <any>new THREE.Color(this._converter.toHexColor(definition.visibleEdgeColor).substring(0,7)),
                            hiddenEdgeColor: <any>new THREE.Color(this._converter.toHexColor(definition.hiddenEdgeColor).substring(0,7)),
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
                        this._composer.addPass(this._normalPass);
                        if (this._renderingEngine.renderer.capabilities.isWebGL2)
                            this._composer.addPass(this._depthDownsamplingPass);

                        const definition: ISSAOEffectDefinition = this._effectDefinitions[i].definition as ISSAOEffectDefinition;
                        const ssaoEffect = new SSAOEffect(this._renderingEngine.camera, this._normalPass.texture, <any>{
                            blendFunction: definition.blendFunction,
                            depthAwareUpsampling: definition.depthAwareUpsampling,
                            normalBuffer: this._normalPass.texture || undefined,
                            samples: definition.samples,
                            rings: definition.rings,
                            luminanceInfluence: definition.luminanceInfluence,
                            minRadiusScale: definition.minRadiusScale,
                            radius: definition.radius,
                            intensity: definition.intensity,
                            bias: definition.bias,
                            fade: definition.fade,
                            color: <any>new THREE.Color(this._converter.toHexColor(definition.color).substring(0,7))
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
        this._effectPass = new EffectPass(this._renderingEngine.camera, ...this._effects.map(v => v.effect));
        this._composer.addPass(this._effectPass)
    }

    public getEffect(token: string): Effect {
        return this._effects.find(e => e.token === token)!.effect;
    }

    public init(): void {
        OverrideMaterialManager.workaroundEnabled = true;
        this._composer = new EffectComposer(this._renderingEngine.renderer);
        // EffectComposer disables autoClear, we enable/disable this in the postprocessing render loop
        this._renderingEngine.renderer.autoClear = true;
        this._ssaaRenderPass = new SSAARenderPass(this._renderingEngine.scene, this._renderingEngine.camera);
        this._composer.addPass(this._ssaaRenderPass);

        this._normalPassScene = this._renderingEngine.scene.clone();
        this._normalPassScene.traverseVisible(o => {
            if (o instanceof THREE.LineSegments)
                o.visible = false;
        })
        this._normalPass = new NormalPass(this._normalPassScene, this._renderingEngine.camera);
        this._depthDownsamplingPass = new DepthDownsamplingPass({
            normalBuffer: this._normalPass.texture,
            resolutionScale: 1
        });

        this._eventEngine.addListener(EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED, (e) => {
            if ((<IViewportEvent>e).viewportId !== this._renderingEngine.id) return;
            this._normalPassScene = this._renderingEngine.scene.clone();
            this._normalPassScene.traverseVisible(o => {
                if (o instanceof THREE.LineSegments)
                    o.visible = false;
            })
            this._normalPass.mainScene = this._normalPassScene;
        })
    }

    public removeEffect(token: string): boolean {
        const effectToRemove = this._effectDefinitions.find(e => e.token === token);
        if (effectToRemove)
            this._effectDefinitions.splice(this._effectDefinitions.indexOf(effectToRemove), 1);
        this.changeEffectPass();
        return true;
    }

    public render(deltaTime: number, camera: THREE.Camera) {
        this._renderingEngine.renderer.autoClear = false;
        this._composer.setMainCamera(camera);
        this._composer.render();
        this._renderingEngine.renderer.autoClear = true;
    }

    public resize(width: number, height: number) {
        this._ssaaRenderPass.setSize(width, height);
        this._normalPass.setSize(width, height);
        this._effectPass?.setSize(width, height);
        this._composer.setSize(width, height);
    }

    // #endregion Public Methods (7)
}