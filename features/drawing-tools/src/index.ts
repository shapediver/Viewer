import {
	IMapData,
	IViewportApi,
	MaterialEngine,
	ShapeDiverViewerDrawingToolsError,
} from "@shapediver/viewer";
import {
	AngularRestrictionApi,
	AngularRestrictionProperties,
	AxisRestrictionApi,
	AxisRestrictionProperties,
	CameraPlaneRestrictionApi,
	CameraPlaneRestrictionProperties,
	DraggingRestrictionMetaData,
	DrawingRestrictionMetaData,
	GeometryRestrictionApi,
	GeometryRestrictionProperties,
	GridRestrictionApi,
	GridRestrictionProperties,
	IRestriction,
	IRestrictionApi,
	ISnapRestriction,
	ISnapRestrictionApi,
	LineRestrictionApi,
	LineRestrictionProperties,
	PlaneRestrictionApi,
	PlaneRestrictionProperties,
	PointRestrictionApi,
	PointRestrictionProperties,
	RestrictionMetaData,
	RestrictionProperties,
	RestrictionPropertiesBase,
	RESTRICTION_TYPE,
	SnapRestrictionProperties,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {RestrictionDefinition} from "@shapediver/viewer.shared.types";
import {DrawingToolsApi} from "./api/implementation/DrawingToolsApi";
import {IDrawingToolsApi} from "./api/interfaces/IDrawingToolsApi";
import {DrawingToolsEventResponseMapping} from "./business/interfaces/events/EventResponseMapping";
import {IDrawingToolsEvent} from "./business/interfaces/events/IDrawingToolsEvent";
import {
	Callbacks,
	PointsData,
	SettingsOptional,
} from "./business/interfaces/IDrawingToolsManager";

export {
	SettingsOptional as Settings,
	Callbacks,
	DrawingToolsEventResponseMapping,
	IDrawingToolsEvent,
	IDrawingToolsApi,
	DrawingToolsApi,
	PointsData,
};
export {IRestriction, ISnapRestriction};
export {
	RESTRICTION_TYPE,
	RestrictionDefinition,
	RestrictionProperties,
	RestrictionMetaData,
	DrawingRestrictionMetaData,
	DraggingRestrictionMetaData,
	SnapRestrictionProperties,
	PlaneRestrictionProperties,
	AngularRestrictionProperties,
	AxisRestrictionProperties,
	GridRestrictionProperties,
	GeometryRestrictionProperties,
	PointRestrictionProperties,
	LineRestrictionProperties,
	CameraPlaneRestrictionProperties,
	RestrictionPropertiesBase,
};
export {
	IRestrictionApi,
	ISnapRestrictionApi,
	PlaneRestrictionApi,
	AngularRestrictionApi,
	AxisRestrictionApi,
	GridRestrictionApi,
	GeometryRestrictionApi,
	CameraPlaneRestrictionApi,
	PointRestrictionApi,
	LineRestrictionApi,
};

const defaultTextures: {[key: string]: Promise<IMapData> | IMapData} = {};

defaultTextures["variation_0"] = MaterialEngine.instance
	.loadMap("https://viewer.shapediver.com/v3/graphics/point_soft.png")
	.then((mapData: IMapData | undefined) => {
		defaultTextures["variation_0"] = mapData!;
		return mapData!;
	});

let drawingTools: IDrawingToolsApi | undefined;

/**
 * Create a new instance of DrawingTools.
 *
 * @param viewport The viewport to which the DrawingTools should be attached.
 * @param callback The callback function that is called when the drawing is finished.
 * @param properties The customization properties for the DrawingTools.
 * @returns The DrawingTools instance.
 * @throws An error if there is already an active instance of DrawingTools.
 */
export const createDrawingTools = (
	viewport: IViewportApi,
	callbacks: Callbacks,
	settings: SettingsOptional,
): IDrawingToolsApi => {
	if (drawingTools && drawingTools.closed === false)
		throw new ShapeDiverViewerDrawingToolsError(
			"There can only be one instance of DrawingTools active at a time. Please close the current instance before creating a new one.",
		);

	drawingTools = new DrawingToolsApi(
		viewport,
		callbacks,
		settings,
		defaultTextures,
	);
	return drawingTools;
};
