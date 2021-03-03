import { mat4, vec2, vec3 } from 'gl-matrix';
import * as THREE from 'three';
import { container } from 'tsyringe';

import { SettingsEngine } from '@shapediver/viewer.shared.services';

import { ICameraControls } from '../../interface/ICameraControls';

export class CameraControlsLogic {
    // #region Properties (16)

    private _adjustedSettings = {
        autoRotationSpeed: () => this._settings.autoRotationSpeed.value * this._settingsAdjustments.autoRotationSpeed,
        damping: () => this._settings.damping.value * this._settingsAdjustments.damping,
        movementSmoothness: () => this._settings.movementSmoothness.value * this._settingsAdjustments.movementSmoothness,
        panSpeed: () => this._settings.panSpeed.value * this._settingsAdjustments.panSpeed,
        rotationSpeed: () => this._settings.rotationSpeed.value * this._settingsAdjustments.rotationSpeed,
        zoomSpeed: () => this._settings.zoomSpeed.value * this._settingsAdjustments.zoomSpeed,
    };
    private _settings = (<SettingsEngine>container.resolve(SettingsEngine)).cameraOrbitControls;
    private _damping: any = {
        rotation: {
            time: 0,
            duration: 0,
            theta: 0,
            phi: 0
        },
        zoom: {
            time: 0,
            duration: 0,
            delta: 0
        },
        pan: {
            time: 0,
            duration: 0,
            offset: new THREE.Vector3()
        },
    };
    private _dollyDelta = 0;
    private _dollyEnd = 0;
    private _dollyStart = 0;
    private _panDelta = new THREE.Vector2();
    private _panEnd = new THREE.Vector2();
    private _panStart = new THREE.Vector2();
    private _quat: THREE.Quaternion;
    private _quatInverse: THREE.Quaternion;
    private _rotateDelta = new THREE.Vector2();
    private _rotateEnd = new THREE.Vector2();
    private _rotateStart = new THREE.Vector2();
    private _settingsAdjustments = {
        autoRotationSpeed: 2 * Math.PI / 60 / 60,
        damping: 1.0,
        movementSmoothness: 1.0,
        panSpeed: 2.0,
        rotationSpeed: Math.PI,
        zoomSpeed: 0.025,
    };
    private _touchAdjustements = {
        autoRotationSpeed: 1.0,
        damping: 1.0,
        movementSmoothness: 1.0,
        panSpeed: 1.5,
        rotationSpeed: 2.0,
        zoomSpeed: 100.0,
    };

    // #endregion Properties (16)

    // #region Constructors (1)

