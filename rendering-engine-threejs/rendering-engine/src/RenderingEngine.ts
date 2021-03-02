import { vec3, vec4 } from 'gl-matrix';
import * as THREE from 'three';
import { container } from 'tsyringe'

import { CameraEngine, ICameraEngine } from '@shapediver/viewer.rendering-engine.camera-engine';
import { Canvas, CanvasEngine } from '@shapediver/viewer.rendering-engine.canvas-engine';
import { Tree } from '@shapediver/viewer.shared.node-tree';

import { SceneTree } from './SceneTree';
import { ILightEngine, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine';
import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { StateEngine, SettingsEngine } from '@shapediver/viewer.shared.services';
import { Converter } from '@shapediver/viewer.shared.utils';
import { SDObject } from './SDObject';
import { MaterialData, MATERIAL_SIDE } from '@shapediver/viewer.shared.types';

export class RenderingEngine implements IRenderingEngine {
    // #region Properties (9)

    private readonly _canvasEngine: CanvasEngine;

    protected readonly _converter = <Converter>container.resolve(Converter);
    protected readonly _lightEngine = <LightEngine>container.resolve(LightEngine);
    protected readonly _settings = <SettingsEngine>container.resolve(SettingsEngine);
    protected readonly _stateEngine = <StateEngine>container.resolve(StateEngine);
    protected readonly _tree: Tree = <Tree>container.resolve(Tree);

    protected _cameraEngine!: ICameraEngine;
    protected _canvas!: Canvas;
    protected _sceneTree!: SceneTree;

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(name: string, canvasDefinition?: string | HTMLCanvasElement) {
        this._canvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
        this._canvas = this._canvasEngine.createCanvasObject(canvasDefinition);
        this._stateEngine.settingsRegistered.then(() => this.init());
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
     * Getter cameraEngine
     * @return {ICameraEngine}
     */
    public get cameraEngine(): ICameraEngine {
        return this._cameraEngine;
    }

    /**
     * Setter cameraEngine
     * @param {ICameraEngine} value
     */
    public set cameraEngine(value: ICameraEngine) {
        this._cameraEngine = value;
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

    // #endregion Public Accessors (3)

    // #region Public Methods (1)

    public updateSceneTree(): void {
        if (this._stateEngine.settingsRegistered.resolved !== true) return;
        this._sceneTree.updateSceneTree(this._tree.root, <LightEngine>this._lightEngine);
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private init() {
        this._sceneTree = new SceneTree();

        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

        const camera = new THREE.PerspectiveCamera(75, this._canvas.canvasElement.width / this.canvas.canvasElement.height, 0.1, 100000);
        camera.lookAt(0, 0, 0);

        (<SceneTree>this._sceneTree).scene.background = new THREE.Color(0xffffff)

        const renderer = new THREE.WebGLRenderer({
            canvas: this.canvas.canvasElement,
            antialias: true,
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setSize(this.canvas.canvasElement.width, this.canvas.canvasElement.height);
        renderer.setClearColor(new THREE.Color(0xffffff))

        this._stateEngine.boundingBoxCreated.then(() => {
            let bb = this._sceneTree.boundingBox;
            let sceneExtents = vec3.distance(bb.min, bb.max);
    
            /**
             * TODO evaluate this magic
             * 
             * magic begin
             */
    
            let divisions = 0.1;
            let gridExtents = sceneExtents;
            if (sceneExtents > 1) {
                let tmp = Math.floor(sceneExtents).toString();
                let temp = Math.pow(10, tmp.length - 1);
                gridExtents = Math.max(Math.ceil(sceneExtents / temp) * temp, 1);
                temp = temp / 10;
                divisions = gridExtents / temp;
            }
            else {
                let zeros = 1 - Math.floor(Math.log(sceneExtents) / Math.log(10)) - 2;
                let r = sceneExtents.toFixed(zeros + 1);
                let firstDigit = parseInt(r.substr(r.length - 1)) + 1;
                let gridExtentsS = '0.';
                for (let i = 0; i < zeros; ++i)
                    gridExtentsS = gridExtentsS + '0';
                gridExtents = parseFloat(gridExtentsS + firstDigit);
                divisions = firstDigit * 10;
            }
    
            /**
             * magic end
             */
            
            const gridObject = new SDObject('grid', '');
            let grid = new THREE.GridHelper(2 * gridExtents, divisions);
            (<THREE.Material>grid.material).opacity = 0.15;
            (<THREE.Material>grid.material).transparent = true;
            grid.rotateX(Math.PI / 2);
            grid.visible = this._settings.scene.gridVisibility.value;
            gridObject.add(grid);
            this._sceneTree.scene.add(gridObject);

            const groundPlaneObject = new SDObject('grid', '');
            let mat = new MaterialData();
            mat.color = vec4.fromValues(0.8274, 0.8274, 0.8274, 1);
            mat.side = MATERIAL_SIDE.FRONT;
            mat.roughness = 1;
            mat.metalness = 0;
            let groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(2 * gridExtents, 2 * gridExtents, 2, 2), this._sceneTree.createMaterial(mat));
            groundPlane.receiveShadow = true;
            groundPlane.visible = this._settings.scene.groundPlaneVisibility.value;
            groundPlaneObject.add(groundPlane);
            this._sceneTree.scene.add(groundPlaneObject);

            let eps = 0.005;
            let bs = bb.boundingSphere;
            grid.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
            groundPlane.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
        });

        const animate = (time: number) => {
            requestAnimationFrame(animate);
            if(!this.cameraEngine) return;

            (<THREE.PerspectiveCamera>camera).fov = this._settings.camera.cameraTypes.perspective.fov.value;
            camera.aspect = this.canvas.canvasElement.width / this.canvas.canvasElement.height;
            camera.updateProjectionMatrix();

            renderer.setSize(this.canvas.canvasElement.width, this.canvas.canvasElement.height);

            const cameraDefinition = this.cameraEngine.update(time);
            camera.position.set(cameraDefinition.position[0], cameraDefinition.position[1], cameraDefinition.position[2]);
            camera.lookAt(cameraDefinition.target[0], cameraDefinition.target[1], cameraDefinition.target[2])
            renderer.render((<SceneTree>this._sceneTree).scene, camera);
        };
        animate(0);
    }

    // #endregion Private Methods (1)
}