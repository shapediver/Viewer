import {
    BoxGeometry,
    BufferGeometry,
    Camera,
    CylinderGeometry,
    DoubleSide,
    Euler,
    Float32BufferAttribute,
    Intersection,
    Line,
    LineBasicMaterial,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    MeshNormalMaterial,
    Object3D,
    OctahedronGeometry,
    OrthographicCamera,
    PerspectiveCamera,
    PlaneGeometry,
    Quaternion,
    Raycaster,
    TorusGeometry,
    Vector2,
    Vector3
} from 'three';
/* eslint-disable @typescript-eslint/no-explicit-any */

const _raycaster = new Raycaster();

const _tempVector = new Vector3();
const _tempVector2 = new Vector3();
const _tempQuaternion = new Quaternion();
const _unit = {
    X: new Vector3(1, 0, 0),
    Y: new Vector3(0, 1, 0),
    Z: new Vector3(0, 0, 1)
};

enum TransformationType {
    TRANSLATION = 'translation',
    ROTATION = 'rotation',
    SCALE = 'scale'
}

class TransformControls extends Object3D {
    // #region Properties (50)

    private _axis: string | null = null;
    private _camera: Camera;
    private _cameraPosition: Vector3 = new Vector3();
    private _cameraQuaternion: Quaternion = new Quaternion();
    private _cameraScale: Vector3;
    private _dragging: boolean = false;
    private _enableRotation: boolean = true;
    private _enableScaling: boolean = true;
    private _enableTranslation: boolean = true;
    private _enabled: boolean = true;
    private _endNorm: Vector3;
    private _eye: Vector3 = new Vector3();
    private _gizmo: TransformControlsGizmo;
    private _hovering: boolean = false;
    private _mode?: TransformationType;
    private _object: Object3D | undefined = undefined;
    private _offset: Vector3;
    private _parentPosition: Vector3;
    private _parentQuaternion: Quaternion;
    private _parentQuaternionInv: Quaternion = new Quaternion();
    private _parentScale: Vector3;
    private _pivotDragged: boolean = false;
    private _plane: TransformControlsPlane;
    private _pointEnd: Vector3 = new Vector3();
    private _pointStart: Vector3 = new Vector3();
    private _positionStart: Vector3;
    private _quaternionStart: Quaternion;
    private _rotationAngle: number = 0;
    private _rotationAxis: Vector3 = new Vector3();
    private _rotationSnap: number | null = null;
    private _scaleSnap: number | null = null;
    private _scaleStart: Vector3;
    private _showX: boolean = true;
    private _showY: boolean = true;
    private _showZ: boolean = true;
    private _size: number = 1;
    private _space: string = 'local';
    private _startNorm: Vector3;
    private _translationSnap: number | null = null;
    private _updateCallback: (() => void) | undefined;
    private _updateMatricesCallback: (() => void) | undefined;
    private _worldPosition: Vector3 = new Vector3();
    private _worldPositionStart: Vector3 = new Vector3();
    private _worldQuaternion: Quaternion = new Quaternion();
    private _worldQuaternionInv: Quaternion;
    private _worldQuaternionStart: Quaternion = new Quaternion();
    private _worldScale: Vector3;
    private _worldScaleStart: Vector3;

    public domElement: HTMLElement;
    public isTransformControls: boolean;

    // #endregion Properties (50)

    // #region Constructors (1)

    constructor(camera: Camera, domElement?: HTMLElement, updateCallback?: () => void, updateMatricesCallback?: () => void) {
        super();

        this.userData.ambientOcclusion = false;

        this._camera = camera;
        this._updateCallback = updateCallback;
        this._updateMatricesCallback = updateMatricesCallback;

        if (domElement === undefined) {
            console.warn('THREE.TransformControls: The second parameter "domElement" is now mandatory.');
            domElement = document as unknown as HTMLElement;
        }

        this.isTransformControls = true;

        this.visible = false;
        this.domElement = domElement;
        this.domElement.style.touchAction = 'none'; // disable touch scroll

        const _gizmo = new TransformControlsGizmo(this);
        this._gizmo = _gizmo;
        this.add(_gizmo);

        const _plane = new TransformControlsPlane(this);
        this._plane = _plane;
        this.add(_plane);

        // Define properties with getters/setter
        // Setting the defined property will automatically trigger change event
        // Defined properties are passed down to gizmo and plane

        this._offset = new Vector3();
        this._startNorm = new Vector3();
        this._endNorm = new Vector3();
        this._cameraScale = new Vector3();

        this._parentPosition = new Vector3();
        this._parentQuaternion = new Quaternion();
        this._parentQuaternion = new Quaternion();
        this._parentScale = new Vector3();

        this._worldScaleStart = new Vector3();
        this._worldQuaternionInv = new Quaternion();
        this._worldScale = new Vector3();

        this._positionStart = new Vector3();
        this._quaternionStart = new Quaternion();
        this._scaleStart = new Vector3();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (47)

    public get axis(): string | null {
        return this._axis;
    }

    public set axis(value: string | null) {
        this._axis = value;
    }

    public get camera(): Camera {
        return this._camera;
    }

    public get cameraPosition(): Vector3 {
        return this._cameraPosition;
    }

    public get cameraQuaternion(): Quaternion {
        return this._cameraQuaternion;
    }

    public get dragging(): boolean {
        return this._dragging;
    }

    public set dragging(value: boolean) {
        this._dragging = value;
        this.dispatchEvent({ type: 'dragging-changed', value } as any);
    }

    public get enableRotation(): boolean {
        return this._enableRotation;
    }

    public set enableRotation(value: boolean) {
        this._enableRotation = value;
    }

    public get enableScaling(): boolean {
        return this._enableScaling;
    }

    public set enableScaling(value: boolean) {
        this._enableScaling = value;
    }

    public get enableTranslation(): boolean {
        return this._enableTranslation;
    }

    public set enableTranslation(value: boolean) {
        this._enableTranslation = value;
    }

    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        this._enabled = value;
    }

    public get eye(): Vector3 {
        return this._eye;
    }

    public get hovering(): boolean {
        return this._hovering;
    }

    public get mode(): TransformationType | undefined {
        return this._mode;
    }

    public set mode(value: TransformationType | undefined) {
        this._mode = value;
    }

    public get object(): Object3D | undefined {
        return this._object;
    }

    public set object(value: Object3D | undefined) {
        this._object = value;
    }

    public get pivotDragged(): boolean {
        return this._pivotDragged;
    }

    public set pivotDragged(value: boolean) {
        this._pivotDragged = value;
    }

    public get pointEnd(): Vector3 {
        return this._pointEnd;
    }

    public get pointStart(): Vector3 {
        return this._pointStart;
    }

    public get rotationAngle(): number {
        return this._rotationAngle;
    }

