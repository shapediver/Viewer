import { AngularRestrictionApi } from './api/implementation/restrictions/snap/AngularRestrictionApi';
import { AngularRestrictionProperties } from './business/implementation/restrictions/snap/AngularRestriction';
import { Callbacks, CustomizationProperties } from './business/implementation/DrawingToolsManager';
import { DrawingToolsApi } from './api/implementation/DrawingToolsApi';
import { GridRestrictionApi } from './api/implementation/restrictions/snap/GridRestrictionApi';
import { GridRestrictionProperties } from './business/implementation/restrictions/snap/GridRestriction';
import { IDrawingToolsApi } from './api/interfaces/IDrawingToolsApi';
import { IGeometryData, IViewportApi } from '@shapediver/viewer';
import { PlaneRestrictionApi } from './api/implementation/restrictions/intersection/PlaneRestrictionApi';
import { PlaneRestrictionProperties } from './business/implementation/restrictions/intersection/PlaneRestriction';

export {
    CustomizationProperties,
    IDrawingToolsApi, DrawingToolsApi,
    PlaneRestrictionProperties, GridRestrictionProperties, AngularRestrictionProperties,
    PlaneRestrictionApi, GridRestrictionApi, AngularRestrictionApi,
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
export const createDrawingTools = (viewport: IViewportApi, callbacks: Callbacks, properties: CustomizationProperties): IDrawingToolsApi => {
    if (drawingTools && drawingTools.closed === false)
        throw new Error('There can only be one instance of DrawingTools active at a time. Please close the current instance before creating a new one.');

    drawingTools = new DrawingToolsApi(viewport, callbacks, properties);
    return drawingTools;
};
