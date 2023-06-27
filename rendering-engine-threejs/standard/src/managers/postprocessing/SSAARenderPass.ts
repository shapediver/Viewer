import { ClearPass, Pass } from 'postprocessing';
import {
  AddEquation,
  BufferAttribute,
  BufferGeometry,
  Camera,
  Color,
  CustomBlending,
  HalfFloatType,
  Mesh,
  OneFactor,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SrcAlphaFactor,
  SRGBColorSpace,
  UniformsUtils,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three';
import { CopyShader } from './utils/CopyShader';
import { FullScreenQuad } from './utils/FullScreenQuad';
import { CopyMaterial } from './utils/CopyMaterial';

let geometry: BufferGeometry | null = null;

/**
 * Returns a shared fullscreen triangle.
 *
 * The screen size is 2x2 units (NDC). A triangle needs to be 4x4 units to fill the screen.
 *
 * @private
 * @return {BufferGeometry} The fullscreen geometry.
 */

const getFullscreenTriangle = () =>  {

	if(geometry === null) {

		const vertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
		const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);
		geometry = new BufferGeometry();

			geometry.setAttribute("position", new BufferAttribute(vertices, 3));
			geometry.setAttribute("uv", new BufferAttribute(uvs, 2));


	}

	return geometry;

}

/**
*
* Supersample Anti-Aliasing Render Pass
*
* This manual approach to SSAA re-renders the scene once for each sample with camera jitter and accumulates the results.
*
* References: https://en.wikipedia.org/wiki/Supersampling
*
* original implementation from three.js@0.152.2 was modified to work with the postprocessing library
*
*/
export class SSAARenderPass extends Pass {
  // #region Properties (9)

  private readonly _clearPass: ClearPass;
  private readonly _copyUniforms: any;
  private readonly _fsQuad: FullScreenQuad;
  private readonly _fullScreen: Mesh;
  private readonly _sampleRenderTarget: WebGLRenderTarget;
  private readonly _ssaaCopyMaterial: ShaderMaterial;

  private _clearAlpha: number | undefined;
  private _clearColor: Color = new Color();
  private _oldClearColor: Color = new Color();
  private _sampleLevel: number = 4;
  private _unbiased: boolean = true;
  private _copyMaterial: CopyMaterial;

  // #endregion Properties (9)

  // #region Constructors (1)

