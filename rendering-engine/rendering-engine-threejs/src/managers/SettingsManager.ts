import {CameraEngine} from "@shapediver/viewer.rendering-engine.camera-engine";
import {LightEngine} from "@shapediver/viewer.rendering-engine.light-engine";
import {type IManager} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {
	Converter,
	EventEngine,
	EVENTTYPE_VIEWPORT,
	SESSION_SETTINGS_MODE,
	SettingsEngine,
	StateEngine,
} from "@shapediver/viewer.shared.services";
import {
	ENVIRONMENT_MAP_ORIENTATION,
	ENVIRONMENT_MAP_PBR_MODE,
	type IViewportEvent,
	type IViewportSettingsSections,
	MATERIAL_TYPE,
	TEXTURE_ENCODING,
	TONE_MAPPING,
} from "@shapediver/viewer.shared.types";

import {RenderingEngine} from "..";
import {PostProcessingManager} from "./PostProcessingManager";

export class SettingsManager implements IManager {
	private readonly _converter = Converter.instance;
	private readonly _eventEngine = EventEngine.instance;
	private readonly _stateEngine = StateEngine.instance;
	private readonly _renderingEngine: RenderingEngine;

	private _sessionSettingsId?: string;
	private _sessionSettingsMode: SESSION_SETTINGS_MODE;
	private _settingsEngine?: SettingsEngine;

	constructor(
		renderingEngine: RenderingEngine,
		props: {
			sessionSettingsMode: SESSION_SETTINGS_MODE;
			sessionSettingsId?: string;
		},
	) {
		this._renderingEngine = renderingEngine;
		this._sessionSettingsMode = props.sessionSettingsMode;
		this._sessionSettingsId = props.sessionSettingsId;
	}

	public get sessionSettingsId(): string | undefined {
		return this._sessionSettingsId;
	}

	public set sessionSettingsId(value: string | undefined) {
		this._sessionSettingsId = value;
	}

	public get sessionSettingsMode(): SESSION_SETTINGS_MODE {
		return this._sessionSettingsMode;
	}

	public set sessionSettingsMode(value: SESSION_SETTINGS_MODE) {
		this._sessionSettingsMode = value;
	}

	public get settingsEngine(): SettingsEngine | undefined {
		return this._settingsEngine;
	}

	public set settingsEngine(value: SettingsEngine | undefined) {
		this._settingsEngine = value;
	}

