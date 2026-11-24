import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const accumulateFragmentShader = /* glsl */ `
uniform sampler2D tFrame;
uniform sampler2D tAccumulation;
uniform float weight;
varying vec2 vUv;

vec3 sRGBToLinearColor(vec3 c) {
	return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

void main() {
	vec4 frame = texture2D(tFrame, vUv);
#ifdef LINEAR_ACCUMULATION
	frame.rgb = sRGBToLinearColor(frame.rgb);
#endif
	if (weight >= 1.0) {
		gl_FragColor = frame;
	} else {
		gl_FragColor = mix(texture2D(tAccumulation, vUv), frame, weight);
	}
}
`;

const outputFragmentShader = /* glsl */ `
uniform sampler2D tAccumulation;
varying vec2 vUv;

vec3 linearToSRGBColor(vec3 c) {
	return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
	vec4 color = texture2D(tAccumulation, vUv);
#ifdef LINEAR_ACCUMULATION
	color.rgb = linearToSRGBColor(max(color.rgb, vec3(0.0)));
#endif
	gl_FragColor = color;
}
`;

/**
 * Averages jittered frames of a still view on the canvas.
 *
 * Each accumulated frame is drawn to the canvas as usual (with or without
 * post-processing), then copied from the canvas into a texture and blended
 * into a running mean. From the second frame on, the mean is drawn back to
 * the canvas. The first frame is not jittered and not redrawn, so it stays
 * exactly the frame the viewer drew before this class existed.
 *
 * The mean is kept in linear colour when the device can render to half
 * floats, otherwise in the display colour of the canvas.
 *
 * With accumulationMode "hdr" the post-processing averages the frames before
 * bloom and tone mapping; this class then only jitters the camera, counts the
 * frames and keeps the last canvas image for {@link present}.
 */
export class StillFrameAccumulator {
	// #region Properties (11)

	private readonly _accumulateMaterial: THREE.ShaderMaterial;
	private readonly _camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	private readonly _geometry: THREE.BufferGeometry;
	private readonly _mesh: THREE.Mesh;
	private readonly _outputMaterial: THREE.ShaderMaterial;
	private readonly _targetType: THREE.TextureDataType;

	private _aspect?: number;
	private _count = 0;
	private _frameTexture?: THREE.FramebufferTexture;
	private _height = 0;
	private _jittered = false;
	private _targets?: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
	private _width = 0;

	// #endregion Properties (11)

	// #region Constructors (1)

	constructor(private readonly _renderer: THREE.WebGLRenderer) {
		const extensions = _renderer.extensions;
		const linear =
			extensions.has("EXT_color_buffer_float") ||
			extensions.has("EXT_color_buffer_half_float");
		const defines: {[key: string]: string} = linear
			? {LINEAR_ACCUMULATION: ""}
			: {};

		this._accumulateMaterial = new THREE.ShaderMaterial({
			defines,
			uniforms: {
				tFrame: {value: null},
				tAccumulation: {value: null},
				weight: {value: 1},
			},
			vertexShader,
			fragmentShader: accumulateFragmentShader,
			blending: THREE.NoBlending,
			depthTest: false,
			depthWrite: false,
			toneMapped: false,
		});
		this._outputMaterial = new THREE.ShaderMaterial({
			defines,
			uniforms: {tAccumulation: {value: null}},
			vertexShader,
			fragmentShader: outputFragmentShader,
			blending: THREE.NoBlending,
			depthTest: false,
			depthWrite: false,
			toneMapped: false,
		});

		this._geometry = new THREE.BufferGeometry();
		this._geometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(
				[-1, 3, 0, -1, -1, 0, 3, -1, 0],
				3,
			),
		);
		this._geometry.setAttribute(
			"uv",
			new THREE.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2),
		);
		this._mesh = new THREE.Mesh(this._geometry, this._accumulateMaterial);
		this._mesh.frustumCulled = false;

		this._targetType = linear
			? THREE.HalfFloatType
			: THREE.UnsignedByteType;
	}

	// #endregion Constructors (1)

	// #region Public Accessors (1)

	/** The number of frames in the current mean. */
	public get count(): number {
		return this._count;
	}

	// #endregion Public Accessors (1)

	// #region Public Methods (6)

	/**
	 * Jitters the camera by a sub-pixel offset for the next accumulated
	 * frame. The first frame of a mean is not jittered.
	 * Call {@link endFrame} after drawing the frame.
	 */
	public beginFrame(camera: THREE.Camera): void {
		const size = this.drawingBufferSize();
		if (size.x !== this._width || size.y !== this._height) this.reset();

		this._jittered = false;
		if (this._count === 0) return;
		const viewCamera = camera as
			| THREE.PerspectiveCamera
			| THREE.OrthographicCamera;
		if (!viewCamera.setViewOffset || viewCamera.view?.enabled) return;

		// Halton (2, 3), centred on the pixel
		const x = halton(this._count, 2) - 0.5;
		const y = halton(this._count, 3) - 0.5;
		// setViewOffset replaces the aspect of a perspective camera with the
		// ratio of the drawing buffer, and clearViewOffset does not restore it
		const perspective = viewCamera as THREE.PerspectiveCamera;
		this._aspect = perspective.isPerspectiveCamera
			? perspective.aspect
			: undefined;
		viewCamera.setViewOffset(size.x, size.y, x, y, size.x, size.y);
		if (this._aspect !== undefined) {
			perspective.aspect = this._aspect;
			perspective.updateProjectionMatrix();
		}
		this._jittered = true;
	}

	/** Removes the jitter of {@link beginFrame} from the camera. */
	public endJitter(camera: THREE.Camera): void {
		if (!this._jittered) return;
		this._jittered = false;
		const viewCamera = camera as
			| THREE.PerspectiveCamera
			| THREE.OrthographicCamera;
		viewCamera.clearViewOffset();
		if (this._aspect !== undefined) {
			(viewCamera as THREE.PerspectiveCamera).aspect = this._aspect;
			viewCamera.updateProjectionMatrix();
		}
		this._aspect = undefined;
	}

	/**
	 * The largest number of frames that still change the mean. The display
	 * colour fallback stores 8 bits, so later frames would be lost to rounding.
	 */
	public get maxFrames(): number {
		return this._targetType === THREE.HalfFloatType
			? Number.POSITIVE_INFINITY
			: 64;
	}

	public dispose(): void {
		this.reset();
		this._accumulateMaterial.dispose();
		this._outputMaterial.dispose();
		this._geometry.dispose();
	}

	/**
	 * Adds the frame that is now on the canvas to the mean and, from the
	 * second frame on, draws the mean to the canvas.
	 *
	 * With `meanOnCanvas`, the frames were averaged before they reached the
	 * canvas (in the HDR buffer of the post-processing). The canvas then
	 * already shows the mean: it is only kept for {@link present} and counted.
	 */
	public endFrame(camera: THREE.Camera, meanOnCanvas = false): void {
		this.endJitter(camera);

		const size = this.drawingBufferSize();
		if (!(size.x > 0) || !(size.y > 0)) return;
		this.ensureTargets(size.x, size.y);

		const renderer = this._renderer;
		const previousTarget = renderer.getRenderTarget();
		const autoClear = renderer.autoClear;
		renderer.autoClear = false;

		renderer.setRenderTarget(null);
		renderer.copyFramebufferToTexture(this._frameTexture!);

		const [read, write] = this._targets!;
		this._count++;
		const uniforms = this._accumulateMaterial.uniforms;
		uniforms.tFrame.value = this._frameTexture;
		uniforms.tAccumulation.value = read.texture;
		uniforms.weight.value = meanOnCanvas ? 1 : 1 / this._count;
		this._mesh.material = this._accumulateMaterial;
		renderer.setRenderTarget(write);
		renderer.render(this._mesh, this._camera);
		this._targets = [write, read];

		// The first frame, or a mean drawn by the post-processing, is
		// already on the canvas as drawn.
		if (this._count > 1 && !meanOnCanvas) this.drawToCanvas();

		renderer.setRenderTarget(previousTarget);
		renderer.autoClear = autoClear;
	}

	/**
	 * Sets the number of frames in the mean, for a mean that is averaged
	 * before the canvas (`meanOnCanvas`) and was restarted there.
	 */
	public setCount(count: number): void {
		this._count = Math.max(0, Math.floor(count));
	}

	/**
	 * Draws the current mean to the canvas.
	 * Returns false when there is no mean of at least two frames for the
	 * current canvas size; the canvas is then left alone.
	 */
	public present(): boolean {
		if (this._count < 2 || !this._targets) return false;
		const size = this.drawingBufferSize();
		if (size.x !== this._width || size.y !== this._height) return false;

		const renderer = this._renderer;
		const previousTarget = renderer.getRenderTarget();
		const autoClear = renderer.autoClear;
		renderer.autoClear = false;
		this.drawToCanvas();
		renderer.setRenderTarget(previousTarget);
		renderer.autoClear = autoClear;
		return true;
	}

	/** Starts a new mean with the next frame. */
	public restart(): void {
		this._count = 0;
	}

	/** Starts a new mean and releases the GPU memory. */
	public reset(): void {
		this._count = 0;
		this._frameTexture?.dispose();
		this._frameTexture = undefined;
		this._targets?.forEach((t) => t.dispose());
		this._targets = undefined;
		this._width = 0;
		this._height = 0;
	}

	// #endregion Public Methods (6)

	// #region Private Methods (3)

	private drawingBufferSize(): THREE.Vector2 {
		return this._renderer.getDrawingBufferSize(new THREE.Vector2());
	}

	private drawToCanvas(): void {
		this._outputMaterial.uniforms.tAccumulation.value =
			this._targets![0].texture;
		this._mesh.material = this._outputMaterial;
		this._renderer.setRenderTarget(null);
		this._renderer.render(this._mesh, this._camera);
	}

	private ensureTargets(width: number, height: number): void {
		if (
			this._targets &&
			this._frameTexture &&
			this._width === width &&
			this._height === height
		)
			return;

		this.reset();
		this._width = width;
		this._height = height;
		this._frameTexture = new THREE.FramebufferTexture(width, height);
		const options = {
			type: this._targetType,
			depthBuffer: false,
			stencilBuffer: false,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			generateMipmaps: false,
		};
		this._targets = [
			new THREE.WebGLRenderTarget(width, height, options),
			new THREE.WebGLRenderTarget(width, height, options),
		];
	}

	// #endregion Private Methods (3)
}

/** Element `index` (1-based) of the Halton sequence of `base`, in [0, 1). */
const halton = (index: number, base: number): number => {
	let result = 0;
	let fraction = 1 / base;
	let i = index;
	while (i > 0) {
		result += fraction * (i % base);
		i = Math.floor(i / base);
		fraction /= base;
	}
	return result;
};
