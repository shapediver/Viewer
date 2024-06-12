import { IViewportEvent } from '@shapediver/viewer';
import { PointsData } from '../IDrawingToolsManager';

export interface IDrawingToolsEvent extends IViewportEvent {
    // #region Properties (6)

    drawingToolId: string;
    fromHistory?: boolean;
    index?: number;
    points?: PointsData;
    recordHistory?: boolean;
    temporary?: boolean;

    // #endregion Properties (6)
}