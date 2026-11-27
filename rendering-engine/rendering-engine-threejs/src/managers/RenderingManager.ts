import {AnimationEngine} from "@shapediver/viewer.rendering-engine.animation-engine";
import {AnimationFrameEngine} from "@shapediver/viewer.rendering-engine.animation-frame-engine";
import {
	CAMERA_TYPE,
	PerspectiveCamera,
	PerspectiveCameraControls,
} from "@shapediver/viewer.rendering-engine.camera-engine";
import {type IManager} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {type ITree, Tree} from "@shapediver/viewer.shared.node-tree";
import {
	Converter,
	EventEngine,
	EVENTTYPE,
	EVENTTYPE_VIEWPORT,
	Logger,
	StateEngine,
	SystemInfo,
} from "@shapediver/viewer.shared.services";
import {
	BUSY_MODE_DISPLAY,
	type ICameraEvent,
	type IViewportSceneStateEvent,
	type IViewportUpdatedEvent,
	RENDERER_TYPE,
	SPINNER_POSITIONING,
	TONE_MAPPING,
} from "@shapediver/viewer.shared.types";
import {RenderPass} from "postprocessing";
import * as Stats from "stats.js";
import * as THREE from "three";
import {GemMaterial} from "../materials/GemMaterial";
import {renderInScope} from "../objects/SDObject";
import {RenderingEngine} from "../RenderingEngine";
import {inverseToneMapping} from "./postprocessing/effects/tone-mapping/inverseToneMapping";
import {ToneMappingEffect} from "./postprocessing/effects/tone-mapping/ToneMappingEffect";
import {SSAARenderPass} from "./postprocessing/SSAARenderPass";
import {StillFrameAccumulator} from "./postprocessing/StillFrameAccumulator";
import {updateMorphWeights} from "./sceneTree/SceenTreeManagerUtils";
import {SceneTreeManager} from "./SceneTreeManager";

/** Objects waiting for a compile at which the set is first pruned. */
const COMPILE_SET_PRUNE = 1024;

/** The part of a three.js WebGLProgram that the compile gate reads. */
interface IProgramStatus {
	isReady(): boolean;
}

/**
 * Where a frame draws the scene. three.js builds a program per material for
 * each: onto the canvas with the renderer's output colour space and tone
 * mapping (`canvas`), through the post-processing without tone mapping onto
 * the canvas (`composerCanvas`, a scene pass that is the last pass) or into
 * the composer's render target in linear colour (`composerTarget`).
 */
type SceneDraw = "canvas" | "composerCanvas" | "composerTarget";

export class RenderingManager implements IManager {
	// #region Properties (31)

	private readonly _animationEngine: AnimationEngine =
		AnimationEngine.instance;
	private readonly _animationFrameEngine: AnimationFrameEngine =
		AnimationFrameEngine.instance;
	private readonly _converter: Converter = Converter.instance;
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _logger: Logger = Logger.instance;
	private readonly _stateEngine: StateEngine = StateEngine.instance;
	private readonly _systemInfo: SystemInfo = SystemInfo.instance;
	private readonly _tree: ITree = Tree.instance;

	private _activeRendering: boolean = true;
	private _cameraChanged: boolean = false;
	private _compileSkippedFrame: boolean = false;
	private _compileAll: boolean = false;
	private _firstCompilePending: boolean = true;
	private _compileObjects = new Set<THREE.Object3D>();
	/** An object was requested since the last compile, kept or not. */
	private _compileRequested: boolean = false;
	/** The size of the set at which the objects that left the scene go. */
	private _pruneAt: number = COMPILE_SET_PRUNE;
	private _compilingPrograms: Set<IProgramStatus> | null = null;
	/** The draw the whole scene was last compiled for. */
	private _compiledFor: SceneDraw | null = null;
	/** Bound while compiling for a draw into a render target. */
	private readonly _compileRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
		depthBuffer: false,
	});
	/** Objects hidden at the last switch of the draw, not compiled for it. */
	private _hiddenNotCompiled = new Set<THREE.Object3D>();
	/** The grid and ground plane objects among them, shown without update. */
	private _hiddenEnvironmentNotCompiled = new Set<THREE.Object3D>();
	private _lightSignature: string | null = null;
	private _continuousRendering: boolean = false;
	private _continuousShadowMapUpdate: boolean = false;
	private _height: number = 0;
	private _hasPresentedFrame: boolean = false;
	private _hidden: boolean = true;
	private _hiddenCamera: THREE.PerspectiveCamera =
		new THREE.PerspectiveCamera();
	private _hiddenRenderTarget: THREE.WebGLRenderTarget =
		new THREE.WebGLRenderTarget();
	private _hideLogo: boolean = false;
	private _lastSize: {
		adjustedWidth: number;
		adjustedHeight: number;
		width: number;
		height: number;
	} = {
		adjustedWidth: 0,
		adjustedHeight: 0,
		width: 0,
		height: 0,
	};
	private _lightSizeUVEnd = 0.15;
	private _lightSizeUVStart = 0.025;
	private _maxTextureUnits: number = 0;
	private _minimalRendering: boolean = false;
	private _noWebGL: boolean = false;
	private _pixelRatioOverride?: number;
	private _restoreInteractiveShaders: boolean = false;
	private _runningAnimation: boolean = false;
	private _sizeChanged: boolean = false;
	private _softShadowRenderingActive: boolean = false;
	private _softShadowRenderingDurationActive: number = 0;
	private _softShadowRenderingTimeout: ReturnType<typeof setTimeout> | null =
		null;
	private _stats: any;
	private _usingSwiftShader: boolean = false;
	private _width: number = 0;
	private _accumulator?: StillFrameAccumulator;
	private _backgroundInHdr?: {key: string; color: THREE.Color};
	// whether the current mean is averaged by the post-processing in HDR
	private _accumulatedInHdr = false;
	/** lightSizeUV and blending of the last fade frame */
	private _beautyShadowState?: [number, number];
	private _updateShadowMapInNextRender: boolean = false;

	// #endregion Properties (31)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (7)

	public get continuousRendering(): boolean {
		return this._continuousRendering;
	}

	public set continuousRendering(value: boolean) {
		this._continuousRendering = value;
	}

	public get continuousShadowMapUpdate(): boolean {
		return this._continuousShadowMapUpdate;
	}

	public set continuousShadowMapUpdate(value: boolean) {
		this._continuousShadowMapUpdate = value;
	}

	public get minimalRendering(): boolean {
		return this._minimalRendering;
	}

	public get pixelRatioOverride(): number | undefined {
		return this._pixelRatioOverride;
	}

	public set pixelRatioOverride(value: number | undefined) {
		this._pixelRatioOverride = value;
	}

	public get usingSwiftShader(): boolean {
		return this._usingSwiftShader;
	}

	// #endregion Public Getters And Setters (7)

	// #region Public Methods (10)

	public addLogo(
		canvas: HTMLCanvasElement,
		branding: {
			logo: string | null;
			backgroundColor: string;
			busyModeSpinner: string;
			busyModeDisplay: BUSY_MODE_DISPLAY;
			spinnerPositioning: SPINNER_POSITIONING;
		},
	): HTMLDivElement {
		const logoDivElement = document.createElement("div");
		logoDivElement.style.backgroundColor = branding.backgroundColor;
		logoDivElement.classList.add("sdv-logo-container");
		canvas.parentElement?.insertBefore(
			logoDivElement,
			canvas.parentElement?.firstChild,
		);

		if (branding.logo) {
			const img = new Image();
			img.classList.add("sdv-logo");
			img.src = branding.logo;
			logoDivElement.appendChild(img);
		}

		return logoDivElement;
	}

	public addSpinner(
		canvas: HTMLCanvasElement,
		branding: {
			logo: string | null;
			backgroundColor: string;
			busyModeSpinner: string;
			busyModeDisplay: BUSY_MODE_DISPLAY;
			spinnerPositioning: SPINNER_POSITIONING;
		},
	): HTMLDivElement {
		const spinnerDivElement = document.createElement("div");
		spinnerDivElement.classList.add("sdv-spinner-container");

		spinnerDivElement.style.visibility = "hidden";
		canvas.parentElement?.insertBefore(
			spinnerDivElement,
			canvas.parentElement?.firstChild,
		);

		if (branding.busyModeSpinner) {
			const img = new Image();
			img.src = branding.busyModeSpinner;
			img.classList.add("sdv-spinner");
			img.classList.add(
				"sdv-spinner-" +
					branding.spinnerPositioning.replace("_", "-").toLowerCase(),
			);
			spinnerDivElement.appendChild(img);
		}

		return spinnerDivElement;
	}

	public createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
		const renderingProperties = {
			alpha: true,
			depth: true,
			antialias: true,
			preserveDrawingBuffer: false,
			stencil: true,
			premultipliedAlpha: true,
			canvas,
		};
		const renderer = new THREE.WebGLRenderer(renderingProperties);
		renderer.setPixelRatio(window.devicePixelRatio);
		// Every render of this renderer (the main pass, the postprocessing
		// passes, contact shadows, accumulation) runs in the render scope,
		// so fully batched branches are cut from its walk (SS-10606).
		// `compile` is not wrapped: it sees the real visibility.
		const render = renderer.render;
		const renderingEngine = this._renderingEngine;
		renderer.render = function (
			this: THREE.WebGLRenderer,
			scene: THREE.Object3D,
			camera: THREE.Camera,
		) {
			return renderInScope(renderingEngine.renderListCut, () =>
				render.call(this, scene, camera),
			);
		};

		const context = renderer.getContext();

		if (renderer.extensions.has("WEBGL_debug_renderer_info")) {
			const debugInfo = renderer.extensions.get(
				"WEBGL_debug_renderer_info",
			) as {
				UNMASKED_RENDERER_WEBGL: number;
				UNMASKED_VENDOR_WEBGL: number;
			} | null;
			if (debugInfo) {
				// const vendor = context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
				const rendererInfo = context.getParameter(
					debugInfo.UNMASKED_RENDERER_WEBGL,
				);
				if (rendererInfo === "Google SwiftShader") {
					this._usingSwiftShader = true;
					this._logger.warn(
						"RenderingLogic.createWebGLContext: The current device is using Google SwiftShader, a CPU-based renderer. To achieve better rendering results, please enable GPU-rendering in your settings.",
					);
				}
			}
		}

		if (!renderer.extensions.has("EXT_shader_texture_lod"))
			this._minimalRendering = true;

		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.NoToneMapping;
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.needsUpdate = true;
		renderer.shadowMap.type = THREE.BasicShadowMap;
		renderer.shadowMap.autoUpdate = false;
		renderer.localClippingEnabled = true;
		// Performance: Disable object sorting to save CPU cycles per frame
		// Objects are sorted by material/program by default which is usually sufficient
		renderer.sortObjects = false;
		renderer.setSize(canvas.width, canvas.height);
		renderer.setClearColor(new THREE.Color("#ffffff"), 1);
		this._maxTextureUnits = renderer
			.getContext()
			.getParameter(renderer.getContext().MAX_TEXTURE_IMAGE_UNITS);
		return renderer;
	}

	public evaluateTextureUnitCount(value: number) {
		if (value > this._maxTextureUnits) {
			this._logger.warn(
				"RenderingManager.evaluateTextureUnitCount: Maximum number of texture units exceeded. Disabling shadows.",
			);
			const alreadyDisabled =
				this._renderingEngine.lightLoader.forceDisabledShadows;
			this._renderingEngine.lightLoader.forceDisabledShadows = true;
			this._renderingEngine.update(
				"RenderingManager.evaluateTextureUnitCount",
			);
			// Only the transition rebuilds programs. Later scene updates that
			// are still over the limit must not dirty every cached material.
			if (!alreadyDisabled) {
				this._renderingEngine.materialLoader.updateMaterials();
				this.requestFullCompile();
			}
		} else {
			if (this._renderingEngine.lightLoader.forceDisabledShadows)
				this.requestFullCompile();
			this._renderingEngine.lightLoader.forceDisabledShadows = false;
		}
	}

	/**
	 * Mark an object whose programs the next {@link compileShaders} must
	 * prepare: a mesh the scene update created or gave a new material, a
	 * batch or instanced mesh, a source mesh that left its batch.
	 */
	public requestCompile(object: THREE.Object3D): void {
		this._compileRequested = true;
		// The next compile takes the whole scene, so there is nothing to
		// remember. A load adds thousands of objects this way.
		if (this._compileAll || this._firstCompilePending) return;
		// Interactions create effect meshes between scene updates. Drop what
		// left the scene so a session without updates does not keep it. The
		// walk is paid when the set has doubled since the last one, not on
		// every call.
		if (this._compileObjects.size >= this._pruneAt) {
			const scene = this._renderingEngine.scene;
			for (const candidate of this._compileObjects) {
				let parent: THREE.Object3D | null = candidate;
				while (parent && parent !== scene) parent = parent.parent;
				if (parent !== scene) this._compileObjects.delete(candidate);
			}
			this._pruneAt = Math.max(
				COMPILE_SET_PRUNE,
				this._compileObjects.size * 2,
			);
		}
		this._compileObjects.add(object);
	}

	/**
	 * The next {@link compileShaders} prepares every object of the scene.
	 * For a change of something all programs depend on.
	 */
	public requestFullCompile(): void {
		this._compileAll = true;
	}

	/**
	 * The program key of every lit material depends on the number of lights
	 * per type and on which of them cast shadows.
	 */
	private lightSignature(scene: THREE.Object3D): string {
		// Per type: lights, and lights that cast shadows.
		const counts: Record<string, number> = {};
		scene.traverseVisible((object) => {
			const light = object as THREE.Light;
			if (!light.isLight) return;
			const type = (light as THREE.Light & {type: string}).type;
			counts[type] = (counts[type] ?? 0) + 1;
			if (light.castShadow)
				counts[type + "Shadow"] = (counts[type + "Shadow"] ?? 0) + 1;
		});
		return (
			Object.keys(counts)
				.sort()
				.map((key) => key + ":" + counts[key])
				.join("|") +
			"|" +
			this._renderingEngine.lightLoader.forceDisabledShadows
		);
	}

	/**
	 * The objects to compile, or the whole scene when something all programs
	 * depend on changed: the light set, shadows forced off or on, a renderer
	 * type or instancing switch (`newRendererType`), the first update.
	 * Objects that are no longer in the scene, and source meshes hidden
	 * behind a batch, are left out.
	 */
	private compileTargets(
		scene: THREE.Object3D,
		fullCompile: boolean,
	): THREE.Object3D[] | null {
		const objects = [...this._compileObjects];
		const requested = this._compileRequested;
		this._compileObjects.clear();
		this._compileRequested = false;
		this._pruneAt = COMPILE_SET_PRUNE;
		const signature = this.lightSignature(scene);
		const full =
			fullCompile ||
			this._compileAll ||
			this._firstCompilePending ||
			signature !== this._lightSignature;
		// An update of a scene without objects, such as the one that creates
		// the viewport, is not yet the first update that needs programs.
		if (requested) this._firstCompilePending = false;
		this._compileAll = false;
		this._lightSignature = signature;
		if (full) {
			this._hiddenNotCompiled.clear();
			this._hiddenEnvironmentNotCompiled.clear();
			return null;
		}
		// Hidden objects the last switch of the draw left out, once an
		// update shows them.
		objects.push(...this.takeShown(this._hiddenNotCompiled, scene));
		return objects.filter((object) => {
			if (object.userData.batchedMesh) return false;
			let parent: THREE.Object3D | null = object;
			while (parent && parent !== scene) parent = parent.parent;
			return parent === scene;
		});
	}

	/**
	 * Start compiling the programs of the scene without waiting for them.
	 *
	 * With KHR_parallel_shader_compile the driver compiles in the background
	 * and the animation loop does not draw until {@link shadersCompiled}.
	 * This is what `WebGLRenderer.compileAsync` does (r184), without its
	 * timer: that one throws when a material is disposed while it waits.
	 * Without the extension the first draw compiles, as it always did.
	 */
	public compileShaders(
		scene: THREE.Scene,
		camera: THREE.Camera,
		fullCompile: boolean = false,
	): void {
		// Objects compiled for another draw than the next one would keep
		// programs no frame uses: compile the whole scene for the new draw.
		const targets = this.compileTargets(
			scene,
			fullCompile || this.drawChanged(),
		);
		this.startCompile(scene, camera, targets);
	}

	/**
	 * Compiles the objects (null: the whole scene) for the next draw and
	 * lets the animation loop wait for the new programs.
	 */
	private startCompile(
		scene: THREE.Scene,
		camera: THREE.Camera,
		targets: THREE.Object3D[] | null,
	): void {
		const renderer = this._renderingEngine.renderer;
		const before = new Set(this.livePrograms());
		const draw = this.sceneDraw();
		if (targets === null) {
			this.compileForDraw(scene, camera, null, draw);
			this._compiledFor = draw;
		} else if (targets.length > 0) {
			// One call for all objects: every call collects the lights of
			// the scene again. The group only lists the objects, they keep
			// their parents.
			const group = new THREE.Group();
			group.children = targets;
			this.compileForDraw(group, camera, scene, draw);
		}
		// The contact shadow draws its own passes in the same frame. Its
		// depth programs vary only with what the scene programs vary with
		// (batching, instancing, skinning, morphs, attributes), so it needs a
		// compile only when the scene got a new program. Otherwise every
		// update would traverse and compile the scene a second time.
		if (this.livePrograms().some((program) => !before.has(program)))
			this._renderingEngine.environmentGeometryManager.contactShadow?.compile();
		if (!renderer.extensions.has("KHR_parallel_shader_compile")) return;

		// Wait for the programs this update created. Those of an earlier
		// update that are still compiling stay in the set.
		const pending = this._compilingPrograms ?? new Set<IProgramStatus>();
		for (const program of this.livePrograms())
			if (!before.has(program)) pending.add(program);
		this._compilingPrograms = pending.size > 0 ? pending : null;
	}

	/**
	 * `renderer.compile` for the draw the next frame makes. The program of a
	 * material depends on where the scene is drawn: onto the canvas with the
	 * output colour space and tone mapping of the renderer, or into the
	 * render target of the post-processing in linear colour without tone
	 * mapping. Compiling for the canvas while the post-processing draws
	 * builds programs no frame uses, and the first frame links its own.
	 */
	private compileForDraw(
		scene: THREE.Object3D,
		camera: THREE.Camera,
		targetScene: THREE.Scene | null,
		draw: SceneDraw,
	): void {
		const renderer = this._renderingEngine.renderer;
		if (draw === "canvas") {
			renderer.compile(scene, camera, targetScene);
			return;
		}
		// The same state as PostProcessingManager.render: no tone mapping,
		// and for the scene pass a render target. Any render target gives
		// the programs of the composer's input buffer. Binding that buffer
		// itself would allocate its depth buffer before the composer
		// attaches its depth texture, so a 1x1 target without depth is
		// bound, and its GPU resources are released right after.
		const toneMapping = renderer.toneMapping;
		const previous = renderer.getRenderTarget();
		const face = renderer.getActiveCubeFace();
		const level = renderer.getActiveMipmapLevel();
		renderer.toneMapping = THREE.NoToneMapping;
		if (draw === "composerTarget")
			renderer.setRenderTarget(this._compileRenderTarget);
		try {
			renderer.compile(scene, camera, targetScene);
		} finally {
			renderer.toneMapping = toneMapping;
			if (draw === "composerTarget") {
				renderer.setRenderTarget(previous, face, level);
				this._compileRenderTarget.dispose();
			}
		}
	}

	/**
	 * The post-processing was switched on or off, or its scene pass moved
	 * between the canvas and a render target, since the whole scene was
	 * last compiled.
	 */
	private drawChanged(): boolean {
		return (
			this._compiledFor !== null && this._compiledFor !== this.sceneDraw()
		);
	}

	/**
	 * After {@link drawChanged}, compiles what the next frame draws: the
	 * visible objects, without the source meshes hidden behind a batch.
	 * A hidden object is compiled by the scene update that shows it. The
	 * grid and the ground plane are shown without one: the animation loop
	 * compiles them when they are shown ({@link compileShownEnvironment}).
	 */
	private compileVisibleForDraw(scene: THREE.Scene): void {
		const drawable = (object: THREE.Object3D) => {
			const candidate = object as THREE.Mesh &
				Partial<{
					isLine: boolean;
					isPoints: boolean;
					isSprite: boolean;
				}>;
			return (
				(candidate.isMesh ||
					candidate.isLine ||
					candidate.isPoints ||
					candidate.isSprite) &&
				!object.userData.batchedMesh
			);
		};
		const objects = new Set<THREE.Object3D>();
		scene.traverseVisible((object) => {
			if (drawable(object)) objects.add(object);
		});
		this._hiddenNotCompiled.clear();
		this._hiddenEnvironmentNotCompiled.clear();
		scene.traverse((object) => {
			if (drawable(object) && !objects.has(object))
				this._hiddenNotCompiled.add(object);
		});
		this._renderingEngine.environmentGeometryManager.environmentGeometryObject?.traverse(
			(object) => {
				if (!this._hiddenNotCompiled.delete(object)) return;
				this._hiddenEnvironmentNotCompiled.add(object);
			},
		);
		this.startCompile(scene, this._hiddenCamera, [...objects]);
		this._compiledFor = this.sceneDraw();
	}

	/**
	 * Compiles the grid and ground plane objects that
	 * {@link compileVisibleForDraw} left out once they are shown. Their
	 * setters only change the visibility, without a scene update.
	 */
	private compileShownEnvironment(scene: THREE.Scene): void {
		const shown = this.takeShown(this._hiddenEnvironmentNotCompiled, scene);
		if (shown.length > 0)
			this.startCompile(scene, this._hiddenCamera, shown);
	}

	/**
	 * Removes the objects of the set that are shown, and returns them.
	 * Objects that left the scene are removed as well.
	 */
	private takeShown(
		objects: Set<THREE.Object3D>,
		scene: THREE.Object3D,
	): THREE.Object3D[] {
		const shown: THREE.Object3D[] = [];
		for (const object of objects) {
			let visible = object.visible;
			let parent = object.parent;
			while (parent && parent !== scene) {
				visible &&= parent.visible;
				parent = parent.parent;
			}
			if (parent !== scene) objects.delete(object);
			else if (visible) {
				shown.push(object);
				objects.delete(object);
			}
		}
		return shown;
	}

	/** Whether the frame is drawn through the post-processing. */
	private renderPostProcessing(): boolean {
		const postProcessingManager =
			this._renderingEngine.postProcessingManager;
		return (
			(postProcessingManager.effects.length > 0 ||
				postProcessingManager.manualPostProcessing) &&
			!(
				postProcessingManager.enablePostProcessingOnMobile === false &&
				this._systemInfo.isMobile === true
			)
		);
	}

	/**
	 * accumulationMode "hdr": whether the background is stored as an HDR
	 * colour and tone-mapped like the scene. The averaged frames then mix
	 * object and background in HDR at the silhouette, as inside the object.
	 * A clear colour lighter than about the tone-mapped 1.0 is capped, see
	 * {@link backgroundInHdr}.
	 * Otherwise the tone mapping leaves the background untouched, and a pixel
	 * that holds both is tone-mapped as a whole or not at all, depending on
	 * the depth of the last frame.
	 */
	private toneMapsBackground(): boolean {
		const engine = this._renderingEngine;
		return (
			engine.accumulationMode === "hdr" &&
			engine.postProcessingManager.hdrAccumulationAvailable &&
			engine.toneMapping !== TONE_MAPPING.NONE &&
			!engine.environmentMapAsBackground
		);
	}

	/**
	 * The clear colour for {@link toneMapsBackground}. The post-processing
	 * reads the clear colour as sRGB and stores it in linear colour; the
	 * returned colour is stored as the HDR value that the tone mapping turns
	 * back into that linear colour, so the background looks as before.
	 *
	 * The HDR value is capped at 1.0 per channel (the reference viewer stores
	 * its white background as 1.0 too). A light clear colour would otherwise be
	 * stored far above 1 (white: about 15 with ACES) and the effects before the
	 * tone mapping (bloom, vignette) would see it, e.g. bloom glowing around
	 * silhouettes. Consequence: in "hdr" a clear colour lighter than about
	 * #e2e2e2 (ACES) shows as at most the tone-mapped 1.0; darker colours are
	 * exact.
	 *
	 * three.js multiplies the clear colour by the clear alpha
	 * (premultiplied alpha), so the buffer holds `B * a`. For `0 < a < 1` the
	 * inverse therefore targets `linear * a` and its result is divided by `a`.
	 * With `a <= 0` the pixel is transparent and the colour stays as it is.
	 */
	private backgroundInHdr(color: THREE.Color): THREE.Color {
		const engine = this._renderingEngine;
		const alpha = engine.clearAlpha;
		const key = `${color.r},${color.g},${color.b},${alpha},${engine.toneMapping},${engine.toneMappingExposure}`;
		if (this._backgroundInHdr?.key !== key) {
			const linear = color.clone().convertSRGBToLinear();
			let rgb: [number, number, number] = [linear.r, linear.g, linear.b];
			if (alpha > 0) {
				const a = Math.min(alpha, 1);
				rgb = inverseToneMapping(
					[linear.r * a, linear.g * a, linear.b * a],
					engine.toneMapping,
					engine.toneMappingExposure,
				).map((v) => Math.min(v / a, 1)) as [number, number, number];
			}
			this._backgroundInHdr = {
				key,
				color: new THREE.Color()
					.setRGB(rgb[0], rgb[1], rgb[2], THREE.LinearSRGBColorSpace)
					.convertLinearToSRGB(),
			};
		}
		return this._backgroundInHdr.color;
	}

	/** How the next frame draws the scene, see {@link SceneDraw}. */
	private sceneDraw(): SceneDraw {
		if (!this.renderPostProcessing()) return "canvas";
		const composer =
			this._renderingEngine.postProcessingManager.effectComposer;
		// Without a composer the post-processing draws nothing yet.
		if (!composer) return "canvas";
		// A scene pass that is the last pass draws onto the canvas.
		const scenePass = composer.passes.find(
			(pass) =>
				pass instanceof RenderPass || pass instanceof SSAARenderPass,
		);
		return scenePass?.renderToScreen ? "composerCanvas" : "composerTarget";
	}

	public getScreenshot(
		type: string = "image/png",
		encoderOptions: number = 1,
	): string {
		// The context swaps the drawing buffer. Read it in this same turn,
		// after drawing the scene that is on screen.
		this.renderSceneForScreenshot();
		return this._renderingEngine.renderer.domElement.toDataURL(
			type,
			encoderOptions,
		);
	}

	/**
	 * Waits until the viewport stopped rendering (the soft-shadow fade and
	 * the frame accumulation are done), then takes a screenshot of what is
	 * on screen. Gives up waiting after the fade duration plus 10 seconds,
	 * for example while continuous rendering is on.
	 */
	public async getSettledScreenshot(
		type: string = "image/png",
		encoderOptions: number = 1,
	): Promise<string> {
		const deadline =
			performance.now() +
			this._renderingEngine.beautyRenderDelay +
			this._renderingEngine.beautyRenderBlendingDuration +
			10000;
		while (
			(this._activeRendering || this._softShadowRenderingTimeout) &&
			!this._renderingEngine.closed &&
			performance.now() < deadline
		)
			await new Promise<void>((resolve) =>
				requestAnimationFrame(() => resolve()),
			);
		return this.getScreenshot(type, encoderOptions);
	}

	public async getScreenshotWithHtml(
		type: string = "image/png",
		encoderOptions: number = 1,
		canvasDataUrl?: string,
	): Promise<string> {
		const canvasScreenshot =
			canvasDataUrl || this.getScreenshot("image/png", 1);

		try {
			return await this.rasterizeCanvasParent(
				canvasScreenshot,
				type,
				encoderOptions,
			);
		} catch (e) {
			this._logger.warn(
				`RenderingManager.getScreenshotWithHtml: Could not include HTML elements in the screenshot. Returning the canvas screenshot instead. ${e instanceof Error ? e.message : String(e)}`,
			);
			return this.getScreenshot(type, encoderOptions);
		}
	}

	/** Releases the GPU resources of the frame accumulation. */
	public dispose(): void {
		this._accumulator?.dispose();
		this._accumulator = undefined;
	}

	public init(): void {
		try {
			this._renderingEngine.materialLoader.updateSoftShadow(
				this._lightSizeUVEnd,
				1.0,
			);

			this._renderingEngine.renderer.shadowMap.type =
				THREE.BasicShadowMap;
			this._renderingEngine.renderer.shadowMap.needsUpdate = true;
			this._renderingEngine.materialLoader.updateMaterials();

			this._eventEngine.addListener(
				EVENTTYPE.CAMERA.CAMERA_START,
				(e) => {
					const viewerEvent = <ICameraEvent>e;
					if (viewerEvent.viewportId === this._renderingEngine.id)
						this.startRendering();
				},
			);
			this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_END, (e) => {
				const viewerEvent = <ICameraEvent>e;
				if (viewerEvent.viewportId === this._renderingEngine.id)
					this.stopRendering();
			});

			window.onresize = () => {
				this.render();
			};
			this._renderingEngine.canvas.onresize = () => {
				this.render();
			};
			this._renderingEngine.canvas.parentElement!.onresize = () => {
				this.render();
			};

			const stats1 = new Stats.default();
			stats1.showPanel(0); // Panel 0 = fps
			stats1.dom.style.cssText =
				"position:absolute;top:0px;left:0px;display:none;";
			this._renderingEngine.canvas.parentElement!.appendChild(stats1.dom);

			const stats2 = new Stats.default();
			stats2.showPanel(1); // Panel 1 = ms
			stats2.dom.style.cssText =
				"position:absolute;top:0px;left:80px;display:none;";
			this._renderingEngine.canvas.parentElement!.appendChild(stats2.dom);

			const stats3 = new Stats.default();
			stats3.showPanel(2); // Panel 2 = ms
			stats3.dom.style.cssText =
				"position:absolute;top:0px;left:160px;display:none;";
			this._renderingEngine.canvas.parentElement!.appendChild(stats3.dom);

			this._stats = {
				stats: [stats1, stats2, stats3],
				begin: () => {
					stats1.begin();
					stats2.begin();
					stats3.begin();
				},
				end: () => {
					stats1.end();
					stats2.end();
					stats3.end();
				},
			};
		} catch (e) {
			this._noWebGL = true;
			throw e;
		}
	}

	public render() {
		this.startAndStopRendering();
	}

	public resize(width: number, height: number) {
		this._width = width;
		this._height = height;
		this._renderingEngine.materialLoader.assignPointSize(
			this._renderingEngine.pointSize,
		);
	}

	/**
	 * Must only be called once by the RenderingEngine!
	 */
	public start() {
		this._animationFrameEngine.addAnimationFrameCallback(
			this.animate.bind(this),
		);
		this.startAndStopRendering();
	}

	public updateShadowMap() {
		this._updateShadowMapInNextRender = true;
	}

	/**
	 * Rebuild materials only when the shadow map is actually switched on or off.
	 * Camera start/stop and the beauty fade keep BasicShadowMap and must not
	 * come through here.
	 */
	public applyShadowMapEnabled(): void {
		const shadowMap = this._renderingEngine.renderer.shadowMap;
		const enabled = shadowMap.enabled;
		shadowMap.enabled =
			this._renderingEngine.usingSwiftShader ||
			this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES
				? false
				: this._renderingEngine.shadows;
		if (enabled !== shadowMap.enabled) {
			this._renderingEngine.materialLoader.updateMaterials();
			// Every program depends on it.
			this.requestFullCompile();
		}
	}

	// #endregion Public Methods (10)

	// #region Private Methods (14)

	/**
	 * The scene state of this frame: why the scene changes from frame to
	 * frame by itself (bits in the order of SCENE_DYNAMIC_REASONS). Sends
	 * SCENE_STATE_CHANGED when they changed since the last frame.
	 */
	private updateSceneState(): void {
		const controls = this._renderingEngine.cameraEngine.camera?.controls;
		const reasons =
			(this._runningAnimation ? 1 : 0) |
			(controls?.enableTurntableControls || controls?.enableObjectControls
				? 2
				: 0) |
			(this._continuousRendering ? 4 : 0) |
			(this._continuousShadowMapUpdate ? 8 : 0);
		const sceneTreeManager = this._renderingEngine.sceneTreeManager;
		if (!sceneTreeManager.setDynamicReasons(reasons)) return;
		this._eventEngine.emitEvent(EVENTTYPE_VIEWPORT.SCENE_STATE_CHANGED, {
			viewportId: this._renderingEngine.id,
			sceneState: sceneTreeManager.sceneState,
		} as IViewportSceneStateEvent);
	}

	private activateBeautyRenderShaders() {
		this._renderingEngine.renderer.shadowMap.type = THREE.BasicShadowMap;
		this._renderingEngine.renderer.shadowMap.needsUpdate = true;
		// Fade starts at the hard-shadow end of the blend. setShaderProperties
		// advances the same uniforms; new materials read the stored weight.
		this._renderingEngine.materialLoader.updateSoftShadow(
			this._lightSizeUVStart,
			0,
		);
	}

	private animate(
		time: number,
		deltaTime: number,
		runningAnimation: boolean,
	): void {
		// animation loop - part 1: initial discarding
		if (this._renderingEngine.closed || this._noWebGL) return;

		this._renderingEngine.evaluateFlagState();

		// update if needed
		if (
			this._renderingEngine.show === true &&
			this._tree.root.version !==
				this._renderingEngine.sceneTreeManager.lastRootVersion &&
			this._renderingEngine.sceneTreeManager.suspendSceneUpdates === false
		) {
			this._renderingEngine.sceneTreeManager.updateSceneTree(
				this._tree.root,
			);
			const sceneChanges =
				this._renderingEngine.sceneTreeManager.takeSceneChanges();
			this.updateShadowMap();
			this._animationEngine.updateAnimationData(sceneChanges);
			this.render();
			this._eventEngine.emitEvent(EVENTTYPE_VIEWPORT.VIEWPORT_UPDATED, {
				viewportId: this._renderingEngine.id,
				sceneChanges,
			} as IViewportUpdatedEvent);
		}

		if (this._renderingEngine.preRenderingCallback)
			this._renderingEngine.preRenderingCallback(
				this._renderingEngine.renderer,
			);

		if (runningAnimation !== this._runningAnimation) this.render();
		this._runningAnimation = runningAnimation;
		this.updateSceneState();
		if (this._runningAnimation)
			this._renderingEngine.sceneTreeManager.updateTransformations();
		if (this._runningAnimation)
			updateMorphWeights(
				this._tree.root,
				this._renderingEngine.sceneTreeManager.mainNode,
			);

		// get the current size
		const {
			width,
			height,
			adjustedWidth,
			adjustedHeight,
			pixelRatioChanged,
		} = this.calculateSize();
		const aspect = width / height;
		this._sizeChanged =
			pixelRatioChanged ||
			this._lastSize.adjustedHeight !== adjustedHeight ||
			this._lastSize.adjustedWidth !== adjustedWidth ||
			this._lastSize.height !== height ||
			this._lastSize.width !== width;
		this._lastSize = {width, height, adjustedWidth, adjustedHeight};
		if (this._sizeChanged)
			this._renderingEngine.sceneTreeManager.recordChannel("size");

		// animation loop - part 3: update the camera, if there are new movements, they will start / continue the rendering
		this._cameraChanged = this._renderingEngine.cameraEngine.camera
			? this._renderingEngine.cameraManager.updateCamera(
					deltaTime,
					aspect,
				)
			: false;

		// animation loop - part 4: evaluating state
		const states = this.evaluateRenderingState();

		// The post-processing was switched on or off since the last compile,
		// for example by effects added after the scene update. Every program
		// depends on it: compile the scene for the draw it now gets.
		if (this.drawChanged())
			this.compileVisibleForDraw(this._renderingEngine.scene);
		else if (this._hiddenEnvironmentNotCompiled.size > 0)
			this.compileShownEnvironment(this._renderingEngine.scene);

		// A draw would wait for programs that are still compiling. Keep the
		// frame that is on screen (or the logo) until they are ready.
		const compiling = !this.shadersCompiled();
		if (compiling && states.updateShadowMap)
			this._updateShadowMapInNextRender = true;

		// toggle the blurring
		this.toggleBusyMode(states.busyMode);

		// animation loop - part 5: the scene is not even shown
		if (states.showScene === false || (compiling && this._hidden)) {
			// toggle on logo
			this.toggleLogo(true);

			if (this._hidden === false)
				this._eventEngine.emitEvent(
					EVENTTYPE.VIEWPORT.VIEWPORT_HIDDEN,
					{viewportId: this._renderingEngine.id},
				);

			this._hidden = true;
			return;
		} else {
			// we delay for one render call as some of the postprocessing effects have artefacts in the first call
			if (this._hideLogo === true && this._hidden === true) {
				this.toggleLogo(false);
				this._hideLogo = false;

				if (this._hidden === true)
					this._eventEngine.emitEvent(
						EVENTTYPE.VIEWPORT.VIEWPORT_VISIBLE,
						{viewportId: this._renderingEngine.id},
					);

				this._hidden = false;
			} else {
				this._hideLogo = true;
				if (this._hidden === true)
					this._renderingEngine.postProcessingManager.changeEffectPass();
			}
		}

		// animation loop - part 6: the scene is shown, but there is no active rendering happening
		if (
			states.rendering === false ||
			this._renderingEngine.pause === true ||
			compiling
		)
			return;

		// animation loop - part 7: there is actual rendering happening
		// do the things that have to be done for standard and beauty rendering in the same way
		this._stats.begin();
		this.showStatistics();
		// Roll the beauty shaders back on the next interactive frame, not
		// while the finished beauty frame is still the one on screen.
		this.applyInteractiveShaders();

		this.paintFrame(
			deltaTime,
			{
				width,
				height,
				adjustedWidth,
				adjustedHeight,
				pixelRatioChanged,
				aspect,
			},
			{
				updateShadowMap: states.updateShadowMap,
				softShadowRendering: states.softShadowRendering,
				compileShaders: false,
				trackBeauty: true,
				notify: true,
			},
		);
		this._hasPresentedFrame = true;

		this._stats.end();
	}

	private renderSceneForScreenshot(): void {
		if (this._noWebGL || this._renderingEngine.closed) return;
		if (!this._renderingEngine.cameraEngine.camera) return;

		// Before the first presented frame, the interactive shaders are the
		// ones that frame will use. After that, keep whatever is on screen,
		// including a finished beauty pass whose uniforms are restored later.
		if (!this._hasPresentedFrame) this.applyInteractiveShaders();

		const {
			width,
			height,
			adjustedWidth,
			adjustedHeight,
			pixelRatioChanged,
		} = this.calculateSize();
		if (!(width > 0) || !(height > 0)) return;

		const updateShadowMap =
			this._runningAnimation === true ||
			this._continuousShadowMapUpdate === true ||
			this._updateShadowMapInNextRender === true;

		// The canvas shows the mean of the accumulated frames. Draw that
		// mean again instead of a single frame, unless something changed.
		const rendererSize = this._renderingEngine.renderer.getSize(
			new THREE.Vector2(),
		);
		if (
			!updateShadowMap &&
			!pixelRatioChanged &&
			rendererSize.width === adjustedWidth &&
			rendererSize.height === adjustedHeight &&
			this._accumulator?.present()
		) {
			this._hasPresentedFrame = true;
			return;
		}
		this._updateShadowMapInNextRender = false;

		this.paintFrame(
			0,
			{
				width,
				height,
				adjustedWidth,
				adjustedHeight,
				pixelRatioChanged,
				aspect: width / height,
			},
			{
				updateShadowMap,
				// Draw the shaders already on screen. Advancing the beauty
				// blend here would show a different frame than the canvas.
				softShadowRendering: false,
				compileShaders: true,
				trackBeauty: false,
				notify: false,
			},
		);
		this._hasPresentedFrame = true;
	}

	private paintFrame(
		deltaTime: number,
		size: {
			width: number;
			height: number;
			adjustedWidth: number;
			adjustedHeight: number;
			pixelRatioChanged: boolean;
			aspect: number;
		},
		options: {
			updateShadowMap: boolean;
			softShadowRendering: boolean;
			compileShaders: boolean;
			trackBeauty: boolean;
			notify: boolean;
		},
	): void {
		const {
			width,
			height,
			adjustedWidth,
			adjustedHeight,
			pixelRatioChanged,
			aspect,
		} = size;
		let updateShadowMap = options.updateShadowMap;

		// animation loop - part 8: calculate the current size
		const currentSize = new THREE.Vector2();
		this._renderingEngine.renderer.getSize(currentSize);
		// Performance: Direct property comparison instead of Vector2.equals()
		const resized =
			pixelRatioChanged ||
			currentSize.width !== adjustedWidth ||
			currentSize.height !== adjustedHeight;
		if (resized) {
			this._renderingEngine.renderer.setSize(
				adjustedWidth,
				adjustedHeight,
			);
			this._renderingEngine.postProcessingManager.resize(
				adjustedWidth,
				adjustedHeight,
			);
			this._renderingEngine.renderer.domElement.style.width =
				width + "px";
			this._renderingEngine.renderer.domElement.style.height =
				height + "px";
			this._renderingEngine.materialLoader.assignPointSize(
				this._renderingEngine.pointSize,
			);
		}

		// animation loop - part 9: adjust the camera (the rendering state would be false if we didn't have a camera)
		const {camera, matrix} =
			this._renderingEngine.cameraManager.adjustCamera(aspect);

		// if a matrix is provided after a camera adjustment
		// that means that the turntable controls or the object controls are activated
		if (matrix) {
			for (let i = 0; i < this._tree.root.children.length; i++) {
				if (
					!(<any>this._tree.root.children[i]).sessionNode ||
					this._tree.root.children[i].excludeViewports.includes(
						this._renderingEngine.id,
					)
				)
					continue;
				const transform = this._tree.root.children[
					i
				].transformations.find((t) => t.id === "objectRotation");
				if (transform) {
					transform.matrix = matrix;
				} else {
					this._tree.root.children[i].addTransformation({
						id: "objectRotation",
						matrix,
					});
				}
			}
			updateShadowMap = true;
			this._renderingEngine.sceneTreeManager.updateTransformations();
		}

		// animation loop - part 10: adjust the anchor elements
		this._renderingEngine.htmlElementAnchorLoader.adjustPositions(
			adjustedWidth / width,
			adjustedHeight / height,
		);

		// animation loop - part 11: adjust some scene settings
		// enable / disable the shadow map
		this.applyShadowMapEnabled();
		let threeJsLightObject,
			oldLightVisibility = true;
		// enable / disable lights
		if (this._renderingEngine.lights === false) {
			const ls = this._renderingEngine.lightEngine.lightScene;
			if (ls) {
				threeJsLightObject = ls.node.convertedObject[
					this._renderingEngine.id
				] as THREE.Object3D;
				if (threeJsLightObject) {
					oldLightVisibility = threeJsLightObject.visible;
					threeJsLightObject.visible = false;
				}
			}
		}

		// update shadowMap if need
		if (updateShadowMap) {
			if (this._renderingEngine.renderer.shadowMap.enabled)
				this._renderingEngine.renderer.shadowMap.needsUpdate = true;
			this._renderingEngine.environmentGeometryManager.contactShadow?.render();
		}

		// enable / disable the background
		this._renderingEngine.sceneTreeManager.scene.background = this
			._renderingEngine.environmentMapAsBackground
			? this._renderingEngine.environmentMapLoader.environmentMap
			: null;
		// check if we should render with post-processing
		const renderPostProcessing = this.renderPostProcessing();
		const toneMapBackground =
			renderPostProcessing && this.toneMapsBackground();

		// set the background color / alpha
		const clearColor = new THREE.Color(
			this._converter.toThreeJsColorInput(
				this._renderingEngine.clearColor,
			),
		);
		this._renderingEngine.renderer.setClearColor(
			toneMapBackground ? this.backgroundInHdr(clearColor) : clearColor,
			this._renderingEngine.clearAlpha,
		);

		const scene = (<SceneTreeManager>this._renderingEngine.sceneTreeManager)
			.scene;
		// A screenshot cannot read the buffer after this call returns.
		// Compile here so the draw waits for programs that an in-flight
		// asynchronous compile has not finished yet.
		if (options.compileShaders) {
			const sceneDraw = this.sceneDraw();
			this.compileForDraw(scene, camera, null, sceneDraw);
			this._compiledFor = sceneDraw;
		}

		const draw = () => {
			// the uniforms are shared by all viewports, so set them for each draw
			GemMaterial.clampColorUniform.value = this._renderingEngine
				.gemClampColor
				? 1
				: 0;
			ToneMappingEffect.toneMapBackgroundUniform.value = toneMapBackground
				? 1
				: 0;
			if (renderPostProcessing) {
				// a frame outside the render loop (screenshot) is drawn on its own
				this._renderingEngine.postProcessingManager.render(
					deltaTime,
					camera,
					!options.trackBeauty,
				);
			} else {
				this._renderingEngine.renderer.render(scene, camera);
			}
		};

		// animation loop - part 12: actual rendering separation
		if (options.softShadowRendering === true) {
			const shadowStateChanged = this.setShaderProperties();
			const accumulationFrames = options.trackBeauty
				? this.accumulationFrames()
				: 0;
			let accumulationConverged = true;
			if (accumulationFrames > 1) {
				const accumulator = this.accumulator();
				const frames = Math.min(
					accumulationFrames,
					accumulator.maxFrames,
				);
				// Averaging frames whose shadows still fade would mix the
				// harder shadows into the still image. A resize clears the
				// canvas, and a new shadow map changes the image.
				// accumulationMode "hdr": the post-processing averages the
				// frames before bloom and tone mapping, the canvas shows the mean
				const postProcessingManager =
					this._renderingEngine.postProcessingManager;
				const hdr =
					renderPostProcessing &&
					this._renderingEngine.accumulationMode === "hdr" &&
					postProcessingManager.hdrAccumulationAvailable;
				if (
					shadowStateChanged ||
					resized ||
					updateShadowMap ||
					hdr !== this._accumulatedInHdr
				)
					accumulator.restart();
				this._accumulatedInHdr = hdr;
				if (accumulator.count < frames) {
					accumulator.beginFrame(camera);
					if (hdr)
						postProcessingManager.beginHdrAccumulation(
							accumulator.count === 0,
						);
					try {
						draw();
					} finally {
						accumulator.endJitter(camera);
						if (hdr) postProcessingManager.endHdrAccumulation();
					}
					accumulator.endFrame(camera, hdr);
					// a rebuild of the passes restarts the HDR mean: count
					// only the frames it holds, so the averaging goes on
					if (hdr)
						accumulator.setCount(
							postProcessingManager.hdrAccumulationCount,
						);
				}
				// otherwise the converged mean is already on the canvas
				accumulationConverged = accumulator.count >= frames;
			} else {
				this._accumulator?.reset();
				draw();
			}

			// if the duration was long enough and the frames are accumulated, disable the beauty rendering
			if (
				options.trackBeauty &&
				accumulationConverged &&
				this._softShadowRenderingDurationActive >=
					this._renderingEngine.beautyRenderBlendingDuration
			) {
				this._eventEngine.emitEvent(
					EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					{viewportId: this._renderingEngine.id},
				);
				this.deactivateBeautyRenderShaders();
				this._activeRendering = false;
			} else if (options.trackBeauty) {
				this._softShadowRenderingDurationActive += deltaTime;
			}
		} else {
			draw();
			// the canvas no longer shows the accumulated frames
			if (options.trackBeauty) this._accumulator?.restart();

			// if the beauty rendering was active, disable it
			if (options.trackBeauty && this._softShadowRenderingActive) {
				this._eventEngine.emitEvent(
					EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					{viewportId: this._renderingEngine.id},
				);
				this.deactivateBeautyRenderShaders();
				this._activeRendering = false;
			}
		}

		// reset the visibility of the threeJs light object
		if (threeJsLightObject) threeJsLightObject.visible = oldLightVisibility;

		if (options.notify && this._renderingEngine.postRenderingCallback)
			this._renderingEngine.postRenderingCallback(
				this._renderingEngine.renderer,
				this._renderingEngine.scene,
				this._renderingEngine.camera,
			);
	}

	private async rasterizeCanvasParent(
		canvasDataUrl: string,
		type: string,
		encoderOptions: number,
	): Promise<string> {
		const canvas = this._renderingEngine.renderer.domElement;
		const anchorContainer =
			this._renderingEngine.htmlElementAnchorLoader.parentDiv;

		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => resolve()),
		);

		const canvasRect = canvas.getBoundingClientRect();
		// the output has the size of the rendered image, which can differ from the
		// displayed size (device pixel ratio, maximum rendering size)
		const outputCanvas = document.createElement("canvas");
		outputCanvas.width = Math.max(1, canvas.width);
		outputCanvas.height = Math.max(1, canvas.height);

		const context = outputCanvas.getContext("2d");
		if (!context) return this.getScreenshot(type, encoderOptions);

		const image = await this.loadImage(canvasDataUrl);
		context.drawImage(image, 0, 0, outputCanvas.width, outputCanvas.height);
		// the HTML elements are positioned in the displayed size
		context.scale(
			outputCanvas.width / Math.max(1, canvasRect.width),
			outputCanvas.height / Math.max(1, canvasRect.height),
		);
		this.drawTextAnchorsToCanvas(context, canvasRect, anchorContainer);

		return outputCanvas.toDataURL(type, encoderOptions);
	}

	private drawTextAnchorsToCanvas(
		context: CanvasRenderingContext2D,
		canvasRect: DOMRect,
		anchorContainer: HTMLDivElement,
	): void {
		const textAnchors = Array.from(
			anchorContainer.querySelectorAll(".sdv-anchor-text"),
		) as HTMLElement[];

		for (const textAnchor of textAnchors) {
			const computedStyle = window.getComputedStyle(textAnchor);
			if (
				computedStyle.display === "none" ||
				computedStyle.visibility === "hidden" ||
				computedStyle.opacity === "0"
			)
				continue;

			const text = textAnchor.innerText || textAnchor.textContent || "";
			if (!text.trim()) continue;

			const textRect = textAnchor.getBoundingClientRect();
			let x = textRect.left - canvasRect.left;
			const y = textRect.top - canvasRect.top;
			let textAlign: CanvasTextAlign;

			switch (computedStyle.textAlign) {
				case "center":
					x += textRect.width / 2;
					textAlign = "center";
					break;
				case "right":
				case "end":
					x += textRect.width;
					textAlign = "right";
					break;
				case "left":
				case "start":
				default:
					textAlign = "left";
			}

			const lineHeight = this.getCanvasLineHeight(
				computedStyle,
				textRect,
			);
			const font =
				computedStyle.font && computedStyle.font !== ""
					? computedStyle.font
					: `${computedStyle.fontStyle} ${computedStyle.fontVariant} ${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;

			context.save();
			context.font = font;
			context.fillStyle = computedStyle.color || "#000000";
			context.textAlign = textAlign;
			context.textBaseline = "top";
			context.globalAlpha = parseFloat(computedStyle.opacity || "1");

			const lines = text.split(/\r?\n/);
			for (let i = 0; i < lines.length; i++) {
				context.fillText(lines[i], x, y + i * lineHeight);
			}

			context.restore();
		}
	}

	private getCanvasLineHeight(
		computedStyle: CSSStyleDeclaration,
		textRect: DOMRect,
	): number {
		const parsedLineHeight = parseFloat(computedStyle.lineHeight);
		if (Number.isFinite(parsedLineHeight)) return parsedLineHeight;

		const parsedFontSize = parseFloat(computedStyle.fontSize);
		if (Number.isFinite(parsedFontSize)) return parsedFontSize * 1.2;

		return Math.max(textRect.height, 1);
	}

	private loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = () =>
				reject(
					new Error(
						"RenderingManager.loadImage: Failed to load image.",
					),
				);
			image.src = src;
		});
	}

	private calculateSize(): {
		adjustedWidth: number;
		adjustedHeight: number;
		pixelRatioChanged: boolean;
		width: number;
		height: number;
	} {
		const deviceRatio = this.pixelRatioOverride ?? window.devicePixelRatio;

		let width = this._width,
			height = this._height;
		if (this._renderingEngine.automaticResizing) {
			width = (<HTMLDivElement>this._renderingEngine.canvas.parentNode)
				.clientWidth;
			height = (<HTMLDivElement>this._renderingEngine.canvas.parentNode)
				.clientHeight;
		}

		// Cap the drawing buffer in physical pixels. setSize multiplies the CSS
		// size by the pixel ratio, so the ratio is physical / css.
		const aspect = width / height;
		let physicalWidth = width * deviceRatio;
		let physicalHeight = height * deviceRatio;
		const maximumRenderingSize = this._renderingEngine.maximumRenderingSize;
		if (
			physicalWidth > maximumRenderingSize.width ||
			physicalHeight > maximumRenderingSize.height
		) {
			if (
				(physicalWidth - maximumRenderingSize.width) / aspect >
				physicalHeight - maximumRenderingSize.height
			) {
				physicalWidth = maximumRenderingSize.width;
				physicalHeight = maximumRenderingSize.width / aspect;
			} else {
				physicalWidth = maximumRenderingSize.height * aspect;
				physicalHeight = maximumRenderingSize.height;
			}
		}

		const widthRatio = width > 0 ? physicalWidth / width : deviceRatio;
		const heightRatio = height > 0 ? physicalHeight / height : widthRatio;
		const pixelRatio = Math.min(widthRatio, heightRatio);
		const pixelRatioChanged =
			this._renderingEngine.renderer.getPixelRatio() !== pixelRatio;
		if (pixelRatioChanged) {
			this._renderingEngine.renderer.setPixelRatio(pixelRatio);
		}

		return {
			width,
			adjustedWidth: width,
			height,
			adjustedHeight: height,
			pixelRatioChanged,
		};
	}

	private deactivateBeautyRenderShaders() {
		this._softShadowRenderingTimeout = null;
		this._beautyShadowState = undefined;
		this._softShadowRenderingActive = false;
		this._softShadowRenderingDurationActive = 0;
		// Keep the shaders that produced the frame now on screen. The next
		// interactive draw applies the cheaper shadow settings.
		this._restoreInteractiveShaders = true;
	}

	private applyInteractiveShaders() {
		if (!this._restoreInteractiveShaders) return;
		this._restoreInteractiveShaders = false;
		this._renderingEngine.renderer.shadowMap.type = THREE.BasicShadowMap;
		this._renderingEngine.renderer.shadowMap.needsUpdate = true;
		this._renderingEngine.materialLoader.updateSoftShadow(
			this._lightSizeUVStart,
			0.1,
		);
	}

	private evaluateRenderingState(): {
		showScene: boolean;
		rendering: boolean;
		busyMode: boolean;
		updateShadowMap: boolean;
		softShadowRendering: boolean;
	} {
		// If there is a camera to show the scene and the setting for it is set to true, we show the scene
		let showScene = false;
		if (
			this._renderingEngine.cameraEngine.camera &&
			this._renderingEngine.show === true
		)
			showScene = true;

		// If we should render at all
		let rendering = false;
		if (
			this._activeRendering === true ||
			this._cameraChanged === true ||
			this._sizeChanged === true ||
			this._runningAnimation === true ||
			this._continuousRendering === true
		)
			rendering = true;

		let updateShadowMap = false;
		if (
			this._runningAnimation === true ||
			this._continuousShadowMapUpdate === true ||
			this._updateShadowMapInNextRender === true
		) {
			this._updateShadowMapInNextRender = false;
			updateShadowMap = true;
		}

		// special case, autorotation
		if (this._renderingEngine.cameraEngine.camera) {
			const camera = this._renderingEngine.cameraEngine.camera!;
			if (camera.type === CAMERA_TYPE.PERSPECTIVE) {
				const controls = <PerspectiveCameraControls>(
					(<PerspectiveCamera>camera).controls
				);
				if (
					controls.enableAutoRotation === true &&
					controls.autoRotationSpeed !== 0
				)
					return {
						showScene,
						rendering: true,
						updateShadowMap,
						busyMode: this._renderingEngine.busy,
						softShadowRendering: false,
					};
			}
		} else {
			rendering = false;
		}

		// If the scene should be blurred
		let busyMode = false;
		if (this._renderingEngine.busy) busyMode = true;

		// If we should render in beauty mode
		let softShadowRendering = false;
		if (
			this._softShadowRenderingActive === true &&
			busyMode === false &&
			this._continuousRendering === false &&
			(this._renderingEngine.shadows || !this._systemInfo.isIOS) &&
			this._renderingEngine.usingSwiftShader === false &&
			this._runningAnimation === false &&
			this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES
		)
			softShadowRendering = true;

		return {
			showScene,
			rendering,
			updateShadowMap,
			busyMode,
			softShadowRendering,
		};
	}

	/**
	 * Whether the programs started by {@link compileShaders} can be used
	 * without waiting for the driver. Restarts the rendering once they can.
	 */
	/** The programs three.js currently keeps; released ones are gone. */
	private livePrograms(): IProgramStatus[] {
		return (this._renderingEngine.renderer.info.programs ??
			[]) as unknown as IProgramStatus[];
	}

	private shadersCompiled(): boolean {
		const programs = this._compilingPrograms;
		if (!programs) return true;

		const live = this.livePrograms();
		for (const program of programs) {
			// a released program has nothing left to wait for
			if (live.includes(program) && !program.isReady()) {
				this._compileSkippedFrame = true;
				return false;
			}
			programs.delete(program);
		}

		this._compilingPrograms = null;
		// Frames were skipped. Draw the next one; render() would also restart
		// the beauty countdown that may already have run out meanwhile.
		if (this._compileSkippedFrame) this._activeRendering = true;
		this._compileSkippedFrame = false;
		return true;
	}

	/**
	 * Advances the soft-shadow fade.
	 * Returns whether the shadow uniforms differ from the previous fade frame.
	 */
	private setShaderProperties(): boolean {
		const previous = this._beautyShadowState;
		this.applyBeautyShadowState();
		const current = this._beautyShadowState!;
		return (
			!previous ||
			!Object.is(previous[0], current[0]) ||
			!Object.is(previous[1], current[1])
		);
	}

	private applyBeautyShadowState(): void {
		if (this._renderingEngine.softShadows === false) {
			this.updateBeautySoftShadow(this._lightSizeUVStart, 0);
			return;
		}

		const deltaTime = Math.min(
			this._softShadowRenderingDurationActive,
			this._renderingEngine.beautyRenderBlendingDuration,
		);
		const percentage =
			deltaTime / this._renderingEngine.beautyRenderBlendingDuration;

		if (percentage < 0.25) {
			const percentageMapped = percentage / 0.25;
			this.updateBeautySoftShadow(
				this._lightSizeUVStart,
				percentageMapped,
			);
		} else {
			const percentageMapped = (percentage - 0.25) / (1 - 0.25);
			// this._lightSizeUVStart -> this._lightSizeUVEnd
			this.updateBeautySoftShadow(
				this._lightSizeUVStart +
					(this._lightSizeUVEnd - this._lightSizeUVStart) *
						percentageMapped,
				1.0,
			);
		}
	}

	private updateBeautySoftShadow(lightSizeUV: number, blending: number) {
		this._renderingEngine.materialLoader.updateSoftShadow(
			lightSizeUV,
			blending,
		);
		this._beautyShadowState = [lightSizeUV, blending];
	}

	/** The number of frames to accumulate on this device, 0 when off. */
	private accumulationFrames(): number {
		const frames = this._systemInfo.isMobile
			? this._renderingEngine.accumulationFramesMobile
			: this._renderingEngine.accumulationFrames;
		return frames > 1 ? frames : 0;
	}

	private accumulator(): StillFrameAccumulator {
		if (!this._accumulator)
			this._accumulator = new StillFrameAccumulator(
				this._renderingEngine.renderer,
			);
		return this._accumulator;
	}

	private showStatistics() {
		if (this._renderingEngine.showStatistics) {
			for (let i = 0; i < this._stats.stats.length; i++)
				this._stats.stats[i].dom.style.display = "";
		} else {
			for (let i = 0; i < this._stats.stats.length; i++)
				this._stats.stats[i].dom.style.display = "none";
		}
	}

	private startAndStopRendering() {
		const environmentMapLoaded =
			this._stateEngine.viewportEngines[this._renderingEngine.id]
				?.environmentMapLoaded;
		const environmentMap = this._renderingEngine.environmentMap;
		if (
			environmentMap !== "null" &&
			environmentMap !== "none" &&
			this._renderingEngine.environmentMapLoader.environmentMap ===
				null &&
			environmentMapLoaded &&
			environmentMapLoaded.resolved === false
		) {
			environmentMapLoaded.then(() => this.startAndStopRendering());
			return;
		}

		this._activeRendering = true;
		// something changed, the accumulated frames are outdated
		this._accumulator?.restart();
		// and so is the previous frame the reflections read
		this._renderingEngine.postProcessingManager.invalidateHistory();
		this.stopBeautyRenderCountdown();
		this.startBeautyRenderCountdown();
	}

	private startBeautyRenderCountdown() {
		this._softShadowRenderingTimeout = setTimeout(() => {
			this._softShadowRenderingActive = true;
			this._softShadowRenderingDurationActive = 0;
			this.activateBeautyRenderShaders();
		}, this._renderingEngine.beautyRenderDelay);
	}

	private startRendering() {
		this._activeRendering = true;
		this._accumulator?.restart();
		this.stopBeautyRenderCountdown();
	}

	private stopBeautyRenderCountdown() {
		if (this._softShadowRenderingTimeout)
			clearTimeout(this._softShadowRenderingTimeout);
		this.deactivateBeautyRenderShaders();
	}

	private stopRendering() {
		this.startBeautyRenderCountdown();
	}

	private toggleBusyMode(toggle: boolean) {
		if (
			this._renderingEngine.branding.busyModeDisplay ===
			BUSY_MODE_DISPLAY.BLUR
		) {
			this._renderingEngine.htmlElementAnchorLoader.toggleBusyMode(
				toggle,
			);
			if (toggle) {
				if (
					navigator.userAgent.toLowerCase().indexOf("firefox") > -1 &&
					navigator.userAgent.toLowerCase().indexOf("android") > -1
				)
					return;
				this._renderingEngine.renderer.domElement.style.filter =
					"blur(3px)";
			} else {
				this._renderingEngine.renderer.domElement.style.filter = "";
			}
		} else if (
			this._renderingEngine.branding.busyModeDisplay ===
			BUSY_MODE_DISPLAY.SPINNER
		) {
			if (toggle) {
				this._renderingEngine.spinnerDivElement.style.visibility =
					"visible";
			} else {
				this._renderingEngine.spinnerDivElement.style.visibility =
					"hidden";
			}
		}
	}

	private toggleLogo(toggle: boolean) {
		if (this._renderingEngine.logoDivElement)
			this._renderingEngine.logoDivElement.style.display = toggle
				? "inherit"
				: "none";
		if (this._renderingEngine.canvas)
			this._renderingEngine.canvas.style.display = !toggle
				? "inherit"
				: "none";
	}

	// #endregion Private Methods (14)
}
