import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	DomEventEngine,
	SESSION_SETTINGS_MODE,
	SettingsEngine} from "@shapediver/viewer.shared.services";
import {
	FLAG_TYPE,
	type IGeometryData,
	type IIntersectionFilter,
	RENDERER_TYPE,
	type ViewportCreationDefinition,
	VISIBILITY_MODE} from "@shapediver/viewer.shared.types";

import {vec2, vec3} from "gl-matrix";

export interface IConvert3Dto2DResult {
	container: vec2;
	client: vec2;
	page: vec2;
	hidden: boolean;
	distance: number;
}

export interface IRenderingEngine {
	automaticResizing: boolean;
	canvas: HTMLCanvasElement;
	closed: boolean;
	domEventEngine: DomEventEngine;
	id: string;
	pointSize: number;
	sessionSettingsId?: string;
	sessionSettingsMode: SESSION_SETTINGS_MODE;
	settingsEngine?: SettingsEngine;
	show: boolean;
	showStatistics: boolean;
	type: RENDERER_TYPE;
	viewportCreationDefinition: ViewportCreationDefinition;
	visibility: VISIBILITY_MODE;
	visibilitySessionIds?: string[];

	addFlag(flag: FLAG_TYPE): string;
	assignSettingsEngine(settingsEngine: SettingsEngine): void;
	continueRendering(): void;
	convert3Dto2D(p: vec3): IConvert3Dto2DResult;
	getScreenshot(type?: string, encoderOptions?: number): string;
	isMobileDeviceWithoutBrowserARSupport(): boolean;
	pauseRendering(): void;
	pointerEventToRay(event: PointerEvent): {origin: vec3; direction: vec3};
	raytraceScene(
		origin: vec3,
		direction: vec3,
		filterCriteria?: IIntersectionFilter[],
	): {distance: number; node: ITreeNode; data?: IGeometryData}[];
	removeFlag(token: string): boolean;
	reset(): void;
	resize(width: number, height: number): void;
	start(): void;
	update(id: string): void;
	viewInAR(
		file: string,
		options?: {
			arScale?: "auto" | "fixed";
			arPlacement?: "floor" | "wall";
			xrEnvironment?: boolean;
		},
	): Promise<void>;
	viewableInAR(): boolean;
}
