import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { DrawingToolsManager } from './DrawingToolsManager';
import { IManager } from '../interfaces/IManager';
import { sceneTree, ThreejsData, TreeNode } from '@shapediver/viewer';
import { vec3 } from 'gl-matrix';

export class TextVisualizationManager implements IManager {
    // #region Properties (8)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #labelRenderer: CSS2DRenderer;
    readonly #visualizationNode: TreeNode = new TreeNode();

    #distanceObject3D: THREE.Object3D;
    #object3D: THREE.Object3D;
    #positionObject3D: THREE.Object3D;
    #showDistanceLabels: boolean = true;
    #showPointLabels: boolean = true;

    // #endregion Properties (8)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this.#labelRenderer = new CSS2DRenderer();
        this.#labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.#labelRenderer.domElement.style.position = 'absolute';
        this.#labelRenderer.domElement.style.top = '0px';
        this.#labelRenderer.domElement.style.pointerEvents = 'none';
        this.#labelRenderer.domElement.style.userSelect = 'none';
        this.#labelRenderer.domElement.style.cursor = 'default';
        document.body.appendChild(this.#labelRenderer.domElement);

        this.#drawingToolsManager = drawingToolsManager;
        this.#drawingToolsManager.viewport.postRenderingCallback = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
            this.#labelRenderer.render(scene, camera);
        };

        this.#object3D = new THREE.Object3D();
        this.#positionObject3D = new THREE.Object3D();
        this.#positionObject3D.visible = this.#drawingToolsManager.setupProperties.visualization.pointLabels;
        this.#distanceObject3D = new THREE.Object3D();
        this.#distanceObject3D.visible = this.#drawingToolsManager.setupProperties.visualization.distanceLabels;

        this.#object3D.add(this.#positionObject3D);
        this.#object3D.add(this.#distanceObject3D);

        this.#showPointLabels = this.#drawingToolsManager.setupProperties.visualization.pointLabels;
        this.#showDistanceLabels = this.#drawingToolsManager.setupProperties.visualization.distanceLabels;

        const node = new TreeNode();

        const data = new ThreejsData(this.#object3D);
        node.addData(data);

        this.#visualizationNode.addChild(node);
        this.#visualizationNode.updateVersion();
        sceneTree.root.addChild(this.#visualizationNode);
        sceneTree.root.updateVersion();

        this.createPointLabels();
        this.createDistanceLabels();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get showDistanceLabels(): boolean {
        return this.#distanceObject3D.visible;
    }

    public set showDistanceLabels(value: boolean) {
        this.#showDistanceLabels = value;
        if (this.#showDistanceLabels) {
            this.createDistanceLabels();
        } else {
            this.#distanceObject3D.remove(...this.#distanceObject3D.children);
        }
    }

    public get showPointLabels(): boolean {
        return this.#showPointLabels;
    }

    public set showPointLabels(value: boolean) {
        this.#showPointLabels = value;
        if (this.#showPointLabels) {
            this.createPointLabels();
        } else {
            this.#positionObject3D.remove(...this.#positionObject3D.children);
        }
    }

    // #endregion Public Getters And Setters (4)

    // #region Public Methods (4)

    public close(): void {
        this.#positionObject3D.remove(...this.#positionObject3D.children);
        this.#distanceObject3D.remove(...this.#distanceObject3D.children);
    }

    public createDistanceLabels(): void {
        if (!this.#showDistanceLabels) return;
        this.#distanceObject3D.remove(...this.#distanceObject3D.children);

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
            this.#distanceObject3D.add(label);
        }
    }

    public createPointLabels(): void {
        if (!this.#showPointLabels) return;
        this.#positionObject3D.remove(...this.#positionObject3D.children);

        const positionArray = this.#drawingToolsManager.geometryManager.positionArray;
        for (let i = 0; i < positionArray.length; i += 3) {
            const text = document.createElement('div');
            text.className = 'label';
            text.style.marginTop = '1em';

            text.textContent = `[${this.numberCleaner(positionArray[i])}, ${this.numberCleaner(positionArray[i + 1])}, ${this.numberCleaner(positionArray[i + 2])}]`;

            const label = new CSS2DObject(text);
            label.position.set(positionArray[i], positionArray[i + 1], positionArray[i + 2]);
            this.#positionObject3D.add(label);
        }
    }

    public numberCleaner(value: number): number {
        const roundedThreshold = 100;
        const rounded = Math.round(value * roundedThreshold) / roundedThreshold;

        // if the rounded number is within (1 / roundedThreshold) of the next integer, round to that integer
        if (rounded % 1 < 1 / roundedThreshold) {
            return Math.round(rounded);
        }

        return rounded;
    }

    // #endregion Public Methods (4)
}