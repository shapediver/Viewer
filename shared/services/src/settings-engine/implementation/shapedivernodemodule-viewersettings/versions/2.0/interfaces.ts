import { ISetting, IGlobalSettingsObject } from "../../interfaces/interfaces";

export interface ISettingsObject extends IGlobalSettingsObject {
    // #region Properties (4)

    ar: {
        enableCameraSync: ISetting<boolean>,
        enableCameraSyncInitial: ISetting<boolean>,
        enableLightingEstimation: ISetting<boolean>,
        enableTouchControls: ISetting<boolean>,
        enableTouchControlRotation: ISetting<boolean>,
        enableAutomaticPlacement: ISetting<boolean>,
        defaultHitTestType: ISetting<any>,
    },
    defaultMaterial: {
        // name: ISetting<string>,
        // version: ISetting<string>,
        bumpAmplitude: ISetting<number>,
        color: ISetting<string>,
        metalness: ISetting<number>,
        roughness: ISetting<number>
    },
    // constructor: {
    //     useQueryStringParameters: ISetting<boolean>,
    //     forceQueryStringParameters: ISetting<boolean>,
    //     apiversion: ISetting<string>,
    //     runtimeId: ISetting<string>,
    //     arkitbridge: ISetting<boolean>,
    //     modelViewUrl: ISetting<string>,
    //     ticket: ISetting<string>,
    //     authorization: ISetting<string>,
    //     iframeId: ISetting<string>,
    //     iframeDebugging: ISetting<boolean>
    // },
    // browserUI: {
    //     anchorElements: ISetting<boolean>,
    //     brandedMode: ISetting<boolean>,
    //     brandedModeConsole: ISetting<any>,
    //     busyGraphic: ISetting<string>,
    //     containerControls: ISetting<Element>,
    //     containerSettings: ISetting<Element>,
    //     createButtons: ISetting<boolean>,
    //     domElementIdPrefix: ISetting<string>,
    //     editMode: ISetting<boolean>,
    //     exportModal: ISetting<boolean>,
    //     showControlsButton: ISetting<boolean>,
    //     showControlsInitial: ISetting<boolean>,
    //     showSettingsButton: ISetting<boolean>,
    //     showSettingsInitial: ISetting<boolean>,
    //     showZoomButton: ISetting<boolean>,
    //     zoomButtonResetsCamera: ISetting<boolean>,
    //     showFullscreenButton: ISetting<boolean>,
    //     showInitialSpinner: ISetting<boolean>,
    //     showBusySpinner: ISetting<boolean>,
    //     viewportOverlays: ISetting<boolean>,
    // },
    parameters: {
        controlOrder: ISetting<string[]>,
        controlNames: ISetting<{}>,
        parametersHidden: ISetting<string[]>,
    },
    viewer: {
        blurSceneWhenBusy: ISetting<boolean>,
        // container: ISetting<any>,
        // deferGeometryLoading: ISetting<boolean>,
        ignoreSuperseded: ISetting<boolean>,
        // commPluginRuntimeId: ISetting<string>,
        loggingLevel: ISetting<number>,
        messageLoggingLevel: ISetting<number>,
        // strictMode: ISetting<boolean>,

        viewerRuntimeId: ISetting<string>,
        hasRestoredSettings: ISetting<boolean>,
        useModelSettings: ISetting<boolean>,
        showMessages: ISetting<boolean>,
        // exposeViewer: ISetting<boolean>,
        
        commitSettings: ISetting<boolean>,
        commitParameters: ISetting<boolean>,

        scene: {
            show: ISetting<boolean>,
            // showSceneMode: ISetting<number>,
            showSceneTransition: ISetting<string>,
            duration: ISetting<number>,
            fullscreen: ISetting<boolean>,
            gridVisibility: ISetting<boolean>,
            groundPlaneReflectionThreshold: ISetting<number>,
            groundPlaneReflectionVisibility: ISetting<boolean>,
            groundPlaneVisibility: ISetting<boolean>,
    
            camera: {
                autoAdjust: ISetting<boolean>,
                cameraMovementDuration: ISetting<number>,
                cameraTypes: {
                    perspective: {
                        default: ISetting<{ position: ISetting<any>, target: ISetting<any> }>,
                        fov: ISetting<number>,
                        controls: ISetting<number>,
                    },
                    orthographic: {
                        default: ISetting<{ position: ISetting<any>, target: ISetting<any> }>,
                    },
                    active: ISetting<number>
                },
                controls: {
                    orbit: {
                        autoRotationSpeed: ISetting<number>,
                        damping: ISetting<number>,
                        enableAutoRotation: ISetting<boolean>,
                        enableKeyPan: ISetting<boolean>,
                        enablePan: ISetting<boolean>,
                        enableRotation: ISetting<boolean>,
                        enableZoom: ISetting<boolean>,
                        input: ISetting<any>,
                        keyPanSpeed: ISetting<number>,
                        movementSmoothness: ISetting<number>,
                        restrictions: {
                            position: {
                                cube: ISetting<{ min: ISetting<any>, max: ISetting<any> }>,
                                sphere: ISetting<{ center: ISetting<any>, radius: ISetting<number> }>,
                            },
                            target: {
                                cube: ISetting<{ min: ISetting<any>, max: ISetting<any> }>,
                                sphere: ISetting<{ center: ISetting<any>, radius: ISetting<number> }>,
                            },
                            rotation: ISetting<{ minPolarAngle: ISetting<number>, maxPolarAngle: ISetting<number>, minAzimuthAngle: ISetting<number>, maxAzimuthAngle: ISetting<number> }>,
                            zoom: ISetting<{ minDistance: ISetting<number>, maxDistance: ISetting<number> }>,
                        },
                        rotationSpeed: ISetting<number>,
                        panSpeed: ISetting<number>,
                        zoomSpeed: ISetting<number>,
                    },
                    fps: {
                    },
                    orthographic: {
                        damping: ISetting<number>,
                        enableKeyPan: ISetting<boolean>,
                        enablePan: ISetting<boolean>,
                        enableZoom: ISetting<boolean>,
                        input: ISetting<any>,
                        keyPanSpeed: ISetting<number>,
                        movementSmoothness: ISetting<number>,
                        panSpeed: ISetting<number>,
                        zoomSpeed: ISetting<number>,
                    }
                },
                enableCameraControls: ISetting<boolean>,
                revertAtMouseUp: ISetting<boolean>,
                revertAtMouseUpDuration: ISetting<number>,
                zoomExtentsFactor: ISetting<number>,
            },
            lights: {
                helper: ISetting<boolean>,
                lightScene: ISetting<string>,
                lightScenes: ISetting<any>
            },
            material: {
                environmentMap: ISetting<string | string[]>,
                environmentMapAsBackground: ISetting<boolean>,
                environmentMapResolution: ISetting<string>
            },
            render: {
                ambientOcclusion: ISetting<boolean>,
                beautyRenderDelay: ISetting<number>,
                beautyRenderBlendingDuration: ISetting<number>,
                clearAlpha: ISetting<number>,
                clearColor: ISetting<string>,
                pointSize: ISetting<number>,
                shadows: ISetting<boolean>,
                sao: {
                    samples: ISetting<number>,
                    kernelRadius: ISetting<number>,
                    intensity: ISetting<number>,
                    standardDev: ISetting<number>,
                }
            },
        },
    },

    // #endregion Properties (4)
}
