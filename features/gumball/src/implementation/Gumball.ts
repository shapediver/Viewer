import * as THREE from 'three';
import {
    Box,
    FLAG_TYPE,
    GeometryData,
    ITreeNode,
    IViewportApi,
    sceneTree
} from '@shapediver/viewer';
import { IGumball } from '../interfaces/IGumball';
import { mat4, vec3, quat } from 'gl-matrix';
import { TransformControls } from '../three/TransformControls';

export class Gumball implements IGumball {
    // #region Properties (17)

    readonly #node: ITreeNode | undefined;
    readonly #nodes: ITreeNode[] | undefined;
    readonly #parentObject: THREE.Object3D = new THREE.Object3D();
    readonly #transformControls: TransformControls;
    readonly #transformationControlsPlaceholder: THREE.Object3D = new THREE.Object3D();
    readonly #viewport: IViewportApi;

    #cameraFreezeFlag?: string;
    #enableRotation: boolean = true;
    #enableScaling: boolean = true;
    #enableTranslation: boolean = true;
    #initialOffset: vec3 = vec3.create();
    #matrix: mat4 = mat4.create();
    #scale: number = 0.005;
    #show: boolean = true;
    #space: 'local' | 'world' = 'local';
    #tokenContinuousRendering?: string;
    #tokenContinuousShadowMapUpdate?: string;
    #initialMatrix: mat4 = mat4.create();

    // #endregion Properties (17)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, nodeOrNodes: ITreeNode | ITreeNode[]) {
        this.#viewport = viewport;
        if (Array.isArray(nodeOrNodes)) {
            if(nodeOrNodes.length === 1) {
                this.#node = nodeOrNodes[0];
            } else {
                this.#nodes = nodeOrNodes;
            }
        } else {
            this.#node = nodeOrNodes;
        }

