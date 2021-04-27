import { ISetting } from '../interfaces/ISetting';
import { BooleanSetting } from './types/BooleanSetting';
import { CustomSetting } from './types/CustomSetting';
import { NumberSetting } from './types/NumberSetting';
import { StringSetting } from './types/StringSetting';

export const DefaultSettings = {
    build_date: <ISetting<string>> new StringSetting('', ''),
    build_version: <ISetting<string>> new StringSetting('', ''),
    settings_version: <ISetting<string>> new StringSetting('2.0', ''),

    parameters: {
        controlOrder: <ISetting<string[]>> new CustomSetting([], ''),
        controlNames: <ISetting<{ [key: string]: string }>> new CustomSetting({}, ''),
        parametersHidden: <ISetting<string[]>> new CustomSetting([], ''),
    },
    viewer: {
        blurSceneWhenBusy: <ISetting<boolean>> new BooleanSetting(true, 'Blur or don\'t blur the scene while a process is busy'),
        showMessages: <ISetting<boolean>> new BooleanSetting(true, 'Show or don\'t show user messages in the viewport'),
        commitParameters: <ISetting<boolean>> new BooleanSetting(false, 'Use or don\'t commit mode for parameters'),
        commitSettings: <ISetting<boolean>> new BooleanSetting(false, 'Use or don\'t commit mode for settings'),
        scene: {
            showSceneTransition: <ISetting<string>> new StringSetting('1s', ''),
            camera: {
                autoAdjust: <ISetting<boolean>> new BooleanSetting(false, 'Enable / disable that the camera adjusts to geometry updates'),
                cameraMovementDuration: <ISetting<number>> new NumberSetting(800, 'Default duration of camera movements', (value: number) => value >= 0),
                cameraTypes: {
                    perspective: {
                        default: <ISetting<{ position: { x: number, y: number, z: number }, target: { x: number, y: number, z: number } }>> new CustomSetting({ position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } }, 'Default position and target for the perspective camera'),
                        fov: <ISetting<number>> new NumberSetting(45, 'Camera frustum vertical field of view angle, unit degree, interval [0,180]', (value: number) => value >= 0),
                    },
                    orthographic: {
                        default: <ISetting<{ position: { x: number, y: number, z: number }, target: { x: number, y: number, z: number } }>> new CustomSetting({ position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } }, 'Default position and target for the orthographic camera')
                    },
                    active: <ISetting<number>> new NumberSetting(0, 'Set camera type', (value: number) => value >= 0 && value <=6),
                },
                controls: {
                    orbit: {
                        autoRotationSpeed: <ISetting<number>> new NumberSetting(0, 'Speed of autorotation, can be negative, also refer to enableAutoRotation'),
                        damping: <ISetting<number>> new NumberSetting(0.1, 'How much to damp camera movements by the user', (value: number) => value >= 0),
                        enableAutoRotation: <ISetting<boolean>> new BooleanSetting(false, 'Enable / disable automatic rotation of the camera, also refer to autoRotationSpeed'),
                        enableKeyPan: <ISetting<boolean>> new BooleanSetting(false, 'Enable / disable panning using the keyboard, also refer to enablePan'),
                        enablePan: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable panning in general, also refer to enableKeyPan'),
                        enableRotation: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable camera rotation'),
                        enableZoom: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable zooming'),
                        input: <ISetting<any>> new CustomSetting({ keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, }),
                        keyPanSpeed: <ISetting<number>> new NumberSetting(0.5, 'Speed of panning when using the keyboard', (value: number) => value >= 0 && value <= 1),
                        movementSmoothness: <ISetting<number>> new NumberSetting(0.5, 'How much to the current movement is affected by the previous one', (value: number) => value >= 0 && value <= 1),
                        restrictions: {
                            position: {
                                cube: <ISetting<{min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number }}>> new CustomSetting({ min: { x: -Infinity, y: -Infinity, z: -Infinity }, max: { x: Infinity, y: Infinity, z: Infinity } }, 'Restriction of the camera position inside a cube, minimum and maximum corner of the cube'),
                                sphere: <ISetting<{center: { x: number, y: number, z: number }, radius: number}>> new CustomSetting({ center: { x: 0, y: 0, z: 0 }, radius: Infinity }, 'Restriction of the camera position inside a sphere, center and radius of the sphere'),
                            },
                            target: {
                                cube: <ISetting<{min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number }}>> new CustomSetting({ min: { x: -Infinity, y: -Infinity, z: -Infinity }, max: { x: Infinity, y: Infinity, z: Infinity } }, 'Restriction of the camera target inside a cube, minimum and maximum corner of the cube'),
                                sphere: <ISetting<{center: { x: number, y: number, z: number }, radius: number}>> new CustomSetting({ center: { x: 0, y: 0, z: 0 }, radius: Infinity }, 'Restriction of the camera target inside a sphere, center and radius of the sphere'),
                            },
                            rotation: <ISetting<{minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number}>> new CustomSetting({ minPolarAngle: 0, maxPolarAngle: 180, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity }, 'Minimum and maximum polar and azimuth angle of the camera position with respect to the camera target, unit degree'),
                            zoom: <ISetting<{minDistance: number, maxDistance: number}>> new CustomSetting({ minDistance: 0, maxDistance: Infinity }, 'Minimum and maximum distance between camera position and target'),
                        },
                        rotationSpeed: <ISetting<number>> new NumberSetting(0.5, 'Speed of camera rotation', (value: number) => value >= 0 && value <= 1),
                        panSpeed: <ISetting<number>> new NumberSetting(0.5, 'Speed of panning', (value: number) => value >= 0 && value <= 1),
                        zoomSpeed: <ISetting<number>> new NumberSetting(0.5, 'Speed of zooming', (value: number) => value >= 0 && value <= 1),
                    },
                    orthographic: {
                        damping: <ISetting<number>> new NumberSetting(0.1, 'How much to damp camera movements by the user', (value: number) => value >= 0),
                        enableKeyPan: <ISetting<boolean>> new BooleanSetting(false, 'Enable / disable panning using the keyboard, also refer to enablePan'),
                        enablePan: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable panning in general, also refer to enableKeyPan'),
                        enableZoom: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable zooming'),
                        input: <ISetting<any>> new CustomSetting({ keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, }),
                        keyPanSpeed: <ISetting<number>> new NumberSetting(0.5, 'Speed of panning when using the keyboard', (value: number) => value >= 0 && value <= 1),
                        movementSmoothness: <ISetting<number>> new NumberSetting(0.5, 'How much to the current movement is affected by the previous one', (value: number) => value >= 0 && value <= 1),
                        panSpeed: <ISetting<number>> new NumberSetting(0.5, 'Speed of panning', (value: number) => value >= 0 && value <= 1),
                        zoomSpeed: <ISetting<number>> new NumberSetting(0.5, 'Speed of zooming', (value: number) => value >= 0 && value <= 1),
                    }
                },
                enableCameraControls: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable camera controls'),
                revertAtMouseUp: <ISetting<boolean>> new BooleanSetting(false, 'Enable / disable if the mouse should reset on mouse up'),
                revertAtMouseUpDuration: <ISetting<number>> new NumberSetting(800, 'The duration of the transition of the revertAtMouseUp', (value: number) => value >= 0),
                zoomExtentsFactor: <ISetting<number>> new NumberSetting(1, 'Factor to apply to the bounding box before zooming to extents', (value: number) => value > 0),
            },
            gridVisibility: <ISetting<boolean>> new BooleanSetting(true, 'Show / hide the grid'),
            groundPlaneVisibility: <ISetting<boolean>> new BooleanSetting(true, 'Show / hide the ground plane'),
            lights: {
                lightScene: <ISetting<string>> new StringSetting('default'),
                lightScenes: <ISetting<any>> new CustomSetting({}),
            },
            material: {
                environmentMap: <ISetting<string>> new StringSetting('none', 'Name of the environment map to use, or an array of 6 image URLs making up the cube mapped environment map (px, nx, pz, nz, py, ny)', (value: string | String | string[] | String[]) => true),
                environmentMapAsBackground: <ISetting<boolean>> new BooleanSetting(false, 'Show / hide the environment map in the background'),
                environmentMapResolution: <ISetting<string>> new StringSetting('1024', 'Image resolution to be used for the named environment maps (available resolutions: 256, 512, 1024)', (value: string) => (['256', '512', '1024', '2048'].includes(value))),
            },
            render: {
                ambientOcclusion: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable ambient occlusion for rendering'),
                beautyRenderDelay: <ISetting<number>> new NumberSetting(50, 'Amount of which the beauty rendering is delayed', (value: number) => value >= 0),
                beautyRenderBlendingDuration: <ISetting<number>> new NumberSetting(1500, 'Time to blend the beauty rendering', (value: number) => value >= 0),
                clearColor: <ISetting<string>> new StringSetting('#ffffff', 'Set background color'),
                clearAlpha: <ISetting<number>> new NumberSetting(1.0, 'Set background alpha value', (value: number) => value >= 0 && value <= 1),
                pointSize: <ISetting<number>> new NumberSetting(1.0, 'Set size of point objects', (value: number) => value >= 0),
                shadows: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable shadows for rendering'),
                // sao: {
                //     samples: <ISetting<number>> new NumberSetting(8, '', (value: number) => value >= 0),
                //     intensity: <ISetting<number>> new NumberSetting(0.1, '', (value: number) => value >= 0),
                //     kernelRadius: <ISetting<number>> new NumberSetting(8, '', (value: number) => value >= 0),
                //     standardDev: <ISetting<number>> new NumberSetting(25, '', (value: number) => value >= 0),
                // },
            },
        }
    },
};