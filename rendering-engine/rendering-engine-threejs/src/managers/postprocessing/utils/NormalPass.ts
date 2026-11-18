import {Pass, Resolution} from "postprocessing";
import {
	Camera,
	Color,
	DepthStencilFormat,
	DepthTexture,
	Line,
	Material,
	Mesh,
	MeshNormalMaterial,
	NearestFilter,
	NoBlending,
	Object3D,
	Points,
	Scene,
	Sprite,
	Texture,
	UnsignedInt248Type,
	UnsignedIntType,
	WebGLRenderer,
	WebGLRenderTarget,
} from "three";
import {GemMaterial} from "../../../materials/GemMaterial";
import {RenderPass} from "./RenderPass";

/**
 * A pass that renders the normals of a given scene.
 */

export class NormalPass extends Pass {
	renderPass: RenderPass;
	renderTarget: WebGLRenderTarget | undefined;
	resolution: Resolution;
	dTexture: any;
	private _scene: Scene;
	private _camera: Camera;
	/** Writes alpha 0 where gems are, used to exclude them from the ambient occlusion. */
	private readonly gemMaskMaterial = new MeshNormalMaterial({
		opacity: 0,
		blending: NoBlending,
	});

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

		this._scene = scene;
		this._camera = camera;

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
		this._scene = value;
		this.renderPass.mainScene = value;
	}

	set mainCamera(value: Camera) {
		this._camera = value;
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

		if (!this.renderToScreen) this.renderGemMask(renderer);
	}

	/**
	 * Marks the pixels covered by gems with alpha 0 in the normal target.
	 * The ambient occlusion ignores these pixels, so gems are never darkened.
	 * Everything else keeps alpha 1.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 */

	private renderGemMask(renderer: WebGLRenderer) {
		const scene = this._scene;
		const camera = this._camera;
		const hidden: Object3D[] = [];
		let gemCount = 0;

		scene.traverse((object: Object3D) => {
			if (!object.visible) return;
			const renderable = object as Mesh & Line & Points & Sprite;
			if (
				!renderable.isMesh &&
				!renderable.isLine &&
				!renderable.isPoints &&
				!renderable.isSprite
			)
				return;

			const material = renderable.material as Material | Material[];
			const isGem = Array.isArray(material)
				? material.some((m) => m instanceof GemMaterial)
				: material instanceof GemMaterial;
			// objects without ambient occlusion are not in the normal target either
			if (
				renderable.isMesh &&
				isGem &&
				object.userData.ambientOcclusion !== false
			) {
				gemCount++;
			} else {
				hidden.push(object);
				object.visible = false;
			}
		});

		if (gemCount > 0) {
			const background = scene.background;
			const overrideMaterial = scene.overrideMaterial;
			const autoClear = renderer.autoClear;
			const shadowMapAutoUpdate = renderer.shadowMap.autoUpdate;

			scene.overrideMaterial = this.gemMaskMaterial;
			scene.background = null;
			renderer.autoClear = false;
			renderer.shadowMap.autoUpdate = false;

			renderer.setRenderTarget(this.renderTarget!);
			renderer.render(scene, camera);

			scene.overrideMaterial = overrideMaterial;
			scene.background = background;
			renderer.autoClear = autoClear;
			renderer.shadowMap.autoUpdate = shadowMapAutoUpdate;
		}

		for (let i = 0; i < hidden.length; i++) hidden[i].visible = true;
	}

	override dispose() {
		this.gemMaskMaterial.dispose();
		super.dispose();
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
