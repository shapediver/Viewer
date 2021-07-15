import { vec3 } from 'gl-matrix'

import { ICameraControls } from './ICameraControls'

export interface IPerspectiveCameraControls extends ICameraControls {
    autoRotationSpeed: number;
    cubePositionRestriction: { min: vec3, max: vec3 };
    cubeTargetRestriction: { min: vec3, max: vec3 };
    damping: number;
    enableAutoRotation: boolean;
    enableKeyPan: boolean;
    enablePan: boolean;
    enableRotation: boolean;
    enableZoom: boolean;
    input: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } };
    keyPanSpeed: number;
    movementSmoothness: number;
    panSpeed: number;
    rotationRestriction: { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number };
    rotationSpeed: number;
    spherePositionRestriction: { center: vec3, radius: number };
    sphereTargetRestriction: { center: vec3, radius: number };
    zoomRestriction: { minDistance: number, maxDistance: number };
    zoomSpeed: number;
}