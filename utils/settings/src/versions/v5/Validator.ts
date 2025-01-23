import { z } from "zod";

const cameraControlsSchema = z.object({
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
    enableAzimuthRotation: z.boolean(),
    enableObjectControls: z.boolean(),
    enablePolarRotation: z.boolean(),
    enableTurntableControls: z.boolean(),
    objectControlsCenter: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    turntableCenter: z.object({ x: z.number(), y: z.number(), z: z.number() })
});

const generalCameraSchema = z.object({
    name: z.string().optional(),
    type: z.string(),
    autoAdjust: z.boolean(),
    cameraMovementDuration: z.number(),
    controls: cameraControlsSchema,
    enableCameraControls: z.boolean(),
    position: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }),
    revertAtMouseUp: z.boolean(),
    revertAtMouseUpDuration: z.number(),
    target: z.object({ x: z.number().nullable(), y: z.number().nullable(), z: z.number().nullable() }),
    zoomExtentsFactor: z.number().positive(),
    sceneRotation: z.object({ x: z.number(), y: z.number() })
});

const perspectiveCameraSchema = generalCameraSchema.extend({
    fov: z.number().positive()
});

export const cameraSchema = z.record(z.union([perspectiveCameraSchema, generalCameraSchema]))


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

export const lightSchema = z.record(
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

const bloomEffectSchema = z.object({
    properties: z.object({
        blendFunction: z.number().optional(),
        intensity: z.number().optional(),
        kernelSize: z.number().optional(),
        luminanceSmoothing: z.number().optional(),
        luminanceThreshold: z.number().optional(),
        mipmapBlur: z.boolean(),
    }).optional(),
    type: z.string()
})

const chromaticAberrationEffectSchema = z.object({
    properties: z.object({
        blendFunction: z.number().optional(),
        modulationOffset: z.number().optional(),
        offset: z.object({ x: z.number(), y: z.number() }).optional(),
        radialModulation: z.boolean().optional(),
    }).optional(),
    type: z.string()
})

const depthOfFieldEffectSchema = z.object({
    properties: z.object({
        blendFunction: z.number().optional(),
        bokehScale: z.number().optional(),
        focusDistance: z.number().optional(),
        focusRange: z.number().optional(),
    }).optional(),
    type: z.string()
})

const dotScreenEffectSchema = z.object({
    properties: z.object({
        angle: z.number().optional(),
        blendFunction: z.number().optional(),
        scale: z.number().optional(),
    }).optional(),
    type: z.string()
})

const gridEffectSchema = z.object({
    properties: z.object({
        blendFunction: z.number().optional(),
        scale: z.number().optional(),
    }).optional(),
    type: z.string()
})

const hbaoEffectSchema = z.object({
    properties: z.object({
        resolutionScale: z.number().optional(),
        spp: z.number().optional(),
        distance: z.number().optional(),
        distanceIntensity: z.number().optional(),
        intensity: z.number().optional(),
        color: z.string().optional(),
        bias: z.number().optional(),
        thickness: z.number().optional(),
        iterations: z.number().optional(),
        radius: z.number().optional(),
        rings: z.number().optional(),
        lumaPhi: z.number().optional(),
        depthPhi: z.number().optional(),
        normalPhi: z.number().optional(),
        samples: z.number().optional(),
    }).optional(),
    type: z.string()
})

const hueSaturationEffectSchema = z.object({
    properties: z.object({
        blendFunction: z.number().optional(),
        hue: z.number().optional(),
        saturation: z.number().optional(),
    }).optional(),
    type: z.string()
})

const noiseEffectSchema = z.object({
    properties: z.object({
        blendFunction: z.number().optional(),
        premultiply: z.boolean().optional(),
    }).optional(),
    type: z.string()
})

const pixelationEffectSchema = z.object({
    properties: z.object({
        blendFunction: z.number().optional(),
        granularity: z.number().optional(),
    }).optional(),
    type: z.string()
})

const scanlineEffectSchema = z.object({
    properties: z.object({
        blendFunction: z.number().optional(),
        density: z.number().optional(),
    }).optional(),
    type: z.string()
})

const ssaoEffectSchema = z.object({
    properties: z.object({
        resolutionScale: z.number().optional(),
        spp: z.number().optional(),
        distance: z.number().optional(),
        distanceIntensity: z.number().optional(),
        intensity: z.number().optional(),
        color: z.string().optional(),
        iterations: z.number().optional(),
        radius: z.number().optional(),
        rings: z.number().optional(),
        lumaPhi: z.number().optional(),
        depthPhi: z.number().optional(),
        normalPhi: z.number().optional(),
        samples: z.number().optional(),
    }).optional(),
    type: z.string()
})

const tiltShiftEffectSchema = z.object({
    properties: z.object({
        blendFunction: z.number().optional(),
        feather: z.number().optional(),
        focusArea: z.number().optional(),
        kernelSize: z.number().optional(),
        offset: z.number().optional(),
        rotation: z.number().optional(),
    }).optional(),
    type: z.string()
})

const vignetteEffectSchema = z.object({
    properties: z.object({
        blendFunction: z.number().optional(),
        darkness: z.number().optional(),
        offset: z.number().optional(),
        technique: z.number().optional(),
    }).optional(),
    type: z.string()
})

export const postProcessingSchema = z.array(z.union([bloomEffectSchema, chromaticAberrationEffectSchema, depthOfFieldEffectSchema, dotScreenEffectSchema, gridEffectSchema, hbaoEffectSchema, hueSaturationEffectSchema, noiseEffectSchema, pixelationEffectSchema, scanlineEffectSchema, ssaoEffectSchema, tiltShiftEffectSchema, vignetteEffectSchema]))

export const arSettingsSchema = z.object({
    enable: z.boolean(),
    autoScaling: z.boolean(),
}).optional();

export const cameraSettingsSchema = z.object({
    cameraId: z.string(),
    cameras: cameraSchema
});

export const environmentSettingsSchema = z.object({
    clearAlpha: z.number(),
    clearColor: z.string(),
    map: z.union([z.string(), z.string().array()]),
    mapAsBackground: z.boolean(),
    mapResolution: z.string(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number(), w: z.number() }),
    blurriness: z.number(),
    intensity: z.number(),
});

export const environmentGeometrySettingsSchema = z.object({
    gridColor: z.string(),
    gridVisibility: z.boolean(),
    groundPlaneColor: z.string(),
    groundPlaneVisibility: z.boolean(),
    groundPlaneShadowColor: z.string(),
    groundPlaneShadowVisibility: z.boolean(),
});

export const generalSettingsSchema = z.object({
    transformation: z.object({
        scale: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        translation: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    }),
    blurWhenBusy: z.boolean(),
    commitSettings: z.boolean(),
    commitParameters: z.boolean(),
    pointSize: z.number(),
    showMessages: z.boolean(),
    defaultMaterialColor: z.string(),
});

export const lightSettingsSchema = z.object({
    lightSceneId: z.string().optional(),
    lightScenes: lightSchema,
});

export const postProcessingSettingsSchema = z.object({
    antiAliasingTechnique: z.string(),
    antiAliasingTechniqueMobile: z.string(),
    enablePostProcessingOnMobile: z.boolean(),
    ssaaSampleLevel: z.number(),
    effects: postProcessingSchema
});

export const renderingSettingsSchema = z.object({
    automaticColorAdjustment: z.boolean(),
    beautyRenderDelay: z.number(),
    beautyRenderBlendingDuration: z.number(),
    lights: z.boolean(),
    outputEncoding: z.string(),
    physicallyCorrectLights: z.boolean(),
    shadows: z.boolean(),
    softShadows: z.boolean(),
    textureEncoding: z.string(),
    toneMapping: z.string(),
    toneMappingExposure: z.number(),
});

export const sessionSettingsSchema = z.record(
    z.object({
        order: z.number().optional(),
        displayname: z.string().optional(),
        hidden: z.boolean().optional()
    })
);

const schema = z.object({
    build_date: z.string().optional(),
    build_version: z.string().optional(),
    settings_version: z.string(),
    ar: arSettingsSchema,
    camera: cameraSettingsSchema,
    environment: environmentSettingsSchema,
    environmentGeometry: environmentGeometrySettingsSchema,
    general: generalSettingsSchema,
    light: lightSettingsSchema,
    postprocessing: postProcessingSettingsSchema,
    rendering: renderingSettingsSchema,
    session: sessionSettingsSchema,
}).strict();

export const validate = (s: any): void => {
    const result = schema.parse(s);
    s = result;
}