import {IViewportEvent} from "@shapediver/viewer";
import {RayTraceResult} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {PointsData} from "../IDrawingToolsManager";

export interface IDrawingToolsEvent extends IViewportEvent {
	// #region Properties (7)

	drawingToolsId: string;
	fromHistory?: boolean;
	index?: number;
	indices?: number[];
	message?: string;
	points?: PointsData;
	metaData?: RayTraceResult[];
	recordHistory?: boolean;
	temporary?: boolean;

	// #endregion Properties (7)
}
