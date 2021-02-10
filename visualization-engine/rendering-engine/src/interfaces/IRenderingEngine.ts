import { ICameraEngine } from '@shapediver/viewer.visualization-engine.camera-engine';
import { Canvas } from '@shapediver/viewer.visualization-engine.canvas-engine';
import { ILightEngine } from '@shapediver/viewer.visualization-engine.light-engine';
import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';

export interface IRenderingEngine {
    // #region Properties (2)

    cameraEngine: ICameraEngine;
    lightEngine: ILightEngine;
    canvas: Canvas;

    // #endregion Properties (2)

    // #region Public Methods (1)

    /**
     * Update the current tree with the provided node.
     * 
     * @param root the root node 
     */
    updateSceneTree(): void;

    // #endregion Public Methods (1)
}