        this.#transformControls = new TransformControls(
            viewport.threeJsCoreObjects.camera,
            viewport.threeJsCoreObjects.renderer.domElement,
            this.updateObjects.bind(this),
            this.updateObjectMatrices.bind(this)
        );

        this.setup();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (13)

    public get enableRotation(): boolean {
        return this.#enableRotation;
    }

    public set enableRotation(value: boolean) {
        this.#enableRotation = value;
        this.#transformControls.enableRotation = value;
    }

    public get enableScaling(): boolean {
        return this.#enableScaling;
    }

    public set enableScaling(value: boolean) {
        this.#enableScaling = value;
        this.#transformControls.enableScaling = value;
    }

    public get enableTranslation(): boolean {
        return this.#enableTranslation;
    }

    public set enableTranslation(value: boolean) {
        this.#enableTranslation = value;
        this.#transformControls.enableTranslation = value;
    }

    public get matrix(): mat4 {
        return this.#matrix;
    }

    public get scale(): number {
        return this.#scale;
    }

    public set scale(value: number) {
        this.#scale = value;
        const size = sceneTree.root.boundingBox.boundingSphere.radius * value;
        this.#transformControls.setSize(size);
    }

    public get show(): boolean {
        return this.#show;
    }

    public set show(value: boolean) {
        this.#show = value;
    }

    public get space(): 'local' | 'world' {
        return this.#space;
    }

    public set space(value: 'local' | 'world') {
        this.#space = value;
        this.#transformControls.space = value;
    }

    // #endregion Public Getters And Setters (13)

    // #region Public Methods (1)

    public close(): void {
        this.#parentObject.remove(this.#transformControls);
        this.#parentObject.remove(this.#transformationControlsPlaceholder);
        this.#transformControls.detach();
        this.#transformControls.dispose();
        this.#viewport.threeJsCoreObjects.scene.remove(this.#parentObject);

        if (this.#tokenContinuousRendering) this.#viewport.removeFlag(this.#tokenContinuousRendering);
        if (this.#tokenContinuousShadowMapUpdate) this.#viewport.removeFlag(this.#tokenContinuousShadowMapUpdate);
        if (this.#cameraFreezeFlag) this.#viewport.removeFlag(this.#cameraFreezeFlag);
    }

    // #endregion Public Methods (1)

    // #region Private Methods (2)

    private setup() {
        // assign the position to the transformation controls objects
        if (this.#node) {
            const translation = mat4.getTranslation(vec3.create(), this.#node.worldMatrix);
            const rotation = mat4.getRotation(quat.create(), this.#node.worldMatrix);
            const scale = mat4.getScaling(vec3.create(), this.#node.worldMatrix);

            mat4.copy(this.#initialMatrix, this.#node.worldMatrix);
            vec3.copy(this.#initialOffset, this.#node.boundingBox.boundingSphere.center);
        } else if (this.#nodes) {
            const boundingBox = new Box();
            for (const node of this.#nodes) {
                boundingBox.union(node.boundingBox);
            }
            vec3.copy(this.#initialOffset, boundingBox.boundingSphere.center);
        }
        this.#transformationControlsPlaceholder.position.set(
            this.#initialOffset[0],
            this.#initialOffset[1],
            this.#initialOffset[2]
        );

        this.#transformControls.attach(this.#transformationControlsPlaceholder);

        const size = sceneTree.root.boundingBox.boundingSphere.radius * 0.005;
        this.#transformControls.setSize(size);
        this.#parentObject.add(this.#transformControls);
        this.#parentObject.add(this.#transformationControlsPlaceholder);
        this.#viewport.threeJsCoreObjects.scene.add(this.#parentObject);

        // we register the CAMERA_FREEZE whenever the dragging happens
        this.#transformControls.addEventListener('dragging-changed', (event: unknown) => {
            if ((event as { value: boolean }).value === true) {
                if (this.#cameraFreezeFlag) this.#viewport.removeFlag(this.#cameraFreezeFlag);
                this.#cameraFreezeFlag = this.#viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);
            } else if (this.#cameraFreezeFlag) {
                this.#viewport.removeFlag(this.#cameraFreezeFlag);
                this.#cameraFreezeFlag = undefined;
            }
        });

        // register the CONTINUOUS_RENDERING to continuously render the scene
        this.#tokenContinuousRendering = this.#viewport.addFlag(
            FLAG_TYPE.CONTINUOUS_RENDERING
        );
        // register the CONTINUOUS_SHADOW_MAP_UPDATE to continuously update the shadows
        this.#tokenContinuousShadowMapUpdate = this.#viewport.addFlag(
            FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE
        );
    }

    private updateObjects() {
        const m = new THREE.Matrix4().copy(this.#transformationControlsPlaceholder.matrix)
            .multiply(new THREE.Matrix4().makeTranslation(new THREE.Vector3().fromArray(this.#initialOffset.map(v => -v))));

        const applyTransformation = (node: ITreeNode) => {
            const threeJsObject: THREE.Object3D | undefined = node.convertedObject[this.#viewport.id] as THREE.Object3D;
            if (threeJsObject) {
                threeJsObject.matrixAutoUpdate = false;
                threeJsObject.matrix.copy(m).multiply(new THREE.Matrix4().fromArray(this.#initialMatrix));
                threeJsObject.matrixWorldNeedsUpdate = true;
            }
        };

        if (this.#node) {
            applyTransformation(this.#node);
        } else if (this.#nodes) {
            this.#nodes.forEach(node => {
                applyTransformation(node);
            });
        }
    }

    private updateObjectMatrices() {
        const m = new THREE.Matrix4().copy(this.#transformationControlsPlaceholder.matrix)
        .multiply(new THREE.Matrix4().makeTranslation(new THREE.Vector3().fromArray(this.#initialOffset.map(v => -v))));

        this.#matrix = mat4.fromValues(...m.toArray());

        const applyTransformation = (node: ITreeNode) => {
            const matrixId = 'SD_gumball_matrix';
            const transformation = node.transformations.find(t => t.id === matrixId);
            if (transformation) {
                mat4.multiply(transformation.matrix, this.#matrix, this.#initialMatrix);
            } else {
                node.transformations.push({
                    id: matrixId,
                    matrix: mat4.clone(this.#matrix)
                });
            }
            node.updateVersion();
        };

        if (this.#node) {
            applyTransformation(this.#node);
        } else if (this.#nodes) {
            this.#nodes.forEach(node => {
                applyTransformation(node);
            });
        }
    }

    // #endregion Private Methods (2)
}