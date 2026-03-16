import {IMapData, IViewportApi, MaterialEngine} from "@shapediver/viewer";
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
	RayTraceResult,
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
	RayTraceResult,
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
 * Multiple instances can be active simultaneously. Each returned instance is
 * independent and must be closed individually when no longer needed.
 *
 * @param viewport The viewport to which the DrawingTools should be attached.
 * @param callback The callback function that is called when the drawing is finished.
 * @param properties The customization properties for the DrawingTools.
 * @param customDefaultTextures An object containing custom default textures. The keys should correspond to the texture names used in the properties, and the values should be either a Promise that resolves to an IMapData or an IMapData object.
 * @returns The DrawingTools instance.
 */
export const createDrawingTools = (
	viewport: IViewportApi,
	callbacks: Callbacks,
	settings: SettingsOptional,
	customDefaultTextures?: {[key: string]: Promise<IMapData> | IMapData},
): IDrawingToolsApi => {
	drawingTools = new DrawingToolsApi(
		viewport,
		callbacks,
		settings,
		customDefaultTextures || defaultTextures,
	);
	return drawingTools;
};
