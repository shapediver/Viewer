import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';
import { RenderingEngine } from './RenderingEngine';

export class BeautyRenderer {
    // #region Properties (11)

    //private readonly _postProcessingEngine: PostProcessingEngine;
    private readonly _effectComposer: EffectComposer;

    private _beautyRenderingActive: boolean = false;
    private _beautyRenderingDurationActive: number = 0;
    private _beautyRenderingTimeout: NodeJS.Timeout | null = null;
    private _initialized = false;
    private _lastTime: number = 0;
    private _lightSizeUVEnd = 0.15;
    private _lightSizeUVStart = 0.025;
    private _renderPass!: RenderPass;
    private _saoPass!: SAOPass;
    private _ssaaPass!: SSAARenderPass;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(
        private readonly _renderingEngine: RenderingEngine,
        private readonly _renderer: THREE.WebGLRenderer,
        private readonly _scene: THREE.Scene
    ) {
        //this._postProcessingEngine = new PostProcessingEngine()
        this._effectComposer = new EffectComposer(this._renderer);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (6)

    /**
     * Getter beautyRenderingActive
     * @return {boolean }
     */
    public get beautyRenderingActive(): boolean {
        return this._beautyRenderingActive;
    }

    /**
     * Setter beautyRenderingActive
     * @param {boolean } value
     */
    public set beautyRenderingActive(value: boolean) {
        this._beautyRenderingActive = value;
    }

    /**
     * Getter beautyRenderingDurationActive
     * @return {number }
     */
    public get beautyRenderingDurationActive(): number {
        return this._beautyRenderingDurationActive;
    }

    /**
     * Setter beautyRenderingDurationActive
     * @param {number } value
     */
    public set beautyRenderingDurationActive(value: number) {
        this._beautyRenderingDurationActive = value;
    }

    /**
     * Getter beautyRenderingTimeout
     * @return {NodeJS.Timeout | null}
     */
    public get beautyRenderingTimeout(): NodeJS.Timeout | null {
        return this._beautyRenderingTimeout;
    }

    /**
     * Setter beautyRenderingTimeout
     * @param {NodeJS.Timeout | null} value
     */
    public set beautyRenderingTimeout(value: NodeJS.Timeout | null) {
        this._beautyRenderingTimeout = value;
    }

    // #endregion Public Accessors (6)

    // #region Public Methods (6)

    public activateBeautyRenderShaders() {
        this._renderer.shadowMap.type = THREE.PCFShadowMap;
        this._renderer.shadowMap.needsUpdate = true;
        this._renderingEngine.materialLoader.updateMaterials();
    }

    public deactivateBeautyRenderShaders() {
        this._beautyRenderingTimeout = null;
        this._beautyRenderingActive = false;
        this._beautyRenderingDurationActive = 0;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this._renderer.shadowMap.needsUpdate = true;
        this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVStart, 0.1);
        this._renderingEngine.materialLoader.updateMaterials();
    }

    public initialize(camera: THREE.Camera, width: number, height: number) {
        this._renderPass = new RenderPass(this._scene, camera);
        //this._effectComposer.addPass(this._renderPass);

        this._ssaaPass = new SSAARenderPass(this._scene, camera, this._renderer.getClearColor(new THREE.Color()), this._renderer.getClearAlpha());
        this._effectComposer.addPass(this._ssaaPass);

        this._saoPass = new SAOPass(this._scene, camera, true, true);

        const saoRenderFunction = this._saoPass.render.bind(this._saoPass);

        this._saoPass.render = (renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, deltaTime: number, maskActive: boolean) => {
            const materialsNotRenderer: THREE.Mesh[] = [];
            this._scene.traverse(function (object) {
                if (object instanceof THREE.Mesh && object.material) {
                    if (object.material instanceof THREE.MeshStandardMaterial && object.material.transparent && object.visible) {
                        materialsNotRenderer.push(object);
                        object.visible = false;
                    }
                }
            });
            saoRenderFunction(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
            for (let i = 0; i < materialsNotRenderer.length; i++)
                materialsNotRenderer[i].visible = true;
        }

        this._effectComposer.addPass(this._saoPass);
        this._saoPass.params.saoScale = 0.1;
        this._saoPass.params.saoIntensity = 0.0001;
        this._saoPass.params.saoKernelRadius = 8;
        this._saoPass.params.saoBlurStdDev = 25;
        this._saoPass.params.saoMinResolution = 0.001;

        (<any>window).saoPass = this._saoPass

        this._initialized = true;
    }

    public render(time: number, camera: THREE.Camera, width: number, height: number) {
        if (!this._initialized) this.initialize(camera, width, height);
        const percentage = this.setShaderProperties();

        const saoIntensity = this._saoPass.params.saoIntensity;
        this._saoPass.params.saoIntensity = percentage * saoIntensity;
        // TODO if passes changed, adapt
        this._renderPass.camera = camera;
        this._saoPass.camera = camera;
        this._ssaaPass.camera = camera;
        this._saoPass.setSize(width, height)
        this._effectComposer.setSize(width, height);
        this._effectComposer.render(time);
        this._saoPass.params.saoIntensity = saoIntensity;
    }

    public startBeautyRenderCountdown() {
        this._beautyRenderingTimeout = setTimeout(() => {
            this._beautyRenderingActive = true;
            this._beautyRenderingDurationActive = 0;
            this.activateBeautyRenderShaders();
        }, this._renderingEngine.beautyRenderDelay);
    }

    public stopBeautyRenderCountdown() {
        if (this.beautyRenderingTimeout)
            clearTimeout(this.beautyRenderingTimeout);
        this.deactivateBeautyRenderShaders();
    }

    // #endregion Public Methods (6)

    // #region Private Methods (1)

    private setShaderProperties() {
        const deltaTime = Math.min(this._beautyRenderingDurationActive, this._renderingEngine.beautyRenderBlendingDuration)
        const percentage = deltaTime / this._renderingEngine.beautyRenderBlendingDuration;

        if (percentage < 0.25) {
            const percentageMapped = percentage / 0.25;
            this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVStart, percentageMapped);

        } else {
            const percentageMapped = (percentage - 0.25) / (1 - 0.25);
            // this._lightSizeUVStart -> this._lightSizeUVEnd
            this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVStart + (this._lightSizeUVEnd - this._lightSizeUVStart) * percentageMapped, 1.0);
        }
        return percentage;
    }

    // #endregion Private Methods (1)
}