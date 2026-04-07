import {IViewportApi, sceneTree, TreeNode} from "@shapediver/viewer";
import {
	DragManager,
	HoverManager,
	IDragEvent,
	IHoverEvent,
	InteractionData,
	InteractionEngine,
} from "@shapediver/viewer.features.interaction";
import {
	RestrictionProperties,
	RESTRICTION_TYPE,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	AttributeData,
	GeometryData,
	ITreeNode,
	MaterialStandardData,
	PrimitiveData,
} from "@shapediver/viewer.shared.node-tree";
import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";
import {MATERIAL_ALPHA, PRIMITIVE_MODE} from "@shapediver/viewer.shared.types";

import {mat4, vec3} from "gl-matrix";

import {IRectangleTransformHandler} from "./IRectangleTransformHandler";

const PLANE_Z_OFFSET = 0.1;

export class RectangleTransformTranslationHandler
	implements IRectangleTransformHandler
{
	readonly #dragManager: DragManager;
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #hoverManager: HoverManager;
	readonly #interactionEngine: InteractionEngine;
	readonly #M_planeToWS: mat4;
	readonly #parentNode: ITreeNode;
	readonly #viewport: IViewportApi;

	#committedTranslation: vec3 = vec3.create();
	#dragEndToken: string = "";
	#dragMoveToken: string = "";
	#dragStartToken: string = "";
	#hoverOffToken: string = "";
	#hoverOnToken: string = "";
	#isDragging: boolean = false;
	#isHovering: boolean = false;
	#isInteractionBlocked: () => boolean;
	#onTranslationStart: () => void;
	#localPointsAtDragStart: vec3[] = [];
	#node!: ITreeNode;
	#planeRestrictionToken: string | undefined;

	constructor(
		viewport: IViewportApi,
		restrictions: RestrictionProperties[] | undefined,
		parentNode: ITreeNode,
		planeToWS: mat4,
		getLocalPoints: () => vec3[],
		isInteractionBlocked: () => boolean = () => false,
		onTranslationStart: () => void = () => {},
		onMove: (runningTrans: vec3) => void,
		onCommit: (committedTrans: vec3) => void,
	) {
		this.#M_planeToWS = planeToWS;
		this.#parentNode = parentNode;
		this.#viewport = viewport;
		this.#getLocalPoints = getLocalPoints;
		this.#isInteractionBlocked = isInteractionBlocked;
		this.#onTranslationStart = onTranslationStart;
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

		// Add the initial plane restriction from the parentNode's current world matrix.
		this.#planeRestrictionToken = this.#dragManager.addRestriction(
			this.currentPlaneRestriction(getLocalPoints()),
		);

		// add all other restrictions (e.g. snapping) configured for this handler
		if (restrictions && restrictions.length > 0) {
			restrictions.forEach((restriction) => {
				this.#dragManager.addRestriction(restriction);
			});
		}

		// Snapshot local points at drag start so all DRAG_MOVE deltas are
		// computed relative to the committed state at the beginning of the drag
		this.#dragStartToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.DRAG_START,
			(e) => {
				const ev = e as IDragEvent;
				if (ev.manager !== this.#dragManager) return;
				// Guard: do not start translation while a DT drag (scaling/rotation) is active.
				if (this.#isInteractionBlocked()) {
					return;
				}
				// Cancel any active DT hover/drag (e.g. a hovered edge control) so
				// that only translation runs for this gesture.
				this.#onTranslationStart();
				this.#localPointsAtDragStart = this.#getLocalPoints().map((p) =>
					vec3.clone(p),
				);
				this.#isDragging = true;
				this.refreshCursor(false);
			},
		);

		this.#dragMoveToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.DRAG_MOVE,
			(e) => {
				this.handleDrag(e as IDragEvent, false);
			},
		);

		this.#dragEndToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.DRAG_END,
			(e) => {
				const dragEv = e as IDragEvent;
				this.handleDrag(dragEv, true);
				if (dragEv.manager === this.#dragManager) {
					this.#isDragging = false;
					// recompute() replaced the node, so HOVER_OFF for the old
					// node won't fire. Reset hover state; the next pointermove
					// will fire HOVER_ON for the new node if pointer is inside.
					this.#isHovering = false;
					this.#viewport.canvas.style.cursor = "";
				}
			},
		);

		this.#hoverOnToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.HOVER_ON,
			(e) => {
				const ev = e as IHoverEvent;
				if (ev.manager !== this.#hoverManager) return;
				if (ev.nodes.indexOf(this.#node) === -1) return;
				this.#isHovering = true;
				this.refreshCursor(this.#isInteractionBlocked());
			},
		);

		this.#hoverOffToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.HOVER_OFF,
			(e) => {
				const ev = e as IHoverEvent;
				if (ev.manager !== this.#hoverManager) return;
				this.#isHovering = false;
				if (!this.#isDragging) this.#viewport.canvas.style.cursor = "";
			},
		);
	}

	public get committedTranslation(): vec3 {
		return this.#committedTranslation;
	}

	public get isDragging(): boolean {
		return this.#isDragging;
	}

	/**
	 * Refresh the canvas cursor based on current hover/drag state.
	 * @param blocked true if any DT point/control is currently hovered or being dragged
	 */
	public refreshCursor(blocked: boolean): void {
		if (this.#isDragging) {
			this.#viewport.canvas.style.cursor = "move";
		} else if (this.#isHovering && !blocked) {
			this.#viewport.canvas.style.cursor = "move";
		} else {
			this.#viewport.canvas.style.cursor = "";
		}
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
	 * Rebuild the drag plane and restriction to match the current rectangle
	 * and parent-node world matrix (e.g. after a rotation commit).
	 */
	public recompute(localPoints: vec3[], _temporary: boolean): void {
		// Update the drag restriction to the current world-space plane.
		if (this.#planeRestrictionToken !== undefined) {
			this.#dragManager.removeRestriction(this.#planeRestrictionToken);
		}
		this.#planeRestrictionToken = this.#dragManager.addRestriction(
			this.currentPlaneRestriction(localPoints),
		);
		sceneTree.root.removeChild(this.#node);
		this.createPlaneNode(localPoints);
	}

	/** Build a plane restriction from the parentNode's current world matrix. */
	private currentPlaneRestriction(
		localPoints: vec3[],
	): RestrictionProperties {
		const M = this.#parentNode.worldMatrix;
		const cx = (localPoints[0][0] + localPoints[4][0]) / 2;
		const cy = (localPoints[0][1] + localPoints[4][1]) / 2;
		const origin = vec3.fromValues(
			M[0] * cx + M[4] * cy + M[12],
			M[1] * cx + M[5] * cy + M[13],
			M[2] * cx + M[6] * cy + M[14],
		);
		const vector_u = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[0], M[1], M[2]),
		);
		const vector_v = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[4], M[5], M[6]),
		);
		return {
			type: RESTRICTION_TYPE.PLANE,
			origin,
			vector_u,
			vector_v,
			createHelperObjects: false,
		};
	}

	private createPlaneNode(localPoints: vec3[]) {
		const M = this.#parentNode.worldMatrix;
		// Normal direction = column 2 of the world matrix.
		const normalWS = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[8], M[9], M[10]),
		);
		const normalOffset = vec3.scale(
			vec3.create(),
			normalWS,
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
			// Transform LS corner to world space via parentNode matrix.
			const ws = vec3.add(
				vec3.create(),
				vec3.fromValues(
					M[0] * scaled[0] + M[4] * scaled[1] + M[12],
					M[1] * scaled[0] + M[5] * scaled[1] + M[13],
					M[2] * scaled[0] + M[6] * scaled[1] + M[14],
				),
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
			transparent: true,
			depthWrite: false,
			depthTest: false,
		});
		geometryData.castShadow = false;
		geometryData.receiveShadow = false;
		geometryData.material = material;

		const node = new TreeNode("RectangleTransformTranslationPlane");
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
		// Guard: skip if DT drag (scaling/rotation) is active, or if drag-start was suppressed.
		// Exception: always allow commit (DRAG_END) when isDragging — if we
		// were translating and got blocked mid-gesture (e.g. by a false-positive
		// rotation hover), we must still commit the accumulated delta so the
		// committedTranslation stays in sync with the visual state.
		if (!this.#isDragging) return;
		if (this.#isInteractionBlocked() && !commit) {
			return;
		}
		if (!ev.matrix || this.#localPointsAtDragStart.length === 0) return;
		// The drag matrix is a pure translation in world space
		// (plane restriction + identity world transform of the mesh node).
		const deltaWS = mat4.getTranslation(vec3.create(), ev.matrix);
		// Project the WS delta onto the INITIAL (unrotated) plane axes from
		// M_planeToWS so that the result is in the initial plane-LS frame.
		// Using parentNode.worldMatrix (rotated axes) would give wrong directions
		// once an accumulated rotation has been applied.
		const M = this.#M_planeToWS;
		const uWS = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[0], M[1], M[2]),
		);
		const vWS = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[4], M[5], M[6]),
		);
		const deltaLS = vec3.fromValues(
			vec3.dot(deltaWS, uWS),
			vec3.dot(deltaWS, vWS),
			0,
		);
		if (commit) {
			vec3.add(
				this.#committedTranslation,
				this.#committedTranslation,
				deltaLS,
			);
			this.recompute(this.#getLocalPoints(), false);
			this.#onCommit(this.#committedTranslation);
		} else {
			const runningTrans = vec3.add(
				vec3.create(),
				this.#committedTranslation,
				deltaLS,
			);
			// onMove updates the parent transformation matrix first, then sync
			// the parent ThreeJS matrix so the DT handles (whose buffer positions
			// are in parent-LS) appear at correct WS positions without triggering
			// a full scene-tree rebuild.
			this.#onMove(runningTrans);
			this.#viewport.updateNodeTransformation(this.#parentNode);
		}
	}

	readonly #onCommit: (committedTrans: vec3) => void;

	readonly #onMove: (runningTrans: vec3) => void;
}