    public set rotationAngle(value: number) {
        this._rotationAngle = value;
    }

    public get rotationAxis(): Vector3 {
        return this._rotationAxis;
    }

    public get rotationSnap(): number | null {
        return this._rotationSnap;
    }

    public set rotationSnap(value: number | null) {
        this._rotationSnap = value;
    }

    public get scaleSnap(): number | null {
        return this._scaleSnap;
    }

    public set scaleSnap(value: number | null) {
        this._scaleSnap = value;
    }

    public get showX(): boolean {
        return this._showX;
    }

    public set showX(value: boolean) {
        this._showX = value;
    }

    public get showY(): boolean {
        return this._showY;
    }

    public set showY(value: boolean) {
        this._showY = value;
    }

    public get showZ(): boolean {
        return this._showZ;
    }

    public set showZ(value: boolean) {
        this._showZ = value;
    }

    public get size(): number {
        return this._size;
    }

    public set size(value: number) {
        this._size = value;
    }

    public get space(): string {
        return this._space;
    }

    public set space(value: string) {
        this._space = value;
    }

    public get translationSnap(): number | null {
        return this._translationSnap;
    }

    public set translationSnap(value: number | null) {
        this._translationSnap = value;
    }

    public get worldPosition(): Vector3 {
        return this._worldPosition;
    }

    public get worldPositionStart(): Vector3 {
        return this._worldPositionStart;
    }

    public get worldQuaternion(): Quaternion {
        return this._worldQuaternion;
    }

    public get worldQuaternionStart(): Quaternion {
        return this._worldQuaternionStart;
    }

    // #endregion Public Getters And Setters (47)

    // #region Public Methods (21)

    // Set current object
    public attach(object: Object3D) {
        this.object = object;
        this.visible = true;

        return this;
    }

    // Detach from object
    public detach() {
        this.object = undefined;
        this.visible = false;
        this.axis = null;

        return this;
    }

    public dispose() {
        this.traverse(function (child) {
            if ((child as any).geometry) (child as any).geometry.dispose();
            if ((child as any).material) (child as any).material.dispose();

        });
    }

    public getPointer(event: PointerEvent) {
        if (this.domElement.ownerDocument.pointerLockElement) {
            return {
                x: 0,
                y: 0,
                button: event.button
            };

        } else {
            const rect = this.domElement.getBoundingClientRect();

            return {
                x: (event.clientX - rect.left) / rect.width * 2 - 1,
                y: - (event.clientY - rect.top) / rect.height * 2 + 1,
                button: event.button
            };
        }
    }

    public getRaycaster() {
        return _raycaster;
    }

    public intersectObjectWithRay(object: Object3D, raycaster: Raycaster, includeInvisible: boolean) {
        const allIntersections = raycaster.intersectObject(object, true);

        for (let i = 0; i < allIntersections.length; i++) {
            if (allIntersections[i].object.visible || includeInvisible) {
                return allIntersections[i];
            }
        }

        return false;
    }

    public onPointerDown(event: PointerEvent) {
        if (!this.enabled) return;

        if (!document.pointerLockElement) {
            this.domElement.setPointerCapture(event.pointerId);
        }

        this.pointerHover(this.getPointer(event));
        this.pointerDown(this.getPointer(event));
    }

    public onPointerHover(event: PointerEvent) {
        if (!this.enabled) return;

        switch (event.pointerType) {
            case 'mouse':
            case 'pen':
                this.pointerHover(this.getPointer(event));
                break;
        }
    }

    public onPointerMove(event: PointerEvent) {
        if (!this.enabled) return;

        this.pointerMove(this.getPointer(event));
    }

    public onPointerUp(event: PointerEvent) {
        if (!this.enabled) return;

        this.domElement.releasePointerCapture(event.pointerId);

        this.pointerUp(this.getPointer(event));
    }

    public pointerDown(pointer: { x: number; y: number; button: any; }) {
        if (this.object === undefined || this.dragging === true || (pointer != null && pointer.button !== 0)) return;

        if (this.axis !== null) {
            if (pointer !== null) _raycaster.setFromCamera(pointer as unknown as Vector2, this.camera);

            const planeIntersect = this.intersectObjectWithRay(this._plane, _raycaster, true);

            if (planeIntersect) {
                this.object.updateMatrixWorld();
                this.object?.parent?.updateMatrixWorld();

                this._positionStart.copy(this.object.position);
                this._quaternionStart.copy(this.object.quaternion);
                this._scaleStart.copy(this.object.scale);

                this.object.matrixWorld.decompose(this.worldPositionStart, this.worldQuaternionStart, this._worldScaleStart);

                this.pointStart.copy(planeIntersect.point).sub(this.worldPositionStart);
            }

            this.dragging = true;
        }
    }

    public pointerHover(pointer: { x: number; y: number; button: any; }) {
        if (this.object === undefined || this.dragging === true) return;

        if (pointer !== null) _raycaster.setFromCamera(pointer as unknown as Vector2, this.camera);

        const intersections: {
            mode: TransformationType,
            intersection: Intersection
        }[] = [];

        if (this.enableTranslation) {
            const intersection = this.intersectObjectWithRay(this._gizmo.picker.translate, _raycaster, true);
            if (intersection) {
                intersections.push({
                    mode: TransformationType.TRANSLATION,
                    intersection
                });
            }
        }

        if (this.enableRotation) {
            const intersection = this.intersectObjectWithRay(this._gizmo.picker.rotate, _raycaster, true);
            if (intersection) {
                intersections.push({
                    mode: TransformationType.ROTATION,
                    intersection
                });
            }
        }

        if (this.enableScaling && this.space === 'local') {
            const intersection = this.intersectObjectWithRay(this._gizmo.picker.scale, _raycaster, true);
            if (intersection) {
                intersections.push({
                    mode: TransformationType.SCALE,
                    intersection
                });
            }
        }

        intersections.sort((a, b) => a.intersection.distance - b.intersection.distance);

        if (intersections.length > 0) {
            this.axis = intersections[0].intersection.object.name;
            this.mode = intersections[0].mode;
        } else {
            this.axis = null;
            this.mode = undefined;
        }

        this._hovering = intersections.length > 0;
    }

    public pointerMove(pointer: { x: number; y: number; button: any; }) {
        const axis = this.axis;
        const object = this.object;
        let space = this.space;

        if (axis === 'E' || axis === 'XYZE' || axis === 'XYZ') {
            space = 'world';
        }

        if (object === undefined || axis === null || this.dragging === false || (pointer !== null && pointer.button !== - 1)) return;

        if (pointer !== null) _raycaster.setFromCamera(pointer as unknown as Vector2, this.camera);

        const planeIntersect = this.intersectObjectWithRay(this._plane, _raycaster, true);

        if (!planeIntersect) return;

        this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart);

