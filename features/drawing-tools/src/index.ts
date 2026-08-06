import {
	type IMapData,
	type ITreeNode,
	type IViewportApi,
	MaterialEngine,
} from "@shapediver/viewer";
import {
	AngularRestrictionApi,
	type AngularRestrictionProperties,
	AxisRestrictionApi,
	type AxisRestrictionProperties,
	CameraPlaneRestrictionApi,
	type CameraPlaneRestrictionProperties,
	type DraggingRestrictionMetaData,
	type DrawingRestrictionMetaData,
	GeometryRestrictionApi,
	type GeometryRestrictionProperties,
	GridRestrictionApi,
	type GridRestrictionProperties,
	type IRestriction,
	type IRestrictionApi,
	type ISnapRestriction,
	type ISnapRestrictionApi,
	LineRestrictionApi,
	type LineRestrictionProperties,
	PlaneRestrictionApi,
	type PlaneRestrictionProperties,
	PointRestrictionApi,
	type PointRestrictionProperties,
	type RayTraceResult,
	RESTRICTION_TYPE,
	type RestrictionMetaData,
	type RestrictionProperties,
	type RestrictionPropertiesBase,
	type SnapRestrictionProperties,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {type RestrictionDefinition} from "@shapediver/viewer.shared.types";
import {DrawingToolsApi} from "./api/implementation/DrawingToolsApi";
import {type IDrawingToolsApi} from "./api/interfaces/IDrawingToolsApi";
import {drawingParameterToRuntimeSettings} from "./business/implementation/DrawingParameterSettingsConverter";
import {type IControl} from "./business/interfaces/controls/IControl";
import {type IEdgeControl} from "./business/interfaces/controls/IEdgeControl";
import {type DrawingToolsEventResponseMapping} from "./business/interfaces/events/EventResponseMapping";
import {type IDrawingToolsEvent} from "./business/interfaces/events/IDrawingToolsEvent";
import {
	type AdjacencyEntry,
	type Callbacks,
	type PointsData,
	type SettingsOptional,
} from "./business/interfaces/IDrawingToolsManager";

export {
	AngularRestrictionApi,
	AxisRestrictionApi,
	CameraPlaneRestrictionApi,
	drawingParameterToRuntimeSettings,
	DrawingToolsApi,
	GeometryRestrictionApi,
	GridRestrictionApi,
	LineRestrictionApi,
	PlaneRestrictionApi,
	PointRestrictionApi,
	RESTRICTION_TYPE,
};
export type {
	AdjacencyEntry,
	AngularRestrictionProperties,
	AxisRestrictionProperties,
	Callbacks,
	CameraPlaneRestrictionProperties,
	DraggingRestrictionMetaData,
	DrawingRestrictionMetaData,
	DrawingToolsEventResponseMapping,
	GeometryRestrictionProperties,
	GridRestrictionProperties,
	IControl,
	IDrawingToolsApi,
	IDrawingToolsEvent,
	IEdgeControl,
	IRestriction,
	IRestrictionApi,
	ISnapRestriction,
	ISnapRestrictionApi,
	LineRestrictionProperties,
	PlaneRestrictionProperties,
	PointRestrictionProperties,
	PointsData,
	RayTraceResult,
	RestrictionDefinition,
	RestrictionMetaData,
	RestrictionProperties,
	RestrictionPropertiesBase,
	SettingsOptional as Settings,
	SnapRestrictionProperties,
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
