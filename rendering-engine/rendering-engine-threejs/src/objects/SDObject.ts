import {type ISDObject} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {nextSerial} from "@shapediver/viewer.shared.node-tree";
import {mat4} from "gl-matrix";
import * as THREE from "three";
import {Object3D} from "three";

export enum SD_DATA_TYPE {
	GEOMETRY = "geometry",
	MATERIAL = "material",
	THREEJS = "threejs",
	LIGHT = "light",
	CAMERA = "camera",
	ANIMATION = "animation",
	INTERACTION = "interaction",
	HTML_ELEMENT_ANCHOR = "html_element_anchor",
	CUSTOM = "custom",
	OBJECT = "object",
}

/** The clock value of the last change of a draw set (see noteDrawSetChange). */
let drawSetSerial = 0;

/**
 * Records that a draw set of the converted objects changed (a branch was cut
 * from the render-list walk, or a hidden batch source mesh changed), on the
 * scene tree's change clock. One value for all viewports: an SDObject does
 * not know its viewport. Caches read it as the channel `drawSet` of
 * `SceneCacheGuard`.
 */
export function noteDrawSetChange(): void {
	drawSetSerial = nextSerial();
}

/** The clock value of the last {@link noteDrawSetChange}, `0` if none. */
export function drawSetRevision(): number {
	return drawSetSerial;
}

/**
 * How many renderer calls are running (nested renders are possible). Code
 * that has to know whether three.js walks the scene for a draw reads it.
 * Rendering is synchronous, so one value serves every viewport.
 */
let renderDepth = 0;

/** Call when a render of a viewport starts. Pair it with {@link leaveRenderScope} in a `finally`. */
export function enterRenderScope(): void {
	renderDepth++;
}

/** Call when a render that {@link enterRenderScope} started has ended. */
export function leaveRenderScope(): void {
	if (renderDepth > 0) renderDepth--;
}

/** The number of renders running now, `0` outside of a render. */
export function getRenderDepth(): number {
	return renderDepth;
}

/**
 * Whether the render that runs now cuts branches from the render-list walk
 * (SS-10606, `RenderingEngine.renderListCut` of the viewport that renders).
 */
let renderCut = false;

/**
 * Run a render of a viewport in the render scope: while it runs, an
 * SDObject whose branch holds nothing three.js draws on its own reads
 * `visible === false` when `cut` is true (see `SDObject.SDwalkNeeded`).
 */
export function renderInScope<T>(cut: boolean, render: () => T): T {
	const previousCut = renderCut;
	renderCut = cut;
	enterRenderScope();
	try {
		return render();
	} finally {
		leaveRenderScope();
		renderCut = previousCut;
	}
}

/** Bookkeeping fields of the render-list cut on any object (SS-10606). */
type WalkCounted = Object3D & {
	/** What this object adds to its SDObject parent's `SDwalkNeeded`. */
	_SDcounted?: number;
	/** A batch source mesh hidden because its batch draws it. */
	_SDbatchHidden?: boolean;
};

/**
 * Whether three.js has to visit an object to draw what it holds (`1`) or
 * can leave it out of the render-list walk (`0`). Only objects whose
 * meaning the Viewer knows count `0`; anything else counts `1`, also a
 * plain object hidden for another reason, because its `visible` can be
 * written without the Viewer noticing.
 */
function walkContribution(object: Object3D): number {
	if (object instanceof SDObject)
		return object.SDvisibleState &&
			(object.SDwalkNeeded > 0 || object.SDalwaysWalk)
			? 1
			: 0;
	if ((object as WalkCounted)._SDbatchHidden === true) return 0;
	if (object.children.length > 0) return 1;
	const userData = object.userData;
	if (userData.isInstanced === true) return 0;
	if (userData.SDtype === SD_DATA_TYPE.HTML_ELEMENT_ANCHOR) return 0;
	return 1;
}

/**
 * The contribution of an object to its parent may have changed: update the
 * counts on the way up, as far as a cut state flips. Costs the tree depth.
 */
function refreshWalkCount(object: Object3D): void {
	let child = object as WalkCounted;
	let parent = child.parent;
	while (parent instanceof SDObject) {
		const next = walkContribution(child);
		const previous = child._SDcounted ?? 0;
		if (next === previous) return;
		child._SDcounted = next;
		const wasCut = parent.SDcutState;
		parent.SDwalkNeeded += next - previous;
		if (parent.SDcutState !== wasCut) noteDrawSetChange();
		child = parent;
		parent = parent.parent;
	}
}

