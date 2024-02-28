import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { DrawingToolsManager } from './DrawingToolsManager';
import { IManager } from '../interfaces/IManager';
import { sceneTree, ThreejsData, TreeNode } from '@shapediver/viewer';
import { vec3 } from 'gl-matrix';

export class TextVisualizationManager implements IManager {
    // #region Properties (9)

    readonly #drawingToolsManager: DrawingToolsManager;
    private readonly _labelRenderer: CSS2DRenderer;
    private readonly _visualizationNode: TreeNode = new TreeNode();

    private _angleObject3D: THREE.Object3D;
    private _distanceObject3D: THREE.Object3D;
    private _object3D: THREE.Object3D;
    private _positionObject3D: THREE.Object3D;
    private _showDistanceLabels: boolean = true;
    private _showPointLabels: boolean = true;

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this._labelRenderer = new CSS2DRenderer();
        this._labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this._labelRenderer.domElement.style.position = 'absolute';
        this._labelRenderer.domElement.style.top = '0px';
        this._labelRenderer.domElement.style.pointerEvents = 'none';
        this._labelRenderer.domElement.style.userSelect = 'none';
        this._labelRenderer.domElement.style.cursor = 'default';
        document.body.appendChild(this._labelRenderer.domElement);

        this.#drawingToolsManager = drawingToolsManager;
        this.#drawingToolsManager.viewport.postRenderingCallback = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
            this._labelRenderer.render(scene, camera);
        };

        this._object3D = new THREE.Object3D();
        this._positionObject3D = new THREE.Object3D();
        this._distanceObject3D = new THREE.Object3D();
        this._angleObject3D = new THREE.Object3D();

        this._object3D.add(this._positionObject3D);
        this._object3D.add(this._distanceObject3D);
        this._object3D.add(this._angleObject3D);

        const node = new TreeNode();

        const data = new ThreejsData(this._object3D);
        node.addData(data);

        this._visualizationNode.addChild(node);
        this._visualizationNode.updateVersion();
        sceneTree.root.addChild(this._visualizationNode);
        sceneTree.root.updateVersion();

        this.createPointLabels();
        this.createDistanceLabels();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get showDistanceLabels(): boolean {
        return this._distanceObject3D.visible;
    }

    public set showDistanceLabels(value: boolean) {
        this._showDistanceLabels = value;
        if (this._showDistanceLabels) {
            this.createDistanceLabels();
        } else {
            this._distanceObject3D.remove(...this._distanceObject3D.children);
        }
    }

    public get showPointLabels(): boolean {
        return this._showPointLabels;
    }

    public set showPointLabels(value: boolean) {
        this._showPointLabels = value;
        if (this._showPointLabels) {
            this.createPointLabels();
        } else {
            this._positionObject3D.remove(...this._positionObject3D.children);
        }
    }

    // #endregion Public Getters And Setters (4)

    // #region Public Methods (3)

    public close(): void {
        this._positionObject3D.remove(...this._positionObject3D.children);
        this._distanceObject3D.remove(...this._distanceObject3D.children);
    }

    public createDistanceLabels(): void {
        if (!this._showDistanceLabels) return;
        this._distanceObject3D.remove(...this._distanceObject3D.children);

        const positionArray = this.#drawingToolsManager.geometryManager.positionArray;
        const indicesArrayLines = this.#drawingToolsManager.geometryManager.indicesArrayLines;

        if (!indicesArrayLines) return;

        for (let i = 0; i < indicesArrayLines.length; i += 2) {
            // calculate the midpoint of the line
            const firstIndex = indicesArrayLines[i];
            const secondIndex = indicesArrayLines[i + 1];
            const firstPoint = vec3.fromValues(
                positionArray.at(firstIndex * 3)!,
                positionArray.at(firstIndex * 3 + 1)!,
                positionArray.at(firstIndex * 3 + 2)!
            );
            const secondPoint = vec3.fromValues(
                positionArray.at(secondIndex * 3)!,
                positionArray.at(secondIndex * 3 + 1)!,
                positionArray.at(secondIndex * 3 + 2)!
            );
            const midPoint = vec3.add(vec3.create(), firstPoint, secondPoint);
            vec3.scale(midPoint, midPoint, 0.5);

            const text = document.createElement('div');
            text.className = 'label';
            text.style.marginTop = '1em';
            text.textContent = `${this.numberCleaner(vec3.distance(firstPoint, secondPoint))}`;

            const label = new CSS2DObject(text);
            label.position.set(midPoint[0], midPoint[1], midPoint[2]);
            this._distanceObject3D.add(label);
        }
    }

    public createPointLabels(): void {
        if (!this._showPointLabels) return;
        this._positionObject3D.remove(...this._positionObject3D.children);

        const positionArray = this.#drawingToolsManager.geometryManager.positionArray;
        for (let i = 0; i < positionArray.length; i += 3) {
            const text = document.createElement('div');
            text.className = 'label';
            text.style.marginTop = '1em';

            text.textContent = `[${this.numberCleaner(positionArray[i])}, ${this.numberCleaner(positionArray[i + 1])}, ${this.numberCleaner(positionArray[i + 2])}]`;

            const label = new CSS2DObject(text);
            label.position.set(positionArray[i], positionArray[i + 1], positionArray[i + 2]);
            this._positionObject3D.add(label);
        }
    }

    // #endregion Public Methods (3)

    // #region Private Methods (1)

    private numberCleaner(value: number): number {
        const roundedThreshold = 100;
        const rounded = Math.round(value * roundedThreshold) / roundedThreshold;

        // if the rounded number is within (1 / roundedThreshold) of the next integer, round to that integer
        if (rounded % 1 < 1 / roundedThreshold) {
            return Math.round(rounded);
        }

        return rounded;
    }

    // #endregion Private Methods (1)
}