        if (this.mode === TransformationType.TRANSLATION) {
            // Apply translate

            this._offset.copy(this.pointEnd).sub(this.pointStart);

            if (space === 'local' && axis !== 'XYZ') {
                this._offset.applyQuaternion(this._worldQuaternionInv);
            }

            if (axis.indexOf('X') === - 1) this._offset.x = 0;
            if (axis.indexOf('Y') === - 1) this._offset.y = 0;
            if (axis.indexOf('Z') === - 1) this._offset.z = 0;

            if (space === 'local' && axis !== 'XYZ') {
                this._offset.applyQuaternion(this._quaternionStart).divide(this._parentScale);

            } else {
                this._offset.applyQuaternion(this._parentQuaternionInv).divide(this._parentScale);
            }

            object.position.copy(this._offset).add(this._positionStart);

            // Apply translation snap

            if (this.translationSnap) {
                if (space === 'local') {
                    object.position.applyQuaternion(_tempQuaternion.copy(this._quaternionStart).invert());

                    if (axis.search('X') !== - 1) {
                        object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap;
                    }

                    if (axis.search('Y') !== - 1) {
                        object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap;
                    }

                    if (axis.search('Z') !== - 1) {
                        object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap;
                    }

                    object.position.applyQuaternion(this._quaternionStart);
                }

                if (space === 'world') {
                    if (object.parent) {
                        object.position.add(_tempVector.setFromMatrixPosition(object.parent.matrixWorld));
                    }

                    if (axis.search('X') !== - 1) {
                        object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap;
                    }

                    if (axis.search('Y') !== - 1) {
                        object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap;
                    }

                    if (axis.search('Z') !== - 1) {
                        object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap;
                    }

                    if (object.parent) {
                        object.position.sub(_tempVector.setFromMatrixPosition(object.parent.matrixWorld));
                    }
                }
            }
        }

        if (this.mode === TransformationType.SCALE && space === 'local') {
            if (axis.search('XYZ') !== - 1) {
                let d = this.pointEnd.length() / this.pointStart.length();

                if (this.pointEnd.dot(this.pointStart) < 0) d *= - 1;

                _tempVector2.set(d, d, d);

            } else {
                _tempVector.copy(this.pointStart);
                _tempVector2.copy(this.pointEnd);

                _tempVector.applyQuaternion(this._worldQuaternionInv);
                _tempVector2.applyQuaternion(this._worldQuaternionInv);

                _tempVector2.divide(_tempVector);

                if (axis.search('X') === - 1) {
                    _tempVector2.x = 1;
                }

                if (axis.search('Y') === - 1) {
                    _tempVector2.y = 1;
                }

                if (axis.search('Z') === - 1) {
                    _tempVector2.z = 1;
                }
            }

            // Apply scale

            object.scale.copy(this._scaleStart).multiply(_tempVector2);

            if (this.scaleSnap) {
                if (axis.search('X') !== - 1) {
                    object.scale.x = Math.round(object.scale.x / this.scaleSnap) * this.scaleSnap || this.scaleSnap;
                }

                if (axis.search('Y') !== - 1) {
                    object.scale.y = Math.round(object.scale.y / this.scaleSnap) * this.scaleSnap || this.scaleSnap;
                }

                if (axis.search('Z') !== - 1) {
                    object.scale.z = Math.round(object.scale.z / this.scaleSnap) * this.scaleSnap || this.scaleSnap;
                }
            }
        }

        if (this.mode === TransformationType.ROTATION) {
            this._offset.copy(this.pointEnd).sub(this.pointStart);

            const ROTATION_SPEED = 20 / this.worldPosition.distanceTo(_tempVector.setFromMatrixPosition(this.camera.matrixWorld));

            let _inPlaneRotation = false;

            if (axis === 'XYZE') {
                this.rotationAxis.copy(this._offset).cross(this.eye).normalize();
                this.rotationAngle = this._offset.dot(_tempVector.copy(this.rotationAxis).cross(this.eye)) * ROTATION_SPEED;

            } else if (axis === 'X' || axis === 'Y' || axis === 'Z') {
                this.rotationAxis.copy(_unit[axis]);

                _tempVector.copy(_unit[axis]);

                if (space === 'local') {
                    _tempVector.applyQuaternion(this.worldQuaternion);
                }

                _tempVector.cross(this.eye);

                // When _tempVector is 0 after cross with this.eye the vectors are parallel and should use in-plane rotation logic.
                if (_tempVector.length() === 0) {
                    _inPlaneRotation = true;

                } else {
                    this.rotationAngle = this._offset.dot(_tempVector.normalize()) * ROTATION_SPEED;
                }
            }

            if (axis === 'E' || _inPlaneRotation) {
                this.rotationAxis.copy(this.eye);
                this.rotationAngle = this.pointEnd.angleTo(this.pointStart);

                this._startNorm.copy(this.pointStart).normalize();
                this._endNorm.copy(this.pointEnd).normalize();

                this.rotationAngle *= (this._endNorm.cross(this._startNorm).dot(this.eye) < 0 ? 1 : - 1);
            }

            // Apply rotation snap

            if (this.rotationSnap) this.rotationAngle = Math.round(this.rotationAngle / this.rotationSnap) * this.rotationSnap;

            // Apply rotate
            if (space === 'local' && axis !== 'E' && axis !== 'XYZE') {
                object.quaternion.copy(this._quaternionStart);
                object.quaternion.multiply(_tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle)).normalize();

            } else {
                this.rotationAxis.applyQuaternion(this._parentQuaternionInv);
                object.quaternion.copy(_tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle));
                object.quaternion.multiply(this._quaternionStart).normalize();
            }
        }

        if (this._updateCallback) this._updateCallback();
    }

    public pointerUp(pointer: { x: number, y: number, button: any }) {
        if (pointer !== null && pointer.button !== 0) return;

        if (this.dragging && (this.axis !== null)) {
            if(this._updateMatricesCallback) 
                this._updateMatricesCallback();
        }

        this.dragging = false;
        this.axis = null;
    }

    public reset() {
        if (!this.enabled) return;

        if (this.dragging) {
            this.object?.position.copy(this._positionStart);
            this.object?.quaternion.copy(this._quaternionStart);
            this.object?.scale.copy(this._scaleStart);

            this.pointStart.copy(this.pointEnd);
        }
    }

    public setRotationSnap(rotationSnap: number) {
        this.rotationSnap = rotationSnap;
    }

    public setScaleSnap(scaleSnap: number) {
        this.scaleSnap = scaleSnap;
    }

    public setSize(size: number) {
        this.size = size;
    }

    public setSpace(space: string) {
        this.space = space;
    }

    public setTranslationSnap(translationSnap: number) {
        this.translationSnap = translationSnap;
    }

    // updateMatrixWorld updates key transformation variables
    public updateMatrixWorld(force: boolean = false) {
        if (this.object !== undefined) {
            this.object.updateMatrixWorld();

            if (this.object.parent === null) {
                console.error('TransformControls: The attached 3D object must be a part of the scene graph.');

            } else {
                this.object.parent.matrixWorld.decompose(this._parentPosition, this._parentQuaternion, this._parentScale);
            }

            this.object.matrixWorld.decompose(this.worldPosition, this.worldQuaternion, this._worldScale);

            this._parentQuaternionInv.copy(this._parentQuaternion).invert();
            this._worldQuaternionInv.copy(this.worldQuaternion).invert();
        }

        this.camera.updateMatrixWorld();
        this.camera.matrixWorld.decompose(this.cameraPosition, this.cameraQuaternion, this._cameraScale);

        if ((this.camera as OrthographicCamera).isOrthographicCamera) {
            this.camera.getWorldDirection(this.eye).negate();

        } else {
            this.eye.copy(this.cameraPosition).sub(this.worldPosition).normalize();
        }

        super.updateMatrixWorld(force);
    }

    // #endregion Public Methods (21)
}

