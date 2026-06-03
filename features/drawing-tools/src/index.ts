import {
	IMapData,
	ITreeNode,
	IViewportApi,
	MaterialEngine,
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
	RayTraceResult,
	RESTRICTION_TYPE,
	RestrictionMetaData,
	RestrictionProperties,
	RestrictionPropertiesBase,
	SnapRestrictionProperties,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {RestrictionDefinition} from "@shapediver/viewer.shared.types";
import {DrawingToolsApi} from "./api/implementation/DrawingToolsApi";
import {IDrawingToolsApi} from "./api/interfaces/IDrawingToolsApi";
import {IControl} from "./business/interfaces/controls/IControl";
import {IEdgeControl} from "./business/interfaces/controls/IEdgeControl";
import {DrawingToolsEventResponseMapping} from "./business/interfaces/events/EventResponseMapping";
import {IDrawingToolsEvent} from "./business/interfaces/events/IDrawingToolsEvent";
import {
	AdjacencyEntry,
	Callbacks,
	PointsData,
	SettingsOptional,
} from "./business/interfaces/IDrawingToolsManager";

export {
	AngularRestrictionApi,
	AxisRestrictionApi,
	CameraPlaneRestrictionApi,
	DrawingToolsApi,
	GeometryRestrictionApi,
	GridRestrictionApi,
	LineRestrictionApi,
	PlaneRestrictionApi,
	PointRestrictionApi,
	RESTRICTION_TYPE,
	type AdjacencyEntry,
	type AngularRestrictionProperties,
	type AxisRestrictionProperties,
	type Callbacks,
	type CameraPlaneRestrictionProperties,
	type DraggingRestrictionMetaData,
	type DrawingRestrictionMetaData,
	type DrawingToolsEventResponseMapping,
	type GeometryRestrictionProperties,
	type GridRestrictionProperties,
	type IControl,
	type IDrawingToolsApi,
	type IDrawingToolsEvent,
	type IEdgeControl,
	type IRestriction,
	type IRestrictionApi,
	type ISnapRestriction,
	type ISnapRestrictionApi,
	type LineRestrictionProperties,
	type PlaneRestrictionProperties,
	type PointRestrictionProperties,
	type PointsData,
	type RayTraceResult,
	type RestrictionDefinition,
	type RestrictionMetaData,
	type RestrictionProperties,
	type RestrictionPropertiesBase,
	type SettingsOptional as Settings,
	type SnapRestrictionProperties,
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
	parentNode?: ITreeNode,
): IDrawingToolsApi => {
	drawingTools = new DrawingToolsApi(
		viewport,
		callbacks,
		settings,
		customDefaultTextures || defaultTextures,
		parentNode,
	);
	return drawingTools;
};
