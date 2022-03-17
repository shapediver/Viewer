import { mat4, quat, vec2, vec3 } from 'gl-matrix'
import { Box, Sphere, Spherical } from '@shapediver/viewer.shared.math'

import { PerspectiveCameraControls } from '../PerspectiveCameraControls'
import { ICameraControlsLogic } from '../../../interfaces/controls/ICameraControlsLogic'
import { PerspectiveCamera } from '../../camera/PerspectiveCamera'

export class CameraControlsLogic implements ICameraControlsLogic {
    // #region Properties (15)

    private _adjustedSettings = {
        autoRotationSpeed: () => this._controls.autoRotationSpeed * this._settingsAdjustments.autoRotationSpeed,
        damping: () => this._controls.damping * this._settingsAdjustments.damping,
        movementSmoothness: () => this._controls.movementSmoothness * this._settingsAdjustments.movementSmoothness,
        panSpeed: () => this._controls.panSpeed * this._settingsAdjustments.panSpeed,
        rotationSpeed: () => this._controls.rotationSpeed * this._settingsAdjustments.rotationSpeed,
        zoomSpeed: () => this._controls.zoomSpeed * this._settingsAdjustments.zoomSpeed,
    };
    private _damping = {
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
            offset: vec3.create()
        },
    };
    private _dollyDelta = 0;
    private _dollyEnd = 0;
    private _dollyStart = 0;
    private _panDelta = vec2.create();
    private _panEnd = vec2.create();
    private _panStart = vec2.create();
    private _quat: quat;
    private _quatInverse: quat;
    private _rotateDelta = vec2.create();
    private _rotateEnd = vec2.create();
    private _rotateStart = vec2.create();
    private _settingsAdjustments = {
        autoRotationSpeed: 2 * Math.PI / 60 / 60,
        damping: 1.0,
        movementSmoothness: 1.0,
        panSpeed: 2.0,
        rotationSpeed: Math.PI,
        zoomSpeed: 0.025,
    };
    private _touchAdjustments = {
        autoRotationSpeed: 1.0,
        damping: 1.0,
        movementSmoothness: 1.0,
        panSpeed: 1.5,
        rotationSpeed: 2.0,
        zoomSpeed: 100.0,
    };

    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(private readonly _controls: PerspectiveCameraControls) {
        this._quat = quat.fromValues(-Math.sin(Math.PI / 4), 0, 0, Math.sin(Math.PI / 4));
        this._quatInverse = quat.fromValues(Math.sin(Math.PI / 4), 0, 0, Math.sin(Math.PI / 4));
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    public isWithinRestrictions(position: vec3, target: vec3): boolean {
        let pBox = new Box(this._controls.cubePositionRestriction.min, this._controls.cubePositionRestriction.max),
            pSphere = new Sphere(this._controls.spherePositionRestriction.center, this._controls.spherePositionRestriction.radius),
            tBox = new Box(this._controls.cubeTargetRestriction.min, this._controls.cubeTargetRestriction.max),
            tSphere = new Sphere(this._controls.sphereTargetRestriction.center, this._controls.sphereTargetRestriction.radius);

        if (!(pBox.containsPoint(position) && pSphere.containsPoint(position))) return false;
        if (!(tBox.containsPoint(target) && tSphere.containsPoint(target))) return false;

        let currentDistance = vec3.distance(position, target);
        if (currentDistance > this._controls.zoomRestriction.maxDistance || currentDistance < this._controls.zoomRestriction.minDistance) return false;

        let minPolarAngle = this._controls.rotationRestriction.minPolarAngle * (Math.PI / 180),
            maxPolarAngle = this._controls.rotationRestriction.maxPolarAngle * (Math.PI / 180),
            minAzimuthAngle = this._controls.rotationRestriction.minAzimuthAngle * (Math.PI / 180),
            maxAzimuthAngle = this._controls.rotationRestriction.maxAzimuthAngle * (Math.PI / 180);

        if (minAzimuthAngle !== -Infinity ||
            maxAzimuthAngle !== Infinity ||
            minPolarAngle !== 0 ||
            maxPolarAngle !== 180) {
            let offset = vec3.sub(vec3.create(), position, target);
            vec3.transformQuat(offset, offset, this._quat);
            const spherical = new Spherical().fromVec3(offset);

            if (spherical.theta < minAzimuthAngle ||
                spherical.theta > maxAzimuthAngle ||
                spherical.phi < minPolarAngle ||
                spherical.phi > maxPolarAngle) {
                return false;
            }
        }

        return true;
    }

    public pan(x: number, y: number, active: boolean, touch: boolean): void {
        if (touch) {
            x = x / window.devicePixelRatio;
            y = y / window.devicePixelRatio;
        }

        if (!active) {
            this._panStart = vec2.fromValues(x, y);
        } else {
            this._panEnd = vec2.fromValues(x, y);
            vec2.sub(this._panDelta, this._panEnd, this._panStart);
            if (this._panDelta[0] === 0 && this._panDelta[1] === 0) return;

            vec2.copy(this._panStart, this._panEnd);

            const adjustedPanSpeed = this._adjustedSettings.panSpeed() * (touch ? this._touchAdjustments.panSpeed : 1.0);
            let offset = this.panDeltaToOffset(vec2.mul(vec2.create(), this._panDelta, vec2.fromValues(adjustedPanSpeed, adjustedPanSpeed)));

            if (this._damping.pan.duration > 0) {
                if (offset[0] < 0) {
                    offset[0] = Math.min(offset[0], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[0]);
                } else {
                    offset[0] = Math.max(offset[0], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[0]);
                }
                if (offset[1] < 0) {
                    offset[1] = Math.min(offset[1], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[1]);
                } else {
                    offset[1] = Math.max(offset[1], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[1]);
                }
                if (offset[2] < 0) {
                    offset[2] = Math.min(offset[2], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[2]);
                } else {
                    offset[2] = Math.max(offset[2], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[2]);
                }
            }

            let damping = 1 - Math.max(0.01, Math.min(0.99, this._adjustedSettings.damping()));

            let framesOffsetX = (Math.log(1 / Math.abs(offset[0])) - 5 * Math.log(10)) / (Math.log(damping));
            let framesOffsetY = (Math.log(1 / Math.abs(offset[1])) - 5 * Math.log(10)) / (Math.log(damping));
            let framesOffsetZ = (Math.log(1 / Math.abs(offset[2])) - 5 * Math.log(10)) / (Math.log(damping));
            this._damping.pan.time = 0;
            this._damping.pan.duration = Math.max(framesOffsetX, Math.max(framesOffsetY, framesOffsetZ)) * 16.6666;
            this._damping.pan.offset = vec3.clone(offset);

            this._damping.rotation.duration = 0;
            this._damping.zoom.duration = 0;

            this._controls.applyTargetVector(offset, true);
            this._controls.applyPositionVector(offset, true);
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
                offset: vec3.create()
            },
        };
        this._dollyDelta = 0;
        this._dollyEnd = 0;
        this._dollyStart = 0;
        this._panDelta = vec2.create();
        this._panEnd = vec2.create();
        this._panStart = vec2.create();
        this._rotateDelta = vec2.create();
        this._rotateEnd = vec2.create();
        this._rotateStart = vec2.create();
    }

    public restrict(position: vec3, target: vec3): { position: vec3, target: vec3 } {
        let pBox = new Box(this._controls.cubePositionRestriction.min, this._controls.cubePositionRestriction.max),
            pSphere = new Sphere(this._controls.spherePositionRestriction.center, this._controls.spherePositionRestriction.radius),
            tBox = new Box(this._controls.cubeTargetRestriction.min, this._controls.cubeTargetRestriction.max),
            tSphere = new Sphere(this._controls.sphereTargetRestriction.center, this._controls.sphereTargetRestriction.radius);

        if (!pBox.containsPoint(position))
            position = pBox.clampPoint(position);

        if (!pSphere.containsPoint(position))
            position = pSphere.clampPoint(position);

        if (!tBox.containsPoint(target))
            target = tBox.clampPoint(target);

        if (!tSphere.containsPoint(target))
            target = tSphere.clampPoint(target);

        // zoom restrictions
        let currentDistance = vec3.distance(position, target);
        if (currentDistance > this._controls.zoomRestriction.maxDistance || currentDistance < this._controls.zoomRestriction.minDistance) {
            let direction = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), position, target))
            let distance = Math.max(this._controls.zoomRestriction.minDistance, Math.min(this._controls.zoomRestriction.maxDistance, currentDistance));
            vec3.add(position, vec3.multiply(position, direction, vec3.fromValues(distance, distance, distance)), target);
        }

        // angle restrictions
        let minPolarAngle = this._controls.rotationRestriction.minPolarAngle * (Math.PI / 180),
            maxPolarAngle = this._controls.rotationRestriction.maxPolarAngle * (Math.PI / 180),
            minAzimuthAngle = this._controls.rotationRestriction.minAzimuthAngle * (Math.PI / 180),
            maxAzimuthAngle = this._controls.rotationRestriction.maxAzimuthAngle * (Math.PI / 180);

        if (minAzimuthAngle !== -Infinity ||
            maxAzimuthAngle !== Infinity ||
            minPolarAngle !== 0 ||
            maxPolarAngle !== 180) {
            let offset = vec3.subtract(vec3.create(), position, target);
            vec3.transformQuat(offset, offset, this._quat);

            const spherical = new Spherical().fromVec3(offset);

            if (spherical.theta < minAzimuthAngle ||
                spherical.theta > maxAzimuthAngle ||
                spherical.phi < minPolarAngle ||
                spherical.phi > maxPolarAngle) {
                spherical.theta = Math.max(minAzimuthAngle, Math.min(maxAzimuthAngle, spherical.theta));
                spherical.phi = Math.max(minPolarAngle, Math.min(maxPolarAngle, spherical.phi));
                spherical.makeSafe();
                offset = spherical.toVec3();
                vec3.transformQuat(offset, offset, this._quatInverse);
                vec3.add(position, offset, target);
            }
        }

        return { position, target };
    }

    public rotate(x: number, y: number, active: boolean, touch: boolean): void {
        if (touch) {
            x = x / window.devicePixelRatio;
            y = y / window.devicePixelRatio;
        }

        if (!active) {
            this._rotateStart = vec2.fromValues(x, y)
        } else {
            this._rotateEnd = vec2.fromValues(x, y)
            vec2.subtract(this._rotateDelta, this._rotateEnd, this._rotateStart)
            vec2.copy(this._rotateStart, this._rotateEnd)

            if (!this._controls.canvas) return;
            if (this._controls.canvas.clientWidth == 0 || this._controls.canvas.clientHeight == 0) return;

            const spherical = new Spherical();
            let rotationSpeed = this._adjustedSettings.rotationSpeed() * (touch ? this._touchAdjustments.rotationSpeed : 1.0);
            spherical.theta -= rotationSpeed * this._rotateDelta[0];
            spherical.phi -= rotationSpeed * this._rotateDelta[1];

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

            this._controls.applyPositionVector(offset, true);
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
                let dampingFrames = Math.pow(damping, frameSinceStart);
                let offset = vec3.multiply(vec3.create(), this._damping.pan.offset, vec3.fromValues(dampingFrames, dampingFrames, dampingFrames));
                this._controls.applyTargetVector(offset);
                this._controls.applyPositionVector(offset);
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
                let spherical = new Spherical();
                spherical.theta = this._damping.rotation.theta * Math.pow(damping, frameSinceStart);
                spherical.phi = this._damping.rotation.phi * Math.pow(damping, frameSinceStart);
                let offset = this.rotationSphericalToOffset(spherical);
                this._controls.applyPositionVector(offset);
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
                this._controls.applyPositionVector(offset);
            }
        } else {
            this._damping.zoom.time = 0;
        }

        if (this._controls.enableAutoRotation) {
            let spherical = new Spherical(1.0, 0.0, -this._adjustedSettings.autoRotationSpeed());
            let offset = this.rotationSphericalToOffset(spherical);
            this._controls.applyPositionVector(offset);
        }
    }

    public zoom(x: number, y: number, active: boolean, touch: boolean): void {
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

            let delta = - this._dollyDelta * this._adjustedSettings.zoomSpeed() * (touch ? this._touchAdjustments.zoomSpeed : 1.0);

            let damping = 1 - Math.max(0.01, Math.min(1, this._adjustedSettings.damping()));
            let framesDelta = (Math.log(1 / Math.abs(this._dollyDelta)) - 5 * Math.log(10)) / (Math.log(damping));
            this._damping.zoom.time = 0;
            this._damping.zoom.duration = framesDelta * 16.6666;
            this._damping.zoom.delta = delta;

            this._damping.rotation.duration = 0;
            this._damping.pan.duration = 0;

            let offset = this.zoomDistanceToOffset(delta);
            this._controls.applyPositionVector(offset, true);
        }
    }

    // #endregion Public Methods (7)

    // #region Private Methods (3)

    private panDeltaToOffset(panDelta: vec2): vec3 {
        let offset = vec3.create();
        let panOffset = vec3.create();

        // perspective
        vec3.subtract(offset, this._controls.getPositionWithManualUpdates(), this._controls.getTargetWithManualUpdates());
        var targetDistance = vec3.length(offset);

        // half of the fov is center to top of screen
        targetDistance *= Math.tan((((<PerspectiveCamera>this._controls.camera).fov / 2) * Math.PI) / 180.0);

        // we use only clientHeight here so aspect ratio does not distort speed
        // left
        const mat = mat4.targetTo(mat4.create(), this._controls.camera.position, this._controls.camera.target, vec3.fromValues(0, 0, 1));

        const v1 = vec3.fromValues(mat[0], mat[1], mat[2]);
        const scalar1 = -(2 * panDelta[0] * targetDistance);
        vec3.multiply(v1, v1, vec3.fromValues(scalar1, scalar1, scalar1));
        vec3.add(panOffset, panOffset, v1);

        // // up
        const v2 = vec3.fromValues(mat[4], mat[5], mat[6])
        const scalar2 = 2 * panDelta[1] * targetDistance;
        vec3.multiply(v2, v2, vec3.fromValues(scalar2, scalar2, scalar2));
        vec3.add(panOffset, panOffset, v2);

        return vec3.clone(panOffset);
    }

    private rotationSphericalToOffset(s: Spherical): vec3 {
        let offset = vec3.create();
        vec3.subtract(offset, this._controls.getPositionWithManualUpdates(), this._controls.getTargetWithManualUpdates());
        vec3.transformQuat(offset, offset, this._quat);
        let spherical = new Spherical().fromVec3(offset);

        spherical.theta += s.theta;
        spherical.phi += s.phi;

        let minAzimuthAngle = this._controls.rotationRestriction.minAzimuthAngle * (Math.PI / 180),
        maxAzimuthAngle = this._controls.rotationRestriction.maxAzimuthAngle * (Math.PI / 180);

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
        offset = spherical.toVec3();
        offset = vec3.transformQuat(vec3.create(), offset, this._quatInverse);
        offset = vec3.add(vec3.create(), offset, this._controls.getTargetWithManualUpdates())
        offset = vec3.subtract(vec3.create(), offset, this._controls.getPositionWithManualUpdates());
        return vec3.clone(offset);

    }

    private zoomDistanceToOffset(distance: number): vec3 {
        let offset = vec3.create();
        vec3.subtract(offset, this._controls.getPositionWithManualUpdates(), this._controls.getTargetWithManualUpdates());
        return vec3.multiply(vec3.create(), offset, vec3.fromValues(distance, distance, distance));
    }

    // #endregion Private Methods (3)
};