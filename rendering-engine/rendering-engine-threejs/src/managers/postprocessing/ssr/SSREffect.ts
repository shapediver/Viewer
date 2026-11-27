import {CopyPass, Effect, Pass} from "postprocessing";
import * as THREE from "three";

/**
 * The uniforms the materials read the screen space reflections from.
 * They are owned by the material loader.
 */
export interface IScreenSSRUniforms {
	/** the scene color of the previous frame, before tone mapping */
	sdvSSRColorMap: {value: THREE.Texture | null};
	/** the scene depth of the previous frame */
	sdvSSRDepthMap: {value: THREE.Texture | null};
	/** from the view space of this frame to the clip space of the previous frame */
	sdvSSRViewToPrevClip: {value: THREE.Matrix4};
	/** from the view space of this frame to the view space of the previous frame */
	sdvSSRViewToPrevView: {value: THREE.Matrix4};
	/** near, far and 1 for an orthographic camera of the previous frame */
	sdvSSRPrevCamera: {value: THREE.Vector3};
	/** intensity, maximum roughness, maximum distance, thickness */
	sdvSSRParams: {value: THREE.Vector4};
	/** number of ray march steps */
	sdvSSRSteps: {value: number};
	/** 1 once a previous frame of the current size exists */
	sdvSSRValid: {value: number};
	/** offset of the per pixel noise, changes every frame */
	sdvSSRNoise: {value: number};
}

export interface ISSREffectOptions {
	intensity: number;
	maxRoughness: number;
	steps: number;
	/** in world units */
	maxDistance: number;
	/** in world units */
	thickness: number;
	/**
	 * "radiance": the hit replaces the environment radiance before the BRDF.
	 * "specular": the hit replaces the whole indirect specular light,
	 * weighted like the reference renderer (see MaterialLoader).
	 */
	compositing: "radiance" | "specular";
}

/**
 * Screen space reflections that are applied inside the material shading.
 *
 * The materials march the reflected ray through the depth of the previous
 * frame and take the color of the previous frame where it hits. The hit
 * replaces the environment reflection, so a polished metal reflects the
 * neighbouring geometry instead of the environment behind it. Rays that hit
 * nothing keep the environment reflection.
 *
 * The previous frame is reprojected with its own camera, so a static scene
 * stays correct while the camera moves. This class is never composited by an
 * effect pass: it only holds the targets and the options. The passes are
 * created by {@link createPasses}.
 */
export class SSREffect extends Effect {
	// #region Properties (5)

	private readonly _prevProjection = new THREE.Matrix4();
	private readonly _prevView = new THREE.Matrix4();

	private _colorTarget?: THREE.WebGLRenderTarget;
	private _copyPass?: CopyPass;
	private _depthTexture: THREE.Texture | null = null;
	private _hasPrevious = false;
	private _sourceColorSpace?: string;
	private _lastFrameValid = false;
	private _prepared: "none" | "valid" | "invalid" = "none";
	private _prevCamera = new THREE.Vector3(0.1, 1000, 0);

	// #endregion Properties (5)

	// #region Constructors (1)

	constructor(public readonly options: ISSREffectOptions) {
		// never composited, the materials apply the reflections
		super(
			"SSREffect",
			"void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) { outputColor = inputColor; }",
		);
	}

	// #endregion Constructors (1)

	// #region Public Methods (5)

	/**
	 * The pass before the scene is rendered sets the uniforms, the pass after
	 * it keeps the color, the depth and the camera for the next frame.
	 */
	public createPasses(uniforms: IScreenSSRUniforms): {
		before: Pass;
		after: Pass;
	} {
		return {
			before: new SSRPreparePass(this, uniforms),
			after: new SSRCapturePass(this, uniforms),
		};
	}

	/** Whether the last rendered frame had a previous frame to reflect. */
	public get lastFrameValid(): boolean {
		return this._lastFrameValid;
	}

	/**
	 * Whether a frame was prepared since the last call, and whether it had a
	 * previous frame to reflect. Resets the state.
	 */
	public takeFrameState(): "none" | "valid" | "invalid" {
		const state = this._prepared;
		this._prepared = "none";
		return state;
	}

	public dispose(): void {
		this._colorTarget?.dispose();
		this._colorTarget = undefined;
		this._copyPass?.dispose();
		this._copyPass = undefined;
		this._hasPrevious = false;
		// the depth texture belongs to the composer: Effect.dispose disposes
		// every texture property, which would break the composer's depth
		this._depthTexture = null;
		super.dispose();
	}

