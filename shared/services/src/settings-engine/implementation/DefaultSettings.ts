import { ISetting } from '../interfaces/ISetting';
import { BooleanSetting } from './types/BooleanSetting';
import { CustomSetting } from './types/CustomSetting';
import { NumberSetting } from './types/NumberSetting';
import { StringSetting } from './types/StringSetting';
import { vec3 } from 'gl-matrix';

export const DefaultSettings = {
    build_date: <ISetting<string>> new StringSetting('', ''),
    build_version: <ISetting<string>> new StringSetting('', ''),
    settings_version: <ISetting<string>> new StringSetting('2.0', ''),

    // ar: {
    //     enableCameraSync: <ISetting<boolean>> new BooleanSetting(false, 'Enable / disable synchronisation of the camera with AR tracking information. Enabling this will disable the orbit controls.'),
    //     enableCameraSyncInitial: <ISetting<boolean>> new BooleanSetting(false, 'Enable / disable the inital synchronisation of the camera with AR tracking information. Enabling this will disable the orbit controls.'),
    //     enableLightingEstimation: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable automatic lighting estimation. Enabling this stores the current state of the lights which will get restored once automatic lighting estimation gets disabled again.'),
    //     enableTouchControls: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable touch controls for placement of objects in the AR scene while AR camera synchronisation is enabled.'),
    //     enableTouchControlRotation: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable rotation of objects in the AR scene by means of touch controls. Typically this should be enabled for objects to be placed horizontally.'),
    //     enableAutomaticPlacement: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable initial automatic placement of objects in the AR scene as soon as plane anchors get detected. Automatic placement stops once the user starts to interact.'),
    //     defaultHitTestType: <ISetting<string>> new StringSetting('existingPlaneUsingGeometry', 'Default type of feature to use for hit tests, used by touch controls. ', (value: string) => ['featurePoint', 'estimatedHorizontalPlane', 'estimatedVerticalPlane', 'existingPlane', 'existingPlaneUsingExtent', 'existingPlaneUsingGeometry'].includes(value)),
    // },
    // defaultMaterial: {
    //     // name: <ISetting<string>> new StringSetting('Default material', ''),
    //     // version: <ISetting<string>> new StringSetting('2.0', ''),
    //     // bumpAmplitude: <ISetting<number>> new NumberSetting(1, 'Bump amplitude of the default material'),
    //     // color: <ISetting<string>> new StringSetting('#00fff7', 'Color of the default material'),
    //     // metalness: <ISetting<number>> new NumberSetting(0.0, 'Metalness of the default material', (value: number) => value >= 0 && value <= 1),
    //     // roughness: <ISetting<number>> new NumberSetting(1.0, 'Roughness of the default material', (value: number) => value >= 0 && value <= 1),
    // },
    parameters: {
        controlOrder: <ISetting<string[]>> new CustomSetting([], ''),
        controlNames: <ISetting<string[]>> new CustomSetting([], ''),
        parametersHidden: <ISetting<string[]>> new CustomSetting([], ''),
    },
    viewer: {
        blurSceneWhenBusy: <ISetting<boolean>> new BooleanSetting(true, 'Blur or don\'t blur the scene while a process is busy'),
        // container: <ISetting<any>> new CustomSetting(undefined, 'Container to use for creating the viewport, may be undefined in which case a DOM element whose id is domElementIdPrefix+\'-viewport\' will be looked for. An array of containers may be passed to create multiple viewports. Pass an empty array to avoid creating a viewport.'),
        // deferGeometryLoading: <ISetting<boolean>> new BooleanSetting(false, 'true: tell the CommPlugin instance created by the constructor to not load any geometry until first parameter update or refresh, false: load default geometry'),
        ignoreSuperseded: <ISetting<boolean>> new BooleanSetting(true, 'Ignore intermediate solutions which at the time of their arrival have already been superseded by another customization request'),
        loggingLevel: <ISetting<number>> new NumberSetting(-1, 'Level of log messages shown on the console, allowed values: -1 (none), 0 (error), 1 (warn), 2 (info), 3 (debug)', (value: number) => value >= -1 && value <=3),
        // commPluginRuntimeId: <ISetting<string>> new StringSetting('CommPlugin_1', 'runtime id to use for the CommPlugin instance created by the constructor'),
        messageLoggingLevel: <ISetting<number>> new NumberSetting(-1, 'Log level to be used for logging internal messages, allowed values: -1 (none), 0 (error), 1 (warn), 2 (info), 3 (debug)', (value: number) => value >= -1 && value <=3),

        // strictMode: <ISetting<boolean>> new BooleanSetting(false),
        showMessages: <ISetting<boolean>> new BooleanSetting(true, 'Show or don\'t show user messages in the viewport'),
        hasRestoredSettings: <ISetting<boolean>> new BooleanSetting(false, 'True if settings have been restored from a settings object delivered by a CommPlugin'),
    
        // exposeViewer: <ISetting<boolean>> new BooleanSetting(false),
        commitParameters: <ISetting<boolean>> new BooleanSetting(false, 'Use or don\'t commit mode for parameters'),
        commitSettings: <ISetting<boolean>> new BooleanSetting(false, 'Use or don\'t commit mode for settings'),
        viewerRuntimeId: <ISetting<string>> new StringSetting('', 'The runtime id of this viewer'),

        scene: {
            show: <ISetting<boolean>> new BooleanSetting(false, 'Show / hide the scene'),
            // showSceneMode: <ISetting<number>> new NumberSetting(2, 'when to fade in the scene: ON_SHOW(1), ON_FIRST_PLUGIN(2), ON_ALL_PLUGINS(3)', (value: number) => value >= 0 && value <= 3),
            showSceneTransition: <ISetting<string>> new StringSetting('1s', ''),
            camera: {
                autoAdjust: <ISetting<boolean>> new BooleanSetting(false, 'Enable / disable that the camera adjusts to geometry updates'),
                cameraMovementDuration: <ISetting<number>> new NumberSetting(800, 'Default duration of camera movements', (value: number) => value >= 0),
                cameraTypes: {
                    perspective: {
                        default: <ISetting<{ position: vec3, target: vec3 }>> new CustomSetting({ position: vec3.create(), target: vec3.create() }, 'Default position and target for the perspective camera'),
                        fov: <ISetting<number>> new NumberSetting(45, 'Camera frustum vertical field of view angle, unit degree, interval [0,180]', (value: number) => value >= 0),
                        controls: <ISetting<number>> new NumberSetting(0, 'Set camera control type', (value: number) => value === 0 || value === 1),
                    },
                    orthographic: {
                        default: <ISetting<{ position: vec3, target: vec3 }>> new CustomSetting({ position: vec3.create(), target: vec3.create() }, 'Default position and target for the orthographic camera')
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
                                cube: <ISetting<{min: vec3, max: vec3}>> new CustomSetting({ min: vec3.fromValues(-Infinity, -Infinity, -Infinity), max: vec3.fromValues(Infinity, Infinity, Infinity) }, 'Restriction of the camera position inside a cube, minimum and maximum corner of the cube'),
                                sphere: <ISetting<{center: vec3, radius: number}>> new CustomSetting({ center: vec3.create(), radius: Infinity }, 'Restriction of the camera position inside a sphere, center and radius of the sphere'),
                            },
                            target: {
                                cube: <ISetting<{min: vec3, max: vec3}>> new CustomSetting({ min: vec3.fromValues(-Infinity, -Infinity, -Infinity), max: vec3.fromValues(Infinity, Infinity, Infinity) }, 'Restriction of the camera target inside a cube, minimum and maximum corner of the cube'),
                                sphere: <ISetting<{center: vec3, radius: number}>> new CustomSetting({ center: vec3.create(), radius: Infinity }, 'Restriction of the camera target inside a sphere, center and radius of the sphere'),
                            },
                            rotation: <ISetting<{minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number}>> new CustomSetting({ minPolarAngle: 0, maxPolarAngle: 180, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity }, 'Minimum and maximum polar and azimuth angle of the camera position with respect to the camera target, unit degree'),
                            zoom: <ISetting<{minDistance: number, maxDistance: number}>> new CustomSetting({ minDistance: 0, maxDistance: Infinity }, 'Minimum and maximum distance between camera position and target'),
                        },
                        rotationSpeed: <ISetting<number>> new NumberSetting(0.5, 'Speed of camera rotation', (value: number) => value >= 0 && value <= 1),
                        panSpeed: <ISetting<number>> new NumberSetting(0.5, 'Speed of panning', (value: number) => value >= 0 && value <= 1),
                        zoomSpeed: <ISetting<number>> new NumberSetting(0.5, 'Speed of zooming', (value: number) => value >= 0 && value <= 1),
                    },
                    fps: {
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
            duration: <ISetting<number>> new NumberSetting(0, 'Set fade in / fade out duration', (value: number) => value >= 0),
            fullscreen: <ISetting<boolean>> new BooleanSetting(false, 'Enable / disable fullscreen mode'),
            gridVisibility: <ISetting<boolean>> new BooleanSetting(true, 'Show / hide the grid'),
            groundPlaneReflectionThreshold: <ISetting<number>> new NumberSetting(0.01, 'Allows to control the distance to objects that are still reflected by the groundplane', (value: number) => value >= 0),
            groundPlaneReflectionVisibility: <ISetting<boolean>> new BooleanSetting(false, 'Enable / disable the reflectivity of the groundplane'),
            groundPlaneVisibility: <ISetting<boolean>> new BooleanSetting(true, 'Show / hide the ground plane'),
            lights: {
                helper: <ISetting<boolean>> new BooleanSetting(false, 'Show / hide the light helpers'),
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
                clearColor: <ISetting<string>> new StringSetting('#ffffff', 'Set background color'),
                clearAlpha: <ISetting<number>> new NumberSetting(1.0, 'Set background alpha value', (value: number) => value >= 0 && value <= 1),
                pointSize: <ISetting<number>> new NumberSetting(1.0, 'Set size of point objects', (value: number) => value >= 0),
                shadows: <ISetting<boolean>> new BooleanSetting(true, 'Enable / disable shadows for rendering'),
                sao: {
                    samples: <ISetting<number>> new NumberSetting(8, '', (value: number) => value >= 0),
                    intensity: <ISetting<number>> new NumberSetting(0.1, '', (value: number) => value >= 0),
                    kernelRadius: <ISetting<number>> new NumberSetting(8, '', (value: number) => value >= 0),
                    standardDev: <ISetting<number>> new NumberSetting(25, '', (value: number) => value >= 0),
                },
            },
        }
    },
};