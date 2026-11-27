export const ssao = `
varying vec2 vUv;

uniform highp sampler2D depthTexture;
uniform mat4 projectionViewMatrix;
uniform mat4 cameraMatrixWorld;

uniform sampler2D blueNoiseTexture;
uniform vec2 blueNoiseRepeat;
uniform vec2 texSize;
uniform float aoDistance;
uniform float distancePower;
uniform float cameraNear;
uniform float cameraFar;
uniform int frame;
uniform float saoRadius;
uniform bool saoOrthographic;

uniform vec3[spp] samples;
uniform float[spp] samplesR;

#include <common>
#include <packing>
#include <sampleBlueNoise>
#include <ao_utils>

highp float linearize_depth(highp float d, highp float zNear, highp float zFar) {
    highp float z_n = 2.0 * d - 1.0;
    return 2.0 * zNear * zFar / (zFar + zNear - z_n * (zFar - zNear));
}

#ifndef SAO

void main() {
    float depth = textureLod(depthTexture, vUv, 0.).x;
    vec3 normal = computeNormal(vUv);

    // filter out background
    if (depth == 1.0) {
        gl_FragColor = vec4(normal, 1.0);
        return;
    }

    vec3 worldPos = computeWorldPosition(depth, vUv);
    vec3 screenSpaceNormal = getUnpackedNormal(vUv);

    #ifdef animatedNoise
        int seed = frame;
    #else
        int seed = 0;
    #endif

    vec4 noise = sampleBlueNoise(blueNoiseTexture, seed, blueNoiseRepeat, texSize);

    vec3 randomVec = normalize(noise.rgb * 2.0 - 1.0);
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 tbn = mat3(tangent, bitangent, normal);

    float occluded = 0.0;
    float totalWeight = 0.0;

    vec3 samplePos;

    float sppF = float(spp);

    for (float i = 0.0; i < sppF; i++) {
        vec3 sampleDirection = tbn * samples[int(i)];

        // make sure sample direction is in the same hemisphere as the normal
        if (dot(sampleDirection, normal) < 0.0) sampleDirection *= -1.0;

        float moveAmt = samplesR[int(mod(i + noise.a * sppF, sppF))];
        samplePos = worldPos + aoDistance * moveAmt * sampleDirection;

        vec4 offset = projectionViewMatrix * vec4(samplePos, 1.0);
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;

        float sampleDepth = textureLod(depthTexture, offset.xy, 0.0).x;

        if(sampleDepth == 1.0) {
            occluded += 0.0;
            totalWeight += 1.0;
            continue;
        }

        vec3 sampleNormal = getUnpackedNormal(offset.xy);

        float distSample = linearize_depth(sampleDepth, cameraNear, cameraFar);
        float distWorld = linearize_depth(offset.z, cameraNear, cameraFar);

        float depthBias = 0.001;
        float rangeCheck = smoothstep(0.0, 1.0, aoDistance / (abs(distSample - distWorld) + depthBias));
        rangeCheck = pow(rangeCheck, distancePower);
        rangeCheck = clamp(rangeCheck, 0.0, 1.0);
        float weight = dot(sampleDirection, normal);
        weight = clamp(weight, 0.0, 1.0);

        
        // check if the normals are in the same direction
        float dotProduct = dot(screenSpaceNormal, normalize(sampleNormal));
        if (dotProduct < 0.9999) {
            occluded += rangeCheck * weight * (distSample < distWorld ? 1.0 : 0.0);
            totalWeight += weight;
        } else {
            if(areDepthsOnSamePlane(depth, sampleDepth, vUv, offset.xy, normal, 0.1)) {
                occluded += 0.0;
                totalWeight += 1.0;
            } else {
                occluded += rangeCheck * weight * (distSample < distWorld ? 1.0 : 0.0);
                totalWeight += weight;
            }
        }
    }

    float occ = clamp(1.0 - occluded / totalWeight, 0.0, 1.0);
    gl_FragColor = vec4(normal, occ);
}

#else

// Scalable Ambient Obscurance (McGuire et al. 2012, as in three.js's SAOShader)
#define SAO_SAMPLES 11
#define SAO_SPIRAL_TURNS 3
#define SAO_BIAS 0.001
#define SAO_EPSILON 0.001
#define SAO_FALLOFF 1.3
#define SAO_INTENSITY 0.25

void main() {
    float depth = textureLod(depthTexture, vUv, 0.).x;
    vec3 normal = computeNormal(vUv);

    // filter out background
    if (depth == 1.0) {
        gl_FragColor = vec4(normal, 1.0);
        return;
    }

    // no radius, no occlusion
    if (saoRadius <= 0.0) {
        gl_FragColor = vec4(normal, 1.0);
        return;
    }

    // view-space position and the shading normal of the normal pass (view space)
    vec3 centerPosition = (viewMatrix * vec4(computeWorldPosition(depth, vUv), 1.0)).xyz;
    vec3 centerNormal = getUnpackedNormal(vUv);
    vec4 noise = sampleBlueNoise(blueNoiseTexture, 0, blueNoiseRepeat, texSize);
    float randomAngle = 6.2 * noise.r;

    // pixels per world unit at distance 1, and the radius of the sample spiral in pixels
    float projectionScale = 0.5 * texSize.y / projectionMatrixInverse[1][1];
    float screenRadius = 0.09 * projectionScale * saoRadius / (saoOrthographic ? 1.0 : -centerPosition.z);

    float sum = 0.0;
    for (int i = 0; i < SAO_SAMPLES; i++) {
        float t = (float(i) + mod(randomAngle, 1.0) + 0.5) / float(SAO_SAMPLES);
        float angle = t * (float(SAO_SPIRAL_TURNS) * 6.28318) + randomAngle;
        vec2 sampleUv = vUv + floor(t * screenRadius * vec2(cos(angle), sin(angle))) / texSize;
        float sampleDepth = textureLod(depthTexture, sampleUv, 0.).x;
        vec3 v = (viewMatrix * vec4(computeWorldPosition(sampleDepth, sampleUv), 1.0)).xyz - centerPosition;
        float vv = dot(v, v) / (saoRadius * saoRadius);
        sum += max((dot(centerNormal, v) / saoRadius - SAO_BIAS) / (SAO_FALLOFF * vv + SAO_EPSILON), 0.0);
    }

    float occ = clamp(1.0 - max(sum * SAO_INTENSITY / float(SAO_SAMPLES), 0.0), 0.0, 1.0);
    gl_FragColor = vec4(normal, occ);
}

#endif
`;
