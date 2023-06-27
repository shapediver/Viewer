import { Effect, EffectComposer, IBloomEffectDefinition, IChromaticAberrationEffectDefinition, IDepthOfFieldEffectDefinition, IDotScreenEffectDefinition, IGodRaysEffectDefinition, IOutlineEffectDefinition, IPostProcessingEffectDefinition, ISSAOEffectDefinition } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { ANTI_ALIASING_TECHNIQUE, IGridEffectDefinition, IHueSaturationEffectDefinition, INoiseEffectDefinition, IPixelationEffectDefinition, IScanlineEffectDefinition, ISelectiveBloomEffectDefinition, ISepiaEffectDefinition, ITiltShiftEffectDefinition, IVignetteEffectDefinition } from "@shapediver/viewer.rendering-engine-threejs.standard/dist/interfaces/IPostProcessingEffectDefinitions";
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
     */
    antiAliasingTechnique: ANTI_ALIASING_TECHNIQUE;
    
    /**
     * Defines the anti-aliasing technique that is used when the post-processing is active on mobile.
     * 
     * The various anti-aliasing technique have an impact on the performance and the rendering quality. 
     * The order is as follows: NONE -> FXAA -> SMAA -> SSAA
     * (lowest to highest quality, fastest to slowest performance)
     * 
     * For the SSAA approach please see {@link ssaaSampleLevel}.
     */
    antiAliasingTechniqueMobile: ANTI_ALIASING_TECHNIQUE;

    /**
     * The effect composer that is used internally for the rendering of the postprocessing effects.
     * In combination with {@link manualPostProcessing} you can adjust the effects and passes yourself.
     */
    readonly effectComposer: EffectComposer;

    /**
     * Access to all currently added god ray effects via token.
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
     * @see effectComposer
     */
    manualPostProcessing: boolean;

    
    /**
     * Access to all currently added outline effects via token.
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
     * @param definition 
     * 
     * @see updateEffect
     * @see removeEffect
     */
    addEffect(definition: IPostProcessingEffectDefinition): string;

    /**
     * Get the effect that was created with the specified token.
     * This functions returns the Effect-Classes as used by the postprocessing package.
     * 
     * @param token 
     */
    getEffect(token: string): Effect;

    /**
     * Remove an effect of the postprocessing pipeline.
     * Use the token that was generated by the {@link addEffect}-function.
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
     * @param token 
     * @param definition 
     * 
     * @see addEffect
     * @see removeEffect
     */
    updateEffect(token: string, definition: IPostProcessingEffectDefinition): void;

    // #endregion Public Methods (21)
}