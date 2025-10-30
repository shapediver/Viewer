import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	IBoxSelectionIntersection,
	IIntersectionFilter,
} from "@shapediver/viewer.shared.types";

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
	onDown(event: PointerEvent, project: (p: vec3) => vec2): void;
	onEnd(event: PointerEvent): void;
	onMove(
		event: PointerEvent,
		insertionActive: boolean,
		removalActive: boolean,
	): void;
	reset(): void;
}
