import { IRenderingEngine as RenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { RenderingEngine as RenderingEngineThreejs } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { container } from "tsyringe";
import { IViewer, RENDERERTYPE } from "../interfaces/IViewer";

export class Viewer implements IViewer {
    // #region Properties (1)

    private _renderingEngine: RenderingEngine;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(type: RENDERERTYPE, name: string, canvas: HTMLCanvasElement) {
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