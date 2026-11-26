import {SCENE_NODE_CHANGE_KINDS} from "@shapediver/viewer.shared.node-tree";
import {
	type SceneChangeChannel,
	type SceneDynamicReason,
} from "@shapediver/viewer.shared.types";

/**
 * The channels of `ISceneState.revisions` in a fixed order. The node change
 * kinds come first, so a kind's index is also its channel's index.
 */
export const SCENE_CHANGE_CHANNELS: readonly SceneChangeChannel[] =
	Object.freeze([
		...SCENE_NODE_CHANGE_KINDS,
		"unknown",
		"environment",
		"shadows",
		"postProcessing",
		"colorManagement",
		"materialSettings",
		"environmentGeometry",
		"rendererType",
		"size",
	]);

/** The index of each channel in {@link SCENE_CHANGE_CHANNELS}. */
export const SCENE_CHANGE_CHANNEL_INDEX = Object.freeze(
	Object.fromEntries(SCENE_CHANGE_CHANNELS.map((c, i) => [c, i])),
) as Readonly<Record<SceneChangeChannel, number>>;

/** The dynamic reasons in a fixed order; a reason's bit is `1 << index`. */
export const SCENE_DYNAMIC_REASONS: readonly SceneDynamicReason[] =
	Object.freeze([
		"animation",
		"objectControls",
		"continuousRendering",
		"continuousShadowMapUpdate",
	]);
