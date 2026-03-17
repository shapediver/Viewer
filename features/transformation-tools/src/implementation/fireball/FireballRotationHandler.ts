import {IMapData, IViewportApi, MaterialEngine} from "@shapediver/viewer";
import {
	IDrawingToolsApi,
	IDrawingToolsEvent,
	createDrawingTools,
} from "@shapediver/viewer.features.drawing-tools";
import {PlaneRestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {Plane} from "@shapediver/viewer.shared.math";

import {vec3} from "gl-matrix";

const rotationDefaultTextures: {[key: string]: Promise<IMapData> | IMapData} =
	{};

rotationDefaultTextures["variation_0"] = MaterialEngine.instance
	.loadMap("https://viewer.shapediver.com/v3/graphics/refresh.png")
	.then((mapData: IMapData | undefined) => {
		rotationDefaultTextures["variation_0"] = mapData!;
		return mapData!;
	});

export class FireballRotationHandler {
	readonly #drawingTools: IDrawingToolsApi;
	readonly #handleDistance: number;
	readonly #plane: Plane;

	#handleLocalPoint: vec3;

	constructor(
		viewport: IViewportApi,
		planeDefinition: PlaneRestrictionProperties,
		plane: Plane,
		localPoints: vec3[],
		handleDistance: number,
	) {
		this.#plane = plane;
		this.#handleDistance = handleDistance;

		// Place the handle above the top edge (M5) by handleDistance * height
		const min = localPoints[0]; // C0 in local space (bottom-left)
		const max = localPoints[4]; // C4 in local space (top-right)
		const rotHandleDist = (max[1] - min[1]) * handleDistance;
		this.#handleLocalPoint = vec3.fromValues(
			(min[0] + max[0]) / 2,
			max[1] + rotHandleDist,
			0,
		);

		const ws = plane.convertFromLSToWS(this.#handleLocalPoint);
		this.#drawingTools = createDrawingTools(
			viewport,
			{onUpdate: () => {}, onCancel: () => {}},
			{
				general: {},
				geometry: {
					mode: "points",
					points: [[ws[0], ws[1], ws[2]]],
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

	public get drawingTools(): IDrawingToolsApi {
		return this.#drawingTools;
	}

	public get handleLocalPoint(): vec3 {
		return this.#handleLocalPoint;
	}

	/**
	 * Apply the drag result by updating the handle position and moving the drawing-tools point.
	 * @param newHandle
	 * @param temporary
	 */
	public applyDrag(newHandle: vec3, temporary: boolean): void {
		this.#handleLocalPoint = newHandle;
		const hwp = this.#plane.convertFromLSToWS(newHandle);
		this.#drawingTools.movePoint(0, [hwp[0], hwp[1], hwp[2]], temporary);
	}

	/**
	 * Process a drag event on the rotation handle, computing the new rectangle points and handle position.
	 * @param ev
	 * @param localPoints
	 * @returns
	 */
	public computeDrag(
		ev: IDrawingToolsEvent,
		localPoints: vec3[],
	): {rotated: vec3[]; newHandle: vec3} {
		const newHandleLS = this.#plane.convertFromWSToLS(
			vec3.fromValues(
				ev.points![0][0],
				ev.points![0][1],
				ev.points![0][2],
			),
		);

		const cx = (localPoints[0][0] + localPoints[4][0]) / 2;
		const cy = (localPoints[0][1] + localPoints[4][1]) / 2;

		const currVec = vec3.subtract(
			vec3.create(),
			this.#handleLocalPoint,
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

		const rotated = localPoints.map((p) => {
			const du = p[0] - cx;
			const dv = p[1] - cy;
			return vec3.fromValues(
				cx + du * cos - dv * sin,
				cy + du * sin + dv * cos,
				0,
			);
		});

		const dhU = this.#handleLocalPoint[0] - cx;
		const dhV = this.#handleLocalPoint[1] - cy;
		const newHandle = vec3.fromValues(
			cx + dhU * cos - dhV * sin,
			cy + dhU * sin + dhV * cos,
			0,
		);

		return {rotated, newHandle};
	}

	/**
	 * Recompute the handle position based on the new rectangle points, and move the drawing-tools point accordingly.
	 * @param localPoints
	 * @param temporary
	 */
	public recompute(localPoints: vec3[], temporary: boolean): void {
		const center = vec3.fromValues(
			(localPoints[0][0] + localPoints[4][0]) / 2,
			(localPoints[0][1] + localPoints[4][1]) / 2,
			0,
		);
		const m5 = localPoints[5];
		const dist = 2 * this.#handleDistance;
		const newHandle = vec3.fromValues(
			m5[0] + dist * (m5[0] - center[0]),
			m5[1] + dist * (m5[1] - center[1]),
			0,
		);
		this.#handleLocalPoint = newHandle;
		const hwp = this.#plane.convertFromLSToWS(newHandle);
		this.#drawingTools.movePoint(0, [hwp[0], hwp[1], hwp[2]], temporary);
	}
}
