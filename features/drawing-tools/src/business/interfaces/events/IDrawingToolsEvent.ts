import {IViewportEvent} from "@shapediver/viewer";
import {RayTraceResult} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";

import {PointsData} from "../IDrawingToolsManager";

export interface IDrawingToolsEvent extends IViewportEvent {
	controlIndex?: number;
	drawingToolsId: string;
	fromHistory?: boolean;
	index?: number;
	indices?: number[];
	message?: string;
	metaData?: RayTraceResult[];
	points?: PointsData;
	recordHistory?: boolean;
	temporary?: boolean;
}