    constructor(private readonly _controls: ICameraControls) {
        this._quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0));
        this._quatInverse = this._quat.clone().inverse();
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    public isWithinRestrictions(position: any, target: any): boolean {
        let pCubeSetting = {
            min: this.convertGlVectorToThreeVector(this._settings.restrictions.position.cube.value.min),
            max: this.convertGlVectorToThreeVector(this._settings.restrictions.position.cube.value.max),
        },
        pSphereSetting = {
            center: this.convertGlVectorToThreeVector(this._settings.restrictions.position.sphere.value.center),
            radius: this._settings.restrictions.position.sphere.value.radius,
        };
        let pBox = new THREE.Box3(new THREE.Vector3(pCubeSetting.min.x, pCubeSetting.min.y, pCubeSetting.min.z), new THREE.Vector3(pCubeSetting.max.x, pCubeSetting.max.y, pCubeSetting.max.z)),
            pSphere = new THREE.Sphere(new THREE.Vector3(pSphereSetting.center.x, pSphereSetting.center.y, pSphereSetting.center.z), pSphereSetting.radius);

        let tCubeSetting = {
            min: this.convertGlVectorToThreeVector(this._settings.restrictions.target.cube.value.min),
            max: this.convertGlVectorToThreeVector(this._settings.restrictions.target.cube.value.max),
        },
        tSphereSetting = {
            center: this.convertGlVectorToThreeVector(this._settings.restrictions.target.sphere.value.center),
            radius: this._settings.restrictions.target.sphere.value.radius,
        };
        let tBox = new THREE.Box3(new THREE.Vector3(tCubeSetting.min.x, tCubeSetting.min.y, tCubeSetting.min.z), new THREE.Vector3(tCubeSetting.max.x, tCubeSetting.max.y, tCubeSetting.max.z)),
            tSphere = new THREE.Sphere(new THREE.Vector3(tSphereSetting.center.x, tSphereSetting.center.y, tSphereSetting.center.z), tSphereSetting.radius);

        if (!(pBox.containsPoint(position) && pSphere.containsPoint(position))) return false;
        if (!(tBox.containsPoint(target) && tSphere.containsPoint(target))) return false;

        let currentDistance = position.distanceTo(target);
        if (currentDistance > this._settings.restrictions.zoom.value.maxDistance || currentDistance < this._settings.restrictions.zoom.value.minDistance) return false;

        let minPolarAngle = this._settings.restrictions.rotation.value.minPolarAngle * (Math.PI / 180),
            maxPolarAngle = this._settings.restrictions.rotation.value.maxPolarAngle * (Math.PI / 180),
            minAzimuthAngle = this._settings.restrictions.rotation.value.minAzimuthAngle * (Math.PI / 180),
            maxAzimuthAngle = this._settings.restrictions.rotation.value.maxAzimuthAngle * (Math.PI / 180);

        if (minAzimuthAngle !== -Infinity ||
            maxAzimuthAngle !== Infinity ||
            minPolarAngle !== 0 ||
            maxPolarAngle !== 180) {
            let offset = new THREE.Vector3();
            offset.copy(position).sub(target);
            offset.applyQuaternion(this._quat);
            let spherical = new THREE.Spherical().setFromVector3(offset);
            if (spherical.theta < minAzimuthAngle ||
                spherical.theta > maxAzimuthAngle ||
                spherical.phi < minPolarAngle ||
                spherical.phi > maxPolarAngle) {
                return false;
            }
        }

        return true;
    }

    public pan(x: any, y: any, active: boolean, touch: boolean): void {
        if (touch) {
            x = x / window.devicePixelRatio;
            y = y / window.devicePixelRatio;
        }

        if (!active) {
            this._panStart.set(x, y);
        } else {
            this._panEnd.set(x, y);
            this._panDelta.subVectors(this._panEnd, this._panStart);
            if (this._panDelta.x === 0 && this._panDelta.y === 0) return;
            this._panStart.copy(this._panEnd);

            let offset = this.panDeltaToOffset(this._panDelta.multiplyScalar(this._adjustedSettings.panSpeed() * (touch ? this._touchAdjustements.panSpeed : 1.0)));

            if (this._damping.pan.duration > 0) {
                if (offset.x < 0) {
                    offset.x = Math.min(offset.x, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.x);
                } else {
                    offset.x = Math.max(offset.x, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.x);
                }
                if (offset.y < 0) {
                    offset.y = Math.min(offset.y, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.y);
                } else {
                    offset.y = Math.max(offset.y, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.y);
                }
                if (offset.z < 0) {
                    offset.z = Math.min(offset.z, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.z);
                } else {
                    offset.z = Math.max(offset.z, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.z);
                }
            }

            let damping = 1 - Math.max(0.01, Math.min(0.99, this._adjustedSettings.damping()));

            let framesOffsetX = (Math.log(1 / Math.abs(offset.x)) - 5 * Math.log(10)) / (Math.log(damping));
            let framesOffsetY = (Math.log(1 / Math.abs(offset.y)) - 5 * Math.log(10)) / (Math.log(damping));
            let framesOffsetZ = (Math.log(1 / Math.abs(offset.z)) - 5 * Math.log(10)) / (Math.log(damping));
            this._damping.pan.time = 0;
            this._damping.pan.duration = Math.max(framesOffsetX, Math.max(framesOffsetY, framesOffsetZ)) * 16.6666;
            this._damping.pan.offset = offset.clone();

            this._damping.rotation.duration = 0;
            this._damping.zoom.duration = 0;

            this._controls.applyTargetMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)), true);
            this._controls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)), true);
        }
    }

    public reset() {
        this._damping = {
            rotation: {
                time: 0,
                duration: 0,
                theta: 0,
                phi: 0
            },
            zoom: {
                time: 0,
                duration: 0,
                delta: 0
            },
            pan: {
                time: 0,
                duration: 0,
                offset: new THREE.Vector3()
            },
        };
        this._dollyDelta = 0;
        this._dollyEnd = 0;
        this._dollyStart = 0;
        this._panDelta = new THREE.Vector2();
        this._panEnd = new THREE.Vector2();
        this._panStart = new THREE.Vector2();
        this._rotateDelta = new THREE.Vector2();
        this._rotateEnd = new THREE.Vector2();
        this._rotateStart = new THREE.Vector2();
    }

    public restrict(p: vec3, t: vec3): { position: vec3, target: vec3 } {
        let position = this.convertGlVectorToThreeVector(p);
        let target = this.convertGlVectorToThreeVector(t);

        // cube and sphere position restrictions
        let pCubeSetting = {
            min: this.convertGlVectorToThreeVector(this._settings.restrictions.position.cube.value.min),
            max: this.convertGlVectorToThreeVector(this._settings.restrictions.position.cube.value.max),
        },
        pSphereSetting = {
            center: this.convertGlVectorToThreeVector(this._settings.restrictions.position.sphere.value.center),
            radius: this._settings.restrictions.position.sphere.value.radius,
        };
        let pBox = new THREE.Box3(new THREE.Vector3(pCubeSetting.min.x, pCubeSetting.min.y, pCubeSetting.min.z), new THREE.Vector3(pCubeSetting.max.x, pCubeSetting.max.y, pCubeSetting.max.z)),
            pSphere = new THREE.Sphere(new THREE.Vector3(pSphereSetting.center.x, pSphereSetting.center.y, pSphereSetting.center.z), pSphereSetting.radius);

        if (!pBox.containsPoint(position))
            pBox.clampPoint(position, position);

        if (!pSphere.containsPoint(position))
            pSphere.clampPoint(position, position);

        // cube and sphere target restrictions
        let tCubeSetting = {
            min: this.convertGlVectorToThreeVector(this._settings.restrictions.target.cube.value.min),
            max: this.convertGlVectorToThreeVector(this._settings.restrictions.target.cube.value.max),
        },
        tSphereSetting = {
            center: this.convertGlVectorToThreeVector(this._settings.restrictions.target.sphere.value.center),
            radius: this._settings.restrictions.target.sphere.value.radius,
        };
        let tBox = new THREE.Box3(new THREE.Vector3(tCubeSetting.min.x, tCubeSetting.min.y, tCubeSetting.min.z), new THREE.Vector3(tCubeSetting.max.x, tCubeSetting.max.y, tCubeSetting.max.z)),
            tSphere = new THREE.Sphere(new THREE.Vector3(tSphereSetting.center.x, tSphereSetting.center.y, tSphereSetting.center.z), tSphereSetting.radius);

        if (!tBox.containsPoint(target))
            tBox.clampPoint(target, target);

        if (!tSphere.containsPoint(target))
            tSphere.clampPoint(target, target);

        // zoom restrictions
        let currentDistance = position.distanceTo(target);
        if (currentDistance > this._settings.restrictions.zoom.value.maxDistance || currentDistance < this._settings.restrictions.zoom.value.minDistance) {
            let direction = new THREE.Vector3();
            direction.copy(position).sub(target).normalize();
            let distance = Math.max(this._settings.restrictions.zoom.value.minDistance, Math.min(this._settings.restrictions.zoom.value.maxDistance, currentDistance));
            position = target.clone().add(direction.multiplyScalar(distance));
        }

        // angle restrictions
        let minPolarAngle = this._settings.restrictions.rotation.value.minPolarAngle * (Math.PI / 180),
            maxPolarAngle = this._settings.restrictions.rotation.value.maxPolarAngle * (Math.PI / 180),
            minAzimuthAngle = this._settings.restrictions.rotation.value.minAzimuthAngle * (Math.PI / 180),
            maxAzimuthAngle = this._settings.restrictions.rotation.value.maxAzimuthAngle * (Math.PI / 180);

        if (minAzimuthAngle !== -Infinity ||
            maxAzimuthAngle !== Infinity ||
            minPolarAngle !== 0 ||
            maxPolarAngle !== 180) {
            let offset = new THREE.Vector3();
            offset.copy(position).sub(target);
            offset.applyQuaternion(this._quat);
            let spherical = new THREE.Spherical().setFromVector3(offset);
            if (spherical.theta < minAzimuthAngle ||
                spherical.theta > maxAzimuthAngle ||
                spherical.phi < minPolarAngle ||
                spherical.phi > maxPolarAngle) {
                spherical.theta = Math.max(minAzimuthAngle, Math.min(maxAzimuthAngle, spherical.theta));
                spherical.phi = Math.max(minPolarAngle, Math.min(maxPolarAngle, spherical.phi));
                spherical.makeSafe();

                offset.setFromSpherical(spherical);
                offset.applyQuaternion(this._quatInverse);
                position = offset.add(target);
            }
        }

        return {
            position: this.convertThreeVectorToGlVector(position),
            target: this.convertThreeVectorToGlVector(target)
        }
    }

    public rotate(x: any, y: any, active: boolean, touch: boolean): void {
        if (touch) {
            x = x / window.devicePixelRatio;
            y = y / window.devicePixelRatio;
        }

        if (!active) {
            this._rotateStart.set(x, y);
        } else {
            this._rotateEnd.set(x, y);
            this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart);
            this._rotateStart.copy(this._rotateEnd);

            if (this._controls.canvas.clientWidth == 0 || this._controls.canvas.clientHeight == 0) return;

            let spherical = new THREE.Spherical();
            let rotationSpeed = this._adjustedSettings.rotationSpeed() * (touch ? this._touchAdjustements.rotationSpeed : 1.0);
            spherical.theta -= rotationSpeed * this._rotateDelta.x;
            spherical.phi -= rotationSpeed * this._rotateDelta.y;

            if (this._damping.rotation.duration > 0) {
                let thetaDelta = this._damping.rotation.theta - spherical.theta;
                spherical.theta += thetaDelta * this._adjustedSettings.movementSmoothness();

                let phiDelta = this._damping.rotation.phi - spherical.phi;
                spherical.phi += phiDelta * this._adjustedSettings.movementSmoothness();
            }

            let offset = this.rotationSphericalToOffset(spherical);

            let damping = 1 - Math.max(0.01, Math.min(1, this._adjustedSettings.damping()));
            let framesTheta = (Math.log(1 / Math.abs(spherical.theta)) - 5 * Math.log(10)) / (Math.log(damping));
            let framesPhi = (Math.log(1 / Math.abs(spherical.phi)) - 5 * Math.log(10)) / (Math.log(damping));

            this._damping.rotation.time = 0;
            this._damping.rotation.duration = Math.max(framesTheta, framesPhi) * 16.6666;
            this._damping.rotation.theta = spherical.theta;
            this._damping.rotation.phi = spherical.phi;

            this._damping.pan.duration = 0;
            this._damping.zoom.duration = 0;

            this._controls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)), true);
        }
    }

    public update(time: number, manualInteraction: boolean): void {
        if (manualInteraction === true) {
            this._damping.zoom.duration = 0;
            this._damping.pan.duration = 0;
            this._damping.rotation.duration = 0;
        }

        let damping = 1 - Math.max(0.01, Math.min(1, this._adjustedSettings.damping()));

        if (this._damping.pan.duration > 0) {
            if (this._damping.pan.time + time > this._damping.pan.duration) {
                this._damping.pan.time = this._damping.pan.duration;
                this._damping.pan.duration = 0;
            } else {
                this._damping.pan.time += time;

                let frameSinceStart = this._damping.pan.time / 16.6666;
                let offset = this._damping.pan.offset.clone().multiplyScalar(Math.pow(damping, frameSinceStart));
                this._controls.applyTargetMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)));
                this._controls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)));
            }
        } else {
            this._damping.pan.time = 0;
        }

        if (this._damping.rotation.duration > 0) {
            if (this._damping.rotation.time + time > this._damping.rotation.duration) {
                this._damping.rotation.time = this._damping.rotation.duration;
                this._damping.rotation.duration = 0;
            } else {
                this._damping.rotation.time += time;

                let frameSinceStart = this._damping.rotation.time / 16.6666;
                let spherical = new THREE.Spherical();
                spherical.theta = this._damping.rotation.theta * Math.pow(damping, frameSinceStart);
                spherical.phi = this._damping.rotation.phi * Math.pow(damping, frameSinceStart);
                let offset = this.rotationSphericalToOffset(spherical);
                this._controls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)));
            }
        } else {
            this._damping.rotation.time = 0;
        }

        if (this._damping.zoom.duration > 0) {
            if (this._damping.zoom.time + time > this._damping.zoom.duration) {
                this._damping.zoom.time = this._damping.zoom.duration;
                this._damping.zoom.duration = 0;
            } else {
                this._damping.zoom.time += time;

                let frameSinceStart = this._damping.zoom.time / 16.6666;
                let delta = this._damping.zoom.delta * Math.pow(damping, frameSinceStart);
                let offset = this.zoomDistanceToOffset(delta);
                this._controls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)));
            }
        } else {
            this._damping.zoom.time = 0;
        }

        if (this._settings.enableAutoRotation.value) {
            let spherical = new THREE.Spherical(1.0, 0.0, -this._adjustedSettings.autoRotationSpeed());
            let offset = this.rotationSphericalToOffset(spherical);
            this._controls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)));
        }
    }

    public zoom(x: any, y: any, active: boolean, touch: boolean): void {
        var distance = Math.sqrt(x * x + y * y);

        if (touch)
            distance = distance / window.devicePixelRatio;

        if (!active) {
            this._dollyStart = distance;
        } else {
            this._dollyEnd = distance;
            this._dollyDelta = this._dollyEnd - this._dollyStart;
            this._dollyStart = this._dollyEnd;

            if (this._damping.zoom.duration > 0) {
                if (this._dollyDelta < 0) {
                    this._dollyDelta = Math.min(this._dollyDelta, this._adjustedSettings.movementSmoothness() * this._damping.zoom.delta);
                } else {
                    this._dollyDelta = Math.max(this._dollyDelta, this._adjustedSettings.movementSmoothness() * this._damping.zoom.delta);
                }
            }

            let delta = - this._dollyDelta * this._adjustedSettings.zoomSpeed() * (touch ? this._touchAdjustements.zoomSpeed : 1.0);

            let damping = 1 - Math.max(0.01, Math.min(1, this._adjustedSettings.damping()));
            let framesDelta = (Math.log(1 / Math.abs(this._dollyDelta)) - 5 * Math.log(10)) / (Math.log(damping));
            this._damping.zoom.time = 0;
            this._damping.zoom.duration = framesDelta * 16.6666;
            this._damping.zoom.delta = delta;

            this._damping.rotation.duration = 0;
            this._damping.pan.duration = 0;

            let offset = this.zoomDistanceToOffset(delta);
            this._controls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)), true);
        }
    }

    // #endregion Public Methods (7)

    // #region Private Methods (7)

    private convertGlMatrixToThreeMatrix(matrix: mat4): THREE.Matrix4 {
        return new THREE.Matrix4().fromArray(matrix);
    }

    private convertGlVectorToThreeVector(vec: vec3): THREE.Vector3 {
        return new THREE.Vector3(vec[0], vec[1], vec[2]);
    }

    private convertThreeMatrixToGlMatrix(matrix: THREE.Matrix4): mat4 {
        return mat4.fromValues( matrix.toArray()[0], matrix.toArray()[1], matrix.toArray()[2], matrix.toArray()[3],
                                matrix.toArray()[4], matrix.toArray()[5], matrix.toArray()[6], matrix.toArray()[7],
                                matrix.toArray()[8], matrix.toArray()[9], matrix.toArray()[10], matrix.toArray()[11],
                                matrix.toArray()[12], matrix.toArray()[13], matrix.toArray()[14], matrix.toArray()[15]);
    }

    private convertThreeVectorToGlVector(vec: THREE.Vector3): vec3 {
        return vec3.fromValues(vec.x, vec.y, vec.z);
    }

    private panDeltaToOffset(panDelta: THREE.Vector2): THREE.Vector3 {
        let offset = new THREE.Vector3();
        let panOffset = new THREE.Vector3();

        // perspective
        offset.copy(this.convertGlVectorToThreeVector(this._controls.getPositionWithManualUpdates())).sub(this.convertGlVectorToThreeVector(this._controls.getTargetWithManualUpdates()));
        var targetDistance = offset.length();

        // // half of the fov is center to top of screen
        // targetDistance *= Math.tan(((this._controls.camera.fov / 2) * Math.PI) / 180.0);

        // // we use only clientHeight here so aspect ratio does not distort speed
        // // left
        // let v1 = new THREE.Vector3();
        // v1.setFromMatrixColumn(this._controls.camera.matrix, 0); // get X column of objectMatrix
        // v1.multiplyScalar(-(2 * panDelta.x * targetDistance));
        // panOffset.add(v1);

        // // up
        // let v = new THREE.Vector3();
        // v.setFromMatrixColumn(this._controls.camera.matrix, 1); // get Y column of objectMatrix
        // v.multiplyScalar((2 * panDelta.y * targetDistance));
        // panOffset.add(v);

        return panOffset.clone();
    }

    private rotationSphericalToOffset(s: THREE.Spherical): THREE.Vector3 {
        let offset = new THREE.Vector3();
        offset.copy(this.convertGlVectorToThreeVector(this._controls.getPositionWithManualUpdates())).sub(this.convertGlVectorToThreeVector(this._controls.getTargetWithManualUpdates()));
        offset.applyQuaternion(this._quat);
        let spherical = new THREE.Spherical().setFromVector3(offset);

        spherical.theta += s.theta;
        spherical.phi += s.phi;

        let minAzimuthAngle = this._settings.restrictions.rotation.value.minAzimuthAngle * (Math.PI / 180),
            maxAzimuthAngle = this._settings.restrictions.rotation.value.maxAzimuthAngle * (Math.PI / 180);

        if (spherical.theta > Math.PI) {
            spherical.theta -= 2 * Math.PI;
            if (minAzimuthAngle > spherical.theta) {
                spherical.theta += 2 * Math.PI;
            }
        } else if (spherical.theta < -Math.PI) {
            spherical.theta += 2 * Math.PI;
            if (maxAzimuthAngle < spherical.theta) {
                spherical.theta -= 2 * Math.PI;
            }
        }

        spherical.makeSafe();
        offset.setFromSpherical(spherical);
        offset.applyQuaternion(this._quatInverse);
        offset.add(this.convertGlVectorToThreeVector(this._controls.getTargetWithManualUpdates()));
        offset.sub(this.convertGlVectorToThreeVector(this._controls.getPositionWithManualUpdates()));
        return offset.clone();
    }

    private zoomDistanceToOffset(distance: number): THREE.Vector3 {
        let offset = new THREE.Vector3();
        offset.copy(this.convertGlVectorToThreeVector(this._controls.getPositionWithManualUpdates())).sub(this.convertGlVectorToThreeVector(this._controls.getTargetWithManualUpdates()));
        return offset.clone().multiplyScalar(distance);
    }

    // #endregion Private Methods (7)
};