// mouse / touch event handlers

//

// Reusable utility variables

const _tempEuler = new Euler();
const _alignVector = new Vector3(0, 1, 0);
const _zeroVector = new Vector3(0, 0, 0);
const _lookAtMatrix = new Matrix4();
const _tempQuaternion2 = new Quaternion();
const _identityQuaternion = new Quaternion();
const _dirVector = new Vector3();
const _tempMatrix = new Matrix4();

const _unitX = new Vector3(1, 0, 0);
const _unitY = new Vector3(0, 1, 0);
const _unitZ = new Vector3(0, 0, 1);

const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();

class TransformControlsGizmo extends Object3D {
    // #region Properties (5)

    public gizmo: {
        translate: Object3D;
        rotate: Object3D;
        scale: Object3D;
    };
    public helper: {
        translate: Object3D;
        rotate: Object3D;
        scale: Object3D;
    };
    public isTransformControlsGizmo: true;
    public picker: {
        translate: Object3D;
        rotate: Object3D;
        scale: Object3D;
    };
    public type: 'TransformControlsGizmo';

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(readonly _transformControls: TransformControls) {
        super();

        this.isTransformControlsGizmo = true;

        this.type = 'TransformControlsGizmo';

        // shared materials

        const gizmoMaterial = new MeshBasicMaterial({
            depthTest: false,
            depthWrite: false,
            fog: false,
            toneMapped: false,
            transparent: true
        });

        const gizmoLineMaterial = new LineBasicMaterial({
            depthTest: false,
            depthWrite: false,
            fog: false,
            toneMapped: false,
            transparent: true
        });

        // Make unique material for each axis/color

        const materialInvisible = gizmoMaterial.clone();
        materialInvisible.opacity = 0.15;
        const translationMaterialInvisible = materialInvisible.clone();
        const rotationMaterialInvisible = materialInvisible.clone();
        const scaleMaterialInvisible = materialInvisible.clone();

        const materialHelper = gizmoLineMaterial.clone();
        materialHelper.opacity = 0.5;
        const translationMaterialHelper = materialHelper.clone();
        const rotationMaterialHelper = materialHelper.clone();
        const scaleMaterialHelper = materialHelper.clone();

        const materialRed = gizmoMaterial.clone();
        materialRed.color.setHex(0xff0000);
        const translationMaterialRed = materialRed.clone();
        const rotationMaterialRed = materialRed.clone();
        const scaleMaterialRed = materialRed.clone();

        const materialGreen = gizmoMaterial.clone();
        materialGreen.color.setHex(0x00ff00);
        const translationMaterialGreen = materialGreen.clone();
        const rotationMaterialGreen = materialGreen.clone();
        const scaleMaterialGreen = materialGreen.clone();

        const materialBlue = gizmoMaterial.clone();
        materialBlue.color.setHex(0x0000ff);
        const translationMaterialBlue = materialBlue.clone();
        const rotationMaterialBlue = materialBlue.clone();
        const scaleMaterialBlue = materialBlue.clone();

        const materialRedTransparent = gizmoMaterial.clone();
        materialRedTransparent.color.setHex(0xff0000);
        materialRedTransparent.opacity = 0.5;
        const translationMaterialRedTransparent = materialRedTransparent.clone();
        const scaleMaterialRedTransparent = materialRedTransparent.clone();

        const materialGreenTransparent = gizmoMaterial.clone();
        materialGreenTransparent.color.setHex(0x00ff00);
        materialGreenTransparent.opacity = 0.5;
        const translationMaterialGreenTransparent = materialGreenTransparent.clone();
        const scaleMaterialGreenTransparent = materialGreenTransparent.clone();

        const materialBlueTransparent = gizmoMaterial.clone();
        materialBlueTransparent.color.setHex(0x0000ff);
        materialBlueTransparent.opacity = 0.5;
        const translationMaterialBlueTransparent = materialBlueTransparent.clone();
        const scaleMaterialBlueTransparent = materialBlueTransparent.clone();

        const materialWhiteTransparent = gizmoMaterial.clone();
        materialWhiteTransparent.opacity = 0.25;
        const translationMaterialWhiteTransparent = materialWhiteTransparent.clone();
        const scaleMaterialWhiteTransparent = materialWhiteTransparent.clone();

        const materialYellowTransparent = gizmoMaterial.clone();
        materialYellowTransparent.color.setHex(0xffff00);
        materialYellowTransparent.opacity = 0.25;
        const rotationMaterialYellowTransparent = materialYellowTransparent.clone();

        const materialGray = gizmoMaterial.clone();
        materialGray.color.setHex(0x787878);
        const rotationMaterialGray = materialGray.clone();

        // reusable geometry

        const arrowGeo = new CylinderGeometry(0, 0.04, 0.1, 12);
        arrowGeo.translate(0, 0.05, 0);
        const translationArrowGeometry = arrowGeo.clone();

        const scaleHandleGeometry = new BoxGeometry(0.08, 0.08, 0.08);
        scaleHandleGeometry.translate(0, 0.04, 0);

        const lineGeo = new BufferGeometry();
        lineGeo.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3));
        const translationLineGeometry = lineGeo.clone();
        const scaleLineGeometry = lineGeo.clone();
        const rotationLineGeometry = lineGeo.clone();

        const lineGeo2 = new CylinderGeometry(0.0075, 0.0075, 0.5, 3);
        lineGeo2.translate(0, 0.25, 0);
        const translationLineGeometry2 = lineGeo2.clone();

        function CircleGeometry(radius: number, arc: number) {
            const geometry = new TorusGeometry(radius, 0.0075, 3, 64, arc * Math.PI * 2);
            geometry.rotateY(Math.PI / 2);
            geometry.rotateX(Math.PI / 2);
            return geometry;
        }

        // Special geometry for transform helper. If scaled with position vector it spans from [0,0,0] to position

        function TranslateHelperGeometry() {
            const geometry = new BufferGeometry();

            geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));

            return geometry;
        }

        // Gizmo definitions - custom hierarchy definitions for setupGizmo() function
        // this has to be typed separately because TypeScript type inference can't infer type from array of arrays
        type GizmoMap = {
            [key: string]: (
                [Mesh | Line, [number, number, number] | null, [number, number, number] | null, [number, number, number] | null, string | null] |
                [Mesh | Line, [number, number, number] | null, [number, number, number] | null, [number, number, number] | null] |
                [Mesh | Line, [number, number, number] | null, [number, number, number] | null] |
                [Mesh | Line, [number, number, number] | null] |
                [Mesh | Line]

            )[]
        };

        const gizmoTranslate: GizmoMap = {
            X: [
                [new Mesh(translationArrowGeometry, translationMaterialRed), [0.5, 0, 0], [0, 0, - Math.PI / 2]],
                // [new Mesh(translationArrowGeometry, translationMaterialRed), [- 0.5, 0, 0], [0, 0, Math.PI / 2]],
                [new Mesh(translationLineGeometry2, translationMaterialRed), [0, 0, 0], [0, 0, - Math.PI / 2]]
            ],
            Y: [
                [new Mesh(translationArrowGeometry, translationMaterialGreen), [0, 0.5, 0]],
                // [new Mesh(translationArrowGeometry, translationMaterialGreen), [0, - 0.5, 0], [Math.PI, 0, 0]],
                [new Mesh(translationLineGeometry2, translationMaterialGreen)]
            ],
            Z: [
                [new Mesh(translationArrowGeometry, translationMaterialBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
                // [new Mesh(translationArrowGeometry, translationMaterialBlue), [0, 0, - 0.5], [- Math.PI / 2, 0, 0]],
                [new Mesh(translationLineGeometry2, translationMaterialBlue), null, [Math.PI / 2, 0, 0]]
            ],
            XYZ: [
                [new Mesh(new OctahedronGeometry(0.1, 0), translationMaterialWhiteTransparent.clone()), [0, 0, 0]]
            ],
            XY: [
                [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), translationMaterialBlueTransparent.clone()), [0.25, 0.25, 0]]
            ],
            YZ: [
                [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), translationMaterialRedTransparent.clone()), [0, 0.25, 0.25], [0, Math.PI / 2, 0]]
            ],
            XZ: [
                [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), translationMaterialGreenTransparent.clone()), [0.25, 0, 0.25], [- Math.PI / 2, 0, 0]]
            ]
        };

        const pickerTranslate: GizmoMap = {
            X: [
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), translationMaterialInvisible), [0.3, 0, 0], [0, 0, - Math.PI / 2]],
                // [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), translationMaterialInvisible), [- 0.3, 0, 0], [0, 0, Math.PI / 2]]
            ],
            Y: [
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), translationMaterialInvisible), [0, 0.3, 0]],
                // [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), translationMaterialInvisible), [0, - 0.3, 0], [0, 0, Math.PI]]
            ],
            Z: [
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), translationMaterialInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
                // [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), translationMaterialInvisible), [0, 0, - 0.3], [- Math.PI / 2, 0, 0]]
            ],
            XYZ: [
                [new Mesh(new OctahedronGeometry(0.2, 0), translationMaterialInvisible)]
            ],
            XY: [
                [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), translationMaterialInvisible), [0.25, 0.25, 0]]
            ],
            YZ: [
                [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), translationMaterialInvisible), [0, 0.25, 0.25], [0, Math.PI / 2, 0]]
            ],
            XZ: [
                [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), translationMaterialInvisible), [0.25, 0, 0.25], [- Math.PI / 2, 0, 0]]
            ]
        };

        const helperTranslate: GizmoMap = {
            START: [
                [new Mesh(new OctahedronGeometry(0.01, 2), translationMaterialHelper), null, null, null, 'helper']
            ],
            END: [
                [new Mesh(new OctahedronGeometry(0.01, 2), translationMaterialHelper), null, null, null, 'helper']
            ],
            DELTA: [
                [new Line(TranslateHelperGeometry(), translationMaterialHelper), null, null, null, 'helper']
            ],
            X: [
                [new Line(translationLineGeometry, translationMaterialHelper.clone()), [- 1e3, 0, 0], null, [1e6, 1, 1], 'helper']
            ],
            Y: [
                [new Line(translationLineGeometry, translationMaterialHelper.clone()), [0, - 1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']
            ],
            Z: [
                [new Line(translationLineGeometry, translationMaterialHelper.clone()), [0, 0, - 1e3], [0, - Math.PI / 2, 0], [1e6, 1, 1], 'helper']
            ]
        };

        const rotationScale = 1.5;

        const gizmoRotate: GizmoMap = {
            // XYZE: [
            //     [new Mesh(CircleGeometry(0.5 * rotationScale, 1), rotationMaterialGray), null, [0, Math.PI / 2, 0]]
            // ],
            X: [
                [new Mesh(CircleGeometry(0.5 * rotationScale, 0.5), rotationMaterialRed)]
            ],
            Y: [
                [new Mesh(CircleGeometry(0.5 * rotationScale, 0.5), rotationMaterialGreen), null, [0, 0, - Math.PI / 2]]
            ],
            Z: [
                [new Mesh(CircleGeometry(0.5 * rotationScale, 0.5), rotationMaterialBlue), null, [0, Math.PI / 2, 0]]
            ],
            E: [
                [new Mesh(CircleGeometry(0.6 * rotationScale, 1), rotationMaterialYellowTransparent), null, [0, Math.PI / 2, 0]]
            ]
        };

        const helperRotate: GizmoMap = {
            AXIS: [
                [new Line(rotationLineGeometry, rotationMaterialHelper.clone()), [- 1e3, 0, 0], null, [1e6, 1, 1], 'helper']
            ]
        };

        const pickerRotate: GizmoMap = {
            // XYZE: [
            //     [new Mesh(new SphereGeometry(0.25 * rotationScale, 10, 8), rotationMaterialInvisible)]
            // ],
            X: [
                [new Mesh(new TorusGeometry(0.5 * rotationScale, 0.1, 4, 24), rotationMaterialInvisible), [0, 0, 0], [0, - Math.PI / 2, - Math.PI / 2]],
            ],
            Y: [
                [new Mesh(new TorusGeometry(0.5 * rotationScale, 0.1, 4, 24), rotationMaterialInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]],
            ],
            Z: [
                [new Mesh(new TorusGeometry(0.5 * rotationScale, 0.1, 4, 24), rotationMaterialInvisible), [0, 0, 0], [0, 0, - Math.PI / 2]],
            ],
            E: [
                [new Mesh(new TorusGeometry(0.6 * rotationScale, 0.1, 2, 24), rotationMaterialInvisible)]
            ]
        };

        const gizmoScale: GizmoMap = {
            X: [
                // [new Mesh(scaleHandleGeometry, scaleMaterialRed), [0.5, 0, 0], [0, 0, - Math.PI / 2]],
                // [new Mesh(scaleLineGeometry2, scaleMaterialRed), [0, 0, 0], [0, 0, - Math.PI / 2]],
                [new Mesh(scaleHandleGeometry, scaleMaterialRed), [- 0.5, 0, 0], [0, 0, Math.PI / 2]],
            ],
            Y: [
                // [new Mesh(scaleHandleGeometry, scaleMaterialGreen), [0, 0.5, 0]],
                // [new Mesh(scaleLineGeometry2, scaleMaterialGreen)],
                [new Mesh(scaleHandleGeometry, scaleMaterialGreen), [0, - 0.5, 0], [0, 0, Math.PI]],
            ],
            Z: [
                // [new Mesh(scaleHandleGeometry, scaleMaterialBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
                // [new Mesh(scaleLineGeometry2, scaleMaterialBlue), [0, 0, 0], [Math.PI / 2, 0, 0]],
                [new Mesh(scaleHandleGeometry, scaleMaterialBlue), [0, 0, - 0.5], [- Math.PI / 2, 0, 0]]
            ],
            // XY: [
            //     [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), scaleMaterialBlueTransparent), [0.15, 0.15, 0]]
            // ],
            // YZ: [
            //     [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), scaleMaterialRedTransparent), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]
            // ],
            // XZ: [
            //     [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), scaleMaterialGreenTransparent), [0.15, 0, 0.15], [- Math.PI / 2, 0, 0]]
            // ],
            // XYZ: [
            //     [new Mesh(new BoxGeometry(0.1, 0.1, 0.1), scaleMaterialWhiteTransparent.clone())],
            // ]
        };

        const pickerScale: GizmoMap = {
            X: [
                // [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), scaleMaterialInvisible), [0.3, 0, 0], [0, 0, - Math.PI / 2]],
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), scaleMaterialInvisible), [- 0.3, 0, 0], [0, 0, Math.PI / 2]]
            ],
            Y: [
                // [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), scaleMaterialInvisible), [0, 0.3, 0]],
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), scaleMaterialInvisible), [0, - 0.3, 0], [0, 0, Math.PI]]
            ],
            Z: [
                // [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), scaleMaterialInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), scaleMaterialInvisible), [0, 0, - 0.3], [- Math.PI / 2, 0, 0]]
            ],
            // XY: [
            //     [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), scaleMaterialInvisible), [0.15, 0.15, 0]],
            // ],
            // YZ: [
            //     [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), scaleMaterialInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]],
            // ],
            // XZ: [
            //     [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), scaleMaterialInvisible), [0.15, 0, 0.15], [- Math.PI / 2, 0, 0]],
            // ],
            // XYZ: [
            //     [new Mesh(new BoxGeometry(0.2, 0.2, 0.2), scaleMaterialInvisible), [0, 0, 0]],
            // ]
        };

        const helperScale: GizmoMap = {
            X: [
                [new Line(scaleLineGeometry, scaleMaterialHelper.clone()), [- 1e3, 0, 0], null, [1e6, 1, 1], 'helper']
            ],
            Y: [
                [new Line(scaleLineGeometry, scaleMaterialHelper.clone()), [0, - 1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']
            ],
            Z: [
                [new Line(scaleLineGeometry, scaleMaterialHelper.clone()), [0, 0, - 1e3], [0, - Math.PI / 2, 0], [1e6, 1, 1], 'helper']
            ]
        };

        // Creates an Object3D with gizmos described in custom hierarchy definition.

        function setupGizmo(gizmoMap: GizmoMap) {
            const gizmo = new Object3D();

            for (const name in gizmoMap) {
                for (let i = gizmoMap[name].length; i--;) {
                    const object = gizmoMap[name][i][0].clone();
                    const position = gizmoMap[name][i][1];
                    const rotation = gizmoMap[name][i][2];
                    const scale = gizmoMap[name][i][3];
                    const tag = gizmoMap[name][i][4];

                    // name and tag properties are essential for picking and updating logic.
                    object.name = name;
                    object.userData.ambientOcclusion = false;
                    (object as any).tag = tag;

                    if (position) {
                        object.position.set(position[0], position[1], position[2]);
                    }

                    if (rotation) {
                        object.rotation.set(rotation[0], rotation[1], rotation[2]);
                    }

                    if (scale) {
                        object.scale.set(scale[0], scale[1], scale[2]);
                    }

                    object.updateMatrix();

                    const tempGeometry = object.geometry.clone();
                    tempGeometry.applyMatrix4(object.matrix);
                    object.geometry = tempGeometry;
                    object.renderOrder = Infinity;

                    object.position.set(0, 0, 0);
                    object.rotation.set(0, 0, 0);
                    object.scale.set(1, 1, 1);

                    gizmo.add(object);
                }
            }

            return gizmo;
        }

        // Gizmo creation

        this.gizmo = {
            'translate': setupGizmo(gizmoTranslate),
            'rotate': setupGizmo(gizmoRotate),
            'scale': setupGizmo(gizmoScale),
        };
        this.picker = {
            'translate': setupGizmo(pickerTranslate),
            'rotate': setupGizmo(pickerRotate),
            'scale': setupGizmo(pickerScale),
        };
        this.helper = {
            'translate': setupGizmo(helperTranslate),
            'rotate': setupGizmo(helperRotate),
            'scale': setupGizmo(helperScale),
        };

        this.add(this.gizmo['scale']);
        this.add(this.picker['scale']);
        this.add(this.helper['scale']);

        this.add(this.gizmo['translate']);
        this.add(this.picker['translate']);
        this.add(this.helper['translate']);

        this.add(this.gizmo['rotate']);
        this.add(this.picker['rotate']);
        this.add(this.helper['rotate']);

        // Pickers should be hidden always

        this.picker['translate'].visible = false;
        this.picker['rotate'].visible = false;
        this.picker['scale'].visible = false;
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    // updateMatrixWorld will update transformations and appearance of individual handles
    public updateMatrixWorld(force: boolean) {
        const space = this._transformControls.space;

        let quaternion = new Quaternion();
        if (space === 'local') {
            this._transformControls.object?.getWorldQuaternion(quaternion);
        } else {
            quaternion = _identityQuaternion;
        }

        // Show only gizmos for current transform mode

        this.gizmo['translate'].visible = this._transformControls.enableTranslation;
        this.gizmo['rotate'].visible = this._transformControls.enableRotation;
        this.gizmo['scale'].visible = this._transformControls.enableScaling && this._transformControls.space === 'local';

        this.helper['translate'].visible = this._transformControls.enableTranslation;
        this.helper['rotate'].visible = this._transformControls.enableRotation;
        this.helper['scale'].visible = this._transformControls.enableScaling && this._transformControls.space === 'local';

        let handles: {
            object: Object3D,
            mode: TransformationType
        }[] = [];
        if (this._transformControls.enableTranslation) {
            handles = handles.concat(this.picker.translate.children.map((object) => ({ object, mode: TransformationType.TRANSLATION })));
            handles = handles.concat(this.gizmo.translate.children.map((object) => ({ object, mode: TransformationType.TRANSLATION })));
            handles = handles.concat(this.helper.translate.children.map((object) => ({ object, mode: TransformationType.TRANSLATION })));
        }

        if (this._transformControls.enableRotation) {
            handles = handles.concat(this.picker.rotate.children.map((object) => ({ object, mode: TransformationType.ROTATION })));
            handles = handles.concat(this.gizmo.rotate.children.map((object) => ({ object, mode: TransformationType.ROTATION })));
            handles = handles.concat(this.helper.rotate.children.map((object) => ({ object, mode: TransformationType.ROTATION })));
        }

        if (this._transformControls.enableScaling && this._transformControls.space === 'local') {
            handles = handles.concat(this.picker.scale.children.map((object) => ({ object, mode: TransformationType.SCALE })));
            handles = handles.concat(this.gizmo.scale.children.map((object) => ({ object, mode: TransformationType.SCALE })));
            handles = handles.concat(this.helper.scale.children.map((object) => ({ object, mode: TransformationType.SCALE })));
        }

        for (let i = 0; i < handles.length; i++) {
            const handle = handles[i] as { object: Mesh<BufferGeometry, MeshBasicMaterial> | Line<BufferGeometry, LineBasicMaterial>, mode: TransformationType };

            // hide aligned to camera

            handle.object.visible = true;
            handle.object.rotation.set(0, 0, 0);
            handle.object.position.copy(this._transformControls.worldPosition);

            let factor;

            if ((this._transformControls.camera as OrthographicCamera).isOrthographicCamera) {
                factor = ((this._transformControls.camera as OrthographicCamera).top - (this._transformControls.camera as OrthographicCamera).bottom) / (this._transformControls.camera as OrthographicCamera).zoom;

            } else {
                factor = this._transformControls.worldPosition.distanceTo(this._transformControls.cameraPosition) * Math.min(1.9 * Math.tan(Math.PI * (this._transformControls.camera as PerspectiveCamera).fov / 360) / (this._transformControls.camera as PerspectiveCamera).zoom, 7);
            }

            handle.object.scale.set(1, 1, 1).multiplyScalar(factor * this._transformControls.size);

            // TODO: simplify helpers and consider decoupling from gizmo

            if ((handle.object as any).tag === 'helper') {
                handle.object.visible = false;

                if (handle.object.name === 'AXIS') {
                    handle.object.visible = !!this._transformControls.axis;

                    if (this._transformControls.axis === 'X') {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, 0, 0));
                        handle.object.quaternion.copy(quaternion).multiply(_tempQuaternion);

                        if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this._transformControls.eye)) > 0.9) {
                            handle.object.visible = false;
                        }
                    }

                    if (this._transformControls.axis === 'Y') {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, 0, Math.PI / 2));
                        handle.object.quaternion.copy(quaternion).multiply(_tempQuaternion);

                        if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this._transformControls.eye)) > 0.9) {
                            handle.object.visible = false;
                        }
                    }

                    if (this._transformControls.axis === 'Z') {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, Math.PI / 2, 0));
                        handle.object.quaternion.copy(quaternion).multiply(_tempQuaternion);

                        if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this._transformControls.eye)) > 0.9) {
                            handle.object.visible = false;
                        }
                    }

                    if (this._transformControls.axis === 'XYZE') {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, Math.PI / 2, 0));
                        _alignVector.copy(this._transformControls.rotationAxis);
                        handle.object.quaternion.setFromRotationMatrix(_lookAtMatrix.lookAt(_zeroVector, _alignVector, _unitY));
                        handle.object.quaternion.multiply(_tempQuaternion);
                        handle.object.visible = this._transformControls.dragging;
                    }

                    if (this._transformControls.axis === 'E') {
                        handle.object.visible = false;
                    }

                } else if (handle.object.name === 'START') {
                    handle.object.position.copy(this._transformControls.worldPositionStart);
                    handle.object.visible = this._transformControls.dragging;

                } else if (handle.object.name === 'END') {
                    handle.object.position.copy(this._transformControls.worldPosition);
                    handle.object.visible = this._transformControls.dragging;

                } else if (handle.object.name === 'DELTA') {
                    handle.object.position.copy(this._transformControls.worldPositionStart);
                    handle.object.quaternion.copy(this._transformControls.worldQuaternionStart);
                    _tempVector.set(1e-10, 1e-10, 1e-10).add(this._transformControls.worldPositionStart).sub(this._transformControls.worldPosition).multiplyScalar(- 1);
                    _tempVector.applyQuaternion(this._transformControls.worldQuaternionStart.clone().invert());
                    handle.object.scale.copy(_tempVector);
                    handle.object.visible = this._transformControls.dragging;

                } else {
                    handle.object.quaternion.copy(quaternion);

                    if (this._transformControls.dragging) {
                        handle.object.position.copy(this._transformControls.worldPositionStart);

                    } else {
                        handle.object.position.copy(this._transformControls.worldPosition);
                    }

                    if (this._transformControls.axis) {
                        handle.object.visible = this._transformControls.axis.search(handle.object.name) !== - 1;
                    }
                }

                // If updating helper, skip rest of the loop
                continue;
            }

            // Align handles to current local or world rotation

            handle.object.quaternion.copy(quaternion);

            if ((this._transformControls.enableTranslation && handle.mode === TransformationType.TRANSLATION) || (this._transformControls.enableScaling && handle.mode === TransformationType.SCALE)) {
                // Hide translate and scale axis facing the camera

                const AXIS_HIDE_THRESHOLD = 0.99;
                const PLANE_HIDE_THRESHOLD = 0.2;

                if (handle.object.name === 'X') {
                    if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this._transformControls.eye)) > AXIS_HIDE_THRESHOLD) {
                        handle.object.scale.set(1e-10, 1e-10, 1e-10);
                        handle.object.visible = false;
                    }
                }

                if (handle.object.name === 'Y') {
                    if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this._transformControls.eye)) > AXIS_HIDE_THRESHOLD) {
                        handle.object.scale.set(1e-10, 1e-10, 1e-10);
                        handle.object.visible = false;
                    }
                }

                if (handle.object.name === 'Z') {
                    if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this._transformControls.eye)) > AXIS_HIDE_THRESHOLD) {
                        handle.object.scale.set(1e-10, 1e-10, 1e-10);
                        handle.object.visible = false;
                    }
                }

                if (handle.object.name === 'XY') {
                    if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this._transformControls.eye)) < PLANE_HIDE_THRESHOLD) {
                        handle.object.scale.set(1e-10, 1e-10, 1e-10);
                        handle.object.visible = false;
                    }
                }

                if (handle.object.name === 'YZ') {
                    if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this._transformControls.eye)) < PLANE_HIDE_THRESHOLD) {
                        handle.object.scale.set(1e-10, 1e-10, 1e-10);
                        handle.object.visible = false;
                    }
                }

                if (handle.object.name === 'XZ') {
                    if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this._transformControls.eye)) < PLANE_HIDE_THRESHOLD) {
                        handle.object.scale.set(1e-10, 1e-10, 1e-10);
                        handle.object.visible = false;
                    }
                }
            }

            if (this._transformControls.enableRotation) {
                // Align handle.objects to current local or world rotation

                _tempQuaternion2.copy(quaternion);
                _alignVector.copy(this._transformControls.eye).applyQuaternion(_tempQuaternion.copy(quaternion).invert());

                if (handle.object.name.search('E') !== - 1) {
                    handle.object.quaternion.setFromRotationMatrix(_lookAtMatrix.lookAt(this._transformControls.eye, _zeroVector, _unitY));
                }

                if (handle.object.name === 'X') {
                    _tempQuaternion.setFromAxisAngle(_unitX, Math.atan2(- _alignVector.y, _alignVector.z));
                    _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
                    handle.object.quaternion.copy(_tempQuaternion);
                }

                if (handle.object.name === 'Y') {
                    _tempQuaternion.setFromAxisAngle(_unitY, Math.atan2(_alignVector.x, _alignVector.z));
                    _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
                    handle.object.quaternion.copy(_tempQuaternion);
                }

                if (handle.object.name === 'Z') {
                    _tempQuaternion.setFromAxisAngle(_unitZ, Math.atan2(_alignVector.y, _alignVector.x));
                    _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
                    handle.object.quaternion.copy(_tempQuaternion);
                }
            }

            // Hide disabled axes
            handle.object.visible = handle.object.visible && (handle.object.name.indexOf('X') === - 1 || this._transformControls.showX);
            handle.object.visible = handle.object.visible && (handle.object.name.indexOf('Y') === - 1 || this._transformControls.showY);
            handle.object.visible = handle.object.visible && (handle.object.name.indexOf('Z') === - 1 || this._transformControls.showZ);
            handle.object.visible = handle.object.visible && (handle.object.name.indexOf('E') === - 1 || (this._transformControls.showX && this._transformControls.showY && this._transformControls.showZ));

            // highlight selected axis
            if(!(handle.object.material instanceof MeshNormalMaterial)) {
                (handle.object.material as any)._color = (handle.object.material as any)._color || handle.object.material.color.clone();
                (handle.object.material as any)._opacity = (handle.object.material as any)._opacity || handle.object.material.opacity;
    
                handle.object.material.color.copy((handle.object.material as any)._color);
                handle.object.material.opacity = (handle.object.material as any)._opacity;
    
                if (this._transformControls.enabled && this._transformControls.axis && handle.mode === this._transformControls.mode) {
                    if (handle.object.name === this._transformControls.axis) {
                        handle.object.material.color.setHex(0xffff00);
                        handle.object.material.opacity = 1.0;
    
                    } else if (this._transformControls.axis.split('').some(function (a) {
                        return handle.object.name === a;
    
                    })) {
                        handle.object.material.color.setHex(0xffff00);
                        handle.object.material.opacity = 1.0;
                    }
                } else if(this._transformControls.enabled && this._transformControls.pivotDragged) {
                    handle.object.material.color.setHex(0xffff00);
                    handle.object.material.opacity = 1.0;
                }
            }
        }

        super.updateMatrixWorld(force);
    }

    // #endregion Public Methods (1)
}