	/** Sets the uniforms of this frame, before the scene is rendered. */
	public prepare(camera: THREE.Camera, uniforms: IScreenSSRUniforms): void {
		camera.updateMatrixWorld();
		uniforms.sdvSSRViewToPrevView.value.multiplyMatrices(
			this._prevView,
			camera.matrixWorld,
		);
		uniforms.sdvSSRViewToPrevClip.value.multiplyMatrices(
			this._prevProjection,
			uniforms.sdvSSRViewToPrevView.value,
		);
		uniforms.sdvSSRPrevCamera.value.copy(this._prevCamera);
		uniforms.sdvSSRParams.value.set(
			this.options.intensity,
			this.options.maxRoughness,
			this.options.maxDistance,
			this.options.thickness,
		);
		uniforms.sdvSSRSteps.value = this.options.steps;
		// Hand the textures to the materials only after the composer has
		// rendered into them once: three would set up a depth texture that
		// is first bound for sampling as a standalone texture of zero size,
		// and the composer's depth target would then use that empty texture.
		const valid =
			this._hasPrevious &&
			this._colorTarget !== undefined &&
			this._depthTexture !== null;
		uniforms.sdvSSRColorMap.value = valid
			? this._colorTarget!.texture
			: null;
		uniforms.sdvSSRDepthMap.value = valid ? this._depthTexture : null;
		uniforms.sdvSSRValid.value = valid ? 1 : 0;
		this._lastFrameValid = valid;
		this._prepared = valid ? "valid" : "invalid";
		// a golden ratio sequence, so accumulated frames sample other steps
		uniforms.sdvSSRNoise.value =
			(uniforms.sdvSSRNoise.value + 0.618034) % 1;
	}

	/** Keeps the scene color, the depth and the camera of this frame. */
	public capture(
		renderer: THREE.WebGLRenderer,
		inputBuffer: THREE.WebGLRenderTarget,
		camera: THREE.Camera,
		renderToScreen: boolean,
	): void {
		const {width, height} = inputBuffer;
		const type = inputBuffer.texture.type;
		const colorSpace = inputBuffer.texture.colorSpace;
		if (
			!this._colorTarget ||
			this._colorTarget.texture.type !== type ||
			// CopyPass.initialize may change the target's colour space, so
			// compare with the colour space of the buffer it was made for
			this._sourceColorSpace !== colorSpace ||
			this._colorTarget.width !== width ||
			this._colorTarget.height !== height
		) {
			this._colorTarget?.dispose();
			this._colorTarget = new THREE.WebGLRenderTarget(width, height, {
				type,
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				depthBuffer: false,
				stencilBuffer: false,
			});
			// an 8-bit composer buffer stores sRGB, keep the same precision
			this._colorTarget.texture.colorSpace = colorSpace;
			this._sourceColorSpace = colorSpace;
			this._colorTarget.texture.name = "SSREffect.Color";
			this._copyPass?.dispose();
			this._copyPass = new CopyPass(this._colorTarget, false);
			// high precision sampling of half-float input (mobile)
			this._copyPass.initialize(renderer, false, type);
			this._hasPrevious = false;
		}
		const copyPass = this._copyPass!;
		copyPass.renderToScreen = false;
		copyPass.render(renderer, inputBuffer, null as never, 0, false);
		// the last pass of the composer has to show the image
		if (renderToScreen) {
			copyPass.renderToScreen = true;
			copyPass.render(renderer, inputBuffer, null as never, 0, false);
			copyPass.renderToScreen = false;
		}

		this._prevProjection.copy(camera.projectionMatrix);
		this._prevView.copy(camera.matrixWorldInverse);
		const ortho = (camera as THREE.OrthographicCamera).isOrthographicCamera;
		const perspective = camera as THREE.PerspectiveCamera;
		this._prevCamera.set(perspective.near, perspective.far, ortho ? 1 : 0);
		this._hasPrevious = this._depthTexture !== null;
	}

	public setDepthTexture(depthTexture: THREE.Texture): void {
		this._depthTexture = depthTexture;
	}

	public setSize(): void {
		// the targets follow the composer buffers in capture
		this._hasPrevious = false;
	}

	/**
	 * Forgets the previous frame, for example after a change of the scene:
	 * the next frame is then drawn twice instead of reflecting the old scene.
	 */
	public invalidate(): void {
		this._hasPrevious = false;
	}

	// #endregion Public Methods (5)
}

/** Sets the uniforms of the materials before the scene is rendered. */
class SSRPreparePass extends Pass {
	private _camera?: THREE.Camera;

	constructor(
		private readonly _effect: SSREffect,
		private readonly _uniforms: IScreenSSRUniforms,
	) {
		super("SSRPreparePass");
		this.needsSwap = false;
	}

	set mainCamera(value: THREE.Camera) {
		this._camera = value;
	}

	render() {
		if (this._camera) this._effect.prepare(this._camera, this._uniforms);
	}
}

/**
 * Keeps the scene color and depth after the scene is rendered. The depth is
 * the composer's stable depth texture: it is copied right after the render
 * pass, so while the next frame is rendered it still holds this frame.
 */
class SSRCapturePass extends Pass {
	private _camera?: THREE.Camera;

	constructor(
		private readonly _effect: SSREffect,
		private readonly _uniforms: IScreenSSRUniforms,
	) {
		super("SSRCapturePass");
		this.needsSwap = false;
		this.needsDepthTexture = true;
	}

	set mainCamera(value: THREE.Camera) {
		this._camera = value;
	}

	setDepthTexture(depthTexture: THREE.Texture) {
		this._effect.setDepthTexture(depthTexture);
	}

	render(
		renderer: THREE.WebGLRenderer,
		inputBuffer: THREE.WebGLRenderTarget,
	) {
		if (!this._camera) return;
		// the materials must not read the target while it is written
		this._uniforms.sdvSSRValid.value = 0;
		this._effect.capture(
			renderer,
			inputBuffer,
			this._camera,
			this.renderToScreen,
		);
	}
}
