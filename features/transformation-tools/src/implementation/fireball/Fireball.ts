import {Box, IMapData, IViewportApi, MaterialEngine} from "@shapediver/viewer";
import {
	createDrawingTools,
	IDrawingToolsApi,
	IDrawingToolsEvent,
} from "@shapediver/viewer.features.drawing-tools";
import {Plane} from "@shapediver/viewer.shared.math";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE_DRAWING_TOOLS,
} from "@shapediver/viewer.shared.services";
import {mat4, vec3} from "gl-matrix";
import {
	FireballSettingsOptional,
	IFireball,
} from "../../interfaces/fireball/IFireball";
import {TransformationToolsManager} from "../TransformationToolsManager";

const rotationDefaultTextures: {[key: string]: Promise<IMapData> | IMapData} =
	{};

rotationDefaultTextures["variation_0"] = MaterialEngine.instance
	.loadMap("https://viewer.shapediver.com/v3/graphics/refresh.png")
	.then((mapData: IMapData | undefined) => {
		rotationDefaultTextures["variation_0"] = mapData!;
		return mapData!;
	});

export class Fireball extends TransformationToolsManager implements IFireball {
	readonly #drawingTools: IDrawingToolsApi;
	readonly #rotationDrawingTools: IDrawingToolsApi | undefined;
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #plane: Plane;
	readonly #enableUniformScaling: boolean;
	readonly #enableRotation: boolean;

	// Mapping between drawing-tools indices and the 8-point conceptual space
	// Conceptual layout: [C0, M1, C2, M3, C4, M5, C6, M7]
	//   Corners (even): C0=BL, C2=BR, C4=TR, C6=TL
	//   Mids X (horiz): M1=bottom, M5=top  (showMidpointsX)
	//   Mids Y (vert):  M3=right,  M7=left (showMidpointsY)
	readonly #dtToConceptual: number[];
	readonly #conceptualToDT: number[];

	readonly #currentTransformationMatrix: mat4 = mat4.create();
	#localPoints: vec3[] = [];
	#initialLocalPoints: vec3[] = [];
	#rotationHandleLocalPoint: vec3 = vec3.create();
	#showMidpointsX: boolean;
	#showMidpointsY: boolean;

	#rotationHandleDistance: number = 0.25;

	constructor(
		viewport: IViewportApi,
		nodes: ITreeNode[],
		settings?: FireballSettingsOptional,
	) {
		super(viewport, nodes, settings);

		const initialTransformationMatrix = this.initialize();
		mat4.copy(
			this.#currentTransformationMatrix,
			initialTransformationMatrix,
		);

		// create the shared BB from the nodes so that
		// we can create points around it
		const box = new Box();
		nodes.forEach((node) => box.union(node.boundingBox));

		const planeDefinition = settings!.plane!;

		const plane = new Plane(
			planeDefinition.vector_u!,
			planeDefinition.vector_v!,
			-vec3.dot(
				vec3.normalize(
					vec3.create(),
					vec3.cross(
						vec3.create(),
						planeDefinition.vector_u!,
						planeDefinition.vector_v!,
					),
				),
				planeDefinition.origin!,
			),
		);
		this.#plane = plane;
		this.#enableUniformScaling = settings!.enableUniformScaling ?? true;
		this.#enableRotation = settings!.enableRotation ?? true;
		this.#showMidpointsX = settings!.showMidpointsX ?? true;
		this.#showMidpointsY = settings!.showMidpointsY ?? true;

		// project the 8 corners of the bounding box onto the plane
		let projectedPoints: vec3[] = [];
		for (let i = 0; i < 8; i++) {
			const point = vec3.fromValues(
				box.min[0] + (i & 1) * (box.max[0] - box.min[0]),
				box.min[1] + ((i >> 1) & 1) * (box.max[1] - box.min[1]),
				box.min[2] + ((i >> 2) & 1) * (box.max[2] - box.min[2]),
			);
			projectedPoints.push(plane.clampPoint(point));
		}

		for (let i = 0; i < projectedPoints.length; i++)
			projectedPoints[i] = this.#plane.convertFromWSToLS(
				projectedPoints[i],
			);

