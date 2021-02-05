import { container } from 'tsyringe';

import { ICameraEngine } from '@shapediver/viewer.visualization-engine.camera-engine';
import { Canvas } from '@shapediver/viewer.visualization-engine.canvas-engine';
import { ILightEngine } from '@shapediver/viewer.visualization-engine.light-engine';
import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';
import { Settings } from '@shapediver/viewer.shared.settings-engine';

import { ISDObject } from '@shapediver/viewer.shared.types';
import { IRenderingEngine } from '../interfaces/IRenderingEngine';
import { AbstractSceneTree } from './AbstractSceneTree';

export abstract class AbstractRenderingEngine implements IRenderingEngine {
    // #region Properties (5)

    protected _cameraEngine!: ICameraEngine;
    protected _canvas!: Canvas;
    protected _lightEngine!: ILightEngine;
    protected _sceneTree!: AbstractSceneTree<ISDObject>;
    protected _settings: Settings;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor() {
        this._settings = <Settings>container.resolve(Settings);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    /**
     * Getter cameraEngine
     * @return {ICameraEngine}
     */
    public get cameraEngine(): ICameraEngine {
		return this._cameraEngine;
	}

    /**
     * Getter canvas
     * @return {Canvas}
     */
    public get canvas(): Canvas {
		return this._canvas;
	}

    /**
     * Getter lightEngine
     * @return {ILightEngine}
     */
    public get lightEngine(): ILightEngine {
		return this._lightEngine;
	}

    /**
     * Getter sceneTree
     * @return {AbstractSceneTree<ISDObject>}
     */
    public get sceneTree(): AbstractSceneTree<ISDObject> {
		return this._sceneTree;
	}

    // #endregion Public Accessors (4)

    // #region Public Methods (1)

    public updateSceneTree(root: TreeNode): void {
        this._sceneTree.updateSceneTree(root);
    }

    // #endregion Public Methods (1)
}
