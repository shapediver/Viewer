
/**
 * A pass that renders a given scene into the input buffer or to screen.
 *
 * This pass uses a {@link ClearPass} to clear the target buffer.
 */

import { Pass, ClearPass, OverrideMaterialManager } from "postprocessing";
import { Scene, Camera, Material, WebGLRenderer, WebGLRenderTarget, Object3D, Line, LineLoop, LineSegments, Mesh, MeshPhysicalMaterial, Points } from "three";
import { GemMaterial } from "../../../materials/GemMaterial";

export class RenderPass extends Pass {
    clearPass: ClearPass;
    overrideMaterialManager: OverrideMaterialManager | null;
    ignoreBackground: boolean;
    skipShadowMapUpdate: boolean;
    selection: any;

    /**
     * Constructs a new render pass.
     *
     * @param {Scene} scene - The scene to render.
     * @param {Camera} camera - The camera to use to render the scene.
     * @param {Material} [overrideMaterial=null] - An override material.
     */

    constructor(scene: Scene, camera: Camera, overrideMaterial: Material | null = null) {

        super("RenderPass", scene, camera);

        this.needsSwap = false;

        /**
         * A clear pass.
         *
         * @type {ClearPass}
         * @readonly
         */

        this.clearPass = new ClearPass();

        /**
         * An override material manager.
         *
         * @type {OverrideMaterialManager}
         * @private
         */

        this.overrideMaterialManager = (overrideMaterial === null) ? null : new OverrideMaterialManager(overrideMaterial);

        /**
         * Indicates whether the scene background should be ignored.
         *
         * @type {Boolean}
         */

        this.ignoreBackground = false;

        /**
         * Indicates whether the shadow map auto update should be skipped.
         *
         * @type {Boolean}
         */

        this.skipShadowMapUpdate = false;

        /**
         * A selection of objects to render.
         *
         * @type {Selection}
         * @readonly
         */

        this.selection = null;

    }

    set mainScene(value: Scene) {

        this.scene = value;

    }

    set mainCamera(value: Camera) {

        this.camera = value;

    }

    get renderToScreen() {

        return super.renderToScreen;

    }

    set renderToScreen(value) {

        super.renderToScreen = value;
        this.clearPass.renderToScreen = value;

    }

    /**
     * The current override material.
     *
     * @type {Material}
     */

    get overrideMaterial() {

        const manager = this.overrideMaterialManager;
        return (manager !== null) ? (manager as any).material : null;

    }

    set overrideMaterial(value) {

        const manager = this.overrideMaterialManager;

        if (value !== null) {

            if (manager !== null) {

                manager.setMaterial(value);

            } else {

                this.overrideMaterialManager = new OverrideMaterialManager(value);

            }

        } else if (manager !== null) {

            manager.dispose();
            this.overrideMaterialManager = null;

        }

    }

    /**
     * Returns the current override material.
     *
     * @deprecated Use overrideMaterial instead.
     * @return {Material} The material.
     */

    getOverrideMaterial(): Material {

        return this.overrideMaterial;

    }

    /**
     * Sets the override material.
     *
     * @deprecated Use overrideMaterial instead.
     * @return {Material} value - The material.
     */

    setOverrideMaterial(value: any) {

        this.overrideMaterial = value;

    }

    /**
     * Indicates whether the target buffer should be cleared before rendering.
     *
     * @type {Boolean}
     * @deprecated Use clearPass.enabled instead.
     */

    get clear() {

        return this.clearPass.enabled;

    }

    set clear(value) {

        this.clearPass.enabled = value;

    }

    /**
     * Returns the selection. Default is `null` (no restriction).
     *
     * @deprecated Use selection instead.
     * @return {Selection} The selection.
     */

    getSelection(): Selection {

        return this.selection;

    }

    /**
     * Sets the selection. Set to `null` to disable.
     *
     * @deprecated Use selection instead.
     * @param {Selection} value - The selection.
     */

    setSelection(value: Selection) {

        this.selection = value;

    }

    /**
     * Indicates whether the scene background is disabled.
     *
     * @deprecated Use ignoreBackground instead.
     * @return {Boolean} Whether the scene background is disabled.
     */

    isBackgroundDisabled(): boolean {

        return this.ignoreBackground;

    }

    /**
     * Enables or disables the scene background.
     *
     * @deprecated Use ignoreBackground instead.
     * @param {Boolean} value - Whether the scene background should be disabled.
     */

    setBackgroundDisabled(value: boolean) {

        this.ignoreBackground = value;

    }

    /**
     * Indicates whether the shadow map auto update is disabled.
     *
     * @deprecated Use skipShadowMapUpdate instead.
     * @return {Boolean} Whether the shadow map update is disabled.
     */

    isShadowMapDisabled(): boolean {

        return this.skipShadowMapUpdate;

    }

    /**
     * Enables or disables the shadow map auto update.
     *
     * @deprecated Use skipShadowMapUpdate instead.
     * @param {Boolean} value - Whether the shadow map auto update should be disabled.
     */

    setShadowMapDisabled(value: boolean) {

        this.skipShadowMapUpdate = value;

    }

    /**
     * Returns the clear pass.
     *
     * @deprecated Use clearPass.enabled instead.
     * @return {ClearPass} The clear pass.
     */

    getClearPass(): ClearPass {

        return this.clearPass;

    }

    /**
     * Renders the scene.
     *
     * @param {WebGLRenderer} renderer - The renderer.
     * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
     * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
     * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
     * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
     */

    render(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, outputBuffer: WebGLRenderTarget, deltaTime: number, stencilTest: boolean) {

        const materialsNotRenderer: Object3D[] = [];
        this.scene.traverse(function (object) {
            if (object.visible === true) {
                if (object instanceof Mesh && object.material) {
                    if (object.material instanceof MeshPhysicalMaterial && !(object.material instanceof GemMaterial) && object.material.transparent) {
                        materialsNotRenderer.push(object);
                        object.visible = false;
                    }
                }
                if (object instanceof Line || object instanceof LineLoop || object instanceof LineSegments || object instanceof Points) {
                    materialsNotRenderer.push(object);
                    object.visible = false;
                }
                if (object.userData.ambientOcclusion === false) {
                    materialsNotRenderer.push(object);
                    object.visible = false;
                }
            }
        });


        const scene = this.scene;
        const camera = this.camera;
        const selection = this.selection;
        const mask = camera.layers.mask;
        const background = scene.background;
        const shadowMapAutoUpdate = renderer.shadowMap.autoUpdate;
        const renderTarget = this.renderToScreen ? null : inputBuffer;

        if (selection !== null) {

            camera.layers.set(selection.getLayer());

        }

        if (this.skipShadowMapUpdate) {

            renderer.shadowMap.autoUpdate = false;

        }

        if (this.ignoreBackground || this.clearPass.overrideClearColor !== null) {

            scene.background = null;

        }

        if (this.clearPass.enabled) {

            this.clearPass.render(renderer, inputBuffer, inputBuffer);

        }

        renderer.setRenderTarget(renderTarget);

        if (this.overrideMaterialManager !== null) {

            (<any>this.overrideMaterialManager).render(renderer, scene, camera);

        } else {

            renderer.render(scene, camera);

        }

        // Restore original values.
        camera.layers.mask = mask;
        scene.background = background;
        renderer.shadowMap.autoUpdate = shadowMapAutoUpdate;



        for (let i = 0; i < materialsNotRenderer.length; i++)
            materialsNotRenderer[i].visible = true;

    }

}