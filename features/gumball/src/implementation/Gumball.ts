/* eslint-disable @typescript-eslint/no-unused-vars */
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
    // #region Properties (22)

    readonly #keysPressed: { [key: string]: boolean } = {};
    readonly #node: ITreeNode | undefined;
    readonly #nodes: ITreeNode[] | undefined;
    readonly #parentObject: THREE.Object3D = new THREE.Object3D();
    readonly #transformControls: TransformControls;
    readonly #transformationControlsPlaceholder: THREE.Object3D = new THREE.Object3D();
    readonly #viewport: IViewportApi;

    #cameraFreezeFlag?: string;
    #canvasEventListenerToken: string;
    #closed: boolean = false;
    #continuousRenderingFlag?: string;
    #continuousShadowMapUpdateFlag?: string;
    #enableRotation: boolean = true;
    #enableScaling: boolean = true;
    #enableTranslation: boolean = true;
    #initialOffset: vec3 = vec3.create();
    #matrix: mat4 = mat4.create();
    #previousGumballMatrix: mat4[] | mat4 | undefined = undefined;
    #reuseTransformation: boolean = true;
    #scale: number = 0.005;
    #show: boolean = true;
    #space: 'local' | 'world' = 'local';

    // #endregion Properties (22)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, nodeOrNodes: ITreeNode | ITreeNode[], settings?: SettingsOptional) {
        this.#viewport = viewport;
        this.#canvasEventListenerToken = this.#viewport.addCanvasEventListener(this);
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

        this.enableRotation = settings?.enableRotation ?? true;
        this.enableScaling = settings?.enableScaling ?? false;
        this.enableTranslation = settings?.enableTranslation ?? true;
        this.scale = settings?.scale ?? 0.005;
        // we don't allow to change the space for now
        this.#space = settings?.space ?? 'local';
        this.#transformControls.space = this.#space;
        // we don't allow to change the reuseTransformation for now
        this.#reuseTransformation = settings?.reuseTransformation ?? true;

        this.setup();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (14)

    public get closed(): boolean {
        return this.#closed;
    }

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

    public get reuseTransformation(): boolean {
        return this.#reuseTransformation;
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

    // #endregion Public Getters And Setters (14)

    // #region Public Methods (10)

    public close(): void {
        this.#parentObject.remove(this.#transformControls);
        this.#parentObject.remove(this.#transformationControlsPlaceholder);
        this.#transformControls.detach();
        this.#transformControls.dispose();
        this.#viewport.threeJsCoreObjects.scene.remove(this.#parentObject);

        this.#viewport.removeCanvasEventListener(this.#canvasEventListenerToken);
        if (this.#continuousRenderingFlag) this.#viewport.removeFlag(this.#continuousRenderingFlag);
        if (this.#continuousShadowMapUpdateFlag) this.#viewport.removeFlag(this.#continuousShadowMapUpdateFlag);
        if (this.#cameraFreezeFlag) this.#viewport.removeFlag(this.#cameraFreezeFlag);
    }

    public keyPressed(key: string | string[]): boolean {
        if (Array.isArray(key)) {
            // check if one of the keys is pressed
            let result = false;
            for (let i = 0; i < key.length; i++) {
                result = result || this.keyPressCheck(key[i]);
            }
            return result;
        } else {
            return this.keyPressCheck(key);
        }
    }

    public onKeyDown(event: KeyboardEvent): void {
        if (this.closed) return;
        this.#keysPressed[event.key] = true;
    }

    public onKeyUp(event: KeyboardEvent): void {
        if (this.closed) return;
        delete this.#keysPressed[event.key];
    }

    public onMouseWheel(event: WheelEvent): void {}

    public onPointerDown(event: PointerEvent): void {}

    public onPointerEnd(event: PointerEvent): void {}

    public onPointerMove(event: PointerEvent): void {
        if (this.closed) return;

        if (!this.#continuousRenderingFlag)
            this.#continuousRenderingFlag = this.#viewport.addFlag(FLAG_TYPE.CONTINUOUS_RENDERING);
        if (!this.#continuousShadowMapUpdateFlag)
            this.#continuousShadowMapUpdateFlag = this.#viewport.addFlag(FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE);
    }

    public onPointerOut(event: PointerEvent): void {
        if (this.closed) return;

        if (this.#continuousRenderingFlag) {
            this.#viewport.removeFlag(this.#continuousRenderingFlag);
            this.#continuousRenderingFlag = undefined;
        }
        if (this.#continuousShadowMapUpdateFlag) {
            this.#viewport.removeFlag(this.#continuousShadowMapUpdateFlag);
            this.#continuousShadowMapUpdateFlag = undefined;
        }
        this.#viewport.render();
    }

    public onPointerUp(event: PointerEvent): void {}

    // #endregion Public Methods (10)

    // #region Private Methods (4)

    private keyPressCheck(key: string): boolean {
        const pressedKeys = Object.keys(this.#keysPressed).filter(key => this.#keysPressed[key] === true);

        // check if it the only key that is pressed
        if (key.includes('+') && key.length > 1) {
            const keys = key.split('+');

            // there are more keys pressed than the keys in the combination
            if (keys.length !== pressedKeys.length) return false;
            let result = true;
            for (let i = 0; i < keys.length; i++)
                result = result && (this.#keysPressed[keys[i]] || false);

            return result;
        } else {
            // there are also other keys pressed
            if (pressedKeys.length > 1) return false;

            return this.#keysPressed[key] || false;
        }
    }

    private setup() {
        // assign the position to the transformation controls objects
        if (this.#node) {
            const index = this.#node.transformations.findIndex(t => t.id === 'SD_gumball_matrix');
            if (index !== -1) {
                this.#previousGumballMatrix = mat4.clone(this.#node.transformations[index].matrix);
            } else {
                this.#previousGumballMatrix = mat4.create();
            }

            if (this.reuseTransformation === true) {
                const trueBB = new Box();
                this.#node.traverseData(d => {
                    if (d instanceof GeometryData) {
                        trueBB.union(d.boundingBox);
                    }
                });
                this.#initialOffset = vec3.clone(trueBB.boundingSphere.center);

                this.#transformationControlsPlaceholder.applyMatrix4(new THREE.Matrix4().makeTranslation(new THREE.Vector3().fromArray(this.#initialOffset)));
                this.#transformationControlsPlaceholder.applyMatrix4(new THREE.Matrix4().fromArray(this.#node.worldMatrix));
            } else {
                this.#initialOffset = vec3.clone(this.#node.boundingBox.boundingSphere.center);
                this.#transformationControlsPlaceholder.applyMatrix4(new THREE.Matrix4().makeTranslation(new THREE.Vector3().fromArray(this.#initialOffset)));
            }

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
    }

    private updateObjectMatrices() {
        const m = new THREE.Matrix4().copy(this.#transformationControlsPlaceholder.matrix)
            .multiply(new THREE.Matrix4().makeTranslation(new THREE.Vector3().fromArray(this.#initialOffset.map(v => -v))));

        this.#matrix = mat4.fromValues(...m.toArray());
        const matrixId = 'SD_gumball_matrix';

        if (this.#node) {
            if (this.reuseTransformation === true) {
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
            } else {
                const transformation = this.#node.transformations.find(t => t.id === matrixId);
                if (transformation) {
                    mat4.multiply(transformation.matrix, this.#matrix, this.#previousGumballMatrix as mat4);
                } else {
                    this.#node.transformations.push({
                        id: matrixId,
                        matrix: mat4.clone(this.#matrix)
                    });
                }
                this.#node.updateVersion();
            }

        } else if (this.#nodes) {
            this.#nodes.forEach((node, i) => {
                const transformation = node.transformations.find(t => t.id === matrixId);

                // in the case of multiple nodes, we need to apply the previous gumball matrix
                // as this way we can ensure that the previous transformations are kept
                const finalMatrix = mat4.clone(this.#matrix);
                if (this.#previousGumballMatrix) {
                    mat4.multiply(finalMatrix, this.#matrix, this.#previousGumballMatrix[i] as mat4);
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
            if (this.reuseTransformation === true) {
                const threeJsObject: THREE.Object3D | undefined = this.#node.convertedObject[this.#viewport.id] as THREE.Object3D;
                if (threeJsObject) {
                    threeJsObject.matrixAutoUpdate = false;
                    threeJsObject.matrix.copy(m);
                    threeJsObject.matrixWorldNeedsUpdate = true;
                }
            } else {
                const threeJsObject: THREE.Object3D | undefined = this.#node.convertedObject[this.#viewport.id] as THREE.Object3D;
                if (threeJsObject) {
                    threeJsObject.matrixAutoUpdate = false;
                    threeJsObject.matrix.copy(new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().fromArray(this.#previousGumballMatrix as mat4)));
                    threeJsObject.matrixWorldNeedsUpdate = true;
                }
            }
        } else if (this.#nodes) {
            this.#nodes.forEach((node, i) => {
                const threeJsObject: THREE.Object3D | undefined = node.convertedObject[this.#viewport.id] as THREE.Object3D;
                if (threeJsObject) {
                    threeJsObject.matrixAutoUpdate = false;

                    // in the case of multiple nodes, we need to apply the previous gumball matrix
                    // as this way we can ensure that the previous transformations are kept
                    if (this.#previousGumballMatrix) {
                        threeJsObject.matrix.copy(new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().fromArray((this.#previousGumballMatrix as mat4[])[i])));
                    } else {
                        threeJsObject.matrix.copy(m);
                    }
                    threeJsObject.matrixWorldNeedsUpdate = true;
                }
            });
        }
    }

    // #endregion Private Methods (4)
}