	public async applySettings(
		sections: IViewportSettingsSections = {
			ar: true,
			scene: true,
			camera: true,
			light: true,
			environment: true,
			general: true,
			postprocessing: true,
		},
		settingsEngine?: SettingsEngine,
		updateViewport: boolean = true,
	): Promise<void> {
		settingsEngine = settingsEngine || this._settingsEngine;
		if (!settingsEngine) return;

		// The gem options are set first and synchronously: gemTracing and
		// gemNormalMapResolution only affect gems that are captured afterwards,
		// and the scene is converted once the viewport is updated.
		if (sections.general) {
			// TODO: drop the cast once the @shapediver/viewer.settings pin includes settings 7.2
			// a missing or invalid value is the old look
			const material = settingsEngine.material as {
				physicalGemDispersion?: unknown;
				gemTracing?: unknown;
				gemNormalMapResolution?: unknown;
			};
			const dispersion =
				typeof material.physicalGemDispersion === "boolean"
					? material.physicalGemDispersion
					: false;
			const tracing =
				material.gemTracing === "sphere" ||
				material.gemTracing === "facets"
					? material.gemTracing
					: "sphere";
			const resolution =
				material.gemNormalMapResolution === 256 ||
				material.gemNormalMapResolution === 512 ||
				material.gemNormalMapResolution === 1024
					? material.gemNormalMapResolution
					: 1024;
			// the dispersion setter updates the materials, so only call it on a change
			if (this._renderingEngine.physicalGemDispersion !== dispersion)
				this._renderingEngine.physicalGemDispersion = dispersion;
			this._renderingEngine.gemTracing = tracing;
			this._renderingEngine.gemNormalMapResolution = resolution;
		}

		if (sections.environment) {
			const promises = [];

			promises.push(
				this._renderingEngine.postProcessingManager.initialize(),
			);

			// as the environment map is the only thing that needs time to load, load it first
			promises.push(
				new Promise<void>((resolve, reject) => {
					this._stateEngine.viewportEngines[
						this._renderingEngine.id
					]?.environmentMapLoaded
						.then(() => {
							try {
								if (!settingsEngine) return;
								this._renderingEngine.environmentMapAsBackground =
									settingsEngine.environment.mapAsBackground;
								this._renderingEngine.clearAlpha =
									settingsEngine.environment.clearAlpha;
								this._renderingEngine.clearColor =
									this._converter.toHexColor(
										settingsEngine.environment.clearColor,
									);
								this._renderingEngine.environmentMapRotation = [
									settingsEngine.environment.rotation.x,
									settingsEngine.environment.rotation.y,
									settingsEngine.environment.rotation.z,
									settingsEngine.environment.rotation.w,
								];
								this._renderingEngine.environmentMapBlurriness =
									settingsEngine.environment.blurriness;
								this._renderingEngine.environmentMapIntensity =
									settingsEngine.environment.intensity;
								// TODO: drop the cast once the @shapediver/viewer.settings pin includes settings 7.2
								// a missing value is the old look
								{
									const mapOrientation = (
										settingsEngine.environment as {
											mapOrientation?: string;
										}
									).mapOrientation;
									const orientation = Object.values(
										ENVIRONMENT_MAP_ORIENTATION,
									).includes(
										mapOrientation as ENVIRONMENT_MAP_ORIENTATION,
									)
										? (mapOrientation as ENVIRONMENT_MAP_ORIENTATION)
										: ENVIRONMENT_MAP_ORIENTATION.LEGACY;
									// the setter reassigns the rotation, so only call it on a change
									if (
										this._renderingEngine
											.environmentMapOrientation !==
										orientation
									)
										this._renderingEngine.environmentMapOrientation =
											orientation;
								}
								{
									const mapPbrMode = (
										settingsEngine.environment as {
											mapPbrMode?: string;
										}
									).mapPbrMode;
									const pbrMode = Object.values(
										ENVIRONMENT_MAP_PBR_MODE,
									).includes(
										mapPbrMode as ENVIRONMENT_MAP_PBR_MODE,
									)
										? (mapPbrMode as ENVIRONMENT_MAP_PBR_MODE)
										: ENVIRONMENT_MAP_PBR_MODE.LEGACY;
									// the setter recompiles the materials, so only call it on a change
									if (
										this._renderingEngine
											.environmentMapPbrMode !== pbrMode
									)
										this._renderingEngine.environmentMapPbrMode =
											pbrMode;
								}
								this.applySyncSettings(
									sections,
									settingsEngine,
									updateViewport,
								);

								this._eventEngine.emitEvent(
									EVENTTYPE_VIEWPORT.VIEWPORT_SETTINGS_LOADED,
									<IViewportEvent>{
										viewportId: this._renderingEngine.id,
									},
								);
								resolve();
							} catch (e) {
								reject(e);
							}
						})
						.catch((e) => reject(e));

					// set it like this to not trigger the loading
					this._renderingEngine.environmentMap =
						this._renderingEngine.environmentMapLoader.reconstructSavedEnvironmentMapContent(
							settingsEngine!.environment.map,
						);
				}),
			);

			await Promise.all(promises);
		} else {
			this.applySyncSettings(sections, settingsEngine, updateViewport);
			this._eventEngine.emitEvent(
				EVENTTYPE_VIEWPORT.VIEWPORT_SETTINGS_LOADED,
				<IViewportEvent>{viewportId: this._renderingEngine.id},
			);
		}
	}

