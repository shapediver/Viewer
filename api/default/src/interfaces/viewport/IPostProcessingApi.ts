import { ANTI_ALIASING_TECHNIQUE, Effect, EffectComposer, IPostProcessingEffectsArray, IBloomEffectDefinition, IChromaticAberrationEffectDefinition, IDepthOfFieldEffectDefinition, IDotScreenEffectDefinition, IGodRaysEffectDefinition, IOutlineEffectDefinition, IPostProcessingEffectDefinition, ISSAOEffectDefinition, IGridEffectDefinition, IHBAOEffectDefinition, IHueSaturationEffectDefinition, INoiseEffectDefinition, IPixelationEffectDefinition, IScanlineEffectDefinition, ISelectiveBloomEffectDefinition, ISepiaEffectDefinition, ITiltShiftEffectDefinition, IVignetteEffectDefinition, POST_PROCESSING_EFFECT_TYPE } from "@shapediver/viewer.rendering-engine.rendering-engine-threejs";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IPostProcessingApi {
    // #region Properties (5)

    /**
     * Defines the anti-aliasing technique that is used when the post-processing is active. (default: ANTI_ALIASING_TECHNIQUE.SSAA)
     * 
     * The various anti-aliasing technique have an impact on the performance and the rendering quality. 
     * The order is as follows: NONE -> FXAA -> SMAA -> SSAA
     * (lowest to highest quality, fastest to slowest performance)
     * 
     * For the SSAA approach please see {@link ssaaSampleLevel}.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     */
    antiAliasingTechnique: ANTI_ALIASING_TECHNIQUE;
    
    /**
     * Defines the anti-aliasing technique that is used when the post-processing is active on mobile. (default: ANTI_ALIASING_TECHNIQUE.FXAA)
     * 
     * The various anti-aliasing technique have an impact on the performance and the rendering quality. 
     * The order is as follows: NONE -> FXAA -> SMAA -> SSAA
     * (lowest to highest quality, fastest to slowest performance)
     * 
     * For the SSAA approach please see {@link ssaaSampleLevel}.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     */
    antiAliasingTechniqueMobile: ANTI_ALIASING_TECHNIQUE;

    /**
     * The effect composer that is used internally for the rendering of the postprocessing effects.
     * In combination with {@link manualPostProcessing} you can adjust the effects and passes yourself.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     */
    readonly effectComposer: EffectComposer  | undefined;

    /**
     * If the post-processing effects should be enabled on mobile. (default: true)
     * 
     * As some post-processing effects greatly effect the rendering performance it might make sense to not use post-processing on mobile device.
     * This will ensure that the rendering on mobile devices is still fluid, while providing the best results on desktop.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     */
    enablePostProcessingOnMobile: boolean;

    /**
     * Access to all currently added god ray effects via token.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     * 
     * @see addEffect
     * @see updateEffect
     * @see removeEffect
     */
    godRaysEffects: {
        [key: string]: {
            /**
             * Set the light source for the god ray effect.
             * This light source is the geometry on which the god ray effect is applied.
             * 
             * @param node 
             */
            setLightSource(node: ITreeNode): void;

            /**
             * Remove the currently set light source.
             */
            removeLightSource(): void;
        }
    }

    /**
     * By setting this option to `true` you can manually work on the postprocessing pipeline.
     * All current effects and passes are removed from the EffectComposer and you can start from scratch.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     * 
     * @see effectComposer
     */
    manualPostProcessing: boolean;

    
    /**
     * Access to all currently added outline effects via token.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     * 
     * @see addEffect
     * @see updateEffect
     * @see removeEffect
     */
    outlineEffects: {
        [key: string]: {
            /**
             * Add a node to the selection for the outline effect.
             * 
             * @param node 
             */
            addSelection(node: ITreeNode): void;

            /**
             * Remove a node from the selection for the outline effect.
             * 
             * @param node 
             */
            removeSelection(node: ITreeNode): boolean;

            /**
             * Clear all currently selected nodes.
             */
            clearSelection(): void;
        }
    }

    /**
     * Access to all currently added selective bloom effects via token.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     * 
     * @see addEffect
     * @see updateEffect
     * @see removeEffect
     */
    selectiveBloomEffects: {
        [key: string]: {
            /**
             * Add a node to the selection for the selective bloom effect.
             * 
             * @param node 
             */
            addSelection(node: ITreeNode): void;

            /**
             * Remove a node from the selection for the selective bloom effect.
             * 
             * @param node 
             */
            removeSelection(node: ITreeNode): boolean;

            /**
             * Clear all currently selected nodes.
             */
            clearSelection(): void;
        }
    }

    /**
     * The number of samples that are taken in the Supersample Anti-Aliasing Render Pass.
     * Specified as n, where the number of samples is 2^n, so sampleLevel = 4, is 2^4 samples, 16. (default: 4)
     * 
     * Only works with {@link ANTI_ALIASING_TECHNIQUE.SSAA}.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     */
    ssaaSampleLevel: number;

    // #endregion Properties (5)

    // #region Public Methods (21)

    addEffect(definition: IBloomEffectDefinition): string;
    addEffect(definition: IChromaticAberrationEffectDefinition): string;
    addEffect(definition: IDepthOfFieldEffectDefinition): string;
    addEffect(definition: IDotScreenEffectDefinition): string;
    addEffect(definition: IGodRaysEffectDefinition): string;
    addEffect(definition: IGridEffectDefinition): string;
    addEffect(definition: IHBAOEffectDefinition): string;
    addEffect(definition: IHueSaturationEffectDefinition): string;
    addEffect(definition: INoiseEffectDefinition): string;
    addEffect(definition: IOutlineEffectDefinition): string;
    addEffect(definition: IPixelationEffectDefinition): string;
    addEffect(definition: ISSAOEffectDefinition): string;
    addEffect(definition: IScanlineEffectDefinition): string;
    addEffect(definition: ISelectiveBloomEffectDefinition): string;
    addEffect(definition: ISepiaEffectDefinition): string;
    addEffect(definition: ITiltShiftEffectDefinition): string;
    addEffect(definition: IVignetteEffectDefinition): string;

    /**
     * Add an effect to the postprocessing pipeline.
     * A token is return which identifies this effect when using other API functions.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     * 
     * @param definition 
     * 
     * @see updateEffect
     * @see removeEffect
     */
    addEffect(definition: IPostProcessingEffectDefinition): string;

    /**
     * Get the default settings of an effect by their type.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     * 
     * @param type 
     */
    getDefaultEffectProperties(type: POST_PROCESSING_EFFECT_TYPE): Object;

    /**
     * Get the effect that was created with the specified token.
     * This functions returns the Effect-Classes as used by the postprocessing package.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     * 
     * @param token 
     */
    getEffect(token: string): Effect;

    /**
     * Get all currently specified effects in a dictionary with the token as a key and 
     * the type as a value.
     */
    getEffectTokens(): { [key: string]: POST_PROCESSING_EFFECT_TYPE};

    /**
     * Get a description of the post-processing effects that are current applied.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     */
    getPostProcessingEffectsArray(): IPostProcessingEffectsArray

    /**
     * Remove an effect of the postprocessing pipeline.
     * Use the token that was generated by the {@link addEffect}-function.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     * 
     * @param token 
     * 
     * @see addEffect
     * @see updateEffect
     */
    removeEffect(token: string): boolean;
    
    /**
     * Update an effect of the postprocessing pipeline with the specified token and definition.
     * Use the token that was generated by the {@link addEffect}-function.
     * 
     * Note: The post-processing API is still WIP. Breaking changes are to be expected.
     * 
     * @param token 
     * @param definition 
     * 
     * @see addEffect
     * @see removeEffect
     */
    updateEffect(token: string, definition: IPostProcessingEffectDefinition): void;

    // #endregion Public Methods (21)
}