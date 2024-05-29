import { IViewportEvent } from '@shapediver/viewer';
import { PointsData } from '../../implementation/DrawingToolsManager';

export interface IDrawingToolsEvent extends IViewportEvent {
    // #region Properties (5)

    drawingToolId: string;
    fromHistory?: boolean;
    index?: number;
    points?: PointsData;
    temporary?: boolean;

    // #endregion Properties (5)
}