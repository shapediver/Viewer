import * as THREE from 'three'
import { SystemInfo } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { EffectComposer } from '../three/postprocessing/EffectComposer.js'
import { RenderPass } from '../three/postprocessing/RenderPass.js'
import { SAOPass } from '../three/postprocessing/SAOPass.js'
import { SSAARenderPass } from '../three/postprocessing/SSAARenderPass.js'
import { RenderingEngine } from '../RenderingEngine'
import { IManager } from '../interfaces/IManager.js'

export class BeautyRenderingManager implements IManager {
    // #region Properties (12)

    private readonly _systemInfo: SystemInfo = <SystemInfo>container.resolve(SystemInfo);

    private _beautyRenderingActive: boolean = false;
    private _beautyRenderingDurationActive: number = 0;
    private _beautyRenderingTimeout: NodeJS.Timeout | null = null;
    private _effectComposer!: EffectComposer;
    private _lastTime: number = 0;
    private _lightSizeUVEnd = 0.15;
    private _lightSizeUVStart = 0.025;
    private _renderPass!: RenderPass;
    private _saoPass!: SAOPass;
    private _ssaaPass!: SSAARenderPass;

    // #endregion Properties (12)

    // #region Constructors (1)

    constructor(
        private readonly _renderingEngine: RenderingEngine
    ) {}

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

    // #region Public Methods (7)

    public activateBeautyRenderShaders() {
        if(this._systemInfo.isMobileDevice) {
            this._renderingEngine.renderer.shadowMap.type = THREE.PCFShadowMap;
            this._renderingEngine.renderer.shadowMap.needsUpdate = true;
            this._renderingEngine.materialLoader.updateMaterials();
        }
    }

    public deactivateBeautyRenderShaders() {
        this._beautyRenderingTimeout = null;
        this._beautyRenderingActive = false;
        this._beautyRenderingDurationActive = 0;
        if(this._systemInfo.isMobileDevice) {
            this._renderingEngine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this._renderingEngine.renderer.shadowMap.needsUpdate = true;
            this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVStart, 0.1);
            this._renderingEngine.materialLoader.updateMaterials();
        }
    }

    public init(): void {
        const tempCamera = new THREE.PerspectiveCamera();
        this._effectComposer = new EffectComposer(this._renderingEngine.renderer);
        this._renderPass = new RenderPass(this._renderingEngine.scene, tempCamera);
        //this._effectComposer.addPass(this._renderPass);

        this._ssaaPass = new SSAARenderPass(this._renderingEngine.scene, tempCamera, this._renderingEngine.renderer.getClearColor(new THREE.Color()), this._renderingEngine.renderer.getClearAlpha());
        this._effectComposer.addPass(this._ssaaPass);

        this._saoPass = new SAOPass(this._renderingEngine.scene, tempCamera, false, true);

        const saoRenderFunction = this._saoPass.render.bind(this._saoPass);

        this._saoPass.render = (renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, deltaTime: number, maskActive: boolean) => {
            const materialsNotRenderer: THREE.Object3D[] = [];
            this._renderingEngine.scene.traverse(function (object) {
                if (object instanceof THREE.Mesh && object.material) {
                    if (object.material instanceof THREE.MeshStandardMaterial && object.material.transparent && object.visible) {
                        materialsNotRenderer.push(object);
                        object.visible = false;
                    }
                }
                if(object.userData.ambientOcclusion === false) {
                    materialsNotRenderer.push(object);
                    object.visible = false;
                }
            });
            saoRenderFunction(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
            for (let i = 0; i < materialsNotRenderer.length; i++)
                materialsNotRenderer[i].visible = true;
        }

        this._effectComposer.addPass(this._saoPass);
        this._saoPass.params.output = 0;
        this._saoPass.params.saoBias = 0.5;
        this._saoPass.params.saoIntensity = 0.0015;
        this._saoPass.params.saoScale = 4;
        this._saoPass.params.saoKernelRadius = 100;
        this._saoPass.params.saoMinResolution = 0.001;
        this._saoPass.params.saoBlur = true;
        this._saoPass.params.saoBlurRadius = 4;
        this._saoPass.params.saoBlurStdDev = 4;
        this._saoPass.params.saoBlurDepthCutoff = 0.01;

        this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVEnd, 1.0);

        this._renderingEngine.renderer.shadowMap.type = THREE.PCFShadowMap;
        this._renderingEngine.renderer.shadowMap.needsUpdate = true;
        this._renderingEngine.materialLoader.updateMaterials();
    }

    public render(time: number, camera: THREE.Camera, width: number, height: number) {
        const percentage = this.setShaderProperties();

        if((this._renderingEngine.ambientOcclusion && !(this._systemInfo.isIOSDevice || this._systemInfo.isMobileDevice || this._systemInfo.runningInSafari))) {
            this._ssaaPass.clearColor = this._renderingEngine.renderer.getClearColor(new THREE.Color());
            this._ssaaPass.clearAlpha = this._renderingEngine.renderer.getClearAlpha();
    
            const saoIntensity = this._saoPass.params.saoIntensity;
            this._saoPass.params.saoIntensity = percentage * saoIntensity;
            // if passes changed, adapt https://shapediver.atlassian.net/browse/SS-2954
            this._renderPass.camera = camera;
            this._saoPass.camera = camera;
            this._ssaaPass.camera = camera;
            this._saoPass.setSize(width, height)
            this._effectComposer.setSize(width, height);
            this._effectComposer.render(time);
            this._saoPass.params.saoIntensity = saoIntensity;
        } else {
            this._renderingEngine.renderer.render(this._renderingEngine.scene, camera)
        }
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

    // #endregion Public Methods (7)

    // #region Private Methods (1)

    private setShaderProperties() {
        const deltaTime = Math.min(this._beautyRenderingDurationActive, this._renderingEngine.beautyRenderBlendingDuration)
        const percentage = deltaTime / this._renderingEngine.beautyRenderBlendingDuration;

        if(this._systemInfo.isMobileDevice) {
            if (percentage < 0.25) {
                const percentageMapped = percentage / 0.25;
                this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVStart, percentageMapped);
    
            } else {
                const percentageMapped = (percentage - 0.25) / (1 - 0.25);
                // this._lightSizeUVStart -> this._lightSizeUVEnd
                this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVStart + (this._lightSizeUVEnd - this._lightSizeUVStart) * percentageMapped, 1.0);
            }
        }
        return percentage;
    }

    // #endregion Private Methods (1)
}