	public assignSettingsEngine(settingsEngine: SettingsEngine): void {
		this._settingsEngine = settingsEngine;
	}

	public init(): void {}

	public saveSettings(settingsEngine?: SettingsEngine) {
		settingsEngine = settingsEngine || this._settingsEngine;
		if (!settingsEngine) return;

		(<LightEngine>this._renderingEngine.lightEngine).saveSettings(
			settingsEngine,
		);
		(<CameraEngine>this._renderingEngine.cameraEngine).saveSettings(
			settingsEngine,
		);
		(<PostProcessingManager>(
			this._renderingEngine.postProcessingManager
		)).saveSettings(settingsEngine);

		settingsEngine.ar.enable = this._renderingEngine.enableAR;

		settingsEngine.environment.mapResolution =
			this._renderingEngine.environmentMapResolution;
		settingsEngine.environment.map =
			this._renderingEngine.environmentMapLoader.createSaveableEnvironmentMapContent(
				this._renderingEngine.environmentMap,
			);
		settingsEngine.environment.mapAsBackground =
			this._renderingEngine.environmentMapAsBackground;
		settingsEngine.environment.clearAlpha =
			this._renderingEngine.clearAlpha;
		settingsEngine.environment.clearColor = this._converter.toHexColor(
			this._renderingEngine.clearColor,
		);
		settingsEngine.environment.rotation = {
			x: this._renderingEngine.environmentMapRotation[0],
			y: this._renderingEngine.environmentMapRotation[1],
			z: this._renderingEngine.environmentMapRotation[2],
			w: this._renderingEngine.environmentMapRotation[3],
		};
		settingsEngine.environment.blurriness =
			this._renderingEngine.environmentMapBlurriness;
		settingsEngine.environment.intensity =
			this._renderingEngine.environmentMapIntensity;
		// TODO: drop the cast once the @shapediver/viewer.settings pin includes settings 7.2
		(settingsEngine.environment as {mapPbrMode?: string}).mapPbrMode =
			this._renderingEngine.environmentMapPbrMode;
		(
			settingsEngine.environment as {mapOrientation?: string}
		).mapOrientation = this._renderingEngine.environmentMapOrientation;

		settingsEngine.environmentGeometry.gridVisibility =
			this._renderingEngine.gridVisibility;
		settingsEngine.environmentGeometry.groundPlaneVisibility =
			this._renderingEngine.groundPlaneVisibility;
		settingsEngine.environmentGeometry.groundPlaneShadowVisibility =
			this._renderingEngine.groundPlaneShadowVisibility;
		settingsEngine.environmentGeometry.gridColor =
			this._converter.toHexColor(this._renderingEngine.gridColor);
		settingsEngine.environmentGeometry.groundPlaneColor =
			this._converter.toHexColor(this._renderingEngine.groundPlaneColor);
		settingsEngine.environmentGeometry.groundPlaneShadowColor =
			this._converter.toHexColor(
				this._renderingEngine.groundPlaneShadowColor,
			);
		settingsEngine.environmentGeometry.contactShadowBlur =
			this._renderingEngine.contactShadowBlur;
		settingsEngine.environmentGeometry.contactShadowDarkness =
			this._renderingEngine.contactShadowDarkness;
		settingsEngine.environmentGeometry.contactShadowHeight =
			this._renderingEngine.contactShadowHeight;
		settingsEngine.environmentGeometry.contactShadowOpacity =
			this._renderingEngine.contactShadowOpacity;
		settingsEngine.environmentGeometry.contactShadowVisibility =
			this._renderingEngine.contactShadowVisibility;

		settingsEngine.general.pointSize = this._renderingEngine.pointSize;
		settingsEngine.general.transformation.rotation = {
			x: this._renderingEngine.arRotation[0],
			y: this._renderingEngine.arRotation[1],
			z: this._renderingEngine.arRotation[2],
		};
		settingsEngine.general.transformation.translation = {
			x: this._renderingEngine.arTranslation[0],
			y: this._renderingEngine.arTranslation[1],
			z: this._renderingEngine.arTranslation[2],
		};
		settingsEngine.general.transformation.scale = {
			x: this._renderingEngine.arScale[0],
			y: this._renderingEngine.arScale[1],
			z: this._renderingEngine.arScale[2],
		};

		settingsEngine.material.defaultMaterialColor =
			this._converter.toHexColor(
				this._renderingEngine.defaultMaterialColor,
			);
		settingsEngine.material.materialOverrideType =
			this._renderingEngine.materialOverrideType;
		const materialGem = settingsEngine.material as {
			physicalGemDispersion?: boolean;
			gemTracing?: string;
			gemNormalMapResolution?: number;
		};
		materialGem.physicalGemDispersion =
			this._renderingEngine.physicalGemDispersion;
		materialGem.gemTracing = this._renderingEngine.gemTracing;
		materialGem.gemNormalMapResolution =
			this._renderingEngine.gemNormalMapResolution;

		settingsEngine.rendering.automaticColorAdjustment =
			this._renderingEngine.automaticColorAdjustment;
		settingsEngine.rendering.lights = this._renderingEngine.lights;
		settingsEngine.rendering.outputEncoding =
			this._renderingEngine.outputEncoding;
		settingsEngine.rendering.physicallyCorrectLights =
			this._renderingEngine.physicallyCorrectLights;
		settingsEngine.rendering.textureEncoding =
			this._renderingEngine.textureEncoding;
		settingsEngine.rendering.toneMapping =
			this._renderingEngine.toneMapping;
		settingsEngine.rendering.toneMappingExposure =
			this._renderingEngine.toneMappingExposure;
		settingsEngine.rendering.beautyRenderBlendingDuration =
			this._renderingEngine.beautyRenderBlendingDuration;
		settingsEngine.rendering.beautyRenderDelay =
			this._renderingEngine.beautyRenderDelay;
		settingsEngine.rendering.shadows = this._renderingEngine.shadows;
		settingsEngine.rendering.softShadows =
			this._renderingEngine.softShadows;
		// TODO: drop the cast once the @shapediver/viewer.settings pin includes settings 7.2
		const renderingAccumulation = settingsEngine.rendering as {
			accumulationFrames?: number;
			accumulationFramesMobile?: number;
		};
		renderingAccumulation.accumulationFrames =
			this._renderingEngine.accumulationFrames;
		renderingAccumulation.accumulationFramesMobile =
			this._renderingEngine.accumulationFramesMobile;
	}