/**
 * Hide or show a batch source mesh (`MaterialBatchManager`). A hidden one
 * is drawn by its batch, so three.js does not need to visit it, and a
 * branch of such meshes can be cut from the render-list walk. Every write
 * of a source mesh's `visible` for its batch goes through here.
 */
export function setBatchHidden(mesh: Object3D, hidden: boolean): void {
	mesh.visible = !hidden;
	const counted = mesh as WalkCounted;
	if ((counted._SDbatchHidden === true) === hidden) return;
	counted._SDbatchHidden = hidden;
	noteDrawSetChange();
	refreshWalkCount(mesh);
}

export class SDObject extends Object3D implements ISDObject {
	// #region Constructors (1)

	#SDid: string;
	#SDversion: string;
	#SDtype: SD_DATA_TYPE;
	#appliedTransformation?: mat4;
	readonly #appliedMatrix = new THREE.Matrix4();

	/**
	 * State of the last scene tree update of this node, used to skip
	 * branches that did not change (see SceneTreeManager).
	 *
	 * - SDvisibleInHierarchy: the inherited visibility that was applied
	 * - SDalwaysUpdate: the branch has data that is read on every scene
	 *   update (lights, three.js objects)
	 * - SDboundsStale: a transformation-only update moved a node in this
	 *   branch without updating the bounding boxes of its ancestors
	 * - SDstructureVersion: the structure version of the tree node when its
	 *   children were last updated
	 */
	public SDvisibleInHierarchy?: boolean;
	public SDstructureVersion?: number;
	/**
	 * The value of the scene tree's change clock when this viewport last
	 * applied the node (SS-10565). `0`: not converted yet. A change kind the
	 * node recorded after it (`TreeNode.changedKindsSince`) is not applied.
	 */
	public SDappliedSerial = 0;
	public SDalwaysUpdate = false;
	public SDboundsStale = false;

	/**
	 * State of the matrix walk (SS-10485), see `updateMatrixWorld`.
	 *
	 * - SDmatrixDirty: this object, or an object below it, has a world matrix
	 *   that needs to be recomputed. Every SDObject ancestor of a dirty
	 *   object is dirty as well. Set by `matrixWorldNeedsUpdate = true` and
	 *   `add`, cleared when the object is walked.
	 * - SDalwaysWalk: the branch holds objects that three.js moves on its
	 *   own (lights, cameras) or that API users move by setting `position`
	 *   (three.js objects), so the walk always goes through it.
	 */
	public SDmatrixDirty = false;
	#alwaysWalk = false;

	/**
	 * State of the render-list cut (SS-10606), see the `visible` accessor
	 * below the class.
	 *
	 * How many children three.js has to visit to draw what they hold: a
	 * visible child SDObject whose own count is above 0 or that is
	 * `SDalwaysWalk`, and every other child except a hidden batch source
	 * mesh (`setBatchHidden`), an instancing placeholder and an HTML anchor
	 * placeholder. `0` and not `SDalwaysWalk`: inside a render that cuts,
	 * this object reads `visible === false`, so three.js leaves its branch
	 * out of the render list and the shadow map. Every object of such a
	 * branch is cut, not only its top one. Kept current by every add,
	 * remove and visibility change, at the cost of the tree depth.
	 */
	public SDwalkNeeded = 0;

	/**
	 * This node itself holds a light, a camera or a three.js object. Its
	 * children that are not SDObjects are walked with a force, as three.js
	 * did before, so what an API user does inside such an object (a child
	 * added with a fixed matrix, a matrix written without a flag) still
	 * works. Not inherited by the ancestors.
	 */
	public SDforceChildren = false;

	/** The world matrix of the parent when this object was last walked. */
	#parentMatrixWorld?: THREE.Matrix4;

	constructor(
		SDid: string,
		SDversion: string,
		type: SD_DATA_TYPE = SD_DATA_TYPE.OBJECT,
	) {
		super();
		this.#SDid = SDid;
		this.#SDversion = SDversion;
		this.#SDtype = type;
		// The cached matrix belongs to the parent it was taken from.
		this.addEventListener("removed", () => {
			this.#parentMatrixWorld = undefined;
		});
	}

