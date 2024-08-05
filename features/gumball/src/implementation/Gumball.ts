import * as THREE from 'three';
import {
    Box,
    FLAG_TYPE,
    GeometryData,
    ITreeNode,
    IViewportApi,
    sceneTree
} from '@shapediver/viewer';
import { IGumball, SettingsOptional } from '../interfaces/IGumball';
import { mat4, vec3 } from 'gl-matrix';
import { TransformControls } from '../three/TransformControls';

export class Gumball implements IGumball {
    // #region Properties (20)

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
    #initialMatrix: mat4 = mat4.create();
    #initialOffset: vec3 = vec3.create();
    #matrix: mat4 = mat4.create();
    #previousGumballMatrix: mat4 | mat4[] | undefined = undefined;
    #resetTransformation: boolean;
    #scale: number = 0.005;
    #show: boolean = true;
    #space: 'local' | 'world' = 'local';
    #tokenContinuousRendering?: string;
    #tokenContinuousShadowMapUpdate?: string;

    // #endregion Properties (20)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, nodeOrNodes: ITreeNode | ITreeNode[], settings?: SettingsOptional) {
        this.#viewport = viewport;
        if (Array.isArray(nodeOrNodes)) {
            if (nodeOrNodes.length === 1) {
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

        this.enableRotation = settings?.enableRotation ?? true;
        this.enableScaling = settings?.enableScaling ?? false;
        this.enableTranslation = settings?.enableTranslation ?? true;
        this.scale = settings?.scale ?? 0.005;
        // we don't allow to change the space for now
        this.#space = settings?.space ?? 'local';
        this.#transformControls.space = this.#space;
        // we don't allow to change the resetTransformation for now
        this.#resetTransformation = settings?.resetTransformation ?? false;
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

    public get resetTransformation(): boolean {
        return this.#resetTransformation;
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

    // #region Private Methods (3)

    private setup() {
        // assign the position to the transformation controls objects
        if (this.#node) {
            this.#initialMatrix = mat4.clone(this.#node.worldMatrix);

            const trueBB = new Box();
            this.#node.traverseData(d => {
                if (d instanceof GeometryData) {
                    trueBB.union(d.boundingBox);
                }
            });
            this.#initialOffset = vec3.clone(trueBB.boundingSphere.center);

            const index = this.#node.transformations.findIndex(t => t.id === 'SD_gumball_matrix');
            if (index !== -1) {
                this.#previousGumballMatrix = mat4.clone(this.#node.transformations[index].matrix);
            }

            this.#transformationControlsPlaceholder.applyMatrix4(new THREE.Matrix4().makeTranslation(new THREE.Vector3().fromArray(this.#initialOffset)));
            this.#transformationControlsPlaceholder.applyMatrix4(new THREE.Matrix4().fromArray(this.#initialMatrix));

        } else if (this.#nodes) {
            const boundingBox = new Box();
            this.#previousGumballMatrix = [];
            for (const node of this.#nodes) {
                boundingBox.union(node.boundingBox);

                const index = node.transformations.findIndex(t => t.id === 'SD_gumball_matrix');
                if (index !== -1) {
                    this.#previousGumballMatrix.push(mat4.clone(node.transformations[index].matrix));
                } else {
                    this.#previousGumballMatrix.push(mat4.create());
                }
            }
            vec3.copy(this.#initialOffset, boundingBox.boundingSphere.center);
            this.#transformationControlsPlaceholder.position.set(
                this.#initialOffset[0],
                this.#initialOffset[1],
                this.#initialOffset[2]
            );
        }

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

    private updateObjectMatrices() {
        const m = new THREE.Matrix4().copy(this.#transformationControlsPlaceholder.matrix)
            .multiply(new THREE.Matrix4().makeTranslation(new THREE.Vector3().fromArray(this.#initialOffset.map(v => -v))));

        this.#matrix = mat4.fromValues(...m.toArray());
        const matrixId = 'SD_gumball_matrix';

        if (this.#node) {
            const transformation = this.#node.transformations.find(t => t.id === matrixId);
            if (transformation) {
                transformation.matrix = mat4.clone(this.#matrix);
            } else {
                this.#node.transformations.push({
                    id: matrixId,
                    matrix: mat4.clone(this.#matrix)
                });
            }
            this.#node.updateVersion();
        } else if (this.#nodes) {
            this.#nodes.forEach((node, i) => {
                const transformation = node.transformations.find(t => t.id === matrixId);

                // in the case of multiple nodes, we need to apply the previous gumball matrix
                // as this way we can ensure that the previous transformations are kept
                const finalMatrix = mat4.clone(this.#matrix);
                if ((this.#previousGumballMatrix as mat4[])[i]) {
                    mat4.multiply(finalMatrix, this.#matrix, (this.#previousGumballMatrix as mat4[])[i]);
                }

                if (transformation) {
                    transformation.matrix = finalMatrix;
                } else {
                    node.transformations.push({
                        id: matrixId,
                        matrix: finalMatrix
                    });
                }
                node.updateVersion();
            });
        }
    }

    private updateObjects() {
        const m = new THREE.Matrix4().copy(this.#transformationControlsPlaceholder.matrix)
            .multiply(new THREE.Matrix4().makeTranslation(new THREE.Vector3().fromArray(this.#initialOffset.map(v => -v))));

        if (this.#node) {
            const threeJsObject: THREE.Object3D | undefined = this.#node.convertedObject[this.#viewport.id] as THREE.Object3D;
            if (threeJsObject) {
                threeJsObject.matrixAutoUpdate = false;
                threeJsObject.matrix.copy(m);
                threeJsObject.matrixWorldNeedsUpdate = true;
            }
        } else if (this.#nodes) {
            this.#nodes.forEach((node, i) => {
                const threeJsObject: THREE.Object3D | undefined = node.convertedObject[this.#viewport.id] as THREE.Object3D;
                if (threeJsObject) {
                    threeJsObject.matrixAutoUpdate = false;

                    // in the case of multiple nodes, we need to apply the previous gumball matrix
                    // as this way we can ensure that the previous transformations are kept
                    if ((this.#previousGumballMatrix as mat4[])[i]) {
                        threeJsObject.matrix.copy(new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().fromArray((this.#previousGumballMatrix as mat4[])[i])));
                    } else {
                        threeJsObject.matrix.copy(m);
                    }
                    threeJsObject.matrixWorldNeedsUpdate = true;
                }
            });
        }
    }

    // #endregion Private Methods (3)
}