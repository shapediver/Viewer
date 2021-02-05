import { RendererType, RenderingEngineManagement } from "@shapediver/viewer.visualization-engine.rendering-engine-management";
import { IRenderingEngine as RenderingEngine } from "@shapediver/viewer.visualization-engine.rendering-engine";
import { container } from "tsyringe";
import { IViewer } from "../interfaces/IViewer";

export class Viewer implements IViewer {
    // #region Properties (1)

    private _renderingEngine: RenderingEngine;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(type: RendererType, name: string, canvas: HTMLCanvasElement) {
        const renderingEngineManagement = <RenderingEngineManagement>container.resolve(RenderingEngineManagement);
        this._renderingEngine = renderingEngineManagement.createNewRenderingEngine(type, name, canvas);
            
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // #endregion Constructors (1)

    public get renderingEngine(): RenderingEngine {
        return this._renderingEngine;
    }
}