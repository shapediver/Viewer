import type {Page} from "@playwright/test";
import {installAecScene} from "./aecScene";

/**
 * Reads counters and timings from outside the viewer. It wraps
 * `renderer.render` on the renderer the public `threeJsCoreObjects` returns
 * and reads `renderer.info`. No product code knows about it.
 */

export interface SceneVariant {
	id: string;
	/** false also turns soft shadows off. SwiftShader forces this. */
	shadows: boolean;
	/** Adds the ambient occlusion effect with its default properties. */
	ssao: boolean;
}

export interface PassRecord {
	/** Counts animation frames since the probe was installed. */
	frame: number;
	/** true when the viewport scene is drawn, false for a full-screen pass. */
	main: boolean;
	calls: number;
	triangles: number;
	/** `material.needsUpdate = true` assignments during this pass. */
	materialUpdates: number;
	/** Synchronous time inside `renderer.render`. Not GPU time. */
	ms: number;
	/**
	 * Programs three.js created during this call. A program created inside
	 * a draw is compiled and linked there, and the frame waits for it.
	 */
	programsCreated: number;
}

/**
 * Runs in the page. Adds `window.__probe`.
 * It must not reference anything outside its own body.
 */
export function installProbe() {
	const SDV = (window as any).SDV;
	const passes: any[] = [];
	let frame = 0;
	let lastTimestamp = -1;
	let renderDepth = 0;
	let updatesInRender = 0;
	let updatesOutsideRender = 0;

	// All callbacks of one animation frame get the same timestamp.
	const requestFrame = window.requestAnimationFrame.bind(window);
	window.requestAnimationFrame = (callback: FrameRequestCallback) =>
		requestFrame((timestamp) => {
			if (timestamp !== lastTimestamp) {
				lastTimestamp = timestamp;
				frame++;
			}
			callback(timestamp);
		});

	function track(renderer: any, mainScene: any) {
		const original = renderer.render.bind(renderer);
		renderer.render = (scene: any, camera: any) => {
			const info = renderer.info;
			const callsBefore = info.render.calls;
			const trianglesBefore = info.render.triangles;
			const updatesBefore = updatesInRender;
			const programsBefore = info.programs ? info.programs.length : 0;
			const start = performance.now();
			renderDepth++;
			let result;
			try {
				result = original(scene, camera);
			} finally {
				renderDepth--;
			}
			const ms = performance.now() - start;
			// With autoReset the renderer zeroes the counters itself.
			passes.push({
				frame,
				main: scene === mainScene,
				calls: info.autoReset
					? info.render.calls
					: info.render.calls - callsBefore,
				triangles: info.autoReset
					? info.render.triangles
					: info.render.triangles - trianglesBefore,
				materialUpdates: updatesInRender - updatesBefore,
				ms,
				programsCreated: Math.max(
					0,
					(info.programs ? info.programs.length : 0) - programsBefore,
				),
			});
			return result;
		};
	}

	/**
	 * Counts `material.needsUpdate = true`. three.js sets it twice per draw
	 * for a transparent double-sided mesh, inside `render`. Anything outside
	 * `render` comes from the viewer.
	 */
	function trackMaterialUpdates(material: any) {
		let proto = material;
		while (proto && !Object.getOwnPropertyDescriptor(proto, "needsUpdate"))
			proto = Object.getPrototypeOf(proto);
		if (!proto) throw new Error("Material.needsUpdate was not found");
		const descriptor = Object.getOwnPropertyDescriptor(
			proto,
			"needsUpdate",
		)!;
		Object.defineProperty(proto, "needsUpdate", {
			configurable: true,
			get: descriptor.get,
			set(value: boolean) {
				if (value === true) {
					if (renderDepth > 0) updatesInRender++;
					else updatesOutsideRender++;
				}
				descriptor.set!.call(this, value);
			},
		});
	}

	async function create(variant: any, options: any) {
		const probe = (window as any).__probe;
		await createViewport(variant);
		build(options);
		show(variant);
		return probe.gpu;
	}

	/**
	 * `create` in three steps, so a caller can read a clock that only exists
	 * outside the page (thread CPU time) between them.
	 */
	async function createViewport(variant: any) {
		const probe = (window as any).__probe;
		const viewport = await SDV.createViewport({
			canvas: document.getElementById("canvas"),
			id: "perf",
			visibility: SDV.VISIBILITY_MODE.MANUAL,
		});
		if (!variant.shadows) {
			viewport.shadows = false;
			viewport.softShadows = false;
		}
		const core = viewport.threeJsCoreObjects;
		track(core.renderer, core.scene);
		const gl = core.renderer.getContext();
		const debug = gl.getExtension("WEBGL_debug_renderer_info");
		probe.gpu = String(
			debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "",
		);
		probe.viewport = viewport;
		probe.renderer = core.renderer;
		probe.scene = core.scene;
		probe.gl = gl;
		return probe.gpu;
	}

	/** Builds the fixture tree and converts it. Fills `buildMs`. */
	function build(options: any) {
		const probe = (window as any).__probe;
		const viewport = probe.viewport;
		const buildStart = performance.now();
		const aec = (window as any).__aec.build(options);
		const treeBuilt = performance.now();
		viewport.update();
		const converted = performance.now();
		trackMaterialUpdates(sceneMaterials().values().next().value);
		probe.aec = aec;
		probe.buildMs = {
			tree: treeBuilt - buildStart,
			convert: converted - treeBuilt,
			total: converted - buildStart,
		};

		viewport.camera.position = aec.camera.position;
		viewport.camera.target = aec.camera.target;
		return probe.buildMs;
	}

	/** Starts rendering. The first frame follows. */
	function show(variant: any) {
		(window as any).__probe.viewport.show = true;
		if (variant.ssao) addSsao();
	}

	function addSsao() {
		const probe = (window as any).__probe;
		return probe.viewport.postProcessing.addEffect({
			type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
		});
	}

	function sceneMaterials() {
		const probe = (window as any).__probe;
		const materials = new Set<any>();
		probe.scene.traverse((object: any) => {
			if (!object.material) return;
			(Array.isArray(object.material)
				? object.material
				: [object.material]
			).forEach((material: any) => material && materials.add(material));
		});
		return materials;
	}

	function stats() {
		const probe = (window as any).__probe;
		const info = probe.renderer.info;
		let objects = 0;
		let meshes = 0;
		let batchedMeshes = 0;
		let matrixAutoUpdate = 0;
		probe.scene.traverse((object: any) => {
			objects++;
			if (object.isMesh) meshes++;
			if (object.isBatchedMesh) batchedMeshes++;
			if (object.matrixAutoUpdate) matrixAutoUpdate++;
		});
		let treeNodes = 0;
		SDV.sceneTree.root.traverse(() => {
			treeNodes++;
		});
		return {
			programs: info.programs ? info.programs.length : 0,
			geometries: info.memory.geometries,
			textures: info.memory.textures,
			materials: sceneMaterials().size,
			objects,
			meshes,
			batchedMeshes,
			matrixAutoUpdate,
			treeNodes,
		};
	}

	let knownMaterials = new Set<any>();

	function snapshotMaterials() {
		knownMaterials = sceneMaterials();
		updatesOutsideRender = 0;
	}

	/** What happened to the scene materials since `snapshotMaterials`. */
	function materialChanges() {
		let created = 0;
		sceneMaterials().forEach((material) => {
			if (!knownMaterials.has(material)) created++;
		});
		return {updatesOutsideRender, created};
	}

	/** Hides one glass pane and counts what the change touches. */
	function oneNodeChange() {
		const probe = (window as any).__probe;
		const glassNodes = probe.aec.glassNodes;
		const target = glassNodes[Math.floor(glassNodes.length / 2)];
		const versions = new Map<any, string>();
		SDV.sceneTree.root.traverse((node: any) => {
			versions.set(node, node.version);
		});

		target.visible = !target.visible;
		target.updateVersion();

		let reversioned = 0;
		versions.forEach((version, node) => {
			if (node.version !== version) reversioned++;
		});

		const proto = Object.getPrototypeOf(target);
		const descriptor = Object.getOwnPropertyDescriptor(proto, "version")!;
		const read = new Set<any>();
		Object.defineProperty(proto, "version", {
			configurable: true,
			get() {
				read.add(this);
				return descriptor.get!.call(this);
			},
			set(value: string) {
				descriptor.set!.call(this, value);
			},
		});
		const batches = new Set<any>();
		probe.scene.traverse((object: any) => {
			if (object.isBatchedMesh) batches.add(object);
		});
		const start = performance.now();
		let ms: number;
		try {
			probe.viewport.update();
			ms = performance.now() - start;
		} finally {
			Object.defineProperty(proto, "version", descriptor);
		}
		// A batch that is not the same object as before was built again.
		let batchesRebuilt = 0;
		probe.scene.traverse((object: any) => {
			if (object.isBatchedMesh && !batches.has(object)) batchesRebuilt++;
		});
		return {
			reversioned,
			nodesRead: read.size,
			batchesRebuilt,
			ms,
		};
	}

	/** Times a one-node change without the counting wrapper. */
	function timeOneNodeChange() {
		const probe = (window as any).__probe;
		const glassNodes = probe.aec.glassNodes;
		const target = glassNodes[Math.floor(glassNodes.length / 2)];
		const start = performance.now();
		target.visible = !target.visible;
		target.updateVersion();
		probe.viewport.update();
		return performance.now() - start;
	}

	/**
	 * Re-versions the fixture root and every node below it, as adding a
	 * session node to the scene does. Counts the ids that creates.
	 * The next scene update converts the whole fixture again, so call this
	 * after everything else.
	 */
	function versionUpdate() {
		const probe = (window as any).__probe;
		const original = crypto.randomUUID;
		let ids = 0;
		crypto.randomUUID = () => {
			ids++;
			return original.call(crypto);
		};
		try {
			probe.aec.root.updateVersion();
		} finally {
			crypto.randomUUID = original;
		}
		return ids;
	}

	/** Turns the camera around the target by `degrees` and redraws. */
	function orbit(degrees: number) {
		const probe = (window as any).__probe;
		const camera = probe.viewport.camera;
		const position = camera.position;
		const target = camera.target;
		const angle = (degrees * Math.PI) / 180;
		const x = position[0] - target[0];
		const y = position[1] - target[1];
		camera.position = [
			target[0] + x * Math.cos(angle) - y * Math.sin(angle),
			target[1] + x * Math.sin(angle) + y * Math.cos(angle),
			position[2],
		];
	}

	let raycastCalls = 0;
	let treeDataReads = 0;
	const events: Record<string, number> = {};

	/**
	 * Counts reads of `node.data`. An algorithm that visits every node once
	 * reads it about once per node. One that does so per node, per node, shows
	 * up as a count that grows with the square of the scene.
	 */
	function trackTreeDataReads() {
		const probe = (window as any).__probe;
		let proto = Object.getPrototypeOf(probe.aec.root);
		while (proto && !Object.getOwnPropertyDescriptor(proto, "data"))
			proto = Object.getPrototypeOf(proto);
		if (!proto) throw new Error("TreeNode.data was not found");
		const descriptor = Object.getOwnPropertyDescriptor(proto, "data")!;
		Object.defineProperty(proto, "data", {
			configurable: true,
			get() {
				treeDataReads++;
				return descriptor.get!.call(this);
			},
			set: descriptor.set,
		});
	}

	function canvasRect() {
		const rect = (
			window as any
		).__probe.renderer.domElement.getBoundingClientRect();
		return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
	}

	/**
	 * Counts `raycast` calls on meshes. Every pick tests the objects its
	 * broad phase lets through, so the count grows with the scene.
	 */
	function trackRaycasts() {
		const probe = (window as any).__probe;
		const wrapped = new Set<any>();
		probe.scene.traverse((object: any) => {
			if (!object.isMesh && !object.isBatchedMesh) return;
			let proto = Object.getPrototypeOf(object);
			while (proto && !Object.getOwnPropertyDescriptor(proto, "raycast"))
				proto = Object.getPrototypeOf(proto);
			if (!proto || wrapped.has(proto)) return;
			wrapped.add(proto);
			const original = proto.raycast;
			proto.raycast = function (...args: any[]) {
				raycastCalls++;
				return original.apply(this, args);
			};
		});
	}

	/**
	 * Hover and select on every glass pane, through the public interaction
	 * feature. `events` counts what the managers report.
	 */
	function setupInteraction() {
		const probe = (window as any).__probe;
		const {
			InteractionEngine,
			HoverManager,
			SelectManager,
			InteractionData,
		} = (window as any).SDVInteractions;
		for (const item of probe.aec.glassItems)
			item.addData(new InteractionData({hover: true, select: true}));
		const engine = new InteractionEngine(probe.viewport);
		const hover = new HoverManager();
		hover.effectMaterial = new SDV.MaterialStandardData({color: "#dddddd"});
		engine.addInteractionManager(hover);
		const select = new SelectManager();
		select.effectMaterial = new SDV.MaterialStandardData({
			color: "#ff8800",
		});
		engine.addInteractionManager(select);
		for (const [name, type] of [
			["hoverOn", SDV.EVENTTYPE.INTERACTION.HOVER_ON],
			["hoverOff", SDV.EVENTTYPE.INTERACTION.HOVER_OFF],
			["selectOn", SDV.EVENTTYPE.INTERACTION.SELECT_ON],
			["selectOff", SDV.EVENTTYPE.INTERACTION.SELECT_OFF],
		])
			SDV.addListener(type, () => {
				events[name] = (events[name] ?? 0) + 1;
			});
		probe.viewport.update();
		trackRaycasts();
	}

	/**
	 * Gives every item an sdTF attribute set and switches the viewport to the
	 * attribute visualization. `zone` has 8 values, `load` is a number.
	 */
	function setupAttributes() {
		const probe = (window as any).__probe;
		const SDVAV = (window as any).SDVAttributeVisualization;
		probe.aec.items.forEach((item: any, index: number) => {
			item.addData(
				new SDV.SDTFItemData("string", `item${index}`, {
					zone: {typeHint: "string", value: `zone${index % 8}`},
					load: {typeHint: "double", value: index % 100},
				}),
			);
		});
		SDV.sceneTree.root.updateVersion();
		probe.viewport.update();
		probe.attributes = {SDVAV};
		trackTreeDataReads();
	}

	function showAttribute(key: string | null) {
		const probe = (window as any).__probe;
		const SDVAV = probe.attributes.SDVAV;
		if (!probe.engine) {
			probe.viewport.type = SDV.RENDERER_TYPE.ATTRIBUTES;
			probe.engine = new SDVAV.AttributeVisualizationEngine(
				probe.viewport,
			);
		}
		probe.engine.updateAttributes(
			key === null
				? []
				: [
						{
							key,
							type:
								key === "load"
									? SDV.SDTF_TYPEHINT.DOUBLE
									: SDV.SDTF_TYPEHINT.STRING,
							visualization:
								SDVAV.ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED,
						},
					],
		);
	}

	/** Back to the standard renderer. The engine and its materials stay. */
	function leaveAttributes() {
		(window as any).__probe.viewport.type = SDV.RENDERER_TYPE.STANDARD;
	}

	/**
	 * Whether every program has finished compiling. With
	 * KHR_parallel_shader_compile the driver compiles in real time, also
	 * while the page clock is paused. The query does not block.
	 */
	function programsReady() {
		const probe = (window as any).__probe;
		const gl = probe.gl;
		if (!gl.getExtension("KHR_parallel_shader_compile")) return true;
		const COMPLETION_STATUS_KHR = 0x91b1;
		return (probe.renderer.info.programs ?? []).every((item: any) =>
			gl.getProgramParameter(item.program, COMPLETION_STATUS_KHR),
		);
	}

	/** Passes grouped by animation frame, oldest first. */
	function frames() {
		const grouped: {frame: number; passes: any[]}[] = [];
		for (const pass of passes) {
			const last = grouped[grouped.length - 1];
			if (last && last.frame === pass.frame) last.passes.push(pass);
			else grouped.push({frame: pass.frame, passes: [pass]});
		}
		return grouped;
	}

	let batchBoundsReads = 0;
	let batchBoundsTracked = false;

	/**
	 * Counts `BatchedMesh.getBoundingSphereAt`. three.js calls it once per
	 * instance and render pass while it sorts or culls a batch, so the count
	 * is the per-instance work the batches do. Wrapped once a batch exists.
	 */
	function trackBatchBounds() {
		if (batchBoundsTracked) return;
		const probe = (window as any).__probe;
		let batch: any;
		probe.scene?.traverse((object: any) => {
			if (!batch && object.isBatchedMesh) batch = object;
		});
		if (!batch) return;
		let proto = Object.getPrototypeOf(batch);
		while (
			proto &&
			!Object.prototype.hasOwnProperty.call(proto, "getBoundingSphereAt")
		)
			proto = Object.getPrototypeOf(proto);
		if (!proto) return;
		const original = proto.getBoundingSphereAt;
		proto.getBoundingSphereAt = function (...args: any[]) {
			batchBoundsReads++;
			return original.apply(this, args);
		};
		batchBoundsTracked = true;
	}

	(window as any).__probe = {
		create,
		createViewport,
		build,
		show,
		addSsao,
		stats,
		snapshotMaterials,
		materialChanges,
		oneNodeChange,
		timeOneNodeChange,
		versionUpdate,
		orbit,
		frames,
		passes,
		programsReady,
		setupInteraction,
		setupAttributes,
		showAttribute,
		leaveAttributes,
		/** Raycast and event counts since the last reset. */
		picks: () => ({raycastCalls, treeDataReads, events: {...events}}),
		canvasRect,
		batchBoundsReads: () => batchBoundsReads,
		reset: () => {
			trackBatchBounds();
			batchBoundsReads = 0;
			passes.length = 0;
			raycastCalls = 0;
			treeDataReads = 0;
			for (const key of Object.keys(events)) delete events[key];
		},
	};
}

const EMPTY_SVG = "<svg xmlns='http://www.w3.org/2000/svg'/>";

/** Opens the local test-cdn build and installs the fixture and the probe. */
export async function openViewer(page: Page, url: string = "/index.html") {
	// The default logo and spinner are hosted images. Keep the run offline.
	await page.route("https://viewer.shapediver.com/**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "image/svg+xml",
			body: EMPTY_SVG,
		}),
	);
	await page.goto(url);
	await page.waitForFunction(() => Boolean((window as any).SDV));
	await page.evaluate(installAecScene);
	await page.evaluate(installProbe);
}