	private applySyncSettings(
		sections: IViewportSettingsSections = {
			ar: true,
			scene: true,
			camera: true,
			light: true,
			environment: true,
			general: true,
			postprocessing: true,
		},
		settingsEngine?: SettingsEngine,
		updateViewport: boolean = true,
	) {
		settingsEngine = settingsEngine || this._settingsEngine;
		if (!settingsEngine) return;

		if (sections.ar) {
			this._renderingEngine.enableAR = settingsEngine.ar.enable;
			this._renderingEngine.arScale = [
				settingsEngine.general.transformation.scale.x,
				settingsEngine.general.transformation.scale.y,
				settingsEngine.general.transformation.scale.z,
			];
			this._renderingEngine.arTranslation = [
				settingsEngine.general.transformation.translation.x,
				settingsEngine.general.transformation.translation.y,
				settingsEngine.general.transformation.translation.z,
			];
			this._renderingEngine.arRotation = [
				settingsEngine.general.transformation.rotation.x,
				settingsEngine.general.transformation.rotation.y,
				settingsEngine.general.transformation.rotation.z,
			];
		}

		if (sections.scene) {
			this._renderingEngine.gridColor =
				settingsEngine.environmentGeometry.gridColor;
			this._renderingEngine.gridVisibility =
				settingsEngine.environmentGeometry.gridVisibility;
			this._renderingEngine.groundPlaneColor =
				settingsEngine.environmentGeometry.groundPlaneColor;
			this._renderingEngine.groundPlaneVisibility =
				settingsEngine.environmentGeometry.groundPlaneVisibility;
			this._renderingEngine.groundPlaneShadowColor =
				settingsEngine.environmentGeometry.groundPlaneShadowColor;
			this._renderingEngine.groundPlaneShadowVisibility =
				settingsEngine.environmentGeometry.groundPlaneShadowVisibility;
			this._renderingEngine.contactShadowBlur =
				settingsEngine.environmentGeometry.contactShadowBlur;
			this._renderingEngine.contactShadowDarkness =
				settingsEngine.environmentGeometry.contactShadowDarkness;
			this._renderingEngine.contactShadowHeight =
				settingsEngine.environmentGeometry.contactShadowHeight;
			this._renderingEngine.contactShadowOpacity =
				settingsEngine.environmentGeometry.contactShadowOpacity;
			this._renderingEngine.contactShadowVisibility =
				settingsEngine.environmentGeometry.contactShadowVisibility;

			this._renderingEngine.shadows = settingsEngine.rendering.shadows;
			this._renderingEngine.softShadows =
				settingsEngine.rendering.softShadows;
			this._renderingEngine.lights = settingsEngine.rendering.lights;

			this._renderingEngine.automaticColorAdjustment =
				settingsEngine.rendering.automaticColorAdjustment;
			this._renderingEngine.textureEncoding = <TEXTURE_ENCODING>(
				settingsEngine.rendering.textureEncoding
			);
			this._renderingEngine.outputEncoding = <TEXTURE_ENCODING>(
				settingsEngine.rendering.outputEncoding
			);
			this._renderingEngine.physicallyCorrectLights =
				settingsEngine.rendering.physicallyCorrectLights;
			this._renderingEngine.toneMapping = <TONE_MAPPING>(
				settingsEngine.rendering.toneMapping
			);
			this._renderingEngine.toneMappingExposure =
				settingsEngine.rendering.toneMappingExposure;

			// TODO: drop the cast once the @shapediver/viewer.settings pin includes settings 7.2
			// a missing or invalid value is the old look (no accumulation)
			const rendering = settingsEngine.rendering as {
				accumulationFrames?: unknown;
				accumulationFramesMobile?: unknown;
			};
			this._renderingEngine.accumulationFrames =
				typeof rendering.accumulationFrames === "number"
					? rendering.accumulationFrames
					: 0;
			this._renderingEngine.accumulationFramesMobile =
				typeof rendering.accumulationFramesMobile === "number"
					? rendering.accumulationFramesMobile
					: 0;
		}

		if (sections.general) {
			this._renderingEngine.defaultMaterialColor =
				settingsEngine.material.defaultMaterialColor;
			this._renderingEngine.materialOverrideType = settingsEngine.material
				.materialOverrideType as MATERIAL_TYPE;
			this._renderingEngine.pointSize = settingsEngine.general.pointSize;
		}

		if (sections.light)
			(<LightEngine>this._renderingEngine.lightEngine).applySettings(
				settingsEngine,
			);
		if (sections.camera)
			(<CameraEngine>this._renderingEngine.cameraEngine).applySettings(
				settingsEngine,
			);
		if (sections.postprocessing)
			(<PostProcessingManager>(
				this._renderingEngine.postProcessingManager
			)).applySettings(settingsEngine);

		// call adjust camera to load the three.js camera objects
		this._renderingEngine.cameraManager.adjustCamera(1);

		this._stateEngine.viewportEngines[
			this._renderingEngine.id
		]?.settingsAssigned.resolve(true);
		if (updateViewport)
			this._renderingEngine.update("RenderingEngine.applySyncSettings");
	}
}
