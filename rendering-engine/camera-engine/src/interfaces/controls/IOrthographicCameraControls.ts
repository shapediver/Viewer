import { ICameraControls } from './ICameraControls'

export interface IOrthographicCameraControls extends ICameraControls {
    damping: number;
    enableKeyPan: boolean;
    enablePan: boolean;
    enableZoom: boolean;
    input: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } };
    keyPanSpeed: number;
    movementSmoothness: number;
    panSpeed: number;
    zoomSpeed: number;
}