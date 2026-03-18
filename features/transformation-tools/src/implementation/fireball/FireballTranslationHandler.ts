import {IViewportApi, TreeNode, sceneTree} from "@shapediver/viewer";
import {
	DragManager,
	HoverManager,
	IDragEvent,
	IHoverEvent,
	InteractionData,
	InteractionEngine,
} from "@shapediver/viewer.features.interaction";
import {
	PlaneRestrictionProperties,
	RESTRICTION_TYPE,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {Plane} from "@shapediver/viewer.shared.math";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {EVENTTYPE, EventEngine} from "@shapediver/viewer.shared.services";
import {
	AttributeData,
	GeometryData,
	MATERIAL_ALPHA,
	MaterialStandardData,
	PRIMITIVE_MODE,
	PrimitiveData,
} from "@shapediver/viewer.shared.types";

import {mat4, vec3} from "gl-matrix";

const PLANE_Z_OFFSET = 0.1;

export class FireballTranslationHandler {
	readonly #dragManager: DragManager;
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #hoverManager: HoverManager;
	readonly #interactionEngine: InteractionEngine;
	readonly #plane: Plane;
	readonly #viewport: IViewportApi;

	#dragEndToken: string = "";
	#dragMoveToken: string = "";
	#dragStartToken: string = "";
	#hoverOffToken: string = "";
	#hoverOnToken: string = "";
	#isDragging: boolean = false;
	#localPointsAtDragStart: vec3[] = [];
	#node!: ITreeNode;

	constructor(
		viewport: IViewportApi,
		planeRestriction: PlaneRestrictionProperties,
		plane: Plane,
		getLocalPoints: () => vec3[],
		onMove: (points: vec3[]) => void,
		onCommit: (points: vec3[]) => void,
	) {
		this.#plane = plane;
		this.#viewport = viewport;
		this.#getLocalPoints = getLocalPoints;
		this.#onMove = onMove;
		this.#onCommit = onCommit;

		// Create the invisible draggable plane mesh covering the bounding rectangle
		this.createPlaneNode(getLocalPoints());

		// Set up the interaction engine with a hover + plane-restricted drag manager
		this.#interactionEngine = new InteractionEngine(viewport);
		this.#hoverManager = new HoverManager();
		this.#dragManager = new DragManager();
		this.#interactionEngine.addInteractionManager(this.#hoverManager);
		this.#interactionEngine.addInteractionManager(this.#dragManager);
		this.#dragManager.addRestriction({
			type: RESTRICTION_TYPE.PLANE,
			origin: planeRestriction.origin,
			vector_u: planeRestriction.vector_u,
			vector_v: planeRestriction.vector_v,
		});

		// Snapshot local points at drag start so all DRAG_MOVE deltas are
		// computed relative to the committed state at the beginning of the drag
		this.#dragStartToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.DRAG_START,
			(e) => {
				const ev = e as IDragEvent;
				if (ev.manager !== this.#dragManager) return;
				this.#localPointsAtDragStart = this.#getLocalPoints().map((p) =>
					vec3.clone(p),
				);
				this.#isDragging = true;
				this.#viewport.canvas.style.cursor = "move";
			},
		);

		this.#dragMoveToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.DRAG_MOVE,
			(e) => this.handleDrag(e as IDragEvent, false),
		);

		this.#dragEndToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.DRAG_END,
			(e) => {
				this.handleDrag(e as IDragEvent, true);
				if ((e as IDragEvent).manager === this.#dragManager) {
					this.#isDragging = false;
					this.#viewport.canvas.style.cursor = "";
				}
			},
		);

		this.#hoverOnToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.HOVER_ON,
			(e) => {
				const ev = e as IHoverEvent;
				if (ev.manager !== this.#hoverManager) return;
				// ev.nodes contains the node being activated (added to the list)
				// at this point the node is already in the list
				if (!ev.nodes.includes(this.#node)) return;
				this.#viewport.canvas.style.cursor = "move";
			},
		);

		this.#hoverOffToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.HOVER_OFF,
			(e) => {
				const ev = e as IHoverEvent;
				if (ev.manager !== this.#hoverManager) return;
				if (this.#isDragging) return;
				this.#viewport.canvas.style.cursor = "";
			},
		);
	}

	public close(): void {
		this.#eventEngine.removeListener(this.#dragStartToken);
		this.#eventEngine.removeListener(this.#dragMoveToken);
		this.#eventEngine.removeListener(this.#dragEndToken);
		this.#eventEngine.removeListener(this.#hoverOnToken);
		this.#eventEngine.removeListener(this.#hoverOffToken);
		this.#viewport.canvas.style.cursor = "";
		this.#interactionEngine.close();
		sceneTree.root.removeChild(this.#node);
		sceneTree.root.updateVersion(false, false);
	}

	/**
	 * Delete the existing plane node and create a new one based on the new local points;
	 */
	public updatePlane(localPoints: vec3[]): void {
		sceneTree.root.removeChild(this.#node);
		this.createPlaneNode(localPoints);
	}

	private createPlaneNode(localPoints: vec3[]) {
		// 4 world-space corner positions: C0 (BL), C2 (BR), C4 (TR), C6 (TL)
		// Offset slightly along the plane normal so the mesh doesn't
		// intersect the surface it sits on.
		const normalOffset = vec3.scale(
			vec3.create(),
			this.#plane.normal,
			PLANE_Z_OFFSET,
		);
		const positionArray = new Float32Array(12); // 4 vertices × 3 coords
		const cornerIndices = [0, 2, 4, 6];

		// Compute centroid of the 4 corner local points
		const centroid = vec3.create();
		for (const ci of cornerIndices)
			vec3.add(centroid, centroid, localPoints[ci]);
		vec3.scale(centroid, centroid, 1 / 4);

		const PLANE_SCALE = 0.925;
		for (let i = 0; i < 4; i++) {
			// Scale each corner toward the centroid so the plane is slightly
			// smaller than the bounding rectangle formed by the points
			const scaled = vec3.lerp(
				vec3.create(),
				centroid,
				localPoints[cornerIndices[i]],
				PLANE_SCALE,
			);
			const ws = vec3.add(
				vec3.create(),
				this.#plane.convertFromLSToWS(scaled),
				normalOffset,
			);
			positionArray[i * 3] = ws[0];
			positionArray[i * 3 + 1] = ws[1];
			positionArray[i * 3 + 2] = ws[2];
		}

		// Two triangles covering the quad: (0,1,2) and (0,2,3)
		const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

		const geometryData = new GeometryData(
			new PrimitiveData(
				{
					POSITION: new AttributeData(
						positionArray,
						3,
						12,
						0,
						4,
						false,
						positionArray.length,
					),
				},
				new AttributeData(indices, 1, 2, 0, 2, false, indices.length),
			),
			PRIMITIVE_MODE.TRIANGLES,
		);

		// Zero-opacity material – visually invisible but still ray-castable
		const material = new MaterialStandardData({
			opacity: 0,
			alphaMode: MATERIAL_ALPHA.BLEND,
		});
		geometryData.material = material;

		const node = new TreeNode("FireballTranslationPlane");
		node.addData(geometryData);
		const interactionData = new InteractionData({drag: true, hover: true});
		node.addData(interactionData);

		sceneTree.root.addChild(node);
		sceneTree.root.updateVersion(false, false);

		this.#node = node;
	}

	readonly #getLocalPoints: () => vec3[];

	private handleDrag(ev: IDragEvent, commit: boolean): void {
		if (ev.manager !== this.#dragManager) return;
		if (!ev.matrix || this.#localPointsAtDragStart.length === 0) return;
		// The drag matrix is a pure translation in world space
		// (plane restriction + identity world transform of the mesh node).
		const deltaWS = mat4.getTranslation(vec3.create(), ev.matrix);
		// Project the world-space delta onto the plane's local axes
		const deltaLS = vec3.fromValues(
			vec3.dot(deltaWS, this.#plane.vector_u),
			vec3.dot(deltaWS, this.#plane.vector_v),
			0,
		);
		const newPoints = this.#localPointsAtDragStart.map((p) =>
			vec3.add(vec3.create(), p, deltaLS),
		);
		if (commit) {
			this.#onCommit(newPoints);
		} else {
			this.#onMove(newPoints);
		}
	}

	readonly #onCommit: (points: vec3[]) => void;

	readonly #onMove: (points: vec3[]) => void;
}
