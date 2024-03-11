import { AngularRestrictionApi } from './api/implementation/restrictions/plane/snap/AngularRestrictionApi';
import { AngularRestrictionProperties } from './business/implementation/restrictions/plane/snap/AngularRestriction';
import { Callbacks, CustomizationPropertiesOptional, SetupPropertiesOptional } from './business/implementation/DrawingToolsManager';
import { DrawingToolsApi } from './api/implementation/DrawingToolsApi';
import { GridRestrictionApi } from './api/implementation/restrictions/plane/snap/GridRestrictionApi';
import { GridRestrictionProperties } from './business/implementation/restrictions/plane/snap/GridRestriction';
import { IDrawingToolsApi } from './api/interfaces/IDrawingToolsApi';
import {
    IRestriction,
    RESTRICTION_TYPE,
    RestrictionMetaData,
    RestrictionProperties
} from './business/interfaces/IRestriction';
import { IRestrictionApi } from './api/interfaces/IRestrictionApi';
import { IRestrictionBase, RestrictionBaseProperties } from './business/interfaces/IRestrictionBase';
import { ISnapRestriction, SnapRestrictionProperties } from './business/interfaces/ISnapRestriction';
import { IViewportApi, ShapeDiverViewerDrawingToolsError } from '@shapediver/viewer';
import { PlaneRestrictionApi } from './api/implementation/restrictions/plane/PlaneRestrictionApi';
import { PlaneRestrictionProperties } from './business/implementation/restrictions/plane/PlaneRestriction';

export {
    CustomizationPropertiesOptional as CustomizationProperties, SetupPropertiesOptional as SetupProperties, Callbacks,
    IDrawingToolsApi, DrawingToolsApi,
    PlaneRestrictionProperties, GridRestrictionProperties, AngularRestrictionProperties,
    IRestrictionApi, PlaneRestrictionApi, GridRestrictionApi, AngularRestrictionApi,
    RestrictionBaseProperties, IRestrictionBase, RestrictionProperties, IRestriction, RestrictionMetaData, RESTRICTION_TYPE, SnapRestrictionProperties, ISnapRestriction,
};

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
export const createDrawingTools = (viewport: IViewportApi, callbacks: Callbacks, customizationProperties: CustomizationPropertiesOptional, setupProperties?: SetupPropertiesOptional): IDrawingToolsApi => {
    if (drawingTools && drawingTools.closed === false)
        throw new ShapeDiverViewerDrawingToolsError('There can only be one instance of DrawingTools active at a time. Please close the current instance before creating a new one.');

    drawingTools = new DrawingToolsApi(viewport, callbacks, customizationProperties, setupProperties);
    return drawingTools;
};
