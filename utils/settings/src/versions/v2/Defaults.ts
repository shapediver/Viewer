import { ISettings } from "./ISettings";

export const Defaults: () => ISettings = () => {
    return {
        build_date: '',
        build_version: '',
        settings_version: '2.0',

        ar: {
            enableCameraSync: false,
            enableCameraSyncInitial: false,
            enableLightingEstimation: true,
            enableTouchControls: true,
            enableTouchControlRotation: true,
            enableAutomaticPlacement: true,
            defaultHitTestType: 'existingPlaneUsingGeometry',
        },
        defaultMaterial: {
            bumpAmplitude: 1,
            color: '#d3d3d3',
            metalness: 0.0,
            roughness: 1.0,
        },
        parameters: {
            controlOrder: [],
            controlNames: {},
            parametersHidden: [],
        },
        viewer: {
            blurSceneWhenBusy: true,
            ignoreSuperseded: true,
            loggingLevel: -1,
            messageLoggingLevel: -1,

            showMessages: true,
            hasRestoredSettings: false,
            useModelSettings: false,

            commitParameters: false,
            commitSettings: false,
            viewerRuntimeId: '',

            scene: {
                show: false,
                showSceneTransition: '1s',
                camera: {
                    autoAdjust: false,
                    cameraMovementDuration: 800,
                    cameraTypes: {
                        perspective: {
                            default: {
                                position: { x: 0, y: 0, z: 0 },
                                target: { x: 0, y: 0, z: 0 },
                            },
                            fov: 45,
                            controls: 0,
                        },
                        orthographic: {
                            default: {
                                position: { x: 0, y: 0, z: 0 },
                                target: { x: 0, y: 0, z: 0 },
                            },
                        },
                        active: 0,
                    },
                    controls: {
                        orbit: {
                            autoRotationSpeed: 0,
                            damping: 0.1,
                            enableAutoRotation: false,
                            enableKeyPan: false,
                            enablePan: true,
                            enableRotation: true,
                            enableZoom: true,
                            input: { keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, },
                            keyPanSpeed: 0.5,
                            movementSmoothness: 0.5,
                            restrictions: {
                                position: {
                                    cube: {
                                        min: { x: -Infinity, y: -Infinity, z: -Infinity },
                                        max: { x: Infinity, y: Infinity, z: Infinity },
                                    },
                                    sphere: {
                                        center: { x: 0, y: 0, z: 0 },
                                        radius: Infinity,
                                    },
                                },
                                target: {
                                    cube: {
                                        min: { x: -Infinity, y: -Infinity, z: -Infinity },
                                        max: { x: Infinity, y: Infinity, z: Infinity },
                                    },
                                    sphere: {
                                        center: { x: 0, y: 0, z: 0 },
                                        radius: Infinity,
                                    },
                                },
                                rotation: {
                                    minPolarAngle: 0,
                                    maxPolarAngle: 180,
                                    minAzimuthAngle: -Infinity,
                                    maxAzimuthAngle: Infinity,
                                },
                                zoom: {
                                    minDistance: 0,
                                    maxDistance: Infinity,
                                },
                            },
                            rotationSpeed: 0.5,
                            panSpeed: 0.5,
                            zoomSpeed: 0.5,
                        },
                        fps: {
                        },
                        orthographic: {
                            damping: 0.1,
                            enableKeyPan: false,
                            enablePan: true,
                            enableZoom: true,
                            input: { keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 } },
                            keyPanSpeed: 0.5,
                            movementSmoothness: 0.5,
                            panSpeed: 0.5,
                            zoomSpeed: 0.5,
                        }
                    },
                    enableCameraControls: true,
                    revertAtMouseUp: false,
                    revertAtMouseUpDuration: 800,
                    zoomExtentsFactor: 1,
                },
                duration: 0,
                fullscreen: false,
                gridVisibility: true,
                groundPlaneReflectionThreshold: 0.01,
                groundPlaneReflectionVisibility: false,
                groundPlaneVisibility: true,
                lights: {
                    helper: false,
                    lightScene: 'default',
                    lightScenes: {},
                },
                material: {
                    environmentMap: 'none',
                    environmentMapAsBackground: false,
                    environmentMapResolution: '1024',
                },
                render: {
                    ambientOcclusion: true,
                    beautyRenderDelay: 50,
                    beautyRenderBlendingDuration: 1500,
                    clearColor: '#ffffff',
                    clearAlpha: 1.0,
                    pointSize: 1.0,
                    shadows: true,
                    sao: {
                        samples: 8,
                        intensity: 0.1,
                        kernelRadius: 8,
                        standardDev: 25,
                    },
                },
            }
        }
    }
};