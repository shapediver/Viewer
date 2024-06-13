import { IViewportEvent } from '@shapediver/viewer';
import { PointsData } from '../IDrawingToolsManager';

export interface IDrawingToolsEvent extends IViewportEvent {
    // #region Properties (7)

    drawingToolId: string;
    fromHistory?: boolean;
    index?: number;
    message?: string;
    points?: PointsData;
    recordHistory?: boolean;
    temporary?: boolean;

    // #endregion Properties (7)
}