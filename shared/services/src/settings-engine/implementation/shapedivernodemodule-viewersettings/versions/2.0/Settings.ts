import { ISetting } from "../../interfaces/interfaces";
import { SettingsVersion } from "../../SettingsVersion";
import { Setting } from "../../Setting";
import { ISettingsObject } from "./interfaces";
import { Settings as OldSettings } from "../1.0/Settings";
import { BaseSettings } from "../../BaseSettings";
//import typeChecks from "shapedivernodemodule-typechecks";

export class Settings extends BaseSettings {
    // #region Properties (1)

    protected _settings: ISettingsObject;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * 
     * @param settingsObject a settings object that is a JSON representation of this SettingsObject
     */
    constructor(settingsJSON?: any) {
        super();
        this._version = new SettingsVersion('2.0');

        this._settings = {
            build_date: new Setting('', 'string', '', false),
            build_version: new Setting('', 'string', '', false),
            settings_version: new Setting('2.0', 'string', '', true),

            ar: {
                enableCameraSync: new Setting(false, 'boolean', 'Enable / disable synchronisation of the camera with AR tracking information. Enabling this will disable the orbit controls.', false),
                enableCameraSyncInitial: new Setting(false, 'boolean', 'Enable / disable the inital synchronisation of the camera with AR tracking information. Enabling this will disable the orbit controls.'),
                enableLightingEstimation: new Setting(true, 'boolean', 'Enable / disable automatic lighting estimation. Enabling this stores the current state of the lights which will get restored once automatic lighting estimation gets disabled again.'),
                enableTouchControls: new Setting(true, 'boolean', 'Enable / disable touch controls for placement of objects in the AR scene while AR camera synchronisation is enabled.'),
                enableTouchControlRotation: new Setting(true, 'boolean', 'Enable / disable rotation of objects in the AR scene by means of touch controls. Typically this should be enabled for objects to be placed horizontally.'),
                enableAutomaticPlacement: new Setting(true, 'boolean', 'Enable / disable initial automatic placement of objects in the AR scene as soon as plane anchors get detected. Automatic placement stops once the user starts to interact.'),
                defaultHitTestType: new Setting('existingPlaneUsingGeometry', (value: string) => ['featurePoint', 'estimatedHorizontalPlane', 'estimatedVerticalPlane', 'existingPlane', 'existingPlaneUsingExtent', 'existingPlaneUsingGeometry'].includes(value), 'Default type of feature to use for hit tests, used by touch controls. '),
            },
            // constructor: {
            //     useQueryStringParameters: new Setting(false, 'boolean', 'if true, the constructor tries to read settings from the query string, existing settings will not be overridden'),
            //     forceQueryStringParameters: new Setting(false, 'boolean', 'if true, the constructor tries to read settings from the query string existing settings will be overridden'),
            //     apiversion: new Setting('2', 'string', 'major version of the API to return by default'),
            //     runtimeId: new Setting('', 'string', 'runtimeId to set for returned API object, a random one will be chosen by default'),
            //     arkitbridge: new Setting(false, 'boolean', 'enable bridge to ShapeDiver iOS app using ARKit'),
            //     modelViewUrl: new Setting('us-east-1', 'string', 'optional model view url to pass to the default CommPlugin, a leading \'https://\' will be prefixed if not in place, \'us-east-1\' and \'eu-central-1\' may be used as abbreviations for ShapeDiver\'s default systems'),
            //     ticket: new Setting('' , 'string', 'optional model view ticket to be used for immediately instantiating a CommPlugin instance. No CommPlugin instance will be registered by the constructor if this is empty. Further CommPlugin instances can be initialized after the constructor has finished, using the API v2 function {@link module:ApiInterfaceV2~ApiPluginInterface#registerCommPluginAsync registerCommPluginAsync}.'),
            //     authorization: new Setting('', 'string', 'optional authorization token to include with requests to the model view interface (prepend \'Bearer \' yourself if necessary)'),
            //     iframeId: new Setting('sdv-iframe', 'string'),
            //     iframeDebugging: new Setting(false, 'boolean')
            // },
            // browserUI: {
            //     anchorElements: new Setting(true, 'boolean', 'choose whether the default handler for creating DOM elements representing anchors shall be instantiated'),
            //     brandedMode: new Setting(true, 'boolean', 'choose whether ShapeDiver branding shall be shown during initial loading'),
            //     brandedModeConsole: new Setting(null, 'any'),
            //     busyGraphic: new Setting('', 'string', 'optional URL to an image which shall be shown instead of the busy spinner'),
            //     containerControls: new Setting(undefined, 'any', 'optional container to use for creating parameter controls, may be undefined in which case a DOM element whose id is domElementIdPrefix+\'-controls\' will be looked for. Set this to a falsy value different from `undefined` to prevent the settings widget from being created. Not creating the settings and controls widgets saves some resources on loading of the viewer.'),
            //     containerSettings: new Setting(undefined, 'any', 'optional container to use for creating settings controls, may be `undefined` in which case a DOM element whose id is domElementIdPrefix+\'-settings\' will be looked for. Set this to a falsy value different from `undefined` to prevent the settings widget from being created. Not creating the settings and controls widgets saves some resources on loading of the viewer.'),
            //     createButtons: new Setting(true, 'boolean', 'choose whether standard buttons will be created for the viewport'),
            //     domElementIdPrefix: new Setting('sdv-container', 'string', 'prefix to use for lookup of dom elements'),
            //     editMode: new Setting(false, 'boolean', 'choose whether the parameter controls should be initialized in edit mode'),
            //     exportModal: new Setting(true, 'boolean', 'choose whether a modal dialog for export handling shall be instantiated'),
            //     showControlsButton: new Setting(true, 'boolean', 'choose whether a button for showing/hiding the parameter controls shall be shown'),
            //     showControlsInitial: new Setting(false, 'boolean', 'choose whether the parameter controls shall be shown initially'),
            //     showSettingsButton: new Setting(true, 'boolean', 'choose whether a button for showing/hiding the settings controls shall be shown'),
            //     showSettingsInitial: new Setting(false, 'boolean', 'choose whether the settings controls shall be shown initially'),
            //     showZoomButton: new Setting(true, 'boolean', 'choose whether a button for zooming shall be shown'),
            //     zoomButtonResetsCamera: new Setting(false, 'boolean', 'choose whether the zoom button shall reset the camera to its default position'),
            //     showFullscreenButton: new Setting(true, 'boolean', 'choose whether a button for to/from fullscreen mode shall be shown'),
            //     showInitialSpinner: new Setting(true, 'boolean', 'choose whether an initial loading spinner shall be shown'),
            //     showBusySpinner: new Setting(true, 'boolean', 'choose whether a busy mode spinner or the optional custom busyGraphic shall be shown'),
            //     viewportOverlays: new Setting(true, 'boolean', 'choose whether viewport overlays will be created at all (buttons, spinners, progress bar)'),
            // },
            defaultMaterial: {
                // name: new Setting('Default material', 'string', '', false),
                // version: new Setting('2.0', 'string', '', false),
                bumpAmplitude: new Setting(1, 'notnegative', 'Bump amplitude of the default material'),
                color: new Setting('#d3d3d3', 'string', 'Color of the default material'),
                metalness: new Setting(0.0, 'factor', 'Metalness of the default material'),
                roughness: new Setting(1.0, 'factor', 'Roughness of the default material'),
            },
            parameters: {
                controlOrder: new Setting([], 'stringarray', ''),
                controlNames: new Setting({}, (v:any) => true, ''),
                parametersHidden: new Setting([], 'stringarray', ''),
            },
            viewer: {
                blurSceneWhenBusy: new Setting(true, 'boolean', 'Blur or don\'t blur the scene while a process is busy'),
                // container: new Setting(undefined, 'any', 'Container to use for creating the viewport, may be undefined in which case a DOM element whose id is domElementIdPrefix+\'-viewport\' will be looked for. An array of containers may be passed to create multiple viewports. Pass an empty array to avoid creating a viewport.'),
                // deferGeometryLoading: new Setting(false, 'boolean', 'true: tell the CommPlugin instance created by the constructor to not load any geometry until first parameter update or refresh, false: load default geometry'),
                ignoreSuperseded: new Setting(true, 'boolean', 'Ignore intermediate solutions which at the time of their arrival have already been superseded by another customization request', false),
                loggingLevel: new Setting(-1, (value: number) => value >= -1 && value <=3, 'Level of log messages shown on the console, allowed values: -1 (none), 0 (error), 1 (warn), 2 (info), 3 (debug)', false),
                // commPluginRuntimeId: new Setting('CommPlugin_1', 'string', 'runtime id to use for the CommPlugin instance created by the constructor'),
                messageLoggingLevel: new Setting(-1, (value: number) => value >= -1 && value <=3, 'Log level to be used for logging internal messages, allowed values: -1 (none), 0 (error), 1 (warn), 2 (info), 3 (debug)', false),

                // strictMode: new Setting(false, 'boolean', '', false),
                showMessages: new Setting(true, 'boolean', 'Show or don\'t show user messages in the viewport', false),
                hasRestoredSettings: new Setting(false, 'boolean', 'True if settings have been restored from a settings object delivered by a CommPlugin', false),
                useModelSettings: new Setting(false, 'boolean', 'True if settings object delivered by first CommPlugin should be used', false),
            
                // exposeViewer: new Setting(false, 'boolean'),
                commitParameters: new Setting(false, 'boolean', 'Use or don\'t commit mode for parameters'),
                commitSettings: new Setting(false, 'boolean', 'Use or don\'t commit mode for settings'),
                viewerRuntimeId: new Setting('', 'string', 'The runtime id of this viewer', false),

                scene: {
                    show: new Setting(false, 'boolean', 'Show / hide the scene', false),
                    // showSceneMode: new Setting(2, (value: number) => value >= 0 && value <= 3, 'when to fade in the scene: ON_SHOW(1), ON_FIRST_PLUGIN(2), ON_ALL_PLUGINS(3)'),
                    showSceneTransition: new Setting('1s', 'string', ''),
                    camera: {
                        autoAdjust: new Setting(false, 'boolean', 'Enable / disable that the camera adjusts to geometry updates'),
                        cameraMovementDuration: new Setting(800, 'notnegative', 'Default duration of camera movements'),
                        cameraTypes: {
                            perspective: {
                                default: new Setting({
                                    position: new Setting({ x: 0, y: 0, z: 0 }, 'vector3any', 'Default position for the perspective camera'),
                                    target: new Setting({ x: 0, y: 0, z: 0 }, 'vector3any', 'Default target for the perspective camera'),
                                }, (value: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } }) => true, 'Default position and target for the perspective camera'),
                                fov: new Setting(45, 'notnegative', 'Camera frustum vertical field of view angle, unit degree, interval [0,180]'),
                                controls: new Setting(0, (value: number) => value === 0 || value === 1, 'Set camera control type'),
                            },
                            orthographic: {
                                default: new Setting({
                                    position: new Setting({ x: 0, y: 0, z: 0 }, 'vector3any', 'Default position for the orthographic camera'),
                                    target: new Setting({ x: 0, y: 0, z: 0 }, 'vector3any', 'Default target for the orthographic camera'),
                                }, (value: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } }) => true, 'Default position and target for the orthographic camera'),
                            },
                            active: new Setting(0, (value: number) => value >= 0 && value <=6,  'Set camera type'),
                        },
                        controls: {
                            orbit: {
                                autoRotationSpeed: new Setting(0, 'number', 'Speed of autoration, can be negative, also refer to enableAutoRotation'),
                                damping: new Setting(0.1, 'notnegative', 'How much to damp camera movements by the user'),
                                enableAutoRotation: new Setting(false, 'boolean', 'Enable / disable automatic rotation of the camera, also refer to autoRotationSpeed'),
                                enableKeyPan: new Setting(false, 'boolean', 'Enable / disable panning using the keyboard, also refer to enablePan'),
                                enablePan: new Setting(true, 'boolean', 'Enable / disable panning in general, also refer to enableKeyPan'),
                                enableRotation: new Setting(true, 'boolean', 'Enable / disable camera rotation'),
                                enableZoom: new Setting(true, 'boolean', 'Enable / disable zooming'),
                                input: new Setting({ keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, }, 'any'),
                                keyPanSpeed: new Setting(0.5, 'notnegative', 'Speed of panning when using the keyboard'),
                                movementSmoothness: new Setting(0.5, 'factor', 'How much to the current movement is affected by the previous one'),
                                restrictions: {
                                    position: {
                                        cube: new Setting({
                                            min: new Setting({ x: -Infinity, y: -Infinity, z: -Infinity }, 'vector3any', 'Restriction of the camera position inside a cube, minimum corner of the cube'),
                                            max: new Setting({ x: Infinity, y: Infinity, z: Infinity }, 'vector3any', 'Restriction of the camera position inside a cube, maximum corner of the cube'),
                                        }, (value: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } }) => true, 'Restriction of the camera position inside a cube, minimum and maximum corner of the cube',
                                        false),
                                        sphere: new Setting({
                                            center: new Setting({ x: 0, y: 0, z: 0 }, 'vector3any', 'Restriction of the camera position inside a sphere, center of the sphere'),
                                            radius: new Setting(Infinity, 'notnegative', 'Restriction of the camera position inside a sphere, radius of the sphere'),
                                        }, (value: { center: { x: 0, y: 0, z: 0 }, radius: number }) => true, 'Restriction of the camera position inside a sphere, center and radius of the sphere', 
                                        false),
                                    },
                                    target: {
                                        cube: new Setting({
                                            min: new Setting({ x: -Infinity, y: -Infinity, z: -Infinity }, 'vector3any', 'Restriction of the camera target inside a cube, minimum corner of the cube'),
                                            max: new Setting({ x: Infinity, y: Infinity, z: Infinity }, 'vector3any', 'Restriction of the camera target inside a cube, maximum corner of the cube'),
                                        }, (value: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } }) => true, 'Restriction of the camera target inside a cube, minimum and maximum corner of the cube', 
                                        false),
                                        sphere: new Setting({
                                            center: new Setting({ x: 0, y: 0, z: 0 }, 'vector3any', 'Restriction of the camera target inside a sphere, center of the sphere'),
                                            radius: new Setting(Infinity, 'notnegative', 'Restriction of the camera target inside a sphere, radius of the sphere'),
                                        }, (value: { center: { x: 0, y: 0, z: 0 }, radius: number }) => true, 'Restriction of the camera target inside a sphere, center and radius of the sphere', 
                                        false),
                                    },
                                    rotation: new Setting({
                                        minPolarAngle: new Setting(0, (value: number) =>true, 'Minimum polar angle of the camera position with respect to the camera target, unit degree, interval [0,180]'),
                                        maxPolarAngle: new Setting(180, (value: number) => true, 'Maximum polar angle of the camera position with respect to the camera target, unit degree, interval [0,180]'),
                                        minAzimuthAngle: new Setting(-Infinity, 'number', 'Minimum azimuth angle of the camera position with respect to the camera target, unit degree, interval [-180,180]'),
                                        maxAzimuthAngle: new Setting(Infinity, 'number', 'Maximum azimuth angle of the camera position with respect to the camera target, unit degree, interval [-180,180]'),
                                    }, (value: { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }) => true, 'Minimum and maximum polar and azimuth angle of the camera position with respect to the camera target, unit degree', 
                                    false),
                                    zoom: new Setting({
                                        minDistance: new Setting(0, 'notnegative', 'Minimum distance between camera position and target'),
                                        maxDistance: new Setting(Infinity, 'notnegative', 'Maximum distance between camera position and target'),
                                    }, (value: { minDistance: number, maxDistance: number }) => true, 'Minimum and maximum distance between camera position and target', 
                                    false),
                                },
                                rotationSpeed: new Setting(0.5, 'notnegative', 'Speed of camera rotation'),
                                panSpeed: new Setting(0.5, 'notnegative', 'Speed of panning'),
                                zoomSpeed: new Setting(0.5, 'notnegative', 'Speed of zooming'),
                            },
                            fps: {
                            },
                            orthographic: {
                                damping: new Setting(0.1, 'notnegative', 'How much to damp camera movements by the user'),
                                enableKeyPan: new Setting(false, 'boolean', 'Enable / disable panning using the keyboard, also refer to enablePan'),
                                enablePan: new Setting(true, 'boolean', 'Enable / disable panning in general, also refer to enableKeyPan'),
                                enableZoom: new Setting(true, 'boolean', 'Enable / disable zooming'),
                                input: new Setting({ keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 } }, 'any'),
                                keyPanSpeed: new Setting(0.5, 'notnegative', 'Speed of panning when using the keyboard'),
                                movementSmoothness: new Setting(0.5, 'factor', 'How much to the current movement is affected by the previous one'),
                                panSpeed: new Setting(0.5, 'notnegative', 'Speed of panning'),
                                zoomSpeed: new Setting(0.5, 'notnegative', 'Speed of zooming'),
                            }
                        },
                        enableCameraControls: new Setting(true, 'boolean', 'Enable / disable camera controls'),
                        revertAtMouseUp: new Setting(false, 'boolean', 'Enable / disable if the mouse should reset on mouse up'),
                        revertAtMouseUpDuration: new Setting(800, 'notnegative', 'The duration of the transition of the revertAtMouseUp'),
                        zoomExtentsFactor: new Setting(1, 'number', 'Factor to apply to the bounding box before zooming to extents'),
                    },
                    duration: new Setting(0, 'notnegative', 'Set fade in / fade out duration'),
                    fullscreen: new Setting(false, 'boolean', 'Enable / disable fullscreen mode', false),
                    gridVisibility: new Setting(true, 'boolean', 'Show / hide the grid'),
                    groundPlaneReflectionThreshold: new Setting(0.01, 'notnegative', 'Allows to control the distance to objects that are still reflected by the groundplane'),
                    groundPlaneReflectionVisibility: new Setting(false, 'boolean', 'Enable / disable the reflectivity of the groundplane'),
                    groundPlaneVisibility: new Setting(true, 'boolean', 'Show / hide the ground plane'),
                    lights: {
                        helper: new Setting(false, 'boolean', 'Show / hide the light helpers'),
                        lightScene: new Setting('default', 'string'),
                        lightScenes: new Setting({}, 'any'),
                    },
                    material: {
                        environmentMap: new Setting('none', (value: string | String | string[] | String[]) => true, 'Name of the environment map to use, or an array of 6 image URLs making up the cube mapped environment map (px, nx, pz, nz, py, ny)'),
                        environmentMapAsBackground: new Setting(false, 'boolean', 'Show / hide the environment map in the background'),
                        environmentMapResolution: new Setting('1024', (value: string) => (['256', '512', '1024', '2048'].includes(value)), 'Image resolution to be used for the named environment maps (available resolutions: 256, 512, 1024)'),
                    },
                    render: {
                        ambientOcclusion: new Setting(true, 'boolean', 'Enable / disable ambient occlusion for rendering'),
                        beautyRenderDelay: new Setting(50, 'notnegative', 'Amount of which the beauty rendering is delayed'),
                        beautyRenderBlendingDuration: new Setting(1500, 'notnegative', 'Time needed to blend the results of the beauty rendering'),
                        clearColor: new Setting('#ffffff', 'string', 'Set background color'),
                        clearAlpha: new Setting(1.0, 'factor', 'Set background alpha value'),
                        pointSize: new Setting(1.0, 'notnegative', 'Set size of point objects'),
                        shadows: new Setting(true, 'boolean', 'Enable / disable shadows for rendering'),
                        sao: {
                            samples: new Setting(8, 'notnegative'),
                            intensity: new Setting(0.1, 'notnegative'),
                            kernelRadius: new Setting(8, 'notnegative'),
                            standardDev: new Setting(25, 'notnegative'),
                        },
                    },
                }
            },
        };
        if(settingsJSON) this._fromJSON(settingsJSON, this._settings);
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public convertFromPreviousVersion(settings: OldSettings): Settings {
        let oldSettings = settings.settings;
    
        (this._settings.viewer.scene.render.clearAlpha as ISetting<any>).value = oldSettings.clearAlpha.value;
        (this._settings.viewer.scene.render.clearColor as ISetting<any>).value = oldSettings.clearColor.value;
        (this._settings.defaultMaterial.color as ISetting<any>).value = oldSettings.defaultMaterialColor.value;

        (this._settings.build_date as ISetting<any>).value = oldSettings.build_date.value;
        (this._settings.build_version as ISetting<any>).value = oldSettings.build_version.value;

        if( !(
                (oldSettings.camera as ISetting<any>).value.position.value.x === 5 && 
                (oldSettings.camera as ISetting<any>).value.position.value.y === 5 && 
                (oldSettings.camera as ISetting<any>).value.position.value.z === 5 && 
                (oldSettings.camera as ISetting<any>).value.target.value.x === 0 && 
                (oldSettings.camera as ISetting<any>).value.target.value.y === 0 && 
                (oldSettings.camera as ISetting<any>).value.target.value.z === 0
            )
            &&
            !(
                (oldSettings.camera as ISetting<any>).value.position.value.x === 0 && 
                (oldSettings.camera as ISetting<any>).value.position.value.y === 0 && 
                (oldSettings.camera as ISetting<any>).value.position.value.z === 0 && 
                (oldSettings.camera as ISetting<any>).value.target.value.x === 0 && 
                (oldSettings.camera as ISetting<any>).value.target.value.y === 0 && 
                (oldSettings.camera as ISetting<any>).value.target.value.z === 0
            )
        ) {
            ((this._settings.viewer.scene.camera.cameraTypes.perspective.default as ISetting<any>).value.position as ISetting<any>).value = (oldSettings.camera as ISetting<any>).value.position.value;
            ((this._settings.viewer.scene.camera.cameraTypes.perspective.default as ISetting<any>).value.target as ISetting<any>).value = (oldSettings.camera as ISetting<any>).value.target.value;    
        }

        if( !(
                (oldSettings.cameraOrtho as ISetting<any>).value.position.value.x === 5 && 
                (oldSettings.cameraOrtho as ISetting<any>).value.position.value.y === 5 && 
                (oldSettings.cameraOrtho as ISetting<any>).value.position.value.z === 5 && 
                (oldSettings.cameraOrtho as ISetting<any>).value.target.value.x === 0 && 
                (oldSettings.cameraOrtho as ISetting<any>).value.target.value.y === 0 && 
                (oldSettings.cameraOrtho as ISetting<any>).value.target.value.z === 0
            )
            && 
            !(
                (oldSettings.cameraOrtho as ISetting<any>).value.position.value.x === 0 && 
                (oldSettings.cameraOrtho as ISetting<any>).value.position.value.y === 0 && 
                (oldSettings.cameraOrtho as ISetting<any>).value.position.value.z === 0 && 
                (oldSettings.cameraOrtho as ISetting<any>).value.target.value.x === 0 && 
                (oldSettings.cameraOrtho as ISetting<any>).value.target.value.y === 0 && 
                (oldSettings.cameraOrtho as ISetting<any>).value.target.value.z === 0
            )
        ) {
            ((this._settings.viewer.scene.camera.cameraTypes.orthographic.default as ISetting<any>).value.position as ISetting<any>).value = (oldSettings.cameraOrtho as ISetting<any>).value.position.value;
            ((this._settings.viewer.scene.camera.cameraTypes.orthographic.default as ISetting<any>).value.target as ISetting<any>).value = (oldSettings.cameraOrtho as ISetting<any>).value.target.value;        
        }
        else if(
            oldSettings.topView.value &&
            !(
                (oldSettings.camera as ISetting<any>).value.position.value.x === 5 && 
                (oldSettings.camera as ISetting<any>).value.position.value.y === 5 && 
                (oldSettings.camera as ISetting<any>).value.position.value.z === 5 && 
                (oldSettings.camera as ISetting<any>).value.target.value.x === 0 && 
                (oldSettings.camera as ISetting<any>).value.target.value.y === 0 && 
                (oldSettings.camera as ISetting<any>).value.target.value.z === 0
            )
            &&
            !(
                (oldSettings.camera as ISetting<any>).value.position.value.x === 0 && 
                (oldSettings.camera as ISetting<any>).value.position.value.y === 0 && 
                (oldSettings.camera as ISetting<any>).value.position.value.z === 0 && 
                (oldSettings.camera as ISetting<any>).value.target.value.x === 0 && 
                (oldSettings.camera as ISetting<any>).value.target.value.y === 0 && 
                (oldSettings.camera as ISetting<any>).value.target.value.z === 0
            )
        ) {
            ((this._settings.viewer.scene.camera.cameraTypes.orthographic.default as ISetting<any>).value.position as ISetting<any>).value = (oldSettings.camera as ISetting<any>).value.position.value;
            ((this._settings.viewer.scene.camera.cameraTypes.orthographic.default as ISetting<any>).value.target as ISetting<any>).value = (oldSettings.camera as ISetting<any>).value.target.value;    
        }

        (this._settings.viewer.scene.render.ambientOcclusion as ISetting<any>).value = oldSettings.ambientOcclusion.value;
        (this._settings.viewer.scene.camera.controls.orbit.autoRotationSpeed as ISetting<any>).value = oldSettings.autoRotateSpeed.value;
        (this._settings.defaultMaterial.bumpAmplitude as ISetting<any>).value = oldSettings.bumpAmplitude.value;
        (this._settings.viewer.scene.camera.autoAdjust as ISetting<any>).value = oldSettings.cameraAutoAdjust.value;
        (this._settings.viewer.scene.camera.cameraMovementDuration as ISetting<any>).value = oldSettings.cameraMovementDuration.value;
        (this._settings.viewer.scene.camera.revertAtMouseUp as ISetting<any>).value = oldSettings.cameraRevertAtMouseUp.value;
        (this._settings.viewer.commitParameters as ISetting<any>).value = oldSettings.commitParameters.value;
        (this._settings.viewer.scene.camera.controls.orbit.damping as ISetting<any>).value = oldSettings.controlDamping.value;
        (this._settings.viewer.scene.camera.controls.orthographic.damping as ISetting<any>).value = oldSettings.controlDamping.value;
        (this._settings.parameters.controlNames as ISetting<any>).value = oldSettings.controlNames.value;
        (this._settings.parameters.controlOrder as ISetting<any>).value = oldSettings.controlOrder.value;
        (this._settings.viewer.scene.camera.controls.orbit.enablePan as ISetting<any>).value = !oldSettings.disablePan.value;
        (this._settings.viewer.scene.camera.controls.orthographic.enablePan as ISetting<any>).value = !oldSettings.disablePan.value;
        (this._settings.viewer.scene.camera.controls.orbit.enableZoom as ISetting<any>).value = !oldSettings.disableZoom.value;
        (this._settings.viewer.scene.camera.controls.orthographic.enableZoom as ISetting<any>).value = !oldSettings.disableZoom.value;
        (this._settings.viewer.scene.camera.controls.orbit.enableAutoRotation as ISetting<any>).value = oldSettings.enableAutoRotation.value;
        (this._settings.viewer.scene.camera.controls.orbit.enableRotation as ISetting<any>).value = oldSettings.enableRotation.value;
        (this._settings.viewer.scene.material.environmentMap as ISetting<any>).value = oldSettings.environmentMap.value;
        (this._settings.viewer.scene.material.environmentMapResolution as ISetting<any>).value = oldSettings.environmentMapResolution.value;
        (this._settings.viewer.scene.camera.cameraTypes.perspective.fov as ISetting<any>).value = oldSettings.fov.value;
        (this._settings.viewer.scene.lights.lightScene as ISetting<any>).value = oldSettings.lightScene.value;
        (this._settings.viewer.scene.lights.lightScenes as ISetting<any>).value = oldSettings.lightScenes.value;
        (this._settings.viewer.scene.camera.controls.orbit.panSpeed as ISetting<any>).value = oldSettings.panSpeed.value;
        (this._settings.parameters.parametersHidden as ISetting<any>).value = oldSettings.parametersHidden.value;
        (this._settings.viewer.scene.render.pointSize as ISetting<any>).value = oldSettings.pointSize.value;
        (this._settings.viewer.scene.camera.revertAtMouseUpDuration as ISetting<any>).value = oldSettings.revertAtMouseUpDuration.value;
        (this._settings.viewer.scene.camera.controls.orbit.rotationSpeed as ISetting<any>).value = oldSettings.rotateSpeed.value;
        (this._settings.viewer.scene.material.environmentMapAsBackground as ISetting<any>).value = oldSettings.showEnvironmentMap.value;
        (this._settings.viewer.scene.gridVisibility as ISetting<any>).value = oldSettings.showGrid.value;
        (this._settings.viewer.scene.groundPlaneVisibility as ISetting<any>).value = oldSettings.showGroundPlane.value;
        (this._settings.viewer.scene.render.shadows as ISetting<any>).value = oldSettings.showShadows.value;
        
        // TODO: replace the '1' with the enum, as soon as build process is fixed
        if(oldSettings.topView.value)
            (this._settings.viewer.scene.camera.cameraTypes.active as ISetting<any>).value = 1;
        (this._settings.viewer.scene.camera.zoomExtentsFactor as ISetting<any>).value = oldSettings.zoomExtentFactor.value;
        (this._settings.viewer.scene.camera.controls.orbit.zoomSpeed as ISetting<any>).value = oldSettings.zoomSpeed.value;
        (this._settings.viewer.scene.camera.controls.orthographic.zoomSpeed as ISetting<any>).value = oldSettings.zoomSpeed.value;

        return this;
    }

    public convertToPreviousVersion(): OldSettings {
        let oldSettings: OldSettings = new OldSettings();
        (oldSettings.settings.build_date as ISetting<any>).value = this._settings.build_date.value;
        (oldSettings.settings.build_version as ISetting<any>).value = this._settings.build_version.value;

        (oldSettings.settings.ambientOcclusion as ISetting<any>).value = this._settings.viewer.scene.render.ambientOcclusion.value;
        (oldSettings.settings.autoRotateSpeed as ISetting<any>).value = this._settings.viewer.scene.camera.controls.orbit.autoRotationSpeed.value;
        (oldSettings.settings.bumpAmplitude as ISetting<any>).value = this._settings.defaultMaterial.bumpAmplitude.value;
        (oldSettings.settings.camera as ISetting<any>).value = new Setting({
            position: this._settings.viewer.scene.camera.cameraTypes.perspective.default.value.position.value,
            target: this._settings.viewer.scene.camera.cameraTypes.perspective.default.value.target.value,
        }, (v:any) => true).value;
        (oldSettings.settings.cameraAutoAdjust as ISetting<any>).value = this._settings.viewer.scene.camera.autoAdjust.value;
        (oldSettings.settings.cameraMovementDuration as ISetting<any>).value = this._settings.viewer.scene.camera.cameraMovementDuration.value;
        (oldSettings.settings.cameraOrtho as ISetting<any>).value = new Setting({
            position: this._settings.viewer.scene.camera.cameraTypes.orthographic.default.value.position.value,
            target: this._settings.viewer.scene.camera.cameraTypes.orthographic.default.value.target.value,
        }, (v:any) => true).value;
        (oldSettings.settings.cameraRevertAtMouseUp as ISetting<any>).value = this._settings.viewer.scene.camera.revertAtMouseUp.value;
        (oldSettings.settings.clearAlpha as ISetting<any>).value = this._settings.viewer.scene.render.clearAlpha.value;
        (oldSettings.settings.clearColor as ISetting<any>).value = this._settings.viewer.scene.render.clearColor.value;
        (oldSettings.settings.commitParameters as ISetting<any>).value = this._settings.viewer.commitParameters.value;
        (oldSettings.settings.controlDamping as ISetting<any>).value = this._settings.viewer.scene.camera.controls.orbit.damping.value;
        if (this._settings.parameters.controlNames.value) { // important to keep this, because old viewers will not work properly if this property is null
            (oldSettings.settings.controlNames as ISetting<any>).value = this._settings.parameters.controlNames.value;
        }
        if (this._settings.parameters.controlOrder.value) { // important to keep this, because old viewers will not work properly if this property is null
            (oldSettings.settings.controlOrder as ISetting<any>).value = this._settings.parameters.controlOrder.value;
        }
        (oldSettings.settings.defaultMaterialColor as ISetting<any>).value = this._settings.defaultMaterial.color.value;
        (oldSettings.settings.disablePan as ISetting<any>).value = !this._settings.viewer.scene.camera.controls.orbit.enablePan.value;
        (oldSettings.settings.disableZoom as ISetting<any>).value = !this._settings.viewer.scene.camera.controls.orbit.enableZoom.value;
        (oldSettings.settings.enableAutoRotation as ISetting<any>).value = this._settings.viewer.scene.camera.controls.orbit.enableAutoRotation.value;
        (oldSettings.settings.enableRotation as ISetting<any>).value = this._settings.viewer.scene.camera.controls.orbit.enableRotation.value;
        (oldSettings.settings.environmentMap as ISetting<any>).value = this._settings.viewer.scene.material.environmentMap.value;
        (oldSettings.settings.environmentMapResolution as ISetting<any>).value = this._settings.viewer.scene.material.environmentMapResolution.value;
        (oldSettings.settings.fov as ISetting<any>).value = this._settings.viewer.scene.camera.cameraTypes.perspective.fov.value;
        (oldSettings.settings.lightScene as ISetting<any>).value = this._settings.viewer.scene.lights.lightScene.value;
        (oldSettings.settings.lightScenes as ISetting<any>).value = this._settings.viewer.scene.lights.lightScenes.value;
        (oldSettings.settings.panSpeed as ISetting<any>).value = this._settings.viewer.scene.camera.controls.orbit.panSpeed.value;
        if (this._settings.parameters.parametersHidden.value) { // important to keep this, because old viewers will not work properly if this property is null
            (oldSettings.settings.parametersHidden as ISetting<any>).value = this._settings.parameters.parametersHidden.value;
        }
        (oldSettings.settings.pointSize as ISetting<any>).value = this._settings.viewer.scene.render.pointSize.value;
        (oldSettings.settings.revertAtMouseUpDuration as ISetting<any>).value = this._settings.viewer.scene.camera.revertAtMouseUpDuration.value;
        (oldSettings.settings.rotateSpeed as ISetting<any>).value = this._settings.viewer.scene.camera.controls.orbit.rotationSpeed.value;
        (oldSettings.settings.showEnvironmentMap as ISetting<any>).value = this._settings.viewer.scene.material.environmentMapAsBackground.value;
        (oldSettings.settings.showGrid as ISetting<any>).value = this._settings.viewer.scene.gridVisibility.value;
        (oldSettings.settings.showGroundPlane as ISetting<any>).value = this._settings.viewer.scene.groundPlaneVisibility.value;
        (oldSettings.settings.showShadows as ISetting<any>).value = this._settings.viewer.scene.render.shadows.value;
        // TODO: replace the '1' with the enum, as soon as build process is fixed
        (oldSettings.settings.topView as ISetting<any>).value = this._settings.viewer.scene.camera.cameraTypes.active.value === 1;
        (oldSettings.settings.zoomExtentFactor as ISetting<any>).value = this._settings.viewer.scene.camera.zoomExtentsFactor.value;
        (oldSettings.settings.zoomSpeed as ISetting<any>).value = this._settings.viewer.scene.camera.controls.orbit.zoomSpeed.value;
        // TODO compute backgroundColor (used by viewer v1) from clearAlpha and clearColor, requires tinycolor helper functionality
        //let tc = TO_TINY_COLOR(this._settings.viewer.scene.render.clearColor.value);
        //tc.setAlpha(this._settings.viewer.scene.render.clearAlpha.value);
        //(oldSettings.settings.backgroundColor as ISetting<any>).value = '0x' + tc.toHex8();

        return oldSettings;
    }

    // #endregion Public Methods (2)
};