  constructor(scene: Scene, camera: Camera) {
    super("SSAARenderPass", scene, camera);

    this.needsSwap = false;

    this._sampleRenderTarget = new WebGLRenderTarget(1, 1, {
      type: HalfFloatType,
    });
    this._sampleRenderTarget.texture.name = "SSAARender.Target";
    this._sampleRenderTarget.texture.colorSpace = SRGBColorSpace;

    const copyShader = CopyShader;
    this._copyUniforms = UniformsUtils.clone(copyShader.uniforms);

    // Create a copy material to render the ssaa sample render target to.
    this._ssaaCopyMaterial = new ShaderMaterial({
      uniforms: this._copyUniforms,
      vertexShader: copyShader.vertexShader,
      fragmentShader: copyShader.fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,

      // do not use AdditiveBlending because it mixes the alpha channel instead of adding
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendDst: OneFactor,
      blendDstAlpha: OneFactor,
      blendSrc: SrcAlphaFactor,
      blendSrcAlpha: OneFactor,
    });
    this._fsQuad = new FullScreenQuad(this._ssaaCopyMaterial);

    // create a second copy material to render the final results to
    this._copyMaterial = new CopyMaterial();
    this._fullScreen = new Mesh(getFullscreenTriangle(), this._copyMaterial);
    this._fullScreen.frustumCulled = false;

    // clear pass for color and depth
    this._clearPass = new ClearPass(true, true, false);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (6)

  public set mainCamera(value: Camera) {
    this.camera = value;
  }

  public set mainScene(value: Scene) {
    this.scene = value;
  }

  public get renderToScreen() {
    return super.renderToScreen;
  }

  public set renderToScreen(value) {
    super.renderToScreen = value;
  }

  public get sampleLevel() {
    return this._sampleLevel;
  }

  /**
   * specified as n, where the number of samples is 2^n, so sampleLevel = 4, is 2^4 samples, 16.
   */
  public set sampleLevel(value: number) {
    this._sampleLevel = value;
  }

  /**
   * to cancel out rounding errors
   */
  public set unbiased(value: boolean) {
    this._unbiased = value;
  }

  // #endregion Public Accessors (6)

  // #region Public Methods (3)

  public dispose() {
    this._sampleRenderTarget.dispose();
    this._ssaaCopyMaterial.dispose();
    this._fsQuad.dispose();
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
  public render(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, outputBuffer: WebGLRenderTarget, deltaTime: undefined, stencilTest: undefined) {
    // set clear color / clear alpha / color space from the current renderer
    this._clearColor = renderer
      .getClearColor(new Color())
      .clone()
      .convertSRGBToLinear();
    this._clearAlpha = renderer.getClearAlpha();
    this._sampleRenderTarget.texture.colorSpace = renderer.outputColorSpace;

    const jitterOffsets = _JitterVectors[Math.max(0, Math.min(this._sampleLevel, 5))];

    // save the original auto clear and set to false
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;

    // save the original clear color and alpha
    renderer.getClearColor(this._oldClearColor);
    const oldClearAlpha = renderer.getClearAlpha();

    const baseSampleWeight = 1.0 / jitterOffsets.length;
    const roundingRange = 1 / 32;
    this._copyUniforms["tDiffuse"].value = this._sampleRenderTarget.texture;

    const viewOffset = {
      fullWidth: inputBuffer.width,
      fullHeight: inputBuffer.height,
      offsetX: 0,
      offsetY: 0,
      width: inputBuffer.width,
      height: inputBuffer.height,
    };

    const originalViewOffset = Object.assign(
      {},
      (<PerspectiveCamera | OrthographicCamera>this.camera).view
    );

    if (originalViewOffset.enabled)
      Object.assign(viewOffset, originalViewOffset);

    // render the scene multiple times, each slightly jitter offset from the last and accumulate the results.
    for (let i = 0; i < jitterOffsets.length; i++) {
      const jitterOffset = jitterOffsets[i];

      if ((<PerspectiveCamera | OrthographicCamera>this.camera).setViewOffset) {
        (<PerspectiveCamera | OrthographicCamera>this.camera).setViewOffset(
          viewOffset.fullWidth,
          viewOffset.fullHeight,

          viewOffset.offsetX + jitterOffset[0] * 0.0625,
          viewOffset.offsetY + jitterOffset[1] * 0.0625, // 0.0625 = 1 / 16

          viewOffset.width,
          viewOffset.height
        );
      }

      let sampleWeight = baseSampleWeight;

      if (this._unbiased) {
        // the theory is that equal weights for each sample lead to an accumulation of rounding errors.
        // The following equation varies the sampleWeight per sample so that it is uniformly distributed
        // across a range of values whose rounding errors cancel each other out.

        const uniformCenteredDistribution =
          -0.5 + (i + 0.5) / jitterOffsets.length;
        sampleWeight += roundingRange * uniformCenteredDistribution;
      }

      renderer.setClearColor(this._clearColor, this._clearAlpha);
      renderer.setRenderTarget(this._sampleRenderTarget);
      renderer.clear();
      renderer.render(this.scene, this.camera);

      renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);

      if (i === 0) {
        renderer.setClearColor(0x000000, 0.0);
        renderer.clear();
      }

      // set the weight of the current samples in the ssaaCopyMaterial
      this._copyUniforms["opacity"].value = sampleWeight;

      // render the sampleRenderTarget to fullscreen
      this._fsQuad.render(renderer);
    }

    // clear color and depth
    this._clearPass.render(renderer, inputBuffer, inputBuffer);

    // render to the final result to fullscreen
    this._copyMaterial.uniforms.inputBuffer.value = outputBuffer.texture;
    this._copyMaterial.uniforms.opacity.value = 1;
    renderer.setRenderTarget(this.renderToScreen ? null : inputBuffer);

    this.scene.add(this._fullScreen);
    renderer.render(this.scene, this.camera);
		this.scene.remove(this._fullScreen);

    if ((<PerspectiveCamera | OrthographicCamera>this.camera).setViewOffset && originalViewOffset.enabled) {
      (<PerspectiveCamera | OrthographicCamera>this.camera).setViewOffset(
        originalViewOffset.fullWidth,
        originalViewOffset.fullHeight,

        originalViewOffset.offsetX,
        originalViewOffset.offsetY,

        originalViewOffset.width,
        originalViewOffset.height
      );
    } else if ((<PerspectiveCamera | OrthographicCamera>this.camera).clearViewOffset) {
      (<PerspectiveCamera | OrthographicCamera>this.camera).clearViewOffset();
    }

    renderer.autoClear = autoClear;
    renderer.setClearColor(this._oldClearColor, oldClearAlpha);
  }

  public setSize(width: number, height: number) {
    this._sampleRenderTarget.setSize(width, height);
  }

  // #endregion Public Methods (3)
}

const _JitterVectors = [
  [
    [0, 0]
  ],
  [
    [4, 4], [- 4, - 4]
  ],
  [
    [- 2, - 6], [6, - 2], [- 6, 2], [2, 6]
  ],
  [
    [1, - 3], [- 1, 3], [5, 1], [- 3, - 5],
    [- 5, 5], [- 7, - 1], [3, 7], [7, - 7]
  ],
  [
    [1, 1], [- 1, - 3], [- 3, 2], [4, - 1],
    [- 5, - 2], [2, 5], [5, 3], [3, - 5],
    [- 2, 6], [0, - 7], [- 4, - 6], [- 6, 4],
    [- 8, 0], [7, - 4], [6, 7], [- 7, - 8]
  ],
  [
    [- 4, - 7], [- 7, - 5], [- 3, - 5], [- 5, - 4],
    [- 1, - 4], [- 2, - 2], [- 6, - 1], [- 4, 0],
    [- 7, 1], [- 1, 2], [- 6, 3], [- 3, 3],
    [- 7, 6], [- 3, 6], [- 5, 7], [- 1, 7],
    [5, - 7], [1, - 6], [6, - 5], [4, - 4],
    [2, - 3], [7, - 2], [1, - 1], [4, - 1],
    [2, 1], [6, 2], [0, 4], [4, 4],
    [2, 5], [7, 5], [5, 6], [3, 7]
  ]
];