import { AngularRestrictionApi } from './api/implementation/restrictions/plane/snap/AngularRestrictionApi';
import { AngularRestrictionProperties } from './business/implementation/managers/interaction/restrictions/plane/snap/AngularRestriction';
import { AxisRestrictionApi } from './api/implementation/restrictions/plane/snap/AxisRestrictionApi';
import { AxisRestrictionProperties } from './business/implementation/managers/interaction/restrictions/plane/snap/AxisRestriction';
import { Callbacks, PointsData, SettingsOptional } from './business/interfaces/IDrawingToolsManager';
import { DrawingToolsApi } from './api/implementation/DrawingToolsApi';
import { DrawingToolsEventResponseMapping } from './business/interfaces/events/EventResponseMapping';
import { GeometryRestrictionApi } from './api/implementation/restrictions/geometry/GeometryRestrictionApi';
import { GeometryRestrictionProperties } from './business/implementation/managers/interaction/restrictions/geometry/GeometryRestriction';
import { GridRestrictionApi } from './api/implementation/restrictions/plane/snap/GridRestrictionApi';
import { GridRestrictionProperties } from './business/implementation/managers/interaction/restrictions/plane/snap/GridRestriction';
import { IDrawingToolsApi } from './api/interfaces/IDrawingToolsApi';
import { IDrawingToolsEvent } from './business/interfaces/events/IDrawingToolsEvent';
import {
    IMapData,
    IViewportApi,
    MaterialEngine,
    ShapeDiverViewerDrawingToolsError
} from '@shapediver/viewer';
import {
    IRestriction,
    RESTRICTION_TYPE,
    RestrictionMetaData,
    RestrictionProperties
} from './business/interfaces/IRestriction';
import { IRestrictionApi } from './api/interfaces/IRestrictionApi';
import { IRestrictionBase } from './business/interfaces/IRestrictionBase';
import { ISnapRestriction, SnapRestrictionProperties } from './business/interfaces/ISnapRestriction';
import { PlaneRestrictionApi } from './api/implementation/restrictions/plane/PlaneRestrictionApi';
import { PlaneRestrictionProperties } from './business/implementation/managers/interaction/restrictions/plane/PlaneRestriction';
import { SystemInfo } from '@shapediver/viewer.shared.services';

export {
    SettingsOptional as Settings, Callbacks,
    DrawingToolsEventResponseMapping, IDrawingToolsEvent,
    IDrawingToolsApi, DrawingToolsApi, PointsData,
    PlaneRestrictionProperties, GridRestrictionProperties, AngularRestrictionProperties,
    GeometryRestrictionProperties,
    AxisRestrictionProperties,
    IRestrictionApi, PlaneRestrictionApi, GridRestrictionApi, AngularRestrictionApi, GeometryRestrictionApi, AxisRestrictionApi,
    IRestrictionBase, RestrictionProperties, IRestriction, RestrictionMetaData, RESTRICTION_TYPE, SnapRestrictionProperties, ISnapRestriction,
};

const defaultTextures: { [key: string]: Promise<IMapData> | IMapData } = {};

defaultTextures['variation_0'] = MaterialEngine.instance.loadMap('https://viewer.shapediver.com/v3/graphics/point_soft.png')
    .then((mapData: IMapData | undefined) => {
        defaultTextures['variation_0'] = mapData!;
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
export const createDrawingTools = (viewport: IViewportApi, callbacks: Callbacks, settings: SettingsOptional): IDrawingToolsApi => {
    if (SystemInfo.instance.isMobile)
        throw new ShapeDiverViewerDrawingToolsError('The DrawingTools are not supported on mobile devices.');

    if (drawingTools && drawingTools.closed === false)
        throw new ShapeDiverViewerDrawingToolsError('There can only be one instance of DrawingTools active at a time. Please close the current instance before creating a new one.');

    drawingTools = new DrawingToolsApi(viewport, callbacks, settings, defaultTextures);
    return drawingTools;
};
