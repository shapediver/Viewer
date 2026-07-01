import * as SDV from "@shapediver/viewer";
import {type IDirectionalLightApi, LIGHT_TYPE} from "@shapediver/viewer";
import {
	createDrawingTools,
	type IDrawingToolsApi,
	type IDrawingToolsEvent,
	type IEdgeControl,
	type PointsData,
	type RayTraceResult,
	RESTRICTION_TYPE,
	Settings} from "@shapediver/viewer.features.drawing-tools";
import {
	createCustomUi,
	type IBooleanElement,
	type IDropdownElement,
	type ISliderElement} from "@shapediver/viewer.shared.demo-helper";
(<any>window).SDV = SDV;

// ─── Helper: status log overlay ────────────────────────────────────────────
const createStatusLog = () => {
	const logDiv = document.createElement("div");
	logDiv.id = "status-log";
	logDiv.style.cssText =
		"position:absolute;bottom:1rem;left:1rem;z-index:100;background:rgba(0,0,0,0.7);" +
		"color:#0f0;font-family:monospace;font-size:12px;padding:8px 12px;border-radius:4px;" +
		"max-height:180px;overflow-y:auto;min-width:320px;pointer-events:none;";
	document.body.appendChild(logDiv);

	const maxLines = 12;
	const lines: string[] = [];

	return (msg: string) => {
		lines.push(msg);
		if (lines.length > maxLines) lines.shift();
		logDiv.innerHTML = lines.join("<br>");
		logDiv.scrollTop = logDiv.scrollHeight;
	};
};

