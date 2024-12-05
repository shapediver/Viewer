#define PI 3.14159265358979323846264338327950288

varying vec2 vUv;

uniform highp sampler2D depthTexture;

uniform mat4 projectionViewMatrix;
uniform int frame;

uniform sampler2D blueNoiseTexture;
uniform vec2 blueNoiseRepeat;
uniform vec2 texSize;

uniform float aoDistance;
uniform float distancePower;
uniform float bias;
uniform float thickness;

#include <packing>
#include <sampleBlueNoise>

uniform float cameraNear;
uniform float cameraFar;
uniform mat4 cameraMatrixWorld;

#include <ao_utils>

// source: https://github.com/mrdoob/three.js/blob/342946c8392639028da439b6dc0597e58209c696/examples/js/shaders/SAOShader.js#L123
float getViewZ(const float depth) {
#ifdef PERSPECTIVE_CAMERA
    return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
#else
    return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
#endif
}

vec3 slerp(const vec3 a, const vec3 b, const float t) {
    float cosAngle = dot(a, b);
    float angle = acos(cosAngle);

    if (abs(angle) < 0.001) {
        return mix(a, b, t);
    }

    float sinAngle = sin(angle);
    float t1 = sin((1.0 - t) * angle) / sinAngle;
    float t2 = sin(t * angle) / sinAngle;

    return (a * t1) + (b * t2);
}

// source: https://www.shadertoy.com/view/cll3R4
vec3 cosineSampleHemisphere(const vec3 n, const vec2 u) {
    float r = sqrt(u.x);
    float theta = 2.0 * PI * u.y;

    vec3 b = normalize(cross(n, vec3(0.0, 1.0, 1.0)));
    vec3 t = cross(b, n);

    return normalize(r * sin(theta) * b + sqrt(1.0 - u.x) * n + r * cos(theta) * t);
}

void main() {
    float depth = textureLod(depthTexture, vUv, 0.0).r;
    vec3 normal = computeNormal(vUv);

    // filter out background
    if (depth == 1.0) {
        gl_FragColor = vec4(normal, 1.0);
        return;
    }

    vec4 cameraPosition = cameraMatrixWorld * vec4(0.0, 0.0, 0.0, 1.0);

    vec3 worldPos = computeWorldPosition(depth, vUv);
    vec3 screenSpaceNormal = getUnpackedNormal(vUv);

    float ao = 0.0, totalWeight = 0.0;

    for (int i = 0; i < spp; i++) {
        int seed = i;
        #ifdef animatedNoise
            seed += frame;
        #endif

        vec4 blueNoise = sampleBlueNoise(blueNoiseTexture, seed, blueNoiseRepeat, texSize);

        vec3 sampleWorldDir = cosineSampleHemisphere(normal, blueNoise.rg);

        vec3 sampleWorldPos = worldPos + aoDistance * pow(blueNoise.b, distancePower + 1.0) * sampleWorldDir;

        // Project the sample position to screen space
        vec4 sampleUv = projectionViewMatrix * vec4(sampleWorldPos, 1.);
        sampleUv.xy /= sampleUv.w;
        sampleUv.xy = sampleUv.xy * 0.5 + 0.5;

        // Get the depth of the sample position
        float sampleDepth = textureLod(depthTexture, sampleUv.xy, 0.0).r;

        if(sampleDepth < 1.0) {
            vec3 sampleNormal = getUnpackedNormal(sampleUv.xy);

            // Compute the horizon line
            float deltaDepth = depth - sampleDepth;

            // distance based bias
            float d = distance(sampleWorldPos, cameraPosition.xyz) / aoDistance;
            deltaDepth *= 0.001 * d * d;

            float th = thickness * 0.01;

            float theta = dot(normal, sampleWorldDir);
            totalWeight += theta;

            if (deltaDepth < th) {


                float horizon = sampleDepth + deltaDepth * bias * 1000.;

                float occlusion = max(0.0, horizon - depth) * theta;

                float m = max(0., 1. - deltaDepth / th);
                occlusion = 10. * occlusion * m / d;

                occlusion = max(0.0, occlusion);
                
                // check if the normals are in the same direction
                float dotProduct = dot(screenSpaceNormal, sampleNormal);
                if (dotProduct < 0.9999) {
                    
                    occlusion = sqrt(occlusion);
                    ao += occlusion;
                } else {
                    if(areDepthsOnSamePlane(depth, sampleDepth, vUv, sampleUv.xy, screenSpaceNormal, 0.1)) {
                        // occluded += 0.0;
                        // totalWeight += 1.0;
                    } else {
                    
                        occlusion = sqrt(occlusion);
                        ao += occlusion;
                    }
                }
            }
        }
    }

    if (totalWeight > 0.) ao /= totalWeight;

    // clamp ao to [0, 1]
    ao = clamp(1. - ao, 0., 1.);

    gl_FragColor = vec4(normal, ao);
}