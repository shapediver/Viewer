import { vec3 } from 'gl-matrix';
import * as THREE from 'three';
import {container} from 'tsyringe'

import { CameraEngine, ICameraEngine } from '@shapediver/viewer.visualization-engine.camera-engine';
import { Canvas, CanvasEngine } from '@shapediver/viewer.visualization-engine.canvas-engine';
import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';

import { SceneTree } from './SceneTree';
import { AbstractRenderingEngine } from '@shapediver/viewer.visualization-engine.rendering-engine';

export class RenderingEngine extends AbstractRenderingEngine {
    private readonly _canvasEngine: CanvasEngine;

    // #region Constructors (1)

    constructor(name: string, canvasDefinition?: string | HTMLCanvasElement) {
        super();
        this._canvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
        this._canvas = this._canvasEngine.createCanvasObject(canvasDefinition);

        // TODO put in abstract class
        this._sceneTree = new SceneTree();

        THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);

        const camera = new THREE.PerspectiveCamera(75, this._canvas.canvasElement.width / this.canvas.canvasElement.height, 0.1, 100000);
        camera.lookAt(0,0,0)

        var light = new THREE.AmbientLight(0xffffff, 0.5);
        (<SceneTree> this._sceneTree).scene.add(light)

        var light2 = new THREE.DirectionalLight(0xffffff, .75);
        (<SceneTree> this._sceneTree).scene.add(light2)
        light2.position.z = 150;
        light2.position.y = -150;
        light2.position.x = 150;
        light2.lookAt(0, 0, 0)
        
        var light3 = new THREE.DirectionalLight(0xffffff, .35);
        (<SceneTree> this._sceneTree).scene.add(light3)
        light3.position.z = 150;
        light3.position.y = -150;
        light3.position.x = -150 *.25;
        light3.lookAt(0,0,0);

        (<SceneTree> this._sceneTree).scene.background = new THREE.Color(0xffffff)
        
        const renderer = new THREE.WebGLRenderer({
            canvas: this.canvas.canvasElement,
            antialias: true,
        });
        renderer.setSize(this.canvas.canvasElement.width, this.canvas.canvasElement.height);
        renderer.setClearColor(new THREE.Color(0xffffff))

        this._cameraEngine = new CameraEngine(this.canvas.canvasElement, {
            position: vec3.fromValues(0, -100, 0),
            target: vec3.fromValues(0, 0, 0)
        });

        const animate = (time: number) => {
            requestAnimationFrame(animate);

            (<THREE.PerspectiveCamera>camera).fov = this._settings.camera.fov.value;
            camera.aspect = this.canvas.canvasElement.width / this.canvas.canvasElement.height;
            camera.updateProjectionMatrix();

            renderer.setSize(this.canvas.canvasElement.width, this.canvas.canvasElement.height);

            const cameraDefinition = this.cameraEngine.update(time);
            camera.position.set(cameraDefinition.position[0], cameraDefinition.position[1], cameraDefinition.position[2]);
            camera.lookAt(cameraDefinition.target[0], cameraDefinition.target[1], cameraDefinition.target[2])
            renderer.render((<SceneTree> this._sceneTree).scene, camera);
        };
        animate(0);
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