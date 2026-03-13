import {Box, IViewportApi} from "@shapediver/viewer";
import {
	createDrawingTools,
	IDrawingToolsApi,
} from "@shapediver/viewer.features.drawing-tools";
import {Plane} from "@shapediver/viewer.shared.math";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {mat4, vec3} from "gl-matrix";
import {
	FireballSettingsOptional,
	IFireball,
} from "../../interfaces/fireball/IFireball";
import {TransformationToolsManager} from "../TransformationToolsManager";

export class Fireball extends TransformationToolsManager implements IFireball {
	readonly #drawingTools: IDrawingToolsApi;

	constructor(
		viewport: IViewportApi,
		nodes: ITreeNode[],
		settings?: FireballSettingsOptional,
	) {
		super(viewport, nodes, settings);

		const initialTransformationMatrix = this.initialize();

		// create the shared BB from the nodes so that
		// we can create points around it
		const box = new Box();
		nodes.forEach((node) => box.union(node.boundingBox));

		// now with the plane defined in the settings
		// and the bounding box we can create the points for the fireball
		// we create 4 corner points and 4 mid points
		// all points are on the plane

		const planeDefinition = settings!.plane!;
		const cross = vec3.cross(
			vec3.create(),
			planeDefinition.vector_u!,
			planeDefinition.vector_v!,
		);

		const plane = new Plane(
			cross,
			-vec3.dot(cross, planeDefinition.origin!),
		);

		// project the 8 points of the bounding box on the plane
		let projectedPoints: vec3[] = [];
		for (let i = 0; i < 8; i++) {
			const point = vec3.fromValues(
				box.min[0] + (i & 1) * (box.max[0] - box.min[0]),
				box.min[1] + ((i >> 1) & 1) * (box.max[1] - box.min[1]),
				box.min[2] + ((i >> 2) & 1) * (box.max[2] - box.min[2]),
			);
			const projectedPoint = plane.clampPoint(point);
			projectedPoints.push(projectedPoint);
		}

		// now that we have the projected points we can calculate the
		// 4 corner points and 4 mid points
		// we therefore need to transform the projected points to the local space of the plane
		// and then find the largest rectangle that can be inscribed in the projected points
		for (let i = 0; i < projectedPoints.length; i++) {
			const projectedPoint = projectedPoints[i];
			const localPoint = vec3.create();
			vec3.subtract(localPoint, projectedPoint, planeDefinition.origin!);
			localPoint[0] = vec3.dot(localPoint, planeDefinition.vector_u!);
			localPoint[1] = vec3.dot(localPoint, planeDefinition.vector_v!);
			localPoint[2] = 0;
			projectedPoints[i] = localPoint;
		}

		// find the largest rectangle that can be inscribed in the projected points
		// we can do this by finding the min and max of the projected points in the local space of the plane
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

		// now we can create the 4 corner points and 4 mid points
		const points = [
			[min[0], min[1], 0],
			[(min[0] + max[0]) / 2, min[1], 0],
			[max[0], min[1], 0],
			[max[0], (min[1] + max[1]) / 2, 0],
			[max[0], max[1], 0],
			[(min[0] + max[0]) / 2, max[1], 0],
			[min[0], max[1], 0],
			[min[0], (min[1] + max[1]) / 2, 0],
		];

		console.log("adding drawing tools with points:", points);
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
					points: [...points],
					close: true,
					minPoints: 8,
					maxPoints: 8,
				},
				restrictions: {
					plane: planeDefinition,
				},
				visualization: {
					distanceLabels: false,
					points: {
						size_0: 15,
						size_1: 20,
						size_2: 15,
						size_3: 20,
						size_4: 15,
						size_5: 20,
						color_0: "#000",
						color_1: "#888",
						color_2: "#fff",
						color_3: "#888",
						color_4: "#888",
						color_5: "#888",
					},
					lines: {
						color: "#000",
					},
				},
			},
		);
	}

	protected get transformationToolsPlaceholderMatrix(): mat4 {
		return mat4.create();
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
