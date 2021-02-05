import * as BABYLON from 'babylonjs';
import { vec3 } from 'gl-matrix';

import { CameraEngine } from '@shapediver/viewer.visualization-engine.camera-engine';
import { Canvas } from '@shapediver/viewer.visualization-engine.canvas-engine';
import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';

import { SceneTree } from './SceneTree';
import { AbstractRenderingEngine } from '@shapediver/viewer.visualization-engine.rendering-engine';

export class RenderingEngine extends AbstractRenderingEngine {
    // #region Properties (5)

    private _engine: BABYLON.Engine;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(_canvas: Canvas) {
        super();

        this._canvas = _canvas;

        // Associate a Babylon Engine to it.
        this._engine = new BABYLON.Engine(this.canvas.canvasElement);
        
        this._cameraEngine = new CameraEngine(this.canvas.canvasElement, {
            position: vec3.fromValues(0, -100, 0),
            target: vec3.fromValues(0, 0, 0)
        });

        this._sceneTree = new SceneTree(this._engine);

        // This creates and positions a free camera (non-mesh)
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, -100, 0), (<SceneTree> this._sceneTree).scene);
        camera.upVector.set(0, 0, 1);
        camera.setTarget(BABYLON.Vector3.Zero());

        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 0, 1), (<SceneTree> this._sceneTree).scene);
        light.intensity = 0.1;
        new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-1, 1, 1), (<SceneTree> this._sceneTree).scene);

        // Render every frame
        this._engine.runRenderLoop(() => {
            camera.fov = this._settings.camera.fov.value;
            const cameraDefinition = this.cameraEngine.update(new Date().getTime());
            camera.position.set(cameraDefinition.position[0], cameraDefinition.position[1], cameraDefinition.position[2]);
            camera.setTarget(new BABYLON.Vector3(cameraDefinition.target[0], cameraDefinition.target[1], cameraDefinition.target[2]));
            (<SceneTree> this._sceneTree).scene.render();
        });
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    /**
     * Getter canvas
     * @return {Canvas}
     */
    public get canvas(): Canvas {
		return this._canvas;
	}

    // #endregion Public Accessors (1)

    // #region Public Methods (1)

    public updateSceneTree(root: TreeNode): void {
        this._sceneTree.updateSceneTree(root);
    }

    // #endregion Public Methods (1)
}