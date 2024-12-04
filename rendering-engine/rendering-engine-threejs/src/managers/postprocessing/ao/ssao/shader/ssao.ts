export const ssao = `
varying vec2 vUv;

uniform highp sampler2D depthTexture;
uniform sampler2D normalTexture;
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

void main() {
    float depth = textureLod(depthTexture, vUv, 0.).x;
    vec3 normal = computeNormal(vUv);

    // filter out background
    if (depth == 1.0) {
        gl_FragColor = vec4(normal, 1.0);
        return;
    }

    vec3 worldPos = computeWorldPosition(depth, vUv, true);
    vec3 screenSpaceNormal = normalize(textureLod(normalTexture, vUv, 0.0).xyz);

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

        vec3 sampleNormal = textureLod(normalTexture, offset.xy, 0.0).xyz;

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
            vec3 worldPosSample = computeWorldPosition(sampleDepth, vUv, true);

            if(areDepthsOnSamePlane(depth, sampleDepth, vUv, offset.xy, normal, 0.001)) {
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
`;