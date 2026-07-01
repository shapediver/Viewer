import {type IManager} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {
	EventEngine,
	EVENTTYPE,
	StateEngine,
	UuidGenerator} from "@shapediver/viewer.shared.services";
import {FLAG_TYPE} from "@shapediver/viewer.shared.types";

import {RenderingEngine} from "..";

export class FlagManager implements IManager {
	private readonly _eventEngine = EventEngine.instance;
	private readonly _stateEngine = StateEngine.instance;
	private readonly _uuidGenerator = UuidGenerator.instance;

	#flags: {[key: string]: string[]} = {
		[FLAG_TYPE.CAMERA_FREEZE]: [],
		[FLAG_TYPE.CONTINUOUS_RENDERING]: [],
		[FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE]: [],
		[FLAG_TYPE.SUSPEND_SCENE_UPDATES]: [],
	};

	constructor(
		private readonly _renderingEngine: RenderingEngine,
		props: {
			flags?: {
				[key: string]: FLAG_TYPE;
			};
		},
	) {
		for (const token in props.flags) {
			this.addFlag(props.flags[token], token);
		}
	}

	public addFlag(flag: FLAG_TYPE, inputToken?: string): string {
		const token = inputToken || this._uuidGenerator.create();
		if (flag === FLAG_TYPE.BUSY_MODE) {
			this._stateEngine.viewportEngines[
				this._renderingEngine.id
			]?.busy.push(token);
		} else {
			this.#flags[flag].push(token);
		}
		this.evaluateFlagState();
		return token;
	}

	public evaluateFlagState() {
		// busy
		{
			const currentBusyState = this._renderingEngine.busy;
			if (
				this._stateEngine.viewportEngines[this._renderingEngine.id] &&
				this._stateEngine.viewportEngines[this._renderingEngine.id]!
					.busy.length > 0
			) {
				if (!currentBusyState) {
					this._renderingEngine.busy = true;
					this._renderingEngine.renderingManager.render();
					this._eventEngine.emitEvent(
						EVENTTYPE.VIEWPORT.BUSY_MODE_ON,
						{viewportId: this._renderingEngine.id},
					);
				}
			} else {
				if (currentBusyState) {
					this._renderingEngine.busy = false;
					this._renderingEngine.renderingManager.render();
					this._eventEngine.emitEvent(
						EVENTTYPE.VIEWPORT.BUSY_MODE_OFF,
						{viewportId: this._renderingEngine.id},
					);
				}
			}
		}

		// camera freeze
		{
			if (this.#flags[FLAG_TYPE.CAMERA_FREEZE].length > 0) {
				this._renderingEngine.cameraEngine.deactivateCameraEvents();
			} else {
				this._renderingEngine.cameraEngine.activateCameraEvents();
			}
		}

		// continuous rendering
		{
			const currentContinuousRenderingState =
				this._renderingEngine.continuousRendering;
			if (this.#flags[FLAG_TYPE.CONTINUOUS_RENDERING].length > 0) {
				if (!currentContinuousRenderingState) {
					this._renderingEngine.continuousRendering = true;
					this._renderingEngine.renderingManager.render();
				}
			} else {
				if (currentContinuousRenderingState) {
					this._renderingEngine.continuousRendering = false;
				}
			}
		}

		// continuous shadow map update
		{
			const currentShadowMapUpdateState =
				this._renderingEngine.continuousShadowMapUpdate;
			if (
				this.#flags[FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE].length > 0
			) {
				if (!currentShadowMapUpdateState) {
					this._renderingEngine.continuousShadowMapUpdate = true;
					this._renderingEngine.renderingManager.render();
				}
			} else {
				if (currentShadowMapUpdateState) {
					this._renderingEngine.continuousShadowMapUpdate = false;
				}
			}
		}

		// suspend scene updates
		{
			const currentSuspendSceneUpdatesState =
				this._renderingEngine.suspendSceneUpdates;
			if (currentSuspendSceneUpdatesState) {
				if (this.#flags[FLAG_TYPE.SUSPEND_SCENE_UPDATES].length === 0) {
					this._renderingEngine.suspendSceneUpdates = false;
					this._renderingEngine.update("suspendSceneUpdates: false");
					this._renderingEngine.renderingManager.render();
				}
			} else {
				if (this.#flags[FLAG_TYPE.SUSPEND_SCENE_UPDATES].length > 0) {
					this._renderingEngine.suspendSceneUpdates = true;
				}
			}
		}
	}

	public init() {}

	public removeFlag(token: string): boolean {
		let success = false;
		const Flags = Object.values(FLAG_TYPE);
		for (const f of Flags) {
			if (f === FLAG_TYPE.BUSY_MODE) {
				if (
					this._stateEngine.viewportEngines[
						this._renderingEngine.id
					] &&
					this._stateEngine.viewportEngines[
						this._renderingEngine.id
					]!.busy.includes(token)
				) {
					this._stateEngine.viewportEngines[
						this._renderingEngine.id
					]!.busy.splice(
						this._stateEngine.viewportEngines[
							this._renderingEngine.id
						]!.busy.indexOf(token),
						1,
					);
					success = true;
					break;
				}
			} else {
				if (this.#flags[f].includes(token)) {
					this.#flags[f].splice(this.#flags[f].indexOf(token), 1);
					success = true;
					break;
				}
			}
		}
		this.evaluateFlagState();
		return success;
	}
}
