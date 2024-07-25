import {
    BoxGeometry,
    BufferGeometry,
    Camera,
    CylinderGeometry,
    DoubleSide,
    Euler,
    Float32BufferAttribute,
    Line,
    LineBasicMaterial,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    Object3DEventMap,
    OctahedronGeometry,
    OrthographicCamera,
    PerspectiveCamera,
    PlaneGeometry,
    Quaternion,
    Raycaster,
    SphereGeometry,
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

class TransformControls extends Object3D {
    // #region Properties (49)

    private _axis: string | null = null;
    private _camera: Camera;
    private _cameraPosition: Vector3 = new Vector3();
    private _cameraQuaternion: Quaternion = new Quaternion();
    private _cameraScale: Vector3;
    private _dragging: boolean = false;
    private _enabled: boolean = true;
    private _endNorm: Vector3;
    private _eye: Vector3 = new Vector3();
    private _getPointer: (event: any) => { x: number; y: number; button: any; };
    private _gizmo: TransformControlsGizmo;
    private _mode: string = 'translate';
    private _object: Object3D | undefined = undefined;
    private _offset: Vector3;
    private _onPointerDown: (event: any) => void;
    private _onPointerHover: (event: any) => void;
    private _onPointerMove: (event: any) => void;
    private _onPointerUp: (event: any) => void;
    private _parentPosition: Vector3;
    private _parentQuaternion: Quaternion;
    private _parentQuaternionInv: Quaternion = new Quaternion();
    private _parentScale: Vector3;
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
    private _space: string = 'world';
    private _startNorm: Vector3;
    private _translationSnap: number | null = null;
    private _updateCallback: (() => void) | undefined;
    private _worldPosition: Vector3 = new Vector3();
    private _worldPositionStart: Vector3 = new Vector3();
    private _worldQuaternion: Quaternion = new Quaternion();
    private _worldQuaternionInv: Quaternion;
    private _worldQuaternionStart: Quaternion = new Quaternion();
    private _worldScale: Vector3;
    private _worldScaleStart: Vector3;

    public domElement: HTMLElement;
    public isTransformControls: boolean;

    // #endregion Properties (49)

    // #region Constructors (1)

    constructor(camera: Camera, domElement?: HTMLElement, updateCallback?: () => void) {
        super();

        this._camera = camera;
        this._updateCallback = updateCallback;

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

        this._getPointer = this.getPointer.bind(this);
        this._onPointerDown = this.onPointerDown.bind(this);
        this._onPointerHover = this.onPointerHover.bind(this);
        this._onPointerMove = this.onPointerMove.bind(this);
        this._onPointerUp = this.onPointerUp.bind(this);

        this.domElement.addEventListener('pointerdown', this._onPointerDown);
        this.domElement.addEventListener('pointermove', this._onPointerHover);
        this.domElement.addEventListener('pointerup', this._onPointerUp);
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (39)

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
		this.dispatchEvent( { type: 'dragging-changed', value } as any );
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

    public get mode(): string {
        return this._mode;
    }

    public set mode(value: string) {
        this._mode = value;
    }

    public get object(): Object3D | undefined {
        return this._object;
    }

    public set object(value: Object3D | undefined) {
        this._object = value;
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

    // #endregion Public Getters And Setters (39)

    // #region Public Methods (23)

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
        this.domElement.removeEventListener('pointerdown', this._onPointerDown);
        this.domElement.removeEventListener('pointermove', this._onPointerHover);
        this.domElement.removeEventListener('pointermove', this._onPointerMove);
        this.domElement.removeEventListener('pointerup', this._onPointerUp);

        this.traverse(function (child) {
            if ((child as any).geometry) (child as any).geometry.dispose();
            if ((child as any).material) (child as any).material.dispose();

        });
    }

    // TODO: deprecate
    public getMode() {
        return this.mode;
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

        this.domElement.addEventListener('pointermove', this._onPointerMove);

        this.pointerHover(this._getPointer(event));
        this.pointerDown(this._getPointer(event));
    }

    public onPointerHover(event: PointerEvent) {
        if (!this.enabled) return;

        switch (event.pointerType) {
            case 'mouse':
            case 'pen':
                this.pointerHover(this._getPointer(event));
                break;
        }
    }

    public onPointerMove(event: PointerEvent) {
        if (!this.enabled) return;

        this.pointerMove(this._getPointer(event));
    }

    public onPointerUp(event: PointerEvent) {
        if (!this.enabled) return;

        this.domElement.releasePointerCapture(event.pointerId);

        this.domElement.removeEventListener('pointermove', this._onPointerMove);

        this.pointerUp(this._getPointer(event));
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

        const intersect = this.intersectObjectWithRay((this._gizmo.picker as { [key: string]: Object3D })[this.mode], _raycaster, false);

        if (intersect) {
            this.axis = intersect.object.name;

        } else {
            this.axis = null;
        }
    }

    public pointerMove(pointer: { x: number; y: number; button: any; }) {
        const axis = this.axis;
        const mode = this.mode;
        const object = this.object;
        let space = this.space;

        if (mode === 'scale') {
            space = 'local';

        } else if (axis === 'E' || axis === 'XYZE' || axis === 'XYZ') {
            space = 'world';
        }

        if (object === undefined || axis === null || this.dragging === false || (pointer !== null && pointer.button !== - 1)) return;

        if (pointer !== null) _raycaster.setFromCamera(pointer as unknown as Vector2, this.camera);

        const planeIntersect = this.intersectObjectWithRay(this._plane, _raycaster, true);

        if (!planeIntersect) return;

        this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart);

        if (mode === 'translate') {
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

        } else if (mode === 'scale') {
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

        } else if (mode === 'rotate') {
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

		if(this._updateCallback) this._updateCallback();
    }

    public pointerUp(pointer: { x: number, y: number, button: any }) {
        if (pointer !== null && pointer.button !== 0) return;

        // if (this.dragging && (this.axis !== null)) {
        //     _mouseUpEvent.mode = this.mode;
        // }

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

    public setMode(mode: string) {
        this.mode = mode;
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

    // #endregion Public Methods (23)
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

        const matInvisible = gizmoMaterial.clone();
        matInvisible.opacity = 0.15;

        const matHelper = gizmoLineMaterial.clone();
        matHelper.opacity = 0.5;

        const matRed = gizmoMaterial.clone();
        matRed.color.setHex(0xff0000);

        const matGreen = gizmoMaterial.clone();
        matGreen.color.setHex(0x00ff00);

        const matBlue = gizmoMaterial.clone();
        matBlue.color.setHex(0x0000ff);

        const matRedTransparent = gizmoMaterial.clone();
        matRedTransparent.color.setHex(0xff0000);
        matRedTransparent.opacity = 0.5;

        const matGreenTransparent = gizmoMaterial.clone();
        matGreenTransparent.color.setHex(0x00ff00);
        matGreenTransparent.opacity = 0.5;

        const matBlueTransparent = gizmoMaterial.clone();
        matBlueTransparent.color.setHex(0x0000ff);
        matBlueTransparent.opacity = 0.5;

        const matWhiteTransparent = gizmoMaterial.clone();
        matWhiteTransparent.opacity = 0.25;

        const matYellowTransparent = gizmoMaterial.clone();
        matYellowTransparent.color.setHex(0xffff00);
        matYellowTransparent.opacity = 0.25;

        const matYellow = gizmoMaterial.clone();
        matYellow.color.setHex(0xffff00);

        const matGray = gizmoMaterial.clone();
        matGray.color.setHex(0x787878);

        // reusable geometry

        const arrowGeometry = new CylinderGeometry(0, 0.04, 0.1, 12);
        arrowGeometry.translate(0, 0.05, 0);

        const scaleHandleGeometry = new BoxGeometry(0.08, 0.08, 0.08);
        scaleHandleGeometry.translate(0, 0.04, 0);

        const lineGeometry = new BufferGeometry();
        lineGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3));

        const lineGeometry2 = new CylinderGeometry(0.0075, 0.0075, 0.5, 3);
        lineGeometry2.translate(0, 0.25, 0);

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
                [new Mesh(arrowGeometry, matRed), [0.5, 0, 0], [0, 0, - Math.PI / 2]],
                [new Mesh(arrowGeometry, matRed), [- 0.5, 0, 0], [0, 0, Math.PI / 2]],
                [new Mesh(lineGeometry2, matRed), [0, 0, 0], [0, 0, - Math.PI / 2]]
            ],
            Y: [
                [new Mesh(arrowGeometry, matGreen), [0, 0.5, 0]],
                [new Mesh(arrowGeometry, matGreen), [0, - 0.5, 0], [Math.PI, 0, 0]],
                [new Mesh(lineGeometry2, matGreen)]
            ],
            Z: [
                [new Mesh(arrowGeometry, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
                [new Mesh(arrowGeometry, matBlue), [0, 0, - 0.5], [- Math.PI / 2, 0, 0]],
                [new Mesh(lineGeometry2, matBlue), null, [Math.PI / 2, 0, 0]]
            ],
            XYZ: [
                [new Mesh(new OctahedronGeometry(0.1, 0), matWhiteTransparent.clone()), [0, 0, 0]]
            ],
            XY: [
                [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matBlueTransparent.clone()), [0.15, 0.15, 0]]
            ],
            YZ: [
                [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matRedTransparent.clone()), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]
            ],
            XZ: [
                [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matGreenTransparent.clone()), [0.15, 0, 0.15], [- Math.PI / 2, 0, 0]]
            ]
        };

        const pickerTranslate: GizmoMap = {
            X: [
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0.3, 0, 0], [0, 0, - Math.PI / 2]],
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [- 0.3, 0, 0], [0, 0, Math.PI / 2]]
            ],
            Y: [
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0.3, 0]],
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, - 0.3, 0], [0, 0, Math.PI]]
            ],
            Z: [
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, - 0.3], [- Math.PI / 2, 0, 0]]
            ],
            XYZ: [
                [new Mesh(new OctahedronGeometry(0.2, 0), matInvisible)]
            ],
            XY: [
                [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0.15, 0]]
            ],
            YZ: [
                [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]
            ],
            XZ: [
                [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0, 0.15], [- Math.PI / 2, 0, 0]]
            ]
        };

        const helperTranslate: GizmoMap = {
            START: [
                [new Mesh(new OctahedronGeometry(0.01, 2), matHelper), null, null, null, 'helper']
            ],
            END: [
                [new Mesh(new OctahedronGeometry(0.01, 2), matHelper), null, null, null, 'helper']
            ],
            DELTA: [
                [new Line(TranslateHelperGeometry(), matHelper), null, null, null, 'helper']
            ],
            X: [
                [new Line(lineGeometry, matHelper.clone()), [- 1e3, 0, 0], null, [1e6, 1, 1], 'helper']
            ],
            Y: [
                [new Line(lineGeometry, matHelper.clone()), [0, - 1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']
            ],
            Z: [
                [new Line(lineGeometry, matHelper.clone()), [0, 0, - 1e3], [0, - Math.PI / 2, 0], [1e6, 1, 1], 'helper']
            ]
        };

        const gizmoRotate: GizmoMap = {
            XYZE: [
                [new Mesh(CircleGeometry(0.5, 1), matGray), null, [0, Math.PI / 2, 0]]
            ],
            X: [
                [new Mesh(CircleGeometry(0.5, 0.5), matRed)]
            ],
            Y: [
                [new Mesh(CircleGeometry(0.5, 0.5), matGreen), null, [0, 0, - Math.PI / 2]]
            ],
            Z: [
                [new Mesh(CircleGeometry(0.5, 0.5), matBlue), null, [0, Math.PI / 2, 0]]
            ],
            E: [
                [new Mesh(CircleGeometry(0.75, 1), matYellowTransparent), null, [0, Math.PI / 2, 0]]
            ]
        };

        const helperRotate: GizmoMap = {
            AXIS: [
                [new Line(lineGeometry, matHelper.clone()), [- 1e3, 0, 0], null, [1e6, 1, 1], 'helper']
            ]
        };

        const pickerRotate: GizmoMap = {
            XYZE: [
                [new Mesh(new SphereGeometry(0.25, 10, 8), matInvisible)]
            ],
            X: [
                [new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, - Math.PI / 2, - Math.PI / 2]],
            ],
            Y: [
                [new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]],
            ],
            Z: [
                [new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, 0, - Math.PI / 2]],
            ],
            E: [
                [new Mesh(new TorusGeometry(0.75, 0.1, 2, 24), matInvisible)]
            ]
        };

        const gizmoScale: GizmoMap = {
            X: [
                [new Mesh(scaleHandleGeometry, matRed), [0.5, 0, 0], [0, 0, - Math.PI / 2]],
                [new Mesh(lineGeometry2, matRed), [0, 0, 0], [0, 0, - Math.PI / 2]],
                [new Mesh(scaleHandleGeometry, matRed), [- 0.5, 0, 0], [0, 0, Math.PI / 2]],
            ],
            Y: [
                [new Mesh(scaleHandleGeometry, matGreen), [0, 0.5, 0]],
                [new Mesh(lineGeometry2, matGreen)],
                [new Mesh(scaleHandleGeometry, matGreen), [0, - 0.5, 0], [0, 0, Math.PI]],
            ],
            Z: [
                [new Mesh(scaleHandleGeometry, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
                [new Mesh(lineGeometry2, matBlue), [0, 0, 0], [Math.PI / 2, 0, 0]],
                [new Mesh(scaleHandleGeometry, matBlue), [0, 0, - 0.5], [- Math.PI / 2, 0, 0]]
            ],
            XY: [
                [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matBlueTransparent), [0.15, 0.15, 0]]
            ],
            YZ: [
                [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matRedTransparent), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]
            ],
            XZ: [
                [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matGreenTransparent), [0.15, 0, 0.15], [- Math.PI / 2, 0, 0]]
            ],
            XYZ: [
                [new Mesh(new BoxGeometry(0.1, 0.1, 0.1), matWhiteTransparent.clone())],
            ]
        };

        const pickerScale: GizmoMap = {
            X: [
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0.3, 0, 0], [0, 0, - Math.PI / 2]],
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [- 0.3, 0, 0], [0, 0, Math.PI / 2]]
            ],
            Y: [
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0.3, 0]],
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, - 0.3, 0], [0, 0, Math.PI]]
            ],
            Z: [
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
                [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, - 0.3], [- Math.PI / 2, 0, 0]]
            ],
            XY: [
                [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0.15, 0]],
            ],
            YZ: [
                [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]],
            ],
            XZ: [
                [new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0, 0.15], [- Math.PI / 2, 0, 0]],
            ],
            XYZ: [
                [new Mesh(new BoxGeometry(0.2, 0.2, 0.2), matInvisible), [0, 0, 0]],
            ]
        };

        const helperScale: GizmoMap = {
            X: [
                [new Line(lineGeometry, matHelper.clone()), [- 1e3, 0, 0], null, [1e6, 1, 1], 'helper']
            ],
            Y: [
                [new Line(lineGeometry, matHelper.clone()), [0, - 1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']
            ],
            Z: [
                [new Line(lineGeometry, matHelper.clone()), [0, 0, - 1e3], [0, - Math.PI / 2, 0], [1e6, 1, 1], 'helper']
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

        this.add(this.gizmo['translate']);
        this.add(this.gizmo['rotate']);
        this.add(this.gizmo['scale']);
        this.add(this.picker['translate']);
        this.add(this.picker['rotate']);
        this.add(this.picker['scale']);
        this.add(this.helper['translate']);
        this.add(this.helper['rotate']);
        this.add(this.helper['scale']);

        // Pickers should be hidden always

        this.picker['translate'].visible = false;
        this.picker['rotate'].visible = false;
        this.picker['scale'].visible = false;
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    // updateMatrixWorld will update transformations and appearance of individual handles
    public updateMatrixWorld(force: boolean) {
        const space = (this._transformControls.mode === 'scale') ? 'local' : this._transformControls.space; // scale always oriented to local rotation

        let quaternion = new Quaternion();
        if (space === 'local') {
            this.getWorldQuaternion(quaternion);
        } else {
            quaternion = _identityQuaternion;
        }

        // Show only gizmos for current transform mode

        this.gizmo['translate'].visible = this._transformControls.mode === 'translate';
        this.gizmo['rotate'].visible = this._transformControls.mode === 'rotate';
        this.gizmo['scale'].visible = this._transformControls.mode === 'scale';

        this.helper['translate'].visible = this._transformControls.mode === 'translate';
        this.helper['rotate'].visible = this._transformControls.mode === 'rotate';
        this.helper['scale'].visible = this._transformControls.mode === 'scale';

        let handles: Object3D[] = [];
        handles = handles.concat((this.picker as { [key: string]: Object3D })[this._transformControls.mode].children);
        handles = handles.concat((this.gizmo as { [key: string]: Object3D })[this._transformControls.mode].children);
        handles = handles.concat((this.helper as { [key: string]: Object3D })[this._transformControls.mode].children);

        for (let i = 0; i < handles.length; i++) {
            const handle = handles[i] as Mesh<BufferGeometry, MeshBasicMaterial> | Line<BufferGeometry, LineBasicMaterial>;

            // hide aligned to camera

            handle.visible = true;
            handle.rotation.set(0, 0, 0);
            handle.position.copy(this._transformControls.worldPosition);

            let factor;

            if ((this._transformControls.camera as OrthographicCamera).isOrthographicCamera) {
                factor = ((this._transformControls.camera as OrthographicCamera).top - (this._transformControls.camera as OrthographicCamera).bottom) / (this._transformControls.camera as OrthographicCamera).zoom;

            } else {
                factor = this._transformControls.worldPosition.distanceTo(this._transformControls.cameraPosition) * Math.min(1.9 * Math.tan(Math.PI * (this._transformControls.camera as PerspectiveCamera).fov / 360) / (this._transformControls.camera as PerspectiveCamera).zoom, 7);
            }

            handle.scale.set(1, 1, 1).multiplyScalar(factor * this._transformControls.size / 4);

            // TODO: simplify helpers and consider decoupling from gizmo

            if ((handle as any).tag === 'helper') {
                handle.visible = false;

                if (handle.name === 'AXIS') {
                    handle.visible = !!this._transformControls.axis;

                    if (this._transformControls.axis === 'X') {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, 0, 0));
                        handle.quaternion.copy(quaternion).multiply(_tempQuaternion);

                        if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this._transformControls.eye)) > 0.9) {
                            handle.visible = false;
                        }
                    }

                    if (this._transformControls.axis === 'Y') {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, 0, Math.PI / 2));
                        handle.quaternion.copy(quaternion).multiply(_tempQuaternion);

                        if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this._transformControls.eye)) > 0.9) {
                            handle.visible = false;
                        }
                    }

                    if (this._transformControls.axis === 'Z') {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, Math.PI / 2, 0));
                        handle.quaternion.copy(quaternion).multiply(_tempQuaternion);

                        if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this._transformControls.eye)) > 0.9) {
                            handle.visible = false;
                        }
                    }

                    if (this._transformControls.axis === 'XYZE') {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, Math.PI / 2, 0));
                        _alignVector.copy(this._transformControls.rotationAxis);
                        handle.quaternion.setFromRotationMatrix(_lookAtMatrix.lookAt(_zeroVector, _alignVector, _unitY));
                        handle.quaternion.multiply(_tempQuaternion);
                        handle.visible = this._transformControls.dragging;
                    }

                    if (this._transformControls.axis === 'E') {
                        handle.visible = false;
                    }

                } else if (handle.name === 'START') {
                    handle.position.copy(this._transformControls.worldPositionStart);
                    handle.visible = this._transformControls.dragging;

                } else if (handle.name === 'END') {
                    handle.position.copy(this._transformControls.worldPosition);
                    handle.visible = this._transformControls.dragging;

                } else if (handle.name === 'DELTA') {
                    handle.position.copy(this._transformControls.worldPositionStart);
                    handle.quaternion.copy(this._transformControls.worldQuaternionStart);
                    _tempVector.set(1e-10, 1e-10, 1e-10).add(this._transformControls.worldPositionStart).sub(this._transformControls.worldPosition).multiplyScalar(- 1);
                    _tempVector.applyQuaternion(this._transformControls.worldQuaternionStart.clone().invert());
                    handle.scale.copy(_tempVector);
                    handle.visible = this._transformControls.dragging;

                } else {
                    handle.quaternion.copy(quaternion);

                    if (this._transformControls.dragging) {
                        handle.position.copy(this._transformControls.worldPositionStart);

                    } else {
                        handle.position.copy(this._transformControls.worldPosition);
                    }

                    if (this._transformControls.axis) {
                        handle.visible = this._transformControls.axis.search(handle.name) !== - 1;
                    }
                }

                // If updating helper, skip rest of the loop
                continue;
            }

            // Align handles to current local or world rotation

            handle.quaternion.copy(quaternion);

            if (this._transformControls.mode === 'translate' || this._transformControls.mode === 'scale') {
                // Hide translate and scale axis facing the camera

                const AXIS_HIDE_THRESHOLD = 0.99;
                const PLANE_HIDE_THRESHOLD = 0.2;

                if (handle.name === 'X') {
                    if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this._transformControls.eye)) > AXIS_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    }
                }

                if (handle.name === 'Y') {
                    if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this._transformControls.eye)) > AXIS_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    }
                }

                if (handle.name === 'Z') {
                    if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this._transformControls.eye)) > AXIS_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    }
                }

                if (handle.name === 'XY') {
                    if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this._transformControls.eye)) < PLANE_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    }
                }

                if (handle.name === 'YZ') {
                    if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this._transformControls.eye)) < PLANE_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    }
                }

                if (handle.name === 'XZ') {
                    if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this._transformControls.eye)) < PLANE_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    }
                }

            } else if (this._transformControls.mode === 'rotate') {
                // Align handles to current local or world rotation

                _tempQuaternion2.copy(quaternion);
                _alignVector.copy(this._transformControls.eye).applyQuaternion(_tempQuaternion.copy(quaternion).invert());

                if (handle.name.search('E') !== - 1) {
                    handle.quaternion.setFromRotationMatrix(_lookAtMatrix.lookAt(this._transformControls.eye, _zeroVector, _unitY));
                }

                if (handle.name === 'X') {
                    _tempQuaternion.setFromAxisAngle(_unitX, Math.atan2(- _alignVector.y, _alignVector.z));
                    _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
                    handle.quaternion.copy(_tempQuaternion);
                }

                if (handle.name === 'Y') {
                    _tempQuaternion.setFromAxisAngle(_unitY, Math.atan2(_alignVector.x, _alignVector.z));
                    _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
                    handle.quaternion.copy(_tempQuaternion);
                }

                if (handle.name === 'Z') {
                    _tempQuaternion.setFromAxisAngle(_unitZ, Math.atan2(_alignVector.y, _alignVector.x));
                    _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
                    handle.quaternion.copy(_tempQuaternion);
                }
            }

            // Hide disabled axes
            handle.visible = handle.visible && (handle.name.indexOf('X') === - 1 || this._transformControls.showX);
            handle.visible = handle.visible && (handle.name.indexOf('Y') === - 1 || this._transformControls.showY);
            handle.visible = handle.visible && (handle.name.indexOf('Z') === - 1 || this._transformControls.showZ);
            handle.visible = handle.visible && (handle.name.indexOf('E') === - 1 || (this._transformControls.showX && this._transformControls.showY && this._transformControls.showZ));

            // highlight selected axis

            (handle.material as any)._color = (handle.material as any)._color || handle.material.color.clone();
            (handle.material as any)._opacity = (handle.material as any)._opacity || handle.material.opacity;

            handle.material.color.copy((handle.material as any)._color);
            handle.material.opacity = (handle.material as any)._opacity;

            if (this._transformControls.enabled && this._transformControls.axis) {
                if (handle.name === this._transformControls.axis) {
                    handle.material.color.setHex(0xffff00);
                    handle.material.opacity = 1.0;

                } else if (this._transformControls.axis.split('').some(function (a) {
                    return handle.name === a;

                })) {
                    handle.material.color.setHex(0xffff00);
                    handle.material.opacity = 1.0;
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
        let space = this._transformControls.space;

        this.position.copy(this._transformControls.worldPosition);

        if (this._transformControls.mode === 'scale') space = 'local'; // scale always oriented to local rotation

        _v1.copy(_unitX).applyQuaternion(space === 'local' ? this._transformControls.worldQuaternion : _identityQuaternion);
        _v2.copy(_unitY).applyQuaternion(space === 'local' ? this._transformControls.worldQuaternion : _identityQuaternion);
        _v3.copy(_unitZ).applyQuaternion(space === 'local' ? this._transformControls.worldQuaternion : _identityQuaternion);

        // Align the plane for current transform mode, axis and space.

        _alignVector.copy(_v2);

        switch (this._transformControls.mode) {
            case 'translate':
            case 'scale':
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

                break;
            case 'rotate':
            default:
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