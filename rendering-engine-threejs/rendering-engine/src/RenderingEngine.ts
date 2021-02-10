import { vec3 } from 'gl-matrix';
import * as THREE from 'three';
import {container} from 'tsyringe'

import { CameraEngine, ICameraEngine } from '@shapediver/viewer.rendering-engine.camera-engine';
import { Canvas, CanvasEngine } from '@shapediver/viewer.rendering-engine.canvas-engine';
import { Tree } from '@shapediver/viewer.node-tree.tree';

import { SceneTree } from './SceneTree';
import { ILightEngine, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine';
import { Settings } from '@shapediver/viewer.shared.settings-engine';
import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.event-engine';

export class RenderingEngine implements IRenderingEngine {
    private readonly _canvasEngine: CanvasEngine;
    
    protected _cameraEngine!: ICameraEngine;
    protected _canvas!: Canvas;
    protected _lightEngine!: ILightEngine;
    protected _settings: Settings;
    protected _sceneTree!: SceneTree;
    protected _eventEngine!: EventEngine;
    protected _tree!: Tree;

    // #region Constructors (1)

    constructor(name: string, canvasDefinition?: string | HTMLCanvasElement) {
        this._tree = <Tree>container.resolve(Tree);
        this._settings = <Settings>container.resolve(Settings);
        this._eventEngine = <EventEngine>container.resolve(EventEngine);
        this._canvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
        this._lightEngine = <LightEngine>container.resolve(LightEngine);

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

        //this._eventEngine.addListener(EVENTTYPE.LIGHT_ADDED)
    }

    // #endregion Constructors (1)

    
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

    // #region Public Accessors (1)

    // #endregion Public Accessors (1)

    // #region Public Methods (1)

    public updateSceneTree(): void {
        this._sceneTree.updateSceneTree(this._tree.root);
    }

    // #endregion Public Methods (1)
}