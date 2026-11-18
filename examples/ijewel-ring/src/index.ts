import * as SDV from "@shapediver/viewer";
(<any>window).SDV = SDV;

/**
 * Local counterpart of the iJewel3D / WebGi reference scene
 * https://appbuilder.shapediver.com/v1/ijewel3d/latest/?slug=ijewel3d-ring
 *
 * The values below were read from the reference scene:
 * - environment (scene and gems): one high-contrast .hdr, intensity 1
 *   (gems 1.2)
 * - metal: polished yellow gold, color #fec07a, roughness 0, metalness 1
 * - diamonds: IOR 2.42, dispersion (rIndexDelta) 0.01, white, no absorption
 * - camera: fov 25, white background
 */
// `?sceneEnv=` and `?gemEnv=` select another environment: a preset name or
// the URL of a .hdr file. The geometry backend refuses to proxy some hosts
// (status 400), so the session downloads textures directly.
const urlParameters = new URLSearchParams(location.search);
const environmentMap = (name: string | null, fallback: string): string => {
	if (!name) return fallback;
	if (name.startsWith("https://")) return name;
	return name in SDV.ENVIRONMENT_MAP
		? SDV.ENVIRONMENT_MAP[name as keyof typeof SDV.ENVIRONMENT_MAP]
		: fallback;
};
// `?late=1` applies the materials after the first render instead of before
const LATE = urlParameters.get("late") === "1";
const SCENE_ENVIRONMENT_MAP = environmentMap(
	urlParameters.get("sceneEnv"),
	SDV.ENVIRONMENT_MAP.DEFAULT_STUDIO,
);
const GEM_ENVIRONMENT_MAP = environmentMap(
	urlParameters.get("gemEnv"),
	SDV.ENVIRONMENT_MAP.GEM_STUDIO,
);

// material names of the model: headstone, sidestones, shankcenter, shankside
const GEM_MATERIAL_NAMES = /stone|diamond|gem/i;
const METAL_MATERIAL_NAMES = /shank|metal|gold|prong/i;

const SHOTS: {
	[key: string]: {target: number[]; direction: number[]; distance: number};
} = {
	// the default view of the reference
	front: {target: [0, 0, 0], direction: [0, 0, 1], distance: 3.56},
	quarter: {target: [0, 0, 0], direction: [0.55, 0.35, 0.75], distance: 3.56},
	back: {target: [0, 0, 0], direction: [-0.6, 0.25, -0.75], distance: 3.56},
	top: {target: [0, 0.2, 0], direction: [0, 1, 0.15], distance: 2.6},
	// the head stone, seen from above
	head: {target: [0, 0.43, 0], direction: [0, 0.8, 0.6], distance: 1},
	// polished metal next to the side stones
	side: {target: [0.25, 0.25, 0], direction: [0.5, 0.3, 1], distance: 1.2},
};

const createMetalMaterial = () =>
	new SDV.MaterialStandardData({
		color: "#fec07a",
		roughness: 0,
		metalness: 1,
	});

const createGemMaterial = () =>
	new SDV.MaterialGemData({
		envMap: GEM_ENVIRONMENT_MAP,
		refractionIndex: 2.42,
		impurityMap: undefined,
		impurityScale: 0,
		colorTransferBegin: "#ffffff",
		colorTransferEnd: "#ffffff",
		// The viewer offsets 1 / IOR per channel by dispersion * 0.025. The
		// reference offsets the IOR itself by 0.01, which is about 0.0017 on
		// 1 / IOR at an IOR of 2.42.
		dispersion: 0.07,
		tracingDepth: 5,
		tracingOpacity: 1,
		// tuned by eye: the reference shows bright facets next to dark ones
		contrast: 1.8,
	});

