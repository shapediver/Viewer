import {vec2, vec3} from "gl-matrix";
import {type Color} from "../../types";
import {type IBox} from "../math/IBox";
import {type ITreeNodeData} from "../tree-node/ITreeNodeData";

export enum TAG3D_JUSTIFICATION {
	TOP_LEFT = "TL",
	TOP_CENTER = "TC",
	TOP_RIGHT = "TR",
	MIDDLE_LEFT = "ML",
	MIDDLE_CENTER = "MC",
	MIDDLE_RIGHT = "MR",
	BOTTOM_LEFT = "BL",
	BOTTOM_CENTER = "BC",
	BOTTOM_RIGHT = "BR",
}

export interface ITag3D {
	// #region Properties (6)

	color: Color;
	justification: TAG3D_JUSTIFICATION;
	location: {
		normal: {X: number; Y: number; Z: number};
		yAxis: {X: number; Y: number; Z: number};
		xAxis: {X: number; Y: number; Z: number};
		origin: {X: number; Y: number; Z: number};
	};
	size?: number;
	text?: string;
	version: string;

	// #endregion Properties (6)
}

export interface ITag2D {
	// #region Properties (4)

	color: Color;
	location: {X: number; Y: number; Z: number};

	text: string;
	version: string;

	// #endregion Properties (4)
}

export interface IAnchor {
	// #region Properties (7)

	data?: IAnchorDataImage | IAnchorDataText;
	format?: "text" | "image";
	hideable?: boolean;
	intersectionTarget?:
		| {
				min: {x: number; y: number; z: number};
				max: {x: number; y: number; z: number};
		  }
		| string
		| string[];
	location: {x: number; y: number; z: number};
	version: string;
	viewports?: [];

	// #endregion Properties (7)
}

export interface IAnchorDataImage {
	// #region Properties (6)

	alt: string;
	height: number;
	hidden?: boolean;
	position?: {
		horizontal?: string;
		vertical?: string;
	};

	src: string;
	width: number;

	// #endregion Properties (6)
}

export interface IAnchorDataText {
	// #region Properties (5)

	color: Color;
	hidden?: boolean;
	position?: {
		horizontal?: string;
		vertical?: string;
	};
	text: string;
	textAlign?: string;

	// #endregion Properties (5)
}

export interface IHTMLElementAnchorUpdateProperties {
	anchor: IHTMLElementAnchorData;
	htmlElement: HTMLDivElement;
	page: vec2;
	container: vec2;
	client: vec2;
	scale: vec2;
	hidden: boolean;
	visible: boolean;
	distance: number;
}

export interface IHTMLElementAnchorData extends ITreeNodeData {
	// #region Properties (6)

	data: IAnchorDataImage | IAnchorDataText | any;
	format: "text" | "image" | "custom";
	hideable: boolean;
	intersectionTarget: IBox | string | string[] | undefined;
	location: vec3;
	viewports: string[];

	// #endregion Properties (6)

	// #region Public Methods (5)

	clone(): IHTMLElementAnchorData;
	create(properties: {
		anchor: IHTMLElementAnchorData;
		parent: HTMLDivElement;
	}): void;
	createViewerHtmlElement(viewer: string): HTMLDivElement | null;
	getViewerHtmlElement(viewer: string): HTMLDivElement | null;
	update(properties: IHTMLElementAnchorUpdateProperties): void;

	// #endregion Public Methods (5)
}