	public applyTransformation(transformation: mat4): void {
		// A scene update visits the nodes it checks. Writing the same matrix
		// again would mark the node, and with it the whole branch below, for
		// the matrix walk of the next pass.
		if (this.hasTransformation(transformation)) return;
		this.matrixWorld.identity();
		this.matrix.fromArray(transformation);
		this.matrix.decompose(this.position, this.quaternion, this.scale);
		// Compose the matrix from position, quaternion and scale, as three.js
		// does before rendering an object with matrixAutoUpdate. Node objects
		// of the scene tree do not auto-update (SS-10439): their matrix is
		// only written here, and a transformation with shear renders as it
		// did with matrixAutoUpdate.
		this.matrix.compose(this.position, this.quaternion, this.scale);
		this.matrixWorldNeedsUpdate = true;
		this.#appliedTransformation = mat4.clone(transformation);
		this.#appliedMatrix.copy(this.matrix);
	}

	/**
	 * Whether the given transformation is the one that was applied last and
	 * nothing has written the matrix of this object since (the
	 * transformation tools do that while dragging).
	 */
	public hasTransformation(transformation: mat4): boolean {
		return (
			this.#appliedTransformation !== undefined &&
			mat4.exactEquals(this.#appliedTransformation, transformation) &&
			this.matrix.equals(this.#appliedMatrix)
		);
	}

	/**
	 * The scene walk of every render pass. three.js recomputes the world
	 * matrix of every object below a scene, because the scene (and every
	 * object with `matrixAutoUpdate`) hands `force = true` to its children.
	 * This keeps that for everything that can have moved and leaves out the
	 * rest: a branch is left when nothing in it is marked (see
	 * `SDmatrixDirty`) and nothing forces it.
	 *
	 * A force from a parent that is not an SDObject (the scene, which
	 * recomputes its own matrix in every pass) is only real when the matrix
	 * of that parent differs from the one this object was last walked with.
	 * A force from an SDObject parent is real: the parent was recomputed.
	 */
	public override updateMatrixWorld(force?: boolean): void {
		const parent = this.parent;
		let realForce = force === true;
		if (realForce && parent !== null && !(parent instanceof SDObject)) {
			realForce =
				this.#parentMatrixWorld === undefined ||
				!this.#parentMatrixWorld.equals(parent.matrixWorld);
		}

		if (
			!realForce &&
			!this.matrixWorldNeedsUpdate &&
			!this.matrixAutoUpdate &&
			!this.SDmatrixDirty &&
			!this.SDalwaysWalk
		)
			return;

		// Before the walk, so that a mark made during it survives.
		this.SDmatrixDirty = false;
		if (this.SDforceChildren) this.walkForcingPlainChildren(realForce);
		else super.updateMatrixWorld(realForce);
		if (parent !== null && !(parent instanceof SDObject))
			(this.#parentMatrixWorld ??= new THREE.Matrix4()).copy(
				parent.matrixWorld,
			);
	}

	/** `Object3D.updateMatrixWorld`, but plain children always get a force. */
	private walkForcingPlainChildren(force: boolean): void {
		if (this.matrixAutoUpdate) this.updateMatrix();
		if (this.matrixWorldNeedsUpdate || force) {
			if (this.matrixWorldAutoUpdate === true) {
				if (this.parent === null) this.matrixWorld.copy(this.matrix);
				else
					this.matrixWorld.multiplyMatrices(
						this.parent.matrixWorld,
						this.matrix,
					);
			}
			this.matrixWorldNeedsUpdate = false;
			force = true;
		}
		const children = this.children;
		for (let i = 0, l = children.length; i < l; i++) {
			const child = children[i];
			child.updateMatrixWorld(child instanceof SDObject ? force : true);
		}
	}

	/**
	 * The world matrix of an added object is relative to another parent, or
	 * was never computed: mark it and the way to it from the scene.
	 */
	public override add(...objects: Object3D[]): this {
		if (objects.length > 1) {
			for (const object of objects) this.add(object);
			return this;
		}
		super.add(...objects);
		for (const object of objects) {
			object.matrixWorldNeedsUpdate = true;
			if (object.parent === this) refreshWalkCount(object);
		}
		markMatrixDirty(this);
		return this;
	}

	public override remove(...objects: Object3D[]): this {
		if (objects.length > 1) {
			for (const object of objects) this.remove(object);
			return this;
		}
		const object = objects[0] as WalkCounted | undefined;
		if (!object || object.parent !== this) return super.remove(...objects);
		super.remove(object);
		const counted = object._SDcounted ?? 0;
		object._SDcounted = 0;
		if (counted !== 0) {
			const wasCut = this.SDcutState;
			this.SDwalkNeeded -= counted;
			if (this.SDcutState !== wasCut) noteDrawSetChange();
			refreshWalkCount(this);
		}
		return this;
	}

	public override attach(object: Object3D): this {
		super.attach(object);
		if (object.parent === this) refreshWalkCount(object);
		return this;
	}

	// #endregion Constructors (1)

	// #region Public Accessors (4)

	/**
	 * The branch holds objects that three.js moves on its own (lights,
	 * cameras) or that API users move by setting `position` (three.js
	 * objects), so the matrix walk always goes through it (SS-10485), and
	 * the render-list walk is never cut there (SS-10606).
	 */
	public get SDalwaysWalk(): boolean {
		return this.#alwaysWalk;
	}

	public set SDalwaysWalk(value: boolean) {
		if (this.#alwaysWalk === value) return;
		const wasCut = this.SDcutState;
		this.#alwaysWalk = value;
		if (this.SDcutState !== wasCut) noteDrawSetChange();
		refreshWalkCount(this);
	}

	/** The visibility written last, also inside a render (see `visible`). */
	public get SDvisibleState(): boolean {
		return (this as {_SDvisible?: boolean})._SDvisible !== false;
	}

	/** Whether this object is cut inside a render that cuts. */
	public get SDcutState(): boolean {
		return this.SDwalkNeeded === 0 && !this.#alwaysWalk;
	}

	public get SDid(): string {
		return this.#SDid;
	}

	public set SDid(value: string) {
		this.#SDid = value;
	}

	public get SDversion(): string {
		return this.#SDversion;
	}

	public set SDversion(value: string) {
		this.#SDversion = value;
	}

	public get SDtype(): SD_DATA_TYPE {
		return this.#SDtype;
	}

	public set SDtype(value: SD_DATA_TYPE) {
		this.#SDtype = value;
	}

	public cloneObject(): SDObject {
		const clone = this.clone();
		clone.SDid = this.SDid;
		clone.SDversion = this.SDversion;
		clone.SDtype = this.SDtype;
		return clone;
	}

	// #endregion Public Accessors (4)
}

/** Mark an object and its SDObject ancestors, up to one that is marked. */
function markMatrixDirty(object: Object3D): void {
	let current: Object3D | null = object;
	while (current instanceof SDObject && !current.SDmatrixDirty) {
		current.SDmatrixDirty = true;
		current = current.parent;
	}
}

/**
 * `matrixWorldNeedsUpdate` of an SDObject marks the way to it for the matrix
 * walk when it is set. This is how the writers of a matrix reach the walk:
 * `applyTransformation`, the transformation tools and API users all set it.
 * three.js assigns it in the Object3D constructor, so it is defined on the
 * prototype with a plain backing field (a class accessor cannot replace a
 * property of the base class, and `#private` fields do not exist yet there).
 */
Object.defineProperty(SDObject.prototype, "matrixWorldNeedsUpdate", {
	configurable: true,
	get(this: {_SDmatrixWorldNeedsUpdate?: boolean}): boolean {
		return this._SDmatrixWorldNeedsUpdate === true;
	},
	set(
		this: SDObject & {_SDmatrixWorldNeedsUpdate?: boolean},
		value: boolean,
	) {
		this._SDmatrixWorldNeedsUpdate = value;
		if (value) markMatrixDirty(this);
	},
});

/**
 * `visible` of an SDObject (SS-10606). Outside a render it is exactly the
 * value written last: the node's visibility, as the scene update applies
 * it. Inside a render that cuts (`renderInScope`), an object whose branch
 * holds nothing three.js draws on its own (`SDcutState`) reads `false` as
 * well, so the render-list walk of three.js (`projectObject`) and the
 * shadow map stop there. Batches and instance groups draw what such a
 * branch holds. three.js assigns `visible` in the Object3D constructor, so
 * it is defined on the prototype with a plain backing field, as
 * `matrixWorldNeedsUpdate` above.
 */
Object.defineProperty(SDObject.prototype, "visible", {
	configurable: true,
	get(this: SDObject & {_SDvisible?: boolean}): boolean {
		const value = this._SDvisible !== false;
		if (!value || renderDepth === 0 || !renderCut) return value;
		return !this.SDcutState;
	},
	set(this: SDObject & {_SDvisible?: boolean}, value: boolean) {
		if (this._SDvisible === value) return;
		this._SDvisible = value;
		refreshWalkCount(this);
	},
});