//

class TransformControlsPlane extends Mesh {
    // #region Properties (2)

    public isTransformControlsPlane: true;
    public type: 'TransformControlsPlane';

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(readonly _transformControls: TransformControls) {
        super(
            new PlaneGeometry(100000, 100000, 2, 2),
            new MeshBasicMaterial({ visible: false, wireframe: true, side: DoubleSide, transparent: true, opacity: 0.1, toneMapped: false })
        );

        this.isTransformControlsPlane = true;

        this.type = 'TransformControlsPlane';
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public updateMatrixWorld(force: boolean) {
        const space = this._transformControls.space;

        this.position.copy(this._transformControls.worldPosition);

        _v1.copy(_unitX).applyQuaternion(space === 'local' ? this._transformControls.worldQuaternion : _identityQuaternion);
        _v2.copy(_unitY).applyQuaternion(space === 'local' ? this._transformControls.worldQuaternion : _identityQuaternion);
        _v3.copy(_unitZ).applyQuaternion(space === 'local' ? this._transformControls.worldQuaternion : _identityQuaternion);

        // Align the plane for current transform mode, axis and space.

        _alignVector.copy(_v2);

        if (this._transformControls.mode === TransformationType.TRANSLATION || this._transformControls.mode === TransformationType.SCALE) {
            switch (this._transformControls.axis) {
                case 'X':
                    _alignVector.copy(this._transformControls.eye).cross(_v1);
                    _dirVector.copy(_v1).cross(_alignVector);
                    break;
                case 'Y':
                    _alignVector.copy(this._transformControls.eye).cross(_v2);
                    _dirVector.copy(_v2).cross(_alignVector);
                    break;
                case 'Z':
                    _alignVector.copy(this._transformControls.eye).cross(_v3);
                    _dirVector.copy(_v3).cross(_alignVector);
                    break;
                case 'XY':
                    _dirVector.copy(_v3);
                    break;
                case 'YZ':
                    _dirVector.copy(_v1);
                    break;
                case 'XZ':
                    _alignVector.copy(_v3);
                    _dirVector.copy(_v2);
                    break;
                case 'XYZ':
                case 'E':
                    _dirVector.set(0, 0, 0);
                    break;
                default:
            }
        }

        if (this._transformControls.mode === TransformationType.ROTATION) {
            // special case for rotate
            _dirVector.set(0, 0, 0);
        }

        if (_dirVector.length() === 0) {
            // If in rotate mode, make the plane parallel to camera
            this.quaternion.copy(this._transformControls.cameraQuaternion);

        } else {
            _tempMatrix.lookAt(_tempVector.set(0, 0, 0), _dirVector, _alignVector);

            this.quaternion.setFromRotationMatrix(_tempMatrix);
        }

        super.updateMatrixWorld(force);
    }

    // #endregion Public Methods (1)
}

export { TransformControls, TransformControlsGizmo, TransformControlsPlane };