(async () => {
	const log = createStatusLog();
	log("Initializing viewer…");

	// ─── Viewport ──────────────────────────────────────────────────────────
	const viewport = await SDV.createViewport({
		canvas: document.getElementById("canvas") as HTMLCanvasElement,
		id: "myViewport",
	});

	// ─── Session ───────────────────────────────────────────────────────────
	const session = await SDV.createSession({
		ticket: "4f55cd2f7a647e0f1ea41563597fddaa77ee3ba2be450d2940b322015f2711744da21c252e0b133b56921a738e14636dc861cd7c3c0e5b23f58fac75c024c3f051c1ef1ea70add71dada25b1ec36efb1c563fa7270b5cab7f0a190ce50d81839fbbe5e86c47908-dba7ecfee7a1c6a4c53aa3203b6e4b23",
		modelViewUrl: "https://sdr8euc1.eu-central-1.shapediver.com",
		id: "mySession",
	});

	// ─── Shadow quality ────────────────────────────────────────────────────
	const lightScene = viewport.lightScene!;
	const lightsWithShadows: IDirectionalLightApi[] = <IDirectionalLightApi[]>(
		Object.values(lightScene.lights).filter(
			(l) =>
				l.type === LIGHT_TYPE.DIRECTIONAL &&
				(<IDirectionalLightApi>l).castShadow === true,
		)
	);
	for (const light of lightsWithShadows) {
		light.shadowMapResolution = 1024;
		light.shadowMapBias = -0.0005;
	}

	const geometryRestrictionOutput = session.getOutputByName(
		"GeometryRestriction",
	)[0].node!;

	// ═══════════════════════════════════════════════════════════════════════
	//  SETTINGS – showcasing everything new since 3.15.0
	// ═══════════════════════════════════════════════════════════════════════
	const customizationProperties: Settings = {
		// ── General (NEW: enableTranslation / enableInsertion / enableDeletion / enableSelection) ──
		general: {
			autoUpdate: true,
			displayUnit: "m",
			// NEW: individually toggle user capabilities
			enableTranslation: true,
			enableInsertion: true,
			enableDeletion: true,
			enableSelection: true,
		},

		// ── Edge controls (NEW: controls system) ──────────────────────────
		// Each edge control sits at the midpoint of an edge and drags both
		// endpoints together along the given direction.
		controls: [
			<IEdgeControl>{
				type: "edge",
				point1: 0,
				point2: 1,
				direction: [0, -1, 0], // drag edge 0→1 along -Y
			},
			<IEdgeControl>{
				type: "edge",
				point1: 1,
				point2: 2,
				direction: [-1, 0, 0], // drag edge 1→2 along -X
			},
			<IEdgeControl>{
				type: "edge",
				point1: 2,
				point2: 3,
				direction: [0, 1, 0], // drag edge 2→3 along +Y
			},
			<IEdgeControl>{
				type: "edge",
				point1: 3,
				point2: 0,
				direction: [1, 0, 0], // drag edge 3→0 along +X
			},
		],

		// ── Geometry ───────────────────────────────────────────────────────
		geometry: {
			points: [
				[20, -35, 0],
				[-45, -45, 0],
				[-50, 45, 0],
				[15, 40, 0],
			],
			autoClose: false,
			minPoints: 3,
			maxPoints: 25,
			// NEW: strict enforcement of min/max during drawing
			strictMinMaxPoints: true,
			// NEW: disabled points – index 0 is fixed and cannot be moved/deleted
			disabledPoints: [0],
			// NEW: position & size constraints
			constraints: {
				position: {
					z: [0, 100], // restrict Z between 0 and 100
				},
				size: {
					x: [-100, 100], // max width 50
					y: [-100, 100], // max depth 50
				},
			},
		},

		// ── Key bindings (renamed from 'controls' in 3.15) ────────────────
		keyBindings: {
			insert: ["Insert", "+"],
			delete: ["Delete", "-"],
			confirm: "Enter",
			cancel: "Escape",
			undo: "Control+Z",
			redo: "Control+Y",
		},

		// ── Restrictions ───────────────────────────────────────────────────
		restrictions: {
			geometry: {
				type: RESTRICTION_TYPE.GEOMETRY,
				nodes: [geometryRestrictionOutput],
				wireframeColor: "#ffffff",
				snapToEdges: false,
				snapToVertices: false,
			},
			plane: {
				type: RESTRICTION_TYPE.PLANE,
			},
		},
	};

	// ═══════════════════════════════════════════════════════════════════════
	//  CALLBACKS
	// ═══════════════════════════════════════════════════════════════════════
	const onUpdate = async (
		pointsData: PointsData,
		metaData: (RayTraceResult | undefined)[],
	) => {
		log(`Updated – ${pointsData.length} points`);
	};

	const onCancel = () => {
		log("Drawing cancelled");
	};

	// ═══════════════════════════════════════════════════════════════════════
	//  EVENTS – showcasing all event types (new since 3.15: SELECTED,
	//  DESELECTED, DRAG_START, DRAG_MOVE, DRAG_END, GEOMETRY_CHANGED)
	// ═══════════════════════════════════════════════════════════════════════
	SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.ADDED, (e: SDV.IEvent) => {
		const ev = e as IDrawingToolsEvent;
		log(`Point added at index ${ev.index}`);
		log(`Current points: ${JSON.stringify(drawingToolsApi.pointsData)}`);
	});

	SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.REMOVED, (e: SDV.IEvent) => {
		const ev = e as IDrawingToolsEvent;
		log(`Point removed at index ${ev.index}`);
		log(`Current points: ${JSON.stringify(drawingToolsApi.pointsData)}`);
	});

	SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.MOVED, (e: SDV.IEvent) => {
		const ev = e as IDrawingToolsEvent;
		if (!ev.temporary) {
			log(`Point ${ev.index} moved`);
			log(
				`Current points: ${JSON.stringify(drawingToolsApi.pointsData)}`,
			);
		}
	});

	SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.SELECTED, (e: SDV.IEvent) => {
		const ev = e as IDrawingToolsEvent;
		log(`Point ${ev.index} selected`);
	});

	SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.DESELECTED, (e: SDV.IEvent) => {
		const ev = e as IDrawingToolsEvent;
		log(`Point ${ev.index} deselected`);
	});

	SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.DRAG_START, (e: SDV.IEvent) => {
		const ev = e as IDrawingToolsEvent;
		log(`Drag started on point ${ev.index}`);
	});

	SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.DRAG_END, (e: SDV.IEvent) => {
		const ev = e as IDrawingToolsEvent;
		log(`Drag ended on point ${ev.index}`);
	});

	SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, () => {
		log("Geometry changed");
	});

	SDV.addListener(
		SDV.EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS,
		(e: SDV.IEvent) => {
			log(`⚠ Min points: ${(e as IDrawingToolsEvent).message}`);
		},
	);

	SDV.addListener(
		SDV.EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS,
		(e: SDV.IEvent) => {
			log(`⚠ Max points: ${(e as IDrawingToolsEvent).message}`);
		},
	);

	SDV.addListener(
		SDV.EVENTTYPE_DRAWING_TOOLS.UNCLOSED_LOOP,
		(e: SDV.IEvent) => {
			log(`⚠ Unclosed loop: ${(e as IDrawingToolsEvent).message}`);
		},
	);

	// ═══════════════════════════════════════════════════════════════════════
	//  CREATE DRAWING TOOLS (NEW: multiple instances supported)
	// ═══════════════════════════════════════════════════════════════════════
	const drawingToolsApi: IDrawingToolsApi = createDrawingTools(
		viewport,
		{onUpdate, onCancel},
		customizationProperties,
	);
	(window as any).drawingToolsApi = drawingToolsApi;
	log(`Drawing tools created (id: ${drawingToolsApi.uuid})`);

	// ═══════════════════════════════════════════════════════════════════════
	//  UI PANEL
	// ═══════════════════════════════════════════════════════════════════════
	const menuDiv = document.createElement("div");
	menuDiv.id = "menu";
	menuDiv.style.cssText =
		"position:absolute;top:1rem;left:1rem;z-index:100;max-height:90vh;overflow-y:auto;";
	document.body.appendChild(menuDiv);

	const elements: (IBooleanElement | ISliderElement | IDropdownElement)[] =
		[];

	// ── Labels ──────────────────────────────────────────────────────────
	elements.push(<IBooleanElement>{
		name: "show point labels",
		type: "boolean",
		value: drawingToolsApi.showPointLabels,
		onInputCallback: (value: boolean) => {
			drawingToolsApi.showPointLabels = value;
		},
	});

	elements.push(<IBooleanElement>{
		name: "show distance labels",
		type: "boolean",
		value: drawingToolsApi.showDistanceLabels,
		onInputCallback: (value: boolean) => {
			drawingToolsApi.showDistanceLabels = value;
		},
	});

	// ── NEW: Pause / Continue ──────────────────────────────────────────
	elements.push(<IBooleanElement>{
		name: "paused",
		type: "boolean",
		value: false,
		onInputCallback: (value: boolean) => {
			if (value) {
				drawingToolsApi.pause();
				log("Drawing tools paused");
			} else {
				drawingToolsApi.continue();
				log("Drawing tools resumed");
			}
		},
	});

	// ── NEW: enable/disable translation ────────────────────────────────
	elements.push(<IBooleanElement>{
		name: "enable translation (drag)",
		type: "boolean",
		value: true,
		onInputCallback: (_value: boolean) => {
			log(
				`Translation ${_value ? "enabled" : "disabled"} — recreate to apply`,
			);
		},
	});

	// ── NEW: enable/disable insertion ──────────────────────────────────
	elements.push(<IBooleanElement>{
		name: "enable insertion",
		type: "boolean",
		value: true,
		onInputCallback: (_value: boolean) => {
			log(
				`Insertion ${_value ? "enabled" : "disabled"} — recreate to apply`,
			);
		},
	});

	// ── NEW: enable/disable deletion ───────────────────────────────────
	elements.push(<IBooleanElement>{
		name: "enable deletion",
		type: "boolean",
		value: true,
		onInputCallback: (_value: boolean) => {
			log(
				`Deletion ${_value ? "enabled" : "disabled"} — recreate to apply`,
			);
		},
	});

	// ── NEW: enable/disable selection ──────────────────────────────────
	elements.push(<IBooleanElement>{
		name: "enable selection",
		type: "boolean",
		value: true,
		onInputCallback: (_value: boolean) => {
			log(
				`Selection ${_value ? "enabled" : "disabled"} — recreate to apply`,
			);
		},
	});

	// ── Undo / Redo status ─────────────────────────────────────────────
	elements.push(<IDropdownElement>{
		name: "undo / redo action",
		type: "dropdown",
		choices: ["(none)", "Undo", "Redo"],
		value: 0,
		onChangeCallback: (value: number) => {
			if (value === 1 && drawingToolsApi.canUndo()) {
				drawingToolsApi.undo();
				log("Undo performed");
			} else if (value === 2 && drawingToolsApi.canRedo()) {
				drawingToolsApi.redo();
				log("Redo performed");
			} else if (value !== 0) {
				log("Nothing to undo/redo");
			}
		},
	});

	// ── Min / Max points ───────────────────────────────────────────────
	elements.push(<ISliderElement>{
		name: "min points",
		type: "slider",
		min: 1,
		max: 10,
		step: 1,
		value: 3,
	});

	elements.push(<ISliderElement>{
		name: "max points",
		type: "slider",
		min: 5,
		max: 50,
		step: 1,
		value: 25,
	});

	createCustomUi(elements, menuDiv);

	// ═══════════════════════════════════════════════════════════════════════
	//  CAMERA SWITCH
	// ═══════════════════════════════════════════════════════════════════════
	const imgCameraSwitch = document.createElement("img");
	imgCameraSwitch.src =
		"https://viewer.shapediver.com/v3/graphics/cameraswitch.svg";
	imgCameraSwitch.width = 50;
	imgCameraSwitch.height = 50;
	imgCameraSwitch.style.position = "absolute";
	imgCameraSwitch.style.right = "1rem";
	imgCameraSwitch.style.top = "1rem";
	imgCameraSwitch.onclick = async () => {
		if (viewport.camera?.type === SDV.CAMERA_TYPE.PERSPECTIVE) {
			viewport.assignCamera("top");
		} else {
			viewport.assignCamera("perspective");
		}
	};
	document.body.appendChild(imgCameraSwitch);

	log("Ready! Click on the geometry to start drawing.");
})();