		const min = vec3.fromValues(
			Math.min(...projectedPoints.map((p) => p[0])),
			Math.min(...projectedPoints.map((p) => p[1])),
			0,
		);
		const max = vec3.fromValues(
			Math.max(...projectedPoints.map((p) => p[0])),
			Math.max(...projectedPoints.map((p) => p[1])),
			0,
		);

		// Build the full 8-point conceptual array (corners + mids)
		const initPoints: vec3[] = [
			vec3.fromValues(min[0], min[1], 0), // C0
			vec3.fromValues((min[0] + max[0]) / 2, min[1], 0), // M1
			vec3.fromValues(max[0], min[1], 0), // C2
			vec3.fromValues(max[0], (min[1] + max[1]) / 2, 0), // M3
			vec3.fromValues(max[0], max[1], 0), // C4
			vec3.fromValues((min[0] + max[0]) / 2, max[1], 0), // M5
			vec3.fromValues(min[0], max[1], 0), // C6
			vec3.fromValues(min[0], (min[1] + max[1]) / 2, 0), // M7
		];
		this.#initialLocalPoints = initPoints.map((p) => vec3.clone(p));
		this.#localPoints = initPoints.map((p) => vec3.clone(p));

		// Build index mappings between drawing-tools and conceptual space
		const dtToConceptual: number[] = [];
		const conceptualToDT: number[] = new Array(8).fill(-1);
		for (let ci = 0; ci < 8; ci++) {
			const isMidX = ci === 1 || ci === 5;
			const isMidY = ci === 3 || ci === 7;
			if (isMidX && !this.#showMidpointsX) continue;
			if (isMidY && !this.#showMidpointsY) continue;
			conceptualToDT[ci] = dtToConceptual.length;
			dtToConceptual.push(ci);
		}
		this.#dtToConceptual = dtToConceptual;
		this.#conceptualToDT = conceptualToDT;

		// Build DT initial world-space points from the mapping
		const dtWorldPoints = dtToConceptual.map((ci) => {
			const wp = this.#plane.convertFromLSToWS(this.#localPoints[ci]);
			return [wp[0], wp[1], wp[2]];
		});

		this.#drawingTools = createDrawingTools(
			viewport,
			{
				onUpdate: (pointsData, metaData) => {
					console.log("Points data:", pointsData);
					console.log("Meta data:", metaData);
				},
				onCancel: () => {
					console.log("Drawing tool cancelled");
				},
			},
			{
				general: {},
				geometry: {
					mode: "lines",
					points: dtWorldPoints,
					close: true,
					minPoints: dtWorldPoints.length,
					maxPoints: dtWorldPoints.length,
				},
				restrictions: {
					plane: planeDefinition,
				},
				visualization: {
					distanceLabels: false,
					pointerPosition: false,
					points: {
						size_0: 30,
						size_1: 35,
						size_2: 30,
						size_3: 35,
						color_0: "#0d44f0",
						color_1: "#0d44f0",
						color_2: "#0d44f0",
						color_3: "#0d44f0",
					},
					lines: {
						color: "#0d44f0",
					},
				},
			},
		);

		// Create rotation handle drawing tools if enabled
		if (this.#enableRotation) {
			const rotHandleDist =
				(max[1] - min[1]) * this.#rotationHandleDistance; // distance above top edge
			this.#rotationHandleLocalPoint = vec3.fromValues(
				(min[0] + max[0]) / 2,
				max[1] + rotHandleDist,
				0,
			);
			const rotHandleWS = this.#plane.convertFromLSToWS(
				this.#rotationHandleLocalPoint,
			);
			this.#rotationDrawingTools = createDrawingTools(
				viewport,
				{onUpdate: () => {}, onCancel: () => {}},
				{
					general: {},
					geometry: {
						mode: "points",
						points: [
							[rotHandleWS[0], rotHandleWS[1], rotHandleWS[2]],
						],
						minPoints: 1,
						maxPoints: 1,
					},
					restrictions: {plane: planeDefinition},
					visualization: {
						distanceLabels: false,
						pointerPosition: false,
						points: {
							size_0: 50,
							size_1: 50,
							size_2: 50,
							size_3: 50,
							color_0: "#000",
							color_1: "#000",
							color_2: "#000",
							color_3: "#000",
						},
					},
				},
				rotationDefaultTextures,
			);
		}

		this.#eventEngine.addListener(EVENTTYPE_DRAWING_TOOLS.DRAG_MOVE, (e) =>
			this.dispatchDrag(e as IDrawingToolsEvent, false),
		);
		this.#eventEngine.addListener(EVENTTYPE_DRAWING_TOOLS.DRAG_END, (e) =>
			this.dispatchDrag(e as IDrawingToolsEvent, true),
		);
	}

	private dispatchDrag(ev: IDrawingToolsEvent, commit: boolean): void {
		if (
			this.#enableRotation &&
			ev.drawingToolId === this.#rotationDrawingTools?.uuid
		) {
			this.handleRotationDrag(ev, commit);
		} else if (ev.drawingToolId === this.#drawingTools.uuid) {
			this.handleRectDrag(ev, commit);
		}
	}

	// Push all 8 conceptual local-space points back to the DT and optionally commit.
	private flushRectPoints(localPoints: vec3[], temporary: boolean): void {
		for (let ci = 0; ci < 8; ci++) {
			const di = this.#conceptualToDT[ci];
			if (di < 0) continue;
			const wp = this.#plane.convertFromLSToWS(localPoints[ci]);
			this.#drawingTools.movePoint(di, [wp[0], wp[1], wp[2]], temporary);
		}
	}

	private recomputeRotationHandle(
		localPoints: vec3[],
		temporary: boolean,
	): void {
		if (!this.#enableRotation || !this.#rotationDrawingTools) return;
		// Place handle above M5 at rotationHandleDistance * height, consistent
		// with the initial placement in the constructor.
		const center = vec3.fromValues(
			(localPoints[0][0] + localPoints[4][0]) / 2,
			(localPoints[0][1] + localPoints[4][1]) / 2,
			0,
		);
		const m5 = localPoints[5];
		const dist = 2 * this.#rotationHandleDistance;
		const newHandle = vec3.fromValues(
			m5[0] + dist * (m5[0] - center[0]),
			m5[1] + dist * (m5[1] - center[1]),
			0,
		);
		this.#rotationHandleLocalPoint = newHandle;
		const hwp = this.#plane.convertFromLSToWS(newHandle);
		this.#rotationDrawingTools.movePoint(
			0,
			[hwp[0], hwp[1], hwp[2]],
			temporary,
		);
	}

	private handleRectDrag(ev: IDrawingToolsEvent, commit: boolean): void {
		const dtIndex =
			typeof ev.index === "number" ? ev.index : ev.indices![0];
		const ci = this.#dtToConceptual[dtIndex];
		const p = ev.points![dtIndex];
		const movedLS = this.#plane.convertFromWSToLS(
			vec3.fromValues(p[0], p[1], p[2]),
		);

		const adjusted =
			ci % 2 === 0
				? this.cornerPointMoved(ci, movedLS)
				: this.midPointMoved(ci, movedLS);

		this.flushRectPoints(adjusted, !commit);
		this.recomputeRotationHandle(adjusted, !commit);

		if (commit) this.#localPoints = adjusted;

		this.calculateTransformationMatrix(adjusted, commit);
	}

	private handleRotationDrag(ev: IDrawingToolsEvent, commit: boolean): void {
		const newHandleLS = this.#plane.convertFromWSToLS(
			vec3.fromValues(
				ev.points![0][0],
				ev.points![0][1],
				ev.points![0][2],
			),
		);

		// Rectangle center in local space
		const cx = (this.#localPoints[0][0] + this.#localPoints[4][0]) / 2;
		const cy = (this.#localPoints[0][1] + this.#localPoints[4][1]) / 2;

		const currVec = vec3.subtract(
			vec3.create(),
			this.#rotationHandleLocalPoint,
			vec3.fromValues(cx, cy, 0),
		);
		const newVec = vec3.subtract(
			vec3.create(),
			newHandleLS,
			vec3.fromValues(cx, cy, 0),
		);

		const deltaAngle =
			Math.atan2(newVec[1], newVec[0]) -
			Math.atan2(currVec[1], currVec[0]);
		const cos = Math.cos(deltaAngle);
		const sin = Math.sin(deltaAngle);

		// Rotate all local points and the handle around the center
		const rotated = this.#localPoints.map((p) => {
			const du = p[0] - cx;
			const dv = p[1] - cy;
			return vec3.fromValues(
				cx + du * cos - dv * sin,
				cy + du * sin + dv * cos,
				0,
			);
		});
		const dhU = this.#rotationHandleLocalPoint[0] - cx;
		const dhV = this.#rotationHandleLocalPoint[1] - cy;
		const newHandleRotated = vec3.fromValues(
			cx + dhU * cos - dhV * sin,
			cy + dhU * sin + dhV * cos,
			0,
		);

		// Update DT points
		this.flushRectPoints(rotated, !commit);
		const hwp = this.#plane.convertFromLSToWS(newHandleRotated);
		this.#rotationDrawingTools!.movePoint(
			0,
			[hwp[0], hwp[1], hwp[2]],
			!commit,
		);

		// Rotation always updates #localPoints incrementally so subsequent
		// events see the correct current angle
		this.#localPoints = rotated;
		this.#rotationHandleLocalPoint = newHandleRotated;

		this.calculateTransformationMatrix(rotated, commit);
	}

	private calculateTransformationMatrix(
		localPoints: vec3[],
		commit: boolean,
	): void {
		// Derive a general 2D affine in the plane's local space that maps
		// the initial rectangle to the current one using corners C0, C2, C6.
		const newC0 = localPoints[0];
		const newC2 = localPoints[2];
		const newC6 = localPoints[6];
		const initC0 = this.#initialLocalPoints[0];
		const initW =
			this.#initialLocalPoints[2][0] - this.#initialLocalPoints[0][0];
		const initH =
			this.#initialLocalPoints[6][1] - this.#initialLocalPoints[0][1];

		// New basis columns (handle scale + rotation)
		const aU = (newC2[0] - newC0[0]) / initW;
		const aV = (newC2[1] - newC0[1]) / initW;
		const bU = (newC6[0] - newC0[0]) / initH;
		const bV = (newC6[1] - newC0[1]) / initH;

		// Translation: t = newC0 - A * initC0
		const txLS = newC0[0] - aU * initC0[0] - bU * initC0[1];
		const tyLS = newC0[1] - aV * initC0[0] - bV * initC0[1];

		// Column-major 4Ã—4 affine (scale + rotation + translation in LS)
		const mAffineLS = mat4.fromValues(
			aU,
			aV,
			0,
			0,
			bU,
			bV,
			0,
			0,
			0,
			0,
			1,
			0,
			txLS,
			tyLS,
			0,
			1,
		);

		// Plane LS â†” WS matrices
		const planeOrigin = vec3.scale(
			vec3.create(),
			this.#plane.normal,
			-this.#plane.constant,
		);
		const mLStoWS = mat4.fromValues(
			this.#plane.vector_u[0],
			this.#plane.vector_u[1],
			this.#plane.vector_u[2],
			0,
			this.#plane.vector_v[0],
			this.#plane.vector_v[1],
			this.#plane.vector_v[2],
			0,
			this.#plane.normal[0],
			this.#plane.normal[1],
			this.#plane.normal[2],
			0,
			planeOrigin[0],
			planeOrigin[1],
			planeOrigin[2],
			1,
		);
		const mWStoLS = mat4.invert(mat4.create(), mLStoWS);

		// M_ws_relative = M_ls_to_ws Ã— M_affine Ã— M_ws_to_ls
		const mWSRelative = mat4.multiply(
			mat4.create(),
			mLStoWS,
			mat4.multiply(mat4.create(), mAffineLS, mWStoLS),
		);

		// placeholderMatrix = M_ws_relative Ã— translation(initialOffset)
		mat4.multiply(
			this.#currentTransformationMatrix,
			mWSRelative,
			mat4.fromTranslation(mat4.create(), this.initialOffset),
		);

		if (commit) {
			this.updateObjectMatrices();
		} else {
			this.updateObjects();
		}
	}

	// Derive the rectangle's current basis from #localPoints.
	// Returns { origin (center), axisU (right), axisV (up) } all in plane local space.
	private getRectBasis(): {origin: vec3; axisU: vec3; axisV: vec3} {
		const c0 = this.#localPoints[0];
		const c2 = this.#localPoints[2];
		const c6 = this.#localPoints[6];
		const edgeU = vec3.subtract(vec3.create(), c2, c0);
		const edgeV = vec3.subtract(vec3.create(), c6, c0);
		const axisU =
			vec3.length(edgeU) > 0
				? vec3.normalize(vec3.create(), edgeU)
				: vec3.fromValues(1, 0, 0);
		const axisV =
			vec3.length(edgeV) > 0
				? vec3.normalize(vec3.create(), edgeV)
				: vec3.fromValues(0, 1, 0);
		const origin = vec3.fromValues(
			(c0[0] + this.#localPoints[4][0]) / 2,
			(c0[1] + this.#localPoints[4][1]) / 2,
			0,
		);
		return {origin, axisU, axisV};
	}

	// Project a plane-local point into the rectangle's own 2-D frame.
	private toRectFrame(
		p: vec3,
		basis: {origin: vec3; axisU: vec3; axisV: vec3},
	): {u: number; v: number} {
		const d = vec3.subtract(vec3.create(), p, basis.origin);
		return {u: vec3.dot(d, basis.axisU), v: vec3.dot(d, basis.axisV)};
	}

	// Convert a rectangle-frame (u,v) coordinate back to plane local space.
	private fromRectFrame(
		u: number,
		v: number,
		basis: {origin: vec3; axisU: vec3; axisV: vec3},
	): vec3 {
		return vec3.fromValues(
			basis.origin[0] + u * basis.axisU[0] + v * basis.axisV[0],
			basis.origin[1] + u * basis.axisU[1] + v * basis.axisV[1],
			0,
		);
	}

	// Build all 8 conceptual points from 4 corner UV coordinates [C0,C2,C4,C6].
	private cornersToFullPoints(
		cornerUVs: {u: number; v: number}[],
		basis: {origin: vec3; axisU: vec3; axisV: vec3},
	): vec3[] {
		const pts: vec3[] = new Array(8);
		pts[0] = this.fromRectFrame(cornerUVs[0].u, cornerUVs[0].v, basis);
		pts[2] = this.fromRectFrame(cornerUVs[1].u, cornerUVs[1].v, basis);
		pts[4] = this.fromRectFrame(cornerUVs[2].u, cornerUVs[2].v, basis);
		pts[6] = this.fromRectFrame(cornerUVs[3].u, cornerUVs[3].v, basis);
		for (let i = 1; i < 8; i += 2) {
			pts[i] = vec3.fromValues(
				(pts[(i + 7) % 8][0] + pts[(i + 1) % 8][0]) / 2,
				(pts[(i + 7) % 8][1] + pts[(i + 1) % 8][1]) / 2,
				0,
			);
		}
		return pts;
	}

	private midPointMoved(index: number, movedLS: vec3): vec3[] {
		const basis = this.getRectBasis();

		// M1,M5 lie on U-axis edges -> only V coordinate changes (scale in V)
		// M3,M7 lie on V-axis edges -> only U coordinate changes (scale in U)
		const n = (index - 1) / 2;
		const isUEdge = n % 2 === 0;

		const movedUV = this.toRectFrame(movedLS, basis);

		let c0uv = this.toRectFrame(this.#localPoints[0], basis);
		let c2uv = this.toRectFrame(this.#localPoints[2], basis);
		let c4uv = this.toRectFrame(this.#localPoints[4], basis);
		let c6uv = this.toRectFrame(this.#localPoints[6], basis);

		if (isUEdge) {
			if (index === 1) {
				c0uv = {u: c0uv.u, v: movedUV.v};
				c2uv = {u: c2uv.u, v: movedUV.v};
			} else {
				c4uv = {u: c4uv.u, v: movedUV.v};
				c6uv = {u: c6uv.u, v: movedUV.v};
			}
		} else {
			if (index === 3) {
				c2uv = {u: movedUV.u, v: c2uv.v};
				c4uv = {u: movedUV.u, v: c4uv.v};
			} else {
				c0uv = {u: movedUV.u, v: c0uv.v};
				c6uv = {u: movedUV.u, v: c6uv.v};
			}
		}

		return this.cornersToFullPoints([c0uv, c2uv, c4uv, c6uv], basis);
	}

	private cornerPointMoved(index: number, movedLS: vec3): vec3[] {
		const basis = this.getRectBasis();

		const movedUV = this.toRectFrame(movedLS, basis);

		let c0uv = this.toRectFrame(this.#localPoints[0], basis);
		let c2uv = this.toRectFrame(this.#localPoints[2], basis);
		let c4uv = this.toRectFrame(this.#localPoints[4], basis);
		let c6uv = this.toRectFrame(this.#localPoints[6], basis);

		// n=0->C0: controls left U and bottom V
		// n=1->C2: controls right U and bottom V
		// n=2->C4: controls right U and top V
		// n=3->C6: controls left U and top V
		const n = index / 2;
		const controlsLeft = n === 0 || n === 3;
		const controlsBottom = n < 2;

		let du = movedUV.u;
		let dv = movedUV.v;

		if (this.#enableUniformScaling) {
			const prevUV = this.toRectFrame(this.#localPoints[index], basis);
			const signU = controlsLeft ? -1 : 1;
			const signV = controlsBottom ? -1 : 1;
			const deltaU = signU * (movedUV.u - prevUV.u);
			const deltaV = signV * (movedUV.v - prevUV.v);
			const d = Math.abs(deltaU) < Math.abs(deltaV) ? deltaU : deltaV;
			du = prevUV.u + signU * d;
			dv = prevUV.v + signV * d;
		}

		if (controlsLeft) {
			c0uv = {u: du, v: c0uv.v};
			c6uv = {u: du, v: c6uv.v};
		} else {
			c2uv = {u: du, v: c2uv.v};
			c4uv = {u: du, v: c4uv.v};
		}
		if (controlsBottom) {
			c0uv = {u: c0uv.u, v: dv};
			c2uv = {u: c2uv.u, v: dv};
		} else {
			c4uv = {u: c4uv.u, v: dv};
			c6uv = {u: c6uv.u, v: dv};
		}

		return this.cornersToFullPoints([c0uv, c2uv, c4uv, c6uv], basis);
	}
	protected get transformationToolsPlaceholderMatrix(): mat4 {
		return this.#currentTransformationMatrix;
	}

	public get type(): "fireball" {
		return "fireball";
	}

	protected closeLogic(): void {
		console.warn("Close logic not implemented in fireball");
	}
	protected onKeyDownLogic(
		event: KeyboardEvent,
		pointerInCanvas: boolean,
	): void {
		console.warn(
			"Key down event not handled in fireball",
			event,
			pointerInCanvas,
		);
	}
	protected onKeyUpLogic(
		event: KeyboardEvent,
		pointerInCanvas: boolean,
	): void {
		console.warn(
			"Key up event not handled in fireball",
			event,
			pointerInCanvas,
		);
	}
	protected onPointerDownLogic(event: PointerEvent): void {
		console.warn("Pointer down event not handled in fireball", event);
	}
	protected onPointerEndLogic(event: PointerEvent): void {
		console.warn("Pointer end event not handled in fireball", event);
	}
	protected onPointerMoveLogic(event: PointerEvent): void {
		console.warn("Pointer move event not handled in fireball", event);
	}
	protected onPointerOutLogic(event: PointerEvent): void {
		console.warn("Pointer out event not handled in fireball", event);
	}
	protected onPointerUpLogic(event: PointerEvent): void {
		console.warn("Pointer up event not handled in fireball", event);
	}
}
