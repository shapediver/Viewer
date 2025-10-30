import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	IBoxSelectionIntersection,
	IIntersectionFilter,
} from "@shapediver/viewer.shared.types";

import {vec2, vec3} from "gl-matrix";

import {ISelectionBox} from "../interfaces/ISelectionBox";

export class SelectionBox implements ISelectionBox {
	#canvas: HTMLCanvasElement;
	#coordinates?: {
		start: {x: number; y: number};
		end: {x: number; y: number};
	};
	#htmlElement?: HTMLDivElement;
	#project!: (p: vec3) => vec2;

	constructor(canvas: HTMLCanvasElement) {
		this.#canvas = canvas;
	}

	public get coordinates() {
		return this.#coordinates;
	}

	public intersectObjects(
		nodes: ITreeNode[],
		filterCriteria: IIntersectionFilter[],
	): IBoxSelectionIntersection[] {
		if (!this.#coordinates) return [];
		const minX = Math.min(
			this.#coordinates.start.x,
			this.#coordinates.end.x,
		);
		const maxX = Math.max(
			this.#coordinates.start.x,
			this.#coordinates.end.x,
		);
		const minY = Math.min(
			this.#coordinates.start.y,
			this.#coordinates.end.y,
		);

		const maxY = Math.max(
			this.#coordinates.start.y,
			this.#coordinates.end.y,
		);

		// check if the selection is from the right or left side
		const isRightSelection =
			this.#coordinates.start.x < this.#coordinates.end.x;

		// for all nodes that can be intersected
		// check if the bounding sphere center is within the selection box
		const selectedObjects: IBoxSelectionIntersection[] = [];
		nodes.forEach((i) => {
			const shouldTest = filterCriteria
				? filterCriteria.some((fc) => fc(i))
				: true;
			if (!shouldTest) return;

			// for the selection from the right side, all points of the bounding box have to be included
			let isIncluded = false;
			let breakLoop = false;
			for (let xPoint of [i.boundingBox.min[0], i.boundingBox.max[0]]) {
				for (let yPoint of [
					i.boundingBox.min[1],
					i.boundingBox.max[1],
				]) {
					for (let zPoint of [
						i.boundingBox.min[2],
						i.boundingBox.max[2],
					]) {
						const projection = this.#project(
							vec3.fromValues(xPoint, yPoint, zPoint),
						);

						if (isRightSelection) {
							if (
								!(
									projection[0] >= minX &&
									projection[0] <= maxX &&
									projection[1] >= minY &&
									projection[1] <= maxY
								)
							) {
								isIncluded = false;
								breakLoop = true;
							} else {
								isIncluded = true;
							}
						} else {
							if (
								projection[0] >= minX &&
								projection[0] <= maxX &&
								projection[1] >= minY &&
								projection[1] <= maxY
							) {
								isIncluded = true;
								breakLoop = true;
							}
						}

						if (breakLoop) break;
					}
					if (breakLoop) break;
				}
				if (breakLoop) break;
			}

			if (isIncluded) {
				selectedObjects.push({
					node: i,
					type: "BoxSelectionIntersection",
				});
			}
		});
		return selectedObjects;
	}

	public onDown(event: PointerEvent, project: (p: vec3) => vec2): void {
		this.#project = project;
		const rect = this.#canvas.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
		this.#coordinates = {
			start: {
				x: x,
				y: y,
			},
			end: {
				x: x,
				y: y,
			},
		};
	}

	public onEnd(event: PointerEvent): void {
		const rect = this.#canvas.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		this.#coordinates!.end = {
			x: x,
			y: y,
		};
	}

	public onMove(
		event: PointerEvent,
		insertionActive: boolean,
		removalActive: boolean,
	): void {
		// update box selection
		const rect = this.#canvas.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
		this.#coordinates!.end = {
			x: x,
			y: y,
		};
		this.updateSelectionBox(insertionActive, removalActive);
	}

	public reset(): void {
		this.#htmlElement?.remove();
		this.#htmlElement = undefined;
		this.#coordinates = undefined;
	}

	private updateSelectionBox(
		insertionActive: boolean,
		removalActive: boolean,
	): void {
		if (!this.#coordinates) return;

		let color = "0, 0, 255"; // blue
		if (insertionActive && !removalActive) {
			color = "0, 255, 0"; // green
		} else if (!insertionActive && removalActive) {
			color = "255, 0, 0"; // red
		}

		if (!this.#htmlElement) {
			// create selection box div
			this.#htmlElement = document.createElement("div");
			this.#htmlElement.style.position = "absolute";
			this.#htmlElement.style.border = `1px solid rgba(${color}, 0.8)`;
			this.#htmlElement.style.backgroundColor = `rgba(${color}, 0.1)`;
			this.#htmlElement.style.pointerEvents = "none";
			this.#htmlElement.style.zIndex = "9999"; // Ensure it's on top
			document.body.appendChild(this.#htmlElement);
		} else {
			// check if the color needs to be updated
			const currentBorderColor = this.#htmlElement.style.border;
			const desiredBorderColor = `1px solid rgba(${color}, 0.8)`;
			if (currentBorderColor !== desiredBorderColor) {
				this.#htmlElement.style.border = desiredBorderColor;
				this.#htmlElement.style.backgroundColor = `rgba(${color}, 0.1)`;
			}
		}

		const rect = this.#canvas.getBoundingClientRect();

		// Convert normalized coordinates back to document coordinates
		const convertedStartX =
			((this.#coordinates.start.x + 1) / 2) * rect.width + rect.left;
		const convertedStartY =
			((1 - this.#coordinates.start.y) / 2) * rect.height + rect.top;
		const convertedEndX =
			((this.#coordinates.end.x + 1) / 2) * rect.width + rect.left;
		const convertedEndY =
			((1 - this.#coordinates.end.y) / 2) * rect.height + rect.top;

		const x = Math.min(convertedStartX, convertedEndX);
		const y = Math.min(convertedStartY, convertedEndY);
		const width = Math.abs(convertedEndX - convertedStartX);
		const height = Math.abs(convertedEndY - convertedStartY);

		this.#htmlElement.style.left = `${x}px`;
		this.#htmlElement.style.top = `${y}px`;
		this.#htmlElement.style.width = `${width}px`;
		this.#htmlElement.style.height = `${height}px`;
	}
}
