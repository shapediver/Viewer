import {CameraEngine} from "@shapediver/viewer.rendering-engine.camera-engine";
import {LightEngine} from "@shapediver/viewer.rendering-engine.light-engine";
import {IManager} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {
	Converter,
	EventEngine,
	EVENTTYPE_VIEWPORT,
	SESSION_SETTINGS_MODE,
	SettingsEngine,
	StateEngine,
} from "@shapediver/viewer.shared.services";
import {
	IViewportEvent,
	IViewportSettingsSections,
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

	public init(): void {
		throw new Error("Method not implemented.");
	}

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
