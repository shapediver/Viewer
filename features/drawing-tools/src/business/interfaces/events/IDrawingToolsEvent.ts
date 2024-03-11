import { IViewportEvent } from "@shapediver/viewer";

export interface IDrawingToolsEvent extends IViewportEvent {
    // #region Properties (1)

    drawingToolId: string;

    // #endregion Properties (1)
}