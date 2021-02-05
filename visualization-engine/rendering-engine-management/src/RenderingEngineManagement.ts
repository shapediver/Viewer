import { container, singleton } from 'tsyringe';

import { Canvas, CanvasEngine } from '@shapediver/viewer.visualization-engine.canvas-engine';
import { IRenderingEngine } from '@shapediver/viewer.visualization-engine.rendering-engine';
import {
    RenderingEngine as RenderingEngineBabylonJS
} from '@shapediver/viewer.visualization-engine.rendering-engine-babylonjs';
import {
    RenderingEngine as RenderingEngineThreeJS
} from '@shapediver/viewer.visualization-engine.rendering-engine-threejs';
import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';

export enum RendererType {
    THREE = 'three',
    BABYLON = 'babylon',
}

@singleton()
export class RenderingEngineManagement {
    // #region Properties (1)

    private readonly renderingEngineInstances: IRenderingEngine[] = [];
    private readonly _canvasEngine: CanvasEngine;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * Factory for the creation of new rendering engines.
     */
    constructor() {
        this._canvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    /**
     * Create a new redering engine with the specified type and name.
     * 
     * @param type the type of the engine
     * @param name the name of the engine
     * @returns the newly created rendering engine
     */
    public createNewRenderingEngine(type: RendererType, name: string, canvasDefinition?: string | HTMLCanvasElement): IRenderingEngine {
        const canvas: Canvas = this._canvasEngine.createCanvasObject(canvasDefinition);
        
        switch (type) {
            case RendererType.THREE:
                const renderingEngineThreeJS = new RenderingEngineThreeJS(canvas);
                container.registerInstance(name, renderingEngineThreeJS);
                this.renderingEngineInstances.push(renderingEngineThreeJS);
                return renderingEngineThreeJS;
            case RendererType.BABYLON:
                const renderingEngineBabylonJS = new RenderingEngineBabylonJS(canvas);
                container.registerInstance(name, renderingEngineBabylonJS);
                this.renderingEngineInstances.push(renderingEngineBabylonJS);
                return renderingEngineBabylonJS;
        }
    }

    /**
     * Loads a scene in all rendering engines with the specified node.
     * 
     * @param node the root node
     */
    public loadSceneGraphNode(node: TreeNode) {
        for(let i = 0, len = this.renderingEngineInstances.length; i < len; i++) {
            this.renderingEngineInstances[i].updateSceneTree(node);
        }
    }

    // #endregion Public Methods (2)
}