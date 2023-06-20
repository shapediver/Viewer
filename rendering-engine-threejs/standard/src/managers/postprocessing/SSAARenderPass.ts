
/**
 * A pass that renders a given scene into the input buffer or to screen.
 *
 * This pass uses a {@link ClearPass} to clear the target buffer.
 */

import { ClearPass, OverrideMaterialManager, Pass } from "postprocessing";
import { AddEquation, BufferGeometry, Camera, Color, CustomBlending, Float32BufferAttribute, HalfFloatType, Material, Mesh, OneFactor, OrthographicCamera, PerspectiveCamera, SRGBColorSpace, Scene, ShaderMaterial, SrcAlphaFactor, UniformsUtils, WebGLRenderTarget, WebGLRenderer } from "three";
const CopyShader = {

	name: 'CopyShader',

	uniforms: {

		'tDiffuse': { value: null },
		'opacity': { value: 1.0 }

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );
			gl_FragColor.a *= opacity;


		}`

};


// Helper for passes that need to fill the viewport with a single quad.

const _camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

// https://github.com/mrdoob/three.js/pull/21358

const _geometry = new BufferGeometry();
_geometry.setAttribute( 'position', new Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );
_geometry.setAttribute( 'uv', new Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );

class FullScreenQuad {
	_mesh: Mesh;

	constructor( material: Material ) {

		this._mesh = new Mesh( _geometry, material );

	}

	dispose() {

		this._mesh.geometry.dispose();

	}

	render( renderer: WebGLRenderer ) {

		renderer.render( this._mesh, _camera );

	}

	get material() {

		return this._mesh.material;

	}

	set material( value ) {

		this._mesh.material = value;

	}

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
export class SSAARenderPass extends Pass {
	clearPass: any;
	overrideMaterialManager: any;
	ignoreBackground: boolean;
	skipShadowMapUpdate: boolean;
	selection: any;
	copyMaterial: ShaderMaterial;
	sampleRenderTarget: WebGLRenderTarget;
	sampleLevel: number;
	unbiased: boolean;
	copyUniforms: any;
	fsQuad: any;
	renderTarget: any;
	private _oldClearColor: Color;
	clearColor: Color;
	clearAlpha: number | undefined;

	/**
	 * Constructs a new render pass.
	 *
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The camera to use to render the scene.
	 * @param {Material} [overrideMaterial=null] - An override material.
	 */

	constructor(scene: Scene, camera: Camera, clearColor: Color, clearAlpha: number, overrideMaterial = null) {

		super("RenderPass", scene, camera);

		this.needsSwap = true;

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

		// this.copyMaterial = new CopyMaterial();

		this.sampleRenderTarget = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
		this.sampleRenderTarget.texture.name = "SSAARender.Target";
		this.sampleRenderTarget.texture.colorSpace = SRGBColorSpace
		this.sampleLevel = 4; // specified as n, where the number of samples is 2^n, so sampleLevel = 4, is 2^4 samples, 16.
		this.unbiased = true;

		this.clearColor = (clearColor !== undefined) ? clearColor : new Color(0x000000);
		this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha : 0;
		this._oldClearColor = new Color();



		const copyShader = CopyShader;
		this.copyUniforms = UniformsUtils.clone(copyShader.uniforms);

		this.copyMaterial = new ShaderMaterial({
			uniforms: this.copyUniforms,
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
			blendSrcAlpha: OneFactor
		});

		this.fsQuad = new FullScreenQuad(this.copyMaterial);
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
		return (manager !== null) ? manager.material : null;

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

	getOverrideMaterial() {

		return this.overrideMaterial;

	}

	/**
	 * Sets the override material.
	 *
	 * @deprecated Use overrideMaterial instead.
	 * @return {Material} value - The material.
	 */

	setOverrideMaterial(value: Material) {

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

	getSelection() {

		return this.selection;

	}

	/**
	 * Sets the selection. Set to `null` to disable.
	 *
	 * @deprecated Use selection instead.
	 * @param {Selection} value - The selection.
	 */

	setSelection(value: any) {

		this.selection = value;

	}

	/**
	 * Indicates whether the scene background is disabled.
	 *
	 * @deprecated Use ignoreBackground instead.
	 * @return {Boolean} Whether the scene background is disabled.
	 */

	isBackgroundDisabled() {

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

	isShadowMapDisabled() {

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

	getClearPass() {

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

	render(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, outputBuffer: WebGLRenderTarget, deltaTime: undefined, stencilTest: undefined) {
		const jitterOffsets = _JitterVectors[Math.max(0, Math.min(this.sampleLevel, 5))];

		const autoClear = renderer.autoClear;
		renderer.autoClear = false;

		renderer.getClearColor(this._oldClearColor);
		const oldClearAlpha = renderer.getClearAlpha();

		const baseSampleWeight = 1.0 / jitterOffsets.length;
		const roundingRange = 1 / 32;
		this.copyUniforms['tDiffuse'].value = this.sampleRenderTarget.texture;

		const viewOffset = {

			fullWidth: inputBuffer.width,
			fullHeight: inputBuffer.height,
			offsetX: 0,
			offsetY: 0,
			width: inputBuffer.width,
			height: inputBuffer.height

		};

		const originalViewOffset = Object.assign({}, (<PerspectiveCamera | OrthographicCamera>this.camera).view);

		if (originalViewOffset.enabled) Object.assign(viewOffset, originalViewOffset);

		// render the scene multiple times, each slightly jitter offset from the last and accumulate the results.
		for (let i = 0; i < jitterOffsets.length; i++) {

			const jitterOffset = jitterOffsets[i];

			if ((<PerspectiveCamera | OrthographicCamera>this.camera).setViewOffset) {

				(<PerspectiveCamera | OrthographicCamera>this.camera).setViewOffset(

					viewOffset.fullWidth, viewOffset.fullHeight,

					viewOffset.offsetX + jitterOffset[0] * 0.0625, viewOffset.offsetY + jitterOffset[1] * 0.0625, // 0.0625 = 1 / 16

					viewOffset.width, viewOffset.height

				);

			}

			let sampleWeight = baseSampleWeight;

			if (this.unbiased) {

				// the theory is that equal weights for each sample lead to an accumulation of rounding errors.
				// The following equation varies the sampleWeight per sample so that it is uniformly distributed
				// across a range of values whose rounding errors cancel each other out.

				const uniformCenteredDistribution = (- 0.5 + (i + 0.5) / jitterOffsets.length);
				sampleWeight += roundingRange * uniformCenteredDistribution;

			}

			this.copyUniforms['opacity'].value = sampleWeight;
			renderer.setClearColor(this.clearColor, this.clearAlpha);
			renderer.setRenderTarget(this.sampleRenderTarget);
			renderer.clear();
			renderer.render(this.scene, this.camera);

			renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);

			if (i === 0) {

				renderer.setClearColor(0x000000, 0.0);
				renderer.clear();

			}

			this.fsQuad.render(renderer);

		}

		if ((<PerspectiveCamera | OrthographicCamera>this.camera).setViewOffset && originalViewOffset.enabled) {

			(<PerspectiveCamera | OrthographicCamera>this.camera).setViewOffset(

				originalViewOffset.fullWidth, originalViewOffset.fullHeight,

				originalViewOffset.offsetX, originalViewOffset.offsetY,

				originalViewOffset.width, originalViewOffset.height

			);

		} else if ((<PerspectiveCamera | OrthographicCamera>this.camera).clearViewOffset) {

			(<PerspectiveCamera | OrthographicCamera>this.camera).clearViewOffset();

		}

		renderer.autoClear = autoClear;
		renderer.setClearColor(this._oldClearColor, oldClearAlpha);

	}


	setSize(width: number, height: number) {
		this.sampleRenderTarget.setSize(width, height);
	}

}