import { vec3 } from 'gl-matrix';
import * as THREE from 'three';
import {container} from 'tsyringe'

import { CameraEngine, ICameraEngine } from '@shapediver/viewer.rendering-engine.camera-engine';
import { Canvas, CanvasEngine } from '@shapediver/viewer.rendering-engine.canvas-engine';
import { Tree } from '@shapediver/viewer.shared.node-tree';

import { SceneTree } from './SceneTree';
import { ILightEngine, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine';
import { Settings } from '@shapediver/viewer.shared.settings-engine';
import { StateEngine } from '@shapediver/viewer.shared.state-engine';
import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.event-engine';


export class RenderingEngine implements IRenderingEngine {
    private readonly _canvasEngine: CanvasEngine;
    
    protected _cameraEngine!: ICameraEngine;
    protected _canvas!: Canvas;
    protected _lightEngine = <LightEngine>container.resolve(LightEngine);
    protected _settings = <Settings>container.resolve(Settings);
    protected _stateEngine = <StateEngine>container.resolve(StateEngine);
    protected _sceneTree!: SceneTree;
    protected _eventEngine= <EventEngine>container.resolve(EventEngine);
    protected _tree: Tree = <Tree>container.resolve(Tree);

    // #region Constructors (1)

    constructor(name: string, canvasDefinition?: string | HTMLCanvasElement) {
        this._canvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
        this._canvas = this._canvasEngine.createCanvasObject(canvasDefinition);

        if(this._stateEngine.settingsRegistered === true) {
            this.init();
        } else {
            console.log('registering')
            this._eventEngine.addListener(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, () => { 
                console.log('the event')
                this.init(); 
            })
        }
    }


    private init() {
        
        // TODO put in abstract class
        this._sceneTree = new SceneTree();

        THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);

        const camera = new THREE.PerspectiveCamera(75, this._canvas.canvasElement.width / this.canvas.canvasElement.height, 0.1, 100000);
        camera.lookAt(0,0,0);

        (<SceneTree> this._sceneTree).scene.background = new THREE.Color(0xffffff)
        
        const renderer = new THREE.WebGLRenderer({
            canvas: this.canvas.canvasElement,
            antialias: true,
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setSize(this.canvas.canvasElement.width, this.canvas.canvasElement.height);
        renderer.setClearColor(new THREE.Color(0xffffff))

        const p: any = this._settings.camera.cameraTypes.perspective.default.value.position;
        const t: any = this._settings.camera.cameraTypes.perspective.default.value.target;
        this._cameraEngine = new CameraEngine(this.canvas.canvasElement, {
            position: vec3.fromValues(p.x, p.y, p.z),
            target: vec3.fromValues(t.x, t.y, t.z)
        });

        const animate = (time: number) => {
            requestAnimationFrame(animate);

            (<THREE.PerspectiveCamera>camera).fov = this._settings.camera.cameraTypes.perspective.fov.value;
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
        this._sceneTree.updateSceneTree(this._tree.root, <LightEngine>this._lightEngine);
    }

    // #endregion Public Methods (1)
}