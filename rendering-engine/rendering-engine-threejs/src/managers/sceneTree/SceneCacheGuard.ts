import {currentSerial} from "@shapediver/viewer.shared.node-tree";
import {type SceneChangeChannel} from "@shapediver/viewer.shared.types";

import {drawSetRevision} from "../../objects/SDObject";
import {type SceneTreeManager} from "../SceneTreeManager";
import {SCENE_CHANGE_CHANNEL_INDEX} from "./sceneState";

/**
 * A channel a cache can watch: one of `ISceneState.revisions`, or the
 * internal `drawSet` (a draw set of the converted objects changed, one value
 * for all viewports, see `noteDrawSetChange` in `SDObject.ts`).
 */
export type SceneCacheChannel = SceneChangeChannel | "drawSet";

/**
 * Tells a cache of one viewport (a shadow map, an ambient occlusion buffer,
 * a picking buffer) whether the scene it was built from is still the same.
 *
 * It stores one value of the scene tree's change clock, taken at
 * {@link markBuilt}. The cache is valid while every channel it watches
 * (always including `unknown`) was last applied at or before that value
 * and, with `staticOnly`, while the scene is static.
 *
 * Edits are seen when the viewport applies them: by a scene update, an
 * `updateNode` call of the viewport, a setting change or `viewport.update()`
 * (channel `unknown`). An edit without any of these (a three.js object or a
 * matrix changed without a new version) is not seen until the next one,
 * like today's shadow map. `continuousShadowMapUpdate` makes the scene
 * dynamic, so a `staticOnly` cache is never valid then.
 */
export class SceneCacheGuard {
	private readonly _indices: readonly number[];
	private readonly _drawSet: boolean;
	private _builtAt = -1;

	/**
	 * @param _sceneTreeManager the scene tree manager of the viewport
	 * @param channels the channels the cache depends on; `unknown` is added
	 * @param _staticOnly the cache is invalid while the scene is dynamic
	 */
	constructor(
		private readonly _sceneTreeManager: SceneTreeManager,
		channels: readonly SceneCacheChannel[],
		private readonly _staticOnly: boolean = true,
	) {
		const indices = new Set<number>([SCENE_CHANGE_CHANNEL_INDEX.unknown]);
		for (const channel of channels)
			if (channel !== "drawSet")
				indices.add(SCENE_CHANGE_CHANNEL_INDEX[channel]);
		this._indices = [...indices];
		this._drawSet = channels.includes("drawSet");
	}

	/** Nothing the cache watches changed since {@link markBuilt}. */
	public isValid(): boolean {
		const builtAt = this._builtAt;
		if (builtAt < 0) return false;
		if (this._staticOnly && !this._sceneTreeManager.isStatic) return false;
		if (this._drawSet && drawSetRevision() > builtAt) return false;
		const revisions = this._sceneTreeManager.revisionValues;
		for (let i = 0; i < this._indices.length; i++)
			if (revisions[this._indices[i]] > builtAt) return false;
		return true;
	}

	/** Call after the cache was built from the current scene. */
	public markBuilt(): void {
		this._builtAt = currentSerial();
	}

	/** Makes {@link isValid} false until the next {@link markBuilt}. */
	public invalidate(): void {
		this._builtAt = -1;
	}
}
