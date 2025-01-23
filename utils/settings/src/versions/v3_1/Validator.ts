import { z } from "zod";

const orbitControlsSchema = z.object({
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
            cube: z.object({ min: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }), max: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }) }),
            sphere: z.object({ center: z.object({ x: z.number(), y: z.number(), z: z.number() }), radius: z.number().nullable() }),
        }),
        target: z.object({
            cube: z.object({ min: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }), max: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }) }),
            sphere: z.object({ center: z.object({ x: z.number(), y: z.number(), z: z.number() }), radius: z.number().nullable() }),
        }),
        rotation: z.object({ minPolarAngle: z.number(), maxPolarAngle: z.number(), minAzimuthAngle: z.number().nullable(), maxAzimuthAngle: z.number().nullable() }),
        zoom: z.object({ minDistance: z.number(), maxDistance: z.number().nullable() }),
    }),
    rotationSpeed: z.number(),
    panSpeed: z.number(),
    zoomSpeed: z.number(),
});

const orthographicControlsSchema = z.object({
    damping: z.number(),
    enableKeyPan: z.boolean(),
    enablePan: z.boolean(),
    enableZoom: z.boolean(),
    input: z.object({ keys: z.object({ up: z.number(), down: z.number(), left: z.number(), right: z.number() }), mouse: z.object({ rotate: z.number(), zoom: z.number(), pan: z.number() }), touch: z.object({ rotate: z.number(), zoom: z.number(), pan: z.number() }), }),
    keyPanSpeed: z.number(),
    movementSmoothness: z.number(),
    panSpeed: z.number(),
    zoomSpeed: z.number(),
});

const orthographicCameraSchema = z.object({
    name: z.string().optional(),
    type: z.string(),
    autoAdjust: z.boolean(),
    cameraMovementDuration: z.number(),
    controls: orthographicControlsSchema,
    enableCameraControls: z.boolean(),
    position: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }),
    revertAtMouseUp: z.boolean(),
    revertAtMouseUpDuration: z.number(),
    target: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }),
    zoomExtentsFactor: z.number().positive(),
});

const perspectiveCameraSchema = z.object({
    name: z.string().optional(),
    type: z.string(),
    autoAdjust: z.boolean(),
    cameraMovementDuration: z.number(),
    controls: orbitControlsSchema,
    enableCameraControls: z.boolean(),
    fov: z.number().positive(),
    position: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }),
    revertAtMouseUp: z.boolean(),
    revertAtMouseUpDuration: z.number(),
    target: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }),
    zoomExtentsFactor: z.number().positive(),
});

const cameraSchema = z.record(z.union([perspectiveCameraSchema, orthographicCameraSchema]))


const ambientLightSchema = z.object({
    color: z.union([z.number(), z.string()]),
    intensity: z.number()
})

const directionalLightSchema = z.object({
    color: z.union([z.number(), z.string()]),
    intensity: z.number(),
    direction: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    castShadow: z.boolean(),
    shadowMapResolution: z.number().optional(),
    shadowMapBias: z.number().optional()
})

const hemisphereLightSchema = z.object({
    skyColor: z.union([z.number(), z.string()]),
    intensity: z.number(),
    groundColor: z.union([z.number(), z.string()]),
})

const pointLightSchema = z.object({
    color: z.union([z.number(), z.string()]),
    intensity: z.number(),
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    distance: z.number(),
    decay: z.number(),
})

const spotLightSchema = z.object({
    color: z.union([z.number(), z.string()]),
    intensity: z.number(),
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    target: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    distance: z.number(),
    decay: z.number(),
    angle: z.number(),
    penumbra: z.number(),
})

const lightSchema = z.record(
    z.object({
        name: z.string().optional(),
        lights: z.record(
            z.object({
                name: z.string().optional(),
                type: z.string(),
                order: z.number().optional(),
                properties: z.union([ambientLightSchema, directionalLightSchema, hemisphereLightSchema, pointLightSchema, spotLightSchema])
            })
        )
    })
);


const schema = z.object({
    build_date: z.string().optional(),
    build_version: z.string().optional(),
    settings_version: z.string(),
    ar: z.object({
        enable: z.boolean(),
        autoScaling: z.boolean(),
    }).optional(),
    camera: z.object({
        cameraId: z.string(),
        cameras: cameraSchema
    }),
    environment: z.object({
        clearAlpha: z.number(),
        clearColor: z.string(),
        map: z.union([z.string(), z.string().array()]),
        mapAsBackground: z.boolean(),
        mapResolution: z.string()
    }),
    environmentGeometry: z.object({
        gridColor: z.string(),
        gridVisibility: z.boolean(),
        groundPlaneColor: z.string(),
        groundPlaneVisibility: z.boolean(),
    }),
    general: z.object({
        transformation: z.object({
            scale: z.object({ x: z.number(), y: z.number(), z: z.number() }),
            translation: z.object({ x: z.number(), y: z.number(), z: z.number() }),
            rotation: z.object({ x: z.number(), y: z.number(), z: z.number() })
        }),
        blurWhenBusy: z.boolean(),
        commitSettings: z.boolean(),
        commitParameters: z.boolean(),
        pointSize: z.number(),
        showMessages: z.boolean(),
    }),
    light: z.object({
        lightSceneId: z.string().optional(),
        lightScenes: lightSchema,
    }),
    rendering: z.object({
        ambientOcclusion: z.boolean(),
        ambientOcclusionIntensity: z.number().min(0),
        beautyRenderDelay: z.number(),
        beautyRenderBlendingDuration: z.number(),
        outputEncoding: z.string(),
        physicallyCorrectLights: z.boolean(),
        shadows: z.boolean(),
        textureEncoding: z.string(),
        toneMapping: z.string(),
        toneMappingExposure: z.number(),
    }),
    session: z.record(
        z.object({
            order: z.number().optional(),
            displayname: z.string().optional(),
            hidden: z.boolean().optional()
        })
    ),
}).strict();

export const validate = (s: any): void => {
    const result = schema.parse(s);
    s = result;
}