(async () => {
	// The session is created before the viewport, so that the materials are
	// replaced before the geometry is converted for the first time.
	const session = await SDV.createSession({
		id: "mySession",
		ticket: "ff2d434cd0e8e47f83922bd268196900abbf6710523cf834b936a7ba5d0a5674847c74952ecf318088e5ff845b857eb88d24033d00fae25d5ab43ae23daf03386b4a928e6a4892b084d225a3ce5c5ec7a8a5e2a4651bef0a973604ce9c901e14f17e6c1ea9aac9-d581d7f0d70538922858d020e15b4087",
		modelViewUrl: "https://sdr8euc1.eu-central-1.shapediver.com",
		directTextureDownload: true,
	});

	const applyMaterials = (node: SDV.ITreeNode) => {
		node.traverseData((d) => {
			if (!(d instanceof SDV.GeometryData)) return;
			const name = d.material?.name ?? "";
			if (GEM_MATERIAL_NAMES.test(name)) {
				d.material = createGemMaterial();
				d.material.name = name;
			} else if (METAL_MATERIAL_NAMES.test(name)) {
				d.material = createMetalMaterial();
				d.material.name = name;
			}
		});
	};
	// `?late=1` replaces the materials after the viewport displayed the model
	if (!LATE) applyMaterials(session.node);

	const viewport = await SDV.createViewport({
		id: "myViewport",
		canvas: <HTMLCanvasElement>document.getElementById("canvas"),
		visibility: SDV.VISIBILITY_MODE.MANUAL,
	});

	// the materials are replaced again whenever the outputs are updated
	session.updateCallback = (newNode?: SDV.ITreeNode) => {
		if (!newNode) return;
		applyMaterials(newNode);
		newNode.updateVersion();
		viewport.update();
	};

	// scene setup matching the reference
	viewport.environmentMap = SCENE_ENVIRONMENT_MAP;
	viewport.environmentMapIntensity = 1;
	viewport.environmentMapAsBackground = false;
	viewport.environmentMapPbrMode = SDV.ENVIRONMENT_MAP_PBR_MODE.MODERN;
	// The background does not bloom (`backgroundBloom: false` below). The grey
	// stays only because the reference's white background is tone mapped to a
	// light grey.
	viewport.clearColor = "#e4e4e4";
	viewport.clearAlpha = 1;
	viewport.toneMapping = SDV.TONE_MAPPING.ACES_FILMIC;
	viewport.groundPlaneVisibility = false;
	viewport.gridVisibility = false;
	// tuned by eye towards the soft, faint ground shadow of the reference
	viewport.contactShadowVisibility = true;
	viewport.contactShadowBlur = 3.5;
	viewport.contactShadowDarkness = 1.5;
	viewport.contactShadowOpacity = 0.6;
	// contact darkening in crevices and a glow on the brightest highlights
	viewport.postProcessing.hdr = true;
	viewport.postProcessing.addEffect({
		type: SDV.POST_PROCESSING_EFFECT_TYPE.HBAO,
		properties: {},
	});
	viewport.postProcessing.addEffect({
		type: SDV.POST_PROCESSING_EFFECT_TYPE.BLOOM,
		properties: {
			intensity: 0.8,
			luminanceThreshold: 1.2,
			luminanceSmoothing: 0.4,
			mipmapBlur: true,
			backgroundBloom: false,
		},
	});
	viewport.maximumRenderingSize = {width: 3840, height: 2160};

	if (viewport.camera?.type === SDV.CAMERA_TYPE.PERSPECTIVE)
		(<SDV.IPerspectiveCameraApi>viewport.camera).fov = 25;

	// Comparison shots, selected with `?shot=<name>`. They are defined
	// relative to the bounding box of the ring (r = right, u = up, a = along
	// the ring axis towards the viewer, all in multiples of the ring height),
	// so that the same shot can be set up in the reference scene.
	const shot = SHOTS[new URLSearchParams(location.search).get("shot") ?? ""];
	const box = session.getOutputByName("ring")[0]?.node?.boundingBox;
	if (shot && box) {
		const height = box.max[2] - box.min[2];
		const center = [0, 1, 2].map((i) => (box.min[i] + box.max[i]) / 2);
		// the model is z-up and its ring axis is the y-axis
		const toWorld = ([r, u, a]: number[]): [number, number, number] => [
			center[0] + r * height,
			center[1] - a * height,
			center[2] + u * height,
		];
		const length = Math.hypot(...shot.direction);
		await viewport.camera?.set(
			toWorld(
				shot.target.map(
					(t, i) => t + (shot.direction[i] / length) * shot.distance,
				),
			),
			toWorld(shot.target),
			{duration: 0},
		);
	} else {
		await viewport.camera?.zoomTo(undefined, {duration: 0});
	}

	viewport.show = true;
	if (LATE) {
		viewport.render();
		applyMaterials(session.node);
		session.node.updateVersion();
		viewport.updateNode(session.node);
		viewport.render();
	}
	// read by capture.mjs
	(<any>window).exampleReady = true;
})();
