import {type ITreeNode} from "../tree-node/ITreeNode";
import {type IEvent} from "./IEvent";

/**
 * Definition of the viewport event.
 * These events are sent for viewport specific events ({@link EVENTTYPE_VIEWPORT}).
 */
export interface IViewportEvent extends IEvent {
	// #region Properties (1)

	viewportId: string;

	// #endregion Properties (1)
}

/**
 * What changed on a node of the scene tree itself (see
 * {@link ISceneChanges.kinds}). The kind is written where the edit happens:
 * by the setters of the node and by its data.
 */
export type SceneNodeChangeKind =
	/** A geometry data item (or another data item that is drawn) was added, removed or got a new version. */
	| "geometry"
	/** The shown material of an unchanged geometry was replaced, for example by a hover or selection effect material. */
	| "material"
	/** The node's own transformation changed. Its branch moved with it. */
	| "transformation"
	/** The node's own visibility changed. It applies to its branch. */
	| "visibility"
	/** A child node was added or removed. */
	| "structure"
	/** A light data item was added, removed or got a new version. */
	| "light"
	/** A camera data item was added, removed or got a new version. */
	| "camera";

/** Why the scene of a viewport changes from frame to frame by itself. */
export type SceneDynamicReason =
	/** A scene animation runs (this includes animated morph targets). */
	| "animation"
	/** Turntable or object controls rotate the scene with the camera. */
	| "objectControls"
	/** The setting `continuousRendering` is on. */
	| "continuousRendering"
	/** The setting `continuousShadowMapUpdate` is on. */
	| "continuousShadowMapUpdate";

/** A channel of {@link ISceneState.revisions}. */
export type SceneChangeChannel =
	/** A node of the scene tree changed in this way. A removed node is a `structure` change of its parent. */
	| SceneNodeChangeKind
	/** A scene update went through the whole tree, or `viewport.update()` ran without a scene update: assume that everything changed. */
	| "unknown"
	/** The environment map and its settings. */
	| "environment"
	/** Shadows, soft shadows and the lights switch. */
	| "shadows"
	/** Post-processing effects, anti-aliasing, HDR, SSAA. */
	| "postProcessing"
	/** Tone mapping, exposure, encodings, clear color. */
	| "colorManagement"
	/** Default materials, material override, point size, gem settings. */
	| "materialSettings"
	/** Ground plane, grid, contact shadow. */
	| "environmentGeometry"
	/** The renderer type (standard or attributes) or the GPU instancing switch. */
	| "rendererType"
	/** The canvas size or the pixel ratio. */
	| "size";

/**
 * The scene state of a viewport (`viewport.sceneState`, and the payload of
 * `EVENTTYPE_VIEWPORT.SCENE_STATE_CHANGED`).
 *
 * Results that are kept from one frame to the next (a cached picture or
 * buffer) can compare {@link revisions} with a reading taken when they were
 * made. An edit is seen when it is applied: by a scene update (a new version
 * of the tree and the next frame or `viewport.update()`), by an `updateNode`
 * call of the viewport, or by a setting change. An edit without any of these,
 * for example of a three.js object or of a matrix without a new version, is
 * not seen until the next one; `viewport.update()` marks everything as
 * changed (channel `unknown`). The setting `continuousShadowMapUpdate` makes
 * the scene dynamic for such edits.
 */
export interface ISceneState {
	/** `true` while {@link reasons} is empty: nothing changes from frame to frame by itself. */
	readonly static: boolean;
	/** Why the scene changes from frame to frame by itself. */
	readonly reasons: readonly SceneDynamicReason[];
	/**
	 * Per channel, the value of the scene tree's change clock at which this
	 * viewport last applied a change of that channel. `0` means never.
	 *
	 * The values are taken from one clock that every node and data version
	 * of the tree also uses, so they do not rise in steps of 1. Compare two
	 * readings: a later (larger) value means that the channel changed in
	 * between.
	 */
	readonly revisions: Readonly<Record<SceneChangeChannel, number>>;
}

/**
 * The nodes of the scene tree that a scene update of a viewport went through.
 */
export interface ISceneChanges {
	/**
	 * The nodes that were converted again by the scene update, parents
	 * before their children. A node whose branch did not change is not in
	 * the list. The list can include a node that is no longer attached to the
	 * tree.
	 */
	readonly nodes: readonly ITreeNode[];
	/**
	 * The ids of the nodes whose converted objects were removed from the
	 * viewport by the scene update, together with those of their descendants.
	 * A node with one of these ids can be attached to the tree again.
	 */
	readonly removedNodeIds: readonly string[];
	/**
	 * Same length and order as {@link nodes}: per node, the kinds of change
	 * on the node itself that this viewport had not applied before. Empty if
	 * the update only passed through the node (its bounding box can still
	 * have changed through a descendant). A node that the viewport converts
	 * for the first time carries the kinds of its data items, its parent
	 * `structure`.
	 */
	readonly kinds: readonly (readonly SceneNodeChangeKind[])[];
}

/**
 * Definition of the event that is sent when the scene state of a viewport
 * switches (`EVENTTYPE_VIEWPORT.SCENE_STATE_CHANGED`).
 */
export interface IViewportSceneStateEvent extends IViewportEvent {
	/** The scene state after the switch. */
	sceneState: ISceneState;
}

/**
 * Definition of the event that is sent when a viewport has been updated
 * (`EVENTTYPE_VIEWPORT.VIEWPORT_UPDATED`).
 */
export interface IViewportUpdatedEvent extends IViewportEvent {
	// #region Properties (1)

	/**
	 * What the scene update of this viewport went through. The field is
	 * absent if the update went through the whole tree (for example after a
	 * change of the renderer type or of GPU instancing, or the first update
	 * of a viewport), or if no scene update ran for this event. A listener that
	 * keeps data about the scene tree has to read the whole tree then.
	 */
	sceneChanges?: ISceneChanges;

	// #endregion Properties (1)
}
