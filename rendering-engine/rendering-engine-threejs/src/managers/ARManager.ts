import {IManager} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {
	EventEngine,
	EVENTTYPE,
	ShapeDiverViewerArError,
	SystemInfo,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {ITaskEvent, TASK_TYPE} from "@shapediver/viewer.shared.types";

import {RenderingEngine} from "..";

export class ARManager implements IManager {
	private readonly _eventEngine = EventEngine.instance;
	private readonly _systemInfo = SystemInfo.instance;
	private readonly _uuidGenerator = UuidGenerator.instance;
	readonly #defaultLogoStatic =
		"https://viewer.shapediver.com/v3/graphics/logo.png";

	constructor(renderingEngine: RenderingEngine) {}

	public init() {}

	public isMobileDeviceWithoutBrowserARSupport(): boolean {
		// has to be a mobile device (duh)
		if (
			this._systemInfo.isIOS === false &&
			this._systemInfo.isAndroid === false
		)
			return false;

		// no Firefox on Android
		if (
			this._systemInfo.isAndroid === true &&
			this._systemInfo.isFirefox === true
		)
			return true;

		// no Instagram on iOS
		if (
			this._systemInfo.isIOS === true &&
			this._systemInfo.isInstagram === true
		)
			return true;

		return false;
	}

	public async viewInAR(
		file: string,
		options: {
			arScale?: "auto" | "fixed";
			arPlacement?: "floor" | "wall";
			xrEnvironment?: boolean;
		} = {arScale: "auto", arPlacement: "floor", xrEnvironment: false},
	): Promise<void> {
		const eventId = this._uuidGenerator.create();
		const event: ITaskEvent = {
			type: TASK_TYPE.AR_LOADING,
			id: eventId,
			progress: 0,
			status: "Loading AR scene",
		};
		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, event);

		// if this is not a supported device, throw an error
		if (this.viewableInAR() === false) {
			const event: ITaskEvent = {
				type: TASK_TYPE.AR_LOADING,
				id: eventId,
				progress: 1,
				status: "Stopped AR loading due to an error",
			};
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, event);
			throw new ShapeDiverViewerArError(
				// eslint-disable-next-line quotes
				'Api.viewInAR: The device or browser is not supported for this functionality, please call "viewableInAR" for more information.',
			);
		}

		const arScale = options.arScale !== "auto" ? "fixed" : "auto";
		// const arPlacement = options.arPlacement !== 'wall' ? 'floor' : 'wall';
		// const xrEnvironment = options.xrEnvironment !== true ? false : true;

		// let arEnvironment = '';
		// const envMapUrl = this.getEnvironmentMapImageUrl();
		// if (envMapUrl !== '') {
		//   if (envMapUrl.endsWith('.hdr')) {
		//     arEnvironment = 'skybox-image=' + envMapUrl;
		//   } else {
		//     arEnvironment = 'environment-image=' + envMapUrl;
		//   }
		// }

		if (this._systemInfo.isIOS) {
			// create the link and click it
			const a = document.createElement("a");
			a.href =
				file +
				(arScale === "fixed"
					? ".usdz_allowsContentScaling=0"
					: ".usdz");
			a.rel = "ar";
			const img = document.createElement("img");
			img.src = this.#defaultLogoStatic;
			a.appendChild(img);
			a.click();
		} else {
			const a = document.createElement("a");
			a.href = `intent://arvr.google.com/scene-viewer/1.0?resizable=${arScale === "fixed" ? "false" : "true"}&file=${file}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
			a.click();
		}

		const event2: ITaskEvent = {
			type: TASK_TYPE.AR_LOADING,
			id: eventId,
			progress: 1,
			status: "Done loading AR scene, launching AR",
		};
		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, event2);
	}

	public viewableInAR(): boolean {
		// has to be a mobile device (duh)
		if (
			this._systemInfo.isIOS === false &&
			this._systemInfo.isAndroid === false
		)
			return false;

		// no Firefox on Android
		if (
			this._systemInfo.isAndroid === true &&
			this._systemInfo.isFirefox === true
		)
			return false;

		// no Firefox on iOS
		if (
			this._systemInfo.isIOS === true &&
			this._systemInfo.isFirefox === true
		)
			return false;

		// no Instagram on iOS
		if (
			this._systemInfo.isIOS === true &&
			this._systemInfo.isInstagram === true
		)
			return false;

		return true;
	}
}
