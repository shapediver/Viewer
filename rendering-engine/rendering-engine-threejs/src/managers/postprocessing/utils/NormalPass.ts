import {Pass, Resolution} from "postprocessing";
import {
	Camera,
	Color,
	DepthStencilFormat,
	DepthTexture,
	MeshNormalMaterial,
	NearestFilter,
	Scene,
	Texture,
	UnsignedInt248Type,
	UnsignedIntType,
	WebGLRenderer,
	WebGLRenderTarget,
} from "three";
import {RenderPass} from "./RenderPass";

/**
 * A pass that renders the normals of a given scene.
 */

export class NormalPass extends Pass {
	renderPass: RenderPass;
	renderTarget: WebGLRenderTarget | undefined;
	resolution: Resolution;
	dTexture: any;

	/**
	 * Constructs a new normal pass.
	 *
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The camera to use to render the scene.
	 * @param {Object} [options] - The options.
	 * @param {WebGLRenderTarget} [options.renderTarget] - A custom render target.
	 * @param {Number} [options.resolutionScale=1.0] - The resolution scale.
	 * @param {Number} [options.resolutionX=Resolution.AUTO_SIZE] - The horizontal resolution.
	 * @param {Number} [options.resolutionY=Resolution.AUTO_SIZE] - The vertical resolution.
	 * @param {Number} [options.width=Resolution.AUTO_SIZE] - Deprecated. Use resolutionX instead.
	 * @param {Number} [options.height=Resolution.AUTO_SIZE] - Deprecated. Use resolutionY instead.
	 */

	constructor(
		scene: Scene,
		camera: Camera,
		{
			renderTarget,
			resolutionScale = 1.0,
			width = Resolution.AUTO_SIZE,
			height = Resolution.AUTO_SIZE,
			resolutionX = width,
			resolutionY = height,
		}: {
			renderTarget?: WebGLRenderTarget;
			resolutionScale?: number;
			resolutionX?: number;
			resolutionY?: number;
			width?: number;
			height?: number;
		} = {},
	) {
		super("NormalPass");

		this.needsSwap = false;

		/**
		 * A render pass.
		 *
		 * @type {RenderPass}
		 * @private
		 */

		this.renderPass = new RenderPass(
			scene,
			camera,
			new MeshNormalMaterial(),
		);

		const renderPass = this.renderPass;
		renderPass.ignoreBackground = true;
		renderPass.skipShadowMapUpdate = true;

		const clearPass = renderPass.getClearPass();
		clearPass.overrideClearColor = new Color(0x7777ff);
		clearPass.overrideClearAlpha = 1.0;

		/**
		 * A render target for the scene normals.
		 *
		 * @type {WebGLRenderTarget}
		 * @readonly
		 */

		this.renderTarget = renderTarget;

		if (this.renderTarget === undefined) {
			this.renderTarget = new WebGLRenderTarget(1, 1, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
			});

			this.renderTarget.texture.name = "NormalPass.Target";
		}

		this.dTexture = new DepthTexture(1, 1);

		// Hack: Make sure the input buffer uses the depth texture.
		this.renderTarget.depthTexture = this.dTexture;
		this.renderTarget.dispose();

		if (this.renderTarget.stencilBuffer) {
			this.dTexture.format = DepthStencilFormat;
			this.dTexture.type = UnsignedInt248Type;
		} else {
			this.dTexture.type = UnsignedIntType;
		}

		/**
		 * The resolution.
		 *
		 * @type {Resolution}
		 * @readonly
		 */

		const resolution: Resolution = (this.resolution = new Resolution(
			this,
			resolutionX,
			resolutionY,
			resolutionScale,
		));
		(resolution as any).addEventListener("change", () =>
			this.setSize(resolution.baseWidth, resolution.baseHeight),
		);
	}

	set mainScene(value: Scene) {
		this.renderPass.mainScene = value;
	}

	set mainCamera(value: Camera) {
		this.renderPass.mainCamera = value;
	}

	/**
	 * The normal texture.
	 *
	 * @type {Texture}
	 */

	get texture() {
		return this.renderTarget?.texture;
	}

	get depthTexture() {
		return this.renderTarget?.depthTexture;
	}

	/**
	 * The normal texture.
	 *
	 * @deprecated Use texture instead.
	 * @return {Texture} The texture.
	 */

	getTexture(): Texture | undefined {
		return this.renderTarget?.texture;
	}

	/**
	 * Returns the resolution settings.
	 *
	 * @deprecated Use resolution instead.
	 * @return {Resolution} The resolution.
	 */

	getResolution(): Resolution {
		return this.resolution;
	}

	/**
	 * Returns the current resolution scale.
	 *
	 * @return {Number} The resolution scale.
	 * @deprecated Use resolution.preferredWidth or resolution.preferredHeight instead.
	 */

	getResolutionScale(): number {
		return this.resolution.scale;
	}

	/**
	 * Sets the resolution scale.
	 *
	 * @param {Number} scale - The new resolution scale.
	 * @deprecated Use resolution.preferredWidth or resolution.preferredHeight instead.
	 */

	setResolutionScale(scale: number) {
		this.resolution.scale = scale;
	}

	/**
	 * Renders the scene normals.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer: WebGLRenderer) {
		const renderTarget = this.renderToScreen ? null : this.renderTarget;
		this.renderPass.render(renderer, renderTarget!, renderTarget!, 0, true);
	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width: number, height: number) {
		const resolution = this.resolution;
		resolution.setBaseSize(width, height);
		this.renderTarget?.setSize(resolution.width, resolution.height);
	}
}
