import { IRenderingEngine as RenderingEngine } from "@shapediver/viewer.visualization-engine.rendering-engine";
import { RenderingEngine as RenderingEngineThreejs } from "@shapediver/viewer.visualization-engine.rendering-engine-threejs";
import { container } from "tsyringe";
import { IViewer, RendererType } from "../interfaces/IViewer";

export class Viewer implements IViewer {
    // #region Properties (1)

    private _renderingEngine: RenderingEngine;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(type: RendererType, name: string, canvas: HTMLCanvasElement) {
        const renderingEngineThreejs = new RenderingEngineThreejs(name, canvas);
        container.registerInstance(name, renderingEngineThreejs);
        this._renderingEngine = renderingEngineThreejs;
            
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // #endregion Constructors (1)

    public get renderingEngine(): RenderingEngine {
        return this._renderingEngine;
    }
}