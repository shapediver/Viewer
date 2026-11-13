export const poissionDenoise = `
varying vec2 vUv;

uniform sampler2D inputTexture;
uniform highp sampler2D depthTexture;
uniform highp sampler2D normalTexture;
uniform mat4 projectionMatrixInverse;
uniform mat4 viewMatrixInverse;
uniform mat4 cameraMatrixWorld;
uniform float lumaPhi;
uniform float depthPhi;
uniform float normalPhi;
uniform float distance;
uniform sampler2D blueNoiseTexture;
uniform vec2 blueNoiseRepeat;
uniform int index;
uniform vec2 resolution;

#include <common>
#include <sampleBlueNoise>

vec3 computeWorldPosition(float depth, vec2 coord, bool useCameraMatrixWorld) {
    // Convert depth to normalized device coordinates (NDC)
    float z = depth * 2.0 - 1.0;
    vec4 clipSpacePosition = vec4(coord * 2.0 - 1.0, z, 1.0);

    // Transform to view space
    vec4 viewSpacePosition = projectionMatrixInverse * clipSpacePosition;

    // Perspective division
    viewSpacePosition /= viewSpacePosition.w;

    // Transform to world space using the selected method
    vec4 worldSpacePosition;
    if (useCameraMatrixWorld) {
        // Use cameraMatrixWorld directly
        worldSpacePosition = cameraMatrixWorld * viewSpacePosition;
    } else {
        // Use viewMatrixInverse
        worldSpacePosition = viewMatrixInverse * viewSpacePosition;
    }

    return worldSpacePosition.xyz;
}

#define luminance(a) dot(vec3(0.2125, 0.7154, 0.0721), a)

vec3 getNormal(vec2 uv, vec4 texel) {
#ifdef NORMAL_IN_RGB
    // in case the normal is stored in the RGB channels of the texture
    return texel.rgb;
#else
    return normalize(textureLod(normalTexture, uv, 0.).xyz * 2.0 - 1.0);
#endif
}

float distToPlane(const vec3 worldPos, const vec3 neighborWorldPos, const vec3 worldNormal) {
    vec3 toCurrent = worldPos - neighborWorldPos;
    float distToPlane = abs(dot(toCurrent, worldNormal));

    return distToPlane;
}

#ifdef UPSAMPLE
// The input is smaller than the output. Each input texel is one depth
// sample of one surface, so it is read at its own center and compared with
// the depth at that center. The normal of the output pixel comes from the
// full size depth, not from the input.
uniform vec2 inputSize;

vec2 inputTexelCenter(vec2 uv) {
    return (floor(uv * inputSize) + 0.5) / inputSize;
}

vec3 normalFromDepth(vec2 uv) {
    vec2 size = vec2(textureSize(depthTexture, 0));
    ivec2 p = ivec2(uv * size);
    float c0 = texelFetch(depthTexture, p, 0).x;
    float l2 = texelFetch(depthTexture, p - ivec2(2, 0), 0).x;
    float l1 = texelFetch(depthTexture, p - ivec2(1, 0), 0).x;
    float r1 = texelFetch(depthTexture, p + ivec2(1, 0), 0).x;
    float r2 = texelFetch(depthTexture, p + ivec2(2, 0), 0).x;
    float b2 = texelFetch(depthTexture, p - ivec2(0, 2), 0).x;
    float b1 = texelFetch(depthTexture, p - ivec2(0, 1), 0).x;
    float t1 = texelFetch(depthTexture, p + ivec2(0, 1), 0).x;
    float t2 = texelFetch(depthTexture, p + ivec2(0, 2), 0).x;
    float dl = abs((2.0 * l1 - l2) - c0);
    float dr = abs((2.0 * r1 - r2) - c0);
    float db = abs((2.0 * b1 - b2) - c0);
    float dt = abs((2.0 * t1 - t2) - c0);
    vec3 ce = computeWorldPosition(c0, uv, true);
    vec3 dpdx = (dl < dr) ? ce - computeWorldPosition(l1, uv - vec2(1.0 / size.x, 0.0), true)
                          : -ce + computeWorldPosition(r1, uv + vec2(1.0 / size.x, 0.0), true);
    vec3 dpdy = (db < dt) ? ce - computeWorldPosition(b1, uv - vec2(0.0, 1.0 / size.y), true)
                          : -ce + computeWorldPosition(t1, uv + vec2(0.0, 1.0 / size.y), true);
    return normalize(cross(dpdx, dpdy));
}
#endif

void main() {
    vec4 depthTexel = textureLod(depthTexture, vUv, 0.);
    #ifdef UPSAMPLE
        vec2 centerUv = inputTexelCenter(vUv);
        vec4 texel = textureLod(inputTexture, centerUv, 0.0);
        vec3 normal = normalFromDepth(vUv);
    #else
        vec4 texel = textureLod(inputTexture, vUv, 0.0);
        vec3 normal = getNormal(vUv, texel);
    #endif

    if (depthTexel.r == 1.0 || dot(depthTexel.rgb, depthTexel.rgb) == 0.) {
        #ifdef NORMAL_IN_RGB
            gl_FragColor = vec4(normal, 1.0);
        #else
            gl_FragColor = vec4(1.0);
        #endif

        return;
    }

    #ifdef NORMAL_IN_RGB
        float inputTexel = texel.a;
        float center = texel.a;
    #else
        vec3 inputTexel = texel.rgb;
        vec3 center = texel.rgb;
    #endif

    float depth = depthTexel.x;
    vec3 worldPos = computeWorldPosition(depth, vUv, true);

    float totalWeight = 1.0;

    vec4 blueNoise = sampleBlueNoise(blueNoiseTexture, 0, blueNoiseRepeat, resolution);
    float angle = blueNoise[index];

    float s = sin(angle), c = cos(angle);

    mat2 rotationMatrix = mat2(c, -s, s, c);

    
    #ifdef NORMAL_IN_RGB
        float denoised = inputTexel;
    #else
        vec3 denoised = inputTexel;
    #endif

    #ifdef UPSAMPLE
        // the nearest input texel can lie on another surface, so it is
        // weighted like a neighbor instead of being taken as it is
        float centerDepth = textureLod(depthTexture, centerUv, 0.0).x;
        vec3 centerWorldPos = computeWorldPosition(centerDepth, centerUv, true);
        totalWeight = centerDepth < 1.0
            ? pow(max(dot(normal, texel.rgb), 0.), normalPhi) *
                max(1. - (distToPlane(worldPos, centerWorldPos, normal) / distance), 0.)
            : 0.0;
        denoised = totalWeight * inputTexel;
    #endif

    for (int i = 0; i < samples; i++) {
        vec2 offset = rotationMatrix * poissonDisk[i];
        vec2 neighborUv = vUv + offset;
        #ifdef UPSAMPLE
            neighborUv = inputTexelCenter(neighborUv);
        #endif

        vec4 neighborTexel = textureLod(inputTexture, neighborUv, 0.0);

        vec3 neighborNormal = getNormal(neighborUv, neighborTexel);
        #ifdef NORMAL_IN_RGB
            float neighborColor = neighborTexel.a;
        #else
            vec3 neighborColor = neighborTexel.rgb;
        #endif

        float sampleDepth = textureLod(depthTexture, neighborUv, 0.0).x;

        vec3 worldPosSample = computeWorldPosition(sampleDepth, neighborUv, true);
        float tangentPlaneDist = abs(dot(worldPos - worldPosSample, normal));

        if (sampleDepth < 1.0) {
            float normalDiff = dot(normal, neighborNormal);
            float normalSimilarity = pow(max(normalDiff, 0.), normalPhi);

            #ifdef NORMAL_IN_RGB
                float lumaDiff = abs(neighborColor - center);
            #else
                float lumaDiff = abs(luminance(neighborColor) - luminance(center));
            #endif
            float lumaSimilarity = max(1.0 - lumaDiff / lumaPhi, 0.0);

            float depthDiff = 1. - (distToPlane(worldPos, worldPosSample, normal) / distance);
            float depthSimilarity = max(depthDiff / depthPhi, 0.);

            float w = lumaSimilarity * depthSimilarity * normalSimilarity;

            denoised += w * neighborColor;
            totalWeight += w;
        }
    }

    #ifdef UPSAMPLE
        // no input texel lies on this surface: keep the nearest one
        if (totalWeight < 0.0001) {
            denoised = inputTexel;
            totalWeight = 1.0;
        }
    #endif

    if (totalWeight > 0.) denoised /= totalWeight;

    #ifdef NORMAL_IN_RGB
        gl_FragColor = vec4(normal, denoised);
    #else
        gl_FragColor = vec4(denoised, 1.);
    #endif
}
`;
