export const poissionDenoise = `
varying vec2 vUv;

uniform sampler2D inputTexture;
uniform highp sampler2D depthTexture;
uniform sampler2D normalTexture;
uniform mat4 projectionMatrixInverse;
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

vec3 getWorldPos(float depth, vec2 coord) {
    float z = depth * 2.0 - 1.0;
    vec4 clipSpacePosition = vec4(coord * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = projectionMatrixInverse * clipSpacePosition;

    // Perspective division
    vec4 worldSpacePosition = cameraMatrixWorld * viewSpacePosition;
    worldSpacePosition.xyz /= worldSpacePosition.w;
    return worldSpacePosition.xyz;
}

#define luminance(a) dot(vec3(0.2125, 0.7154, 0.0721), a)

vec3 getNormal(vec2 uv, vec4 texel) {
#ifdef NORMAL_IN_RGB
    // in case the normal is stored in the RGB channels of the texture
    return texel.rgb;
#else
    return normalize(texture2D(normalTexture, uv).xyz * 2.0 - 1.0);
#endif
}

float distToPlane(const vec3 worldPos, const vec3 neighborWorldPos, const vec3 worldNormal) {
    vec3 toCurrent = worldPos - neighborWorldPos;
    float distToPlane = abs(dot(toCurrent, worldNormal));

    return distToPlane;
}

void main() {
    #if __VERSION__ < 130
        initializePoissonDisk();
    #endif

    #if __VERSION__ >= 130 // GLSL 3.0 or higher
        vec4 depthTexel = textureLod(depthTexture, vUv, 0.);
    #else // GLSL 1.0
        vec4 depthTexel = texture2D(depthTexture, vUv);
    #endif

    if (depthTexel.r == 1.0 || dot(depthTexel.rgb, depthTexel.rgb) == 0.) {
        discard;
        return;
    }

    #if __VERSION__ >= 130 // GLSL 3.0 or higher
        vec4 texel = textureLod(inputTexture, vUv, 0.0);
    #else // GLSL 1.0
        vec4 texel = texture2D(inputTexture, vUv);
    #endif

    vec3 normal = getNormal(vUv, texel);

#ifdef NORMAL_IN_RGB
    float denoised = texel.a;
    float center = texel.a;
#else
    vec3 denoised = texel.rgb;
    vec3 center = texel.rgb;
#endif

    float depth = depthTexel.x;
    vec3 worldPos = getWorldPos(depth, vUv);

    float totalWeight = 1.0;

    vec4 blueNoise = sampleBlueNoise(blueNoiseTexture, 0, blueNoiseRepeat, resolution);

    #if __VERSION__ >= 130 // GLSL 3.0 or higher
        float angle = blueNoise[index];
    #else // GLSL 1.0
        float angle;
        if (index == 0) {
            angle = blueNoise[0];
        } else if (index == 1) {
            angle = blueNoise[1];
        } else if (index == 2) {
            angle = blueNoise[2];
        } else if (index == 3) {
            angle = blueNoise[3];
        }
    #endif

    float s = sin(angle), c = cos(angle);

    mat2 rotationMatrix = mat2(c, -s, s, c);

    for (int i = 0; i < samples; i++) {
        vec2 offset = rotationMatrix * poissonDisk[i];
        vec2 neighborUv = vUv + offset;

        #if __VERSION__ >= 130 // GLSL 3.0 or higher
            vec4 neighborTexel = textureLod(inputTexture, neighborUv, 0.0);
        #else // GLSL 1.0
            vec4 neighborTexel = texture2D(inputTexture, neighborUv);
        #endif

        vec3 neighborNormal = getNormal(neighborUv, neighborTexel);
#ifdef NORMAL_IN_RGB
        float neighborColor = neighborTexel.a;
#else
        vec3 neighborColor = neighborTexel.rgb;
#endif

        #if __VERSION__ >= 130 // GLSL 3.0 or higher
            float sampleDepth = textureLod(depthTexture, neighborUv, 0.0).x;
        #else // GLSL 1.0
            float sampleDepth = texture2D(depthTexture, neighborUv).x;
        #endif

        vec3 worldPosSample = getWorldPos(sampleDepth, neighborUv);
        float tangentPlaneDist = abs(dot(worldPos - worldPosSample, normal));

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

    if (totalWeight > 0.) denoised /= totalWeight;

#ifdef NORMAL_IN_RGB
    gl_FragColor = vec4(normal, denoised);
#else
    gl_FragColor = vec4(denoised, 1.);
#endif
}
`;