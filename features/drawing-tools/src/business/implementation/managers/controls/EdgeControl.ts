import {IRay} from "@shapediver/viewer.shared.types";

import {quat, vec3} from "gl-matrix";

import {
	GetPositionFn,
	MoveTemporaryFn,
} from "../../../interfaces/controls/IControl";
import {IEdgeControl} from "../../../interfaces/controls/IEdgeControl";

/**
 * Runtime representation of an edge control point.
 *
 * The control sits at the midpoint of the edge (point1 → point2) and holds a
 * direction vector that is rotated whenever the edge orientation changes relative
 * to its initial orientation.
 */
export class EdgeControl implements IEdgeControl {
	readonly #config: IEdgeControl;
	readonly #direction: vec3;
	readonly #initialDirection: vec3;
	readonly #initialEdge: vec3;
	readonly #position: vec3;

	// Drag state
	#dragStartP1?: vec3;
	#dragStartP2?: vec3;
	#dragStartPos?: vec3;

	constructor(config: IEdgeControl, p1: vec3, p2: vec3) {
		this.#config = config;

		const edge = vec3.sub(vec3.create(), p2, p1);
		this.#initialEdge = vec3.normalize(vec3.create(), edge);
		this.#initialDirection = vec3.clone(config.direction);

		this.#direction = vec3.clone(config.direction);
		this.#position = vec3.scale(
			vec3.create(),
			vec3.add(vec3.create(), p1, p2),
			0.5,
		);
	}

	public get config(): IEdgeControl {
		return this.#config;
	}

	public get direction(): vec3 {
		return this.#direction;
	}

	public get point1(): number {
		return this.#config.point1;
	}

	public get point2(): number {
		return this.#config.point2;
	}

	public get position(): vec3 {
		return this.#position;
	}

	public get type(): "edge" {
		return "edge";
	}

	/**
	 * Restores point1 and point2 to their pre-drag positions, resets the
	 * visual midpoint, and clears drag state.
	 */
	public cancel(moveTemporary: MoveTemporaryFn): void {
		if (
			this.#dragStartP1 !== undefined &&
			this.#dragStartP2 !== undefined
		) {
			moveTemporary(this.#config.point1, this.#dragStartP1);
			moveTemporary(this.#config.point2, this.#dragStartP2);
		}
		if (this.#dragStartPos !== undefined) {
			vec3.copy(this.#position, this.#dragStartPos);
		}
		this.#dragStartP1 = undefined;
		this.#dragStartP2 = undefined;
		this.#dragStartPos = undefined;
	}

	/**
	 * Refreshes the direction vector from the committed edge orientation and
	 * clears drag state.
	 */
	public end(getPosition: GetPositionFn): void {
		const p1 = getPosition(this.#config.point1);
		const p2 = getPosition(this.#config.point2);
		this.updateFromPoints(p1, p2);
		this.#dragStartP1 = undefined;
		this.#dragStartP2 = undefined;
		this.#dragStartPos = undefined;
	}

	/**
	 * Projects the mouse ray onto the control's direction axis via a
	 * line-line closest-point calculation, moves point1 and point2 by the
	 * resulting delta, and returns the new visual midpoint position.
	 *
	 * Returns undefined when the ray and direction axis are parallel
	 * (degenerate case — no movement applied).
	 */
	public move(ray: IRay, moveTemporary: MoveTemporaryFn): vec3 | undefined {
		const dir = this.#direction;
		const rayOrigin = ray.origin as unknown as vec3;
		const rayDir = ray.direction as unknown as vec3;

		// Line-line closest-point:
		//   Line 1 (control axis): dragStartPos + t * dir
		//   Line 2 (mouse ray)   : ray.origin   + s * ray.direction
		const w = vec3.sub(vec3.create(), this.#dragStartPos!, rayOrigin);
		const a = vec3.dot(dir, dir);
		const b = vec3.dot(dir, rayDir);
		const c = vec3.dot(rayDir, rayDir);
		const d = vec3.dot(w, dir);
		const e = vec3.dot(w, rayDir);

		const denom = a * c - b * b;
		if (Math.abs(denom) < 1e-10) return undefined; // lines are parallel

		const t = (b * e - c * d) / denom;
		const delta = vec3.scale(vec3.create(), dir, t);

		const newP1 = vec3.add(vec3.create(), this.#dragStartP1!, delta);
		const newP2 = vec3.add(vec3.create(), this.#dragStartP2!, delta);
		moveTemporary(this.#config.point1, newP1);
		moveTemporary(this.#config.point2, newP2);

		// Update visual position to the new midpoint.
		vec3.add(this.#position, newP1, newP2);
		vec3.scale(this.#position, this.#position, 0.5);

		return vec3.clone(this.#position);
	}

	/**
	 * Recomputes the midpoint position and direction from the current geometry
	 * (e.g. after an undo/redo).
	 */
	public refreshAll(getPosition: GetPositionFn): void {
		const p1 = getPosition(this.#config.point1);
		const p2 = getPosition(this.#config.point2);
		this.updateFromPoints(p1, p2);
	}

	/**
	 * Recomputes this control's midpoint and direction if the moved point is one
	 * of the two edge endpoints. Returns true if the control was affected.
	 */
	public refreshForMovedPoint(
		movedIndex: number,
		getPosition: GetPositionFn,
	): boolean {
		if (
			this.#config.point1 !== movedIndex &&
			this.#config.point2 !== movedIndex
		) {
			return false;
		}
		const p1 = getPosition(this.#config.point1);
		const p2 = getPosition(this.#config.point2);
		this.updateFromPoints(p1, p2);
		return true;
	}

	/**
	 * Snapshots the initial edge endpoint positions and visual midpoint so that
	 * subsequent move() calls can compute the correct displacement.
	 */
	public start(getPosition: GetPositionFn): boolean {
		this.#dragStartP1 = vec3.clone(getPosition(this.#config.point1));
		this.#dragStartP2 = vec3.clone(getPosition(this.#config.point2));
		this.#dragStartPos = vec3.clone(this.#position);
		return true;
	}

	/**
	 * Recomputes the midpoint position and the rotated direction from the current
	 * edge endpoints.
	 *
	 * The direction is rotated by the same rotation that maps the initial
	 * normalized edge vector to the current normalized edge vector.  The magnitude
	 * of the direction vector is preserved.
	 */
	public updateFromPoints(p1: vec3, p2: vec3): void {
		vec3.add(this.#position, p1, p2);
		vec3.scale(this.#position, this.#position, 0.5);

		const edge = vec3.sub(vec3.create(), p2, p1);
		const len = vec3.len(edge);
		if (len < 1e-10) return;

		const currentEdge = vec3.scale(vec3.create(), edge, 1 / len);
		const q = quat.rotationTo(
			quat.create(),
			this.#initialEdge,
			currentEdge,
		);
		vec3.transformQuat(this.#direction, this.#initialDirection, q);
	}
}
