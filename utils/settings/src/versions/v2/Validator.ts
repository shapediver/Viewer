import { z } from "zod";

const lightSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    type: z.string(),
    order: z.number().optional(),
    properties: z.object({
        color: z.union([z.number(), z.string()]).optional(),
        direction: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
        position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
        target: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
        castShadow: z.boolean().optional(),
        skyColor: z.union([z.number(), z.string()]).optional(),
        groundColor: z.union([z.number(), z.string()]).optional(),
        intensity: z.number().optional(),
        distance: z.number().optional(),
        angle: z.number().optional(),
        penumbra: z.number().optional(),
        decay: z.number().optional(),
        shadowMapResolution: z.number().optional(),
        shadowMapBias: z.number().optional()
    })
});

const lightScenesSchema = z.record(
    z.object({
        id: z.string(),
        name: z.string().optional(),
        lights: z.record(lightSchema)
    })
);

const schema = z.object({
    build_date: z.string().optional(),
    build_version: z.string().optional(),
    settings_version: z.string(),
    ar: z.object({
        enableCameraSync: z.boolean().optional(),
        enableCameraSyncInitial: z.boolean().optional(),
        enableLightingEstimation: z.boolean().optional(),
        enableTouchControls: z.boolean().optional(),
        enableTouchControlRotation: z.boolean().optional(),
        enableAutomaticPlacement: z.boolean().optional(),
        defaultHitTestType: z.string().optional(),
    }).optional(),
    defaultMaterial: z.object({
        bumpAmplitude: z.number().optional(),
        color: z.union([z.string(), z.number().array()]).optional(),
        metalness: z.number().optional(),
        roughness: z.number().optional(),
    }),
    parameters: z.object({
        controlOrder: z.string().array().optional(),
        controlNames: z.record(z.string()).optional(),
        parametersHidden: z.string().array().optional(),
    }).optional(),
    viewer: z.object({
        blurSceneWhenBusy: z.boolean(),
        ignoreSuperseded: z.boolean().optional(),
        loggingLevel: z.number().optional(),
        messageLoggingLevel: z.number().optional(),

        viewerRuntimeId: z.string().optional(),
        hasRestoredSettings: z.boolean().optional(),
        useModelSettings: z.boolean().optional(),
        showMessages: z.boolean().optional(),

        commitSettings: z.boolean(),
        commitParameters: z.boolean(),

        scene: z.object({
            show: z.boolean().optional(),
            showSceneTransition: z.string().optional(),
            duration: z.number().optional(),
            fullscreen: z.boolean().optional(),
            gridVisibility: z.boolean(),
            groundPlaneReflectionThreshold: z.number().optional(),
            groundPlaneReflectionVisibility: z.boolean().optional(),
            groundPlaneVisibility: z.boolean(),

            camera: z.object({
                autoAdjust: z.boolean(),
                cameraMovementDuration: z.number(),
                cameraTypes: z.object({
                    perspective: z.object({
                        default: z.object({ position: z.object({ x: z.number(), y: z.number(), z: z.number() }), target: z.object({ x: z.number(), y: z.number(), z: z.number() }) }),
                        fov: z.number(),
                        controls: z.number().optional(),
                    }),
                    orthographic: z.object({
                        default: z.object({ position: z.object({ x: z.number(), y: z.number(), z: z.number() }), target: z.object({ x: z.number(), y: z.number(), z: z.number() }) }),
                    }),
                    active: z.number()
                }),
                controls: z.object({
                    orbit: z.object({
                        autoRotationSpeed: z.number(),
                        damping: z.number(),
                        enableAutoRotation: z.boolean(),
                        enableKeyPan: z.boolean(),
                        enablePan: z.boolean(),
                        enableRotation: z.boolean(),
                        enableZoom: z.boolean(),
                        input: z.object({ keys: z.object({ up: z.number(), down: z.number(), left: z.number(), right: z.number() }), mouse: z.object({ rotate: z.number(), zoom: z.number(), pan: z.number() }), touch: z.object({ rotate: z.number(), zoom: z.number(), pan: z.number() }), }),
                        keyPanSpeed: z.number(),
                        movementSmoothness: z.number(),
                        restrictions: z.object({
                            position: z.object({
                                cube: z.object({ min: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }), max: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }) }).optional(),
                                sphere: z.object({ center: z.object({ x: z.number(), y: z.number(), z: z.number() }), radius: z.number().nullable() }).optional(),
                            }).optional(),
                            target: z.object({
                                cube: z.object({ min: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }), max: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }) }).optional(),
                                sphere: z.object({ center: z.object({ x: z.number(), y: z.number(), z: z.number() }), radius: z.number().nullable() }).optional(),
                            }).optional(),
                            rotation: z.object({ minPolarAngle: z.number(), maxPolarAngle: z.number(), minAzimuthAngle: z.number().nullable(), maxAzimuthAngle: z.number().nullable() }).optional(),
                            zoom: z.object({ minDistance: z.number(), maxDistance: z.number().nullable() }).optional(),
                        }),
                        rotationSpeed: z.number(),
                        panSpeed: z.number(),
                        zoomSpeed: z.number(),
                    }),
                    fps: z.object({}),
                    orthographic: z.object({
                        damping: z.number(),
                        enableKeyPan: z.boolean(),
                        enablePan: z.boolean(),
                        enableZoom: z.boolean(),
                        input: z.object({ keys: z.object({ up: z.number(), down: z.number(), left: z.number(), right: z.number() }), mouse: z.object({ rotate: z.number(), zoom: z.number(), pan: z.number() }), touch: z.object({ rotate: z.number(), zoom: z.number(), pan: z.number() }), }),
                        keyPanSpeed: z.number(),
                        movementSmoothness: z.number(),
                        panSpeed: z.number(),
                        zoomSpeed: z.number(),
                    })
                }),
                enableCameraControls: z.boolean(),
                revertAtMouseUp: z.boolean(),
                revertAtMouseUpDuration: z.number(),
                zoomExtentsFactor: z.number().positive(),
            }),
            lights: z.object({
                helper: z.boolean().optional(),
                lightScene: z.string(),
                lightScenes: lightScenesSchema.nullable()
            }),
            material: z.object({
                environmentMap: z.union([z.string(), z.string().array()]),
                environmentMapAsBackground: z.boolean(),
                environmentMapResolution: z.enum(['256', '512', '1024', '2048'])
            }),
            render: z.object({
                ambientOcclusion: z.boolean(),
                beautyRenderDelay: z.number(),
                beautyRenderBlendingDuration: z.number().optional(),
                clearAlpha: z.number(),
                clearColor: z.string(),
                pointSize: z.number(),
                shadows: z.boolean(),
                sao: z.object({
                    samples: z.number().positive().optional(),
                    kernelRadius: z.number().positive().optional(),
                    intensity: z.number().positive().optional(),
                    standardDev: z.number().optional(),
                })
            }),
        }),
    }),
}).strict();

export const validate = (s: any): void => {
    const result = schema.parse(s);
    s = result;
}