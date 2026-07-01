import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	type IBoxSelectionIntersection,
	type IIntersectionFilter} from "@shapediver/viewer.shared.types";

import {vec2, vec3} from "gl-matrix";

export interface ISelectionBox {
	readonly coordinates?: {
		start: {x: number; y: number};
		end: {x: number; y: number};
	};

	intersectObjects(
		nodes: ITreeNode[],
		filterCriteria: IIntersectionFilter[],
	): IBoxSelectionIntersection[];
	intersectPoints(points: vec3[]): number[];
	onDown(event: PointerEvent, project: (p: vec3) => vec2): void;
	onEnd(event: PointerEvent): void;
	onMove(
		event: PointerEvent,
		insertionActive: boolean,
		removalActive: boolean,
	): void;
	reset(): void;
}
