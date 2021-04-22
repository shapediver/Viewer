export const main = `

uniform float lightSizeUV;
uniform float blending;

#ifdef SHADOWMAP_TYPE_PCF

#define NEAR_PLANE 0.1
#define NUM_SAMPLES 20
#define NUM_RINGS 11

vec2 poissonDisk[NUM_SAMPLES];

void initPoissonSamples( const in vec2 randomSeed ) {
    float ANGLE_STEP = PI2 * float(NUM_RINGS) / float(NUM_SAMPLES);
    float INV_NUM_SAMPLES = 1.0 / float(NUM_SAMPLES);

    // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
    float angle = rand(randomSeed) * PI2;
    float radius = INV_NUM_SAMPLES;
    float radiusStep = radius;

    for (int i = 0; i < int(NUM_SAMPLES); i++ ) {
        poissonDisk[i] = vec2(cos(angle), sin(angle)) * pow(radius, 0.75);
        radius += radiusStep;
        angle += ANGLE_STEP;
    }
}

float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
    return (zReceiver - zBlocker) / zBlocker;
}

float findBlocker(sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {
    // This uses similar triangles to compute what
    // area of the shadow map we should search
    float searchRadius = lightSizeUV * (zReceiver - NEAR_PLANE) / zReceiver;
    float blockerDepthSum = 0.0;
    int numBlockers = 0;

    for (int i = 0; i < int(NUM_SAMPLES); i++ ) {
        float shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
        if (shadowMapDepth < zReceiver) {
            blockerDepthSum += shadowMapDepth;
            numBlockers++;
        }
    }

    if (numBlockers == 0) return -1.0;

    return blockerDepthSum / float(numBlockers);
}

float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius) {
    float sum = 0.0;
    for (int i = 0; i < int(NUM_SAMPLES); i++ ) {
        float depth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * filterRadius));
        if (zReceiver <= depth) sum += 1.0;
    }
    for (int i = 0; i < int(NUM_SAMPLES); i++ ) {
        float depth = unpackRGBAToDepth(texture2D(shadowMap, uv + -poissonDisk[i].yx * filterRadius));
        if (zReceiver <= depth) sum += 1.0;
    }
    return sum / (2.0 * float(NUM_SAMPLES));
}

float PCSS(sampler2D shadowMap, vec4 coords) {
    vec2 uv = coords.xy;
    float zReceiver = coords.z; // Assumed to be eye-space z in this code

    initPoissonSamples(uv);
    // STEP 1: blocker search
    float avgBlockerDepth = findBlocker(shadowMap, uv, zReceiver);

    //There are no occluders so early out (this saves filtering)
    if (avgBlockerDepth == -1.0) return 1.0;

    // STEP 2: penumbra size
    float penumbraRatio = penumbraSize(zReceiver, avgBlockerDepth);
    float filterRadius = penumbraRatio * lightSizeUV * NEAR_PLANE / zReceiver;

    // STEP 3: filtering
    //return avgBlockerDepth;
    return PCF_Filter(shadowMap, uv, zReceiver, filterRadius);
}
#endif
`;

export const entry = `
// PCSS implementation
vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
float dx = texelSize.x;
float dy = texelSize.y;
vec2 uv = shadowCoord.xy;
vec2 f = fract( uv * shadowMapSize + 0.5 );
uv -= f * texelSize;
float shadow1 = (
    texture2DCompare( shadowMap, uv, shadowCoord.z ) +
    texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
    texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
    texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
    mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ), 
         texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
         f.x ) +
    mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ), 
         texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
         f.x ) +
    mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ), 
         texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
         f.y ) +
    mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ), 
         texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
         f.y ) +
    mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ), 
              texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
              f.x ),
         mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ), 
              texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
              f.x ),
         f.y )
) * ( 1.0 / 9.0 );
float shadow2 = PCSS( shadowMap, shadowCoord );
shadow = shadow1 * (1.0 - blending) + blending * shadow2;
            `