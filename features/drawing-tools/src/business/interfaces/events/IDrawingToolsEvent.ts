import {type IViewportEvent} from "@shapediver/viewer";
import {type RayTraceResult} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";

import {type PointsData} from "../IDrawingToolsManager";

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
