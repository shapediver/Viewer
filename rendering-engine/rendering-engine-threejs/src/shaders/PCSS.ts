export const main = `

// PCSS implementation
uniform float lightSizeUV;
uniform float blending;

#if defined( SHADOWMAP_TYPE_BASIC )

#define PCSS_NEAR_PLANE 0.1
#define PCSS_NUM_SAMPLES 20
#define PCSS_NUM_RINGS 11

vec2 pcssPoissonDisk[PCSS_NUM_SAMPLES];

void initPCSSPoissonSamples( const in vec2 randomSeed ) {
    float angleStep = PI2 * float( PCSS_NUM_RINGS ) / float( PCSS_NUM_SAMPLES );
    float invNumSamples = 1.0 / float( PCSS_NUM_SAMPLES );

    float angle = rand( randomSeed ) * PI2;
    float radius = invNumSamples;
    float radiusStep = radius;

    for ( int i = 0; i < PCSS_NUM_SAMPLES; i ++ ) {
        pcssPoissonDisk[ i ] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
        radius += radiusStep;
        angle += angleStep;
    }
}

float getPCSSDepth( sampler2D shadowMap, const in vec2 uv ) {
    float depth = texture2D( shadowMap, uv ).r;

    #ifdef USE_REVERSED_DEPTH_BUFFER
        depth = 1.0 - depth;
    #endif

    return depth;
}

float getPCSSDepthCompare( sampler2D shadowMap, const in vec2 uv, const in float compare ) {
    return step( compare, getPCSSDepth( shadowMap, uv ) );
}

float findPCSSBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {
    float searchRadius = lightSizeUV * ( zReceiver - PCSS_NEAR_PLANE ) / max( zReceiver, 0.0001 );
    float blockerDepthSum = 0.0;
    int numBlockers = 0;

    for ( int i = 0; i < PCSS_NUM_SAMPLES; i ++ ) {
        float shadowMapDepth = getPCSSDepth( shadowMap, uv + pcssPoissonDisk[ i ] * searchRadius );
        if ( shadowMapDepth < zReceiver ) {
            blockerDepthSum += shadowMapDepth;
            numBlockers ++;
        }
    }

    if ( numBlockers == 0 ) return -1.0;

    return blockerDepthSum / float( numBlockers );
}

float getPCSSFilteredShadow( sampler2D shadowMap, const in vec2 uv, const in float zReceiver, const in float filterRadius ) {
    float shadow = 0.0;

    for ( int i = 0; i < PCSS_NUM_SAMPLES; i ++ ) {
        shadow += getPCSSDepthCompare( shadowMap, uv + pcssPoissonDisk[ i ] * filterRadius, zReceiver );
    }
    for ( int i = 0; i < PCSS_NUM_SAMPLES; i ++ ) {
        shadow += getPCSSDepthCompare( shadowMap, uv - pcssPoissonDisk[ i ].yx * filterRadius, zReceiver );
    }

    return shadow / ( 2.0 * float( PCSS_NUM_SAMPLES ) );
}

float getPCSSShadow( sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {
    initPCSSPoissonSamples( uv );

    float avgBlockerDepth = findPCSSBlocker( shadowMap, uv, zReceiver );
    if ( avgBlockerDepth == -1.0 ) return 1.0;

    float penumbraRatio = ( zReceiver - avgBlockerDepth ) / max( avgBlockerDepth, 0.0001 );
    float filterRadius = penumbraRatio * lightSizeUV * PCSS_NEAR_PLANE / max( zReceiver, 0.0001 );

    return getPCSSFilteredShadow( shadowMap, uv, zReceiver, filterRadius );
}

#endif
`;

export const getShadow = `
float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
    float shadow = 1.0;

    shadowCoord.xyz /= shadowCoord.w;

    #ifdef USE_REVERSED_DEPTH_BUFFER
        shadowCoord.z -= shadowBias;
    #else
        shadowCoord.z += shadowBias;
    #endif

    bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
    bool frustumTest = inFrustum && shadowCoord.z <= 1.0;

    if ( frustumTest ) {
        vec2 texelSize = vec2( 1.0 / 1024.0 );
        float dx = texelSize.x;
        float dy = texelSize.y;
        vec2 uv = shadowCoord.xy;
        vec2 f = fract( uv * shadowMapSize + 0.5 );
        uv -= f * texelSize;

        float pcfShadow = (
            getPCSSDepthCompare( shadowMap, uv, shadowCoord.z ) +
            getPCSSDepthCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
            getPCSSDepthCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
            getPCSSDepthCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
            mix( getPCSSDepthCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
                 getPCSSDepthCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
                 f.x ) +
            mix( getPCSSDepthCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
                 getPCSSDepthCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
                 f.x ) +
            mix( getPCSSDepthCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
                 getPCSSDepthCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
                 f.y ) +
            mix( getPCSSDepthCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
                 getPCSSDepthCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
                 f.y ) +
            mix( mix( getPCSSDepthCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
                      getPCSSDepthCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
                      f.x ),
                 mix( getPCSSDepthCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
                      getPCSSDepthCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
                      f.x ),
                 f.y )
        ) * ( 1.0 / 9.0 );

        float pcssShadow = getPCSSShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
        shadow = mix( pcfShadow, pcssShadow, blending );
    }

    return mix( 1.0, shadow, shadowIntensity );
}
`;
