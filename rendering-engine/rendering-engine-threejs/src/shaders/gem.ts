export const vert = `
#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

// CUSTOM START
varying vec3 frag_position;
varying vec3 frag_normal;
// CUSTOM END

void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
    #ifdef USE_TRANSMISSION
        vWorldPosition = worldPosition.xyz;
    #endif

    // CUSTOM START
    frag_position = position;
    frag_normal = objectNormal;
    // CUSTOM END
}
`;

/** The point, spot, directional and rect-area lights of {@link gemReflectedLight}. */
const directLightsBlock = `	float temp = material.roughness;
	material.roughness = 0.5;

	#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )

		PointLight pointLight;
        #if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
            PointLightShadow pointLightShadow;
        #endif

	    #pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
			pointLight = pointLights[ i ];
            getPointLightInfo( pointLight, currentGeometryPosition, dLight );
            #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
                pointLightShadow = pointLightShadows[ i ];
                dLight.color *= ( dLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
            #endif
		    RE_Direct( dLight, currentGeometryPosition, currentGeometryNormal, currentGeometryViewDir, currentGeometryClearcoatNormal, material, rLight );
		}
        #pragma unroll_loop_end
	#endif
	#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
        SpotLight spotLight;
        #if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
            SpotLightShadow spotLightShadow;
        #endif
        #pragma unroll_loop_start
        for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
            spotLight = spotLights[ i ];
            getSpotLightInfo( spotLight, currentGeometryPosition, dLight );
            #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
                spotLightShadow = spotLightShadows[ i ];
                dLight.color *= ( dLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
            #endif
            RE_Direct( dLight, currentGeometryPosition, currentGeometryNormal, currentGeometryViewDir, currentGeometryClearcoatNormal, material, rLight );
        }
        #pragma unroll_loop_end
	#endif

    #if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
        DirectionalLight directionalLight;
        #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
            DirectionalLightShadow directionalLightShadow;
        #endif
        #pragma unroll_loop_start
        for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
            directionalLight = directionalLights[ i ];
            getDirectionalLightInfo( directionalLight, dLight );
            #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
                directionalLightShadow = directionalLightShadows[ i ];
                dLight.color *= ( dLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
            #endif
            RE_Direct( dLight, currentGeometryPosition, currentGeometryNormal, currentGeometryViewDir, currentGeometryClearcoatNormal, material, rLight );
        }
        #pragma unroll_loop_end
    #endif
	material.roughness = temp;

    #if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
        RectAreaLight rectAreaLight;
        #pragma unroll_loop_start
        for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
            rectAreaLight = rectAreaLights[ i ];
            RE_Direct_RectArea( rectAreaLight, currentGeometryPosition, currentGeometryNormal, currentGeometryViewDir, currentGeometryClearcoatNormal, material, rLight );
        }
        #pragma unroll_loop_end
    #endif`;

/** The ambient, hemisphere and light probe irradiance of {@link gemReflectedLight}. */
const sceneAmbientBlock = `        vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );

		#if defined( USE_LIGHT_PROBES )
        	irradiance += getLightProbeIrradiance( lightProbe, currentGeometryNormal );
		#endif
        #if ( NUM_HEMI_LIGHTS > 0 )
            #pragma unroll_loop_start
            for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
                irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], currentGeometryNormal );
            }
            #pragma unroll_loop_end
        #endif`;

/**
 * The shading of one gem surface point as a GLSL function called `name`.
 * `directLights` is the GLSL that adds the direct lights to `rLight`, and
 * `sceneAmbient` the GLSL that declares `irradiance` from the ambient,
 * hemisphere and light probe lights. The full function uses
 * {@link directLightsBlock} and {@link sceneAmbientBlock}; the bounce variant
 * of "firstSurface" passes no direct lights; the "environment" variant passes
 * neither, so the environment map is the only light.
 */
const gemReflectedLight = (
	name: string,
	directLights: string,
	sceneAmbient: string,
) => `vec3 ${name}(vec3 position, vec3 normal, vec3 viewDir, PhysicalMaterial material, int depth) {

	vec3 currentGeometryPosition = (modelMatrix * vec4(position, 1.0)).xyz;

	mat3 normalMatrix;
	normalMatrix[0] = normalize(modelMatrix[0].xyz);
	normalMatrix[1] = normalize(modelMatrix[1].xyz);
	normalMatrix[2] = normalize(modelMatrix[2].xyz);

	// Calculate the normal vector in world space
	vec3 currentGeometryNormal = normalize(normalMatrix * normal);

	// Calculate the view direction vector in world space
	vec3 currentGeometryViewDir = normalize(normalMatrix * -viewDir);

    vec3 currentGeometryClearcoatNormal = vec3( 0.0 );

	#ifdef USE_CLEARCOAT
        currentGeometryClearcoatNormal = clearcoatNormal;
    #endif

	ReflectedLight rLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	IncidentLight dLight;

${directLights}
    #if defined( RE_IndirectDiffuse )
        vec3 iblIrradiance = vec3( 0.0 );
${sceneAmbient}
    #endif
    #if defined( RE_IndirectSpecular )
        vec3 radiance = vec3( 0.0 );
        vec3 clearcoatRadiance = vec3( 0.0 );
    #endif


    #if defined( RE_IndirectDiffuse )
        #ifdef USE_LIGHTMAP
            vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
            vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
            irradiance += lightMapIrradiance;
        #endif
        #if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
            iblIrradiance += getIBLIrradiance( currentGeometryNormal );
        #endif
    #endif
    #if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
        radiance += getIBLRadianceVariation( currentGeometryViewDir, currentGeometryNormal, material.roughness );
        #ifdef USE_CLEARCOAT
            clearcoatRadiance += getIBLRadianceVariation( currentGeometryViewDir, currentGeometryClearcoatNormal, material.clearcoatRoughness );
        #endif
    #endif

    #if defined( RE_IndirectDiffuse )
        RE_IndirectDiffuse( irradiance, currentGeometryPosition, currentGeometryNormal, currentGeometryViewDir, currentGeometryClearcoatNormal, material, rLight );
    #endif
    #if defined( RE_IndirectSpecular )
        RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, currentGeometryPosition, currentGeometryNormal, currentGeometryViewDir, currentGeometryClearcoatNormal, material, rLight );
    #endif

	if(depth >= 0) {
		float frac = float(depth) / float(TRACING_DEPTH);
		vec3 colorTransfer = (1.0-frac) * colorTransferBegin + frac * colorTransferEnd;
		rLight.indirectSpecular *= colorTransfer;
		rLight.directSpecular *= colorTransfer;
	}

	vec3 color = rLight.indirectSpecular + rLight.directSpecular + rLight.indirectDiffuse + rLight.directDiffuse;

	// gamma
	color = pow(color, vec3(1.0/gamma));

	// contrast
	color.rgb = ((color.rgb - 0.5) * max(contrast, 0.0)) + 0.5;

	// brightness
	float colorMax = hdrOutput > 0.5 ? 65504.0 : 1.0;
	color.r = min(max(color.r + brightness, 0.0), colorMax);
	color.g = min(max(color.g + brightness, 0.0), colorMax);
	color.b = min(max(color.b + brightness, 0.0), colorMax);

	return color;
}`;

export const frag = `
#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif

// CUSTOM START
#ifdef USE_IMPURITYMAP
	uniform sampler2D impurityMap;
#endif
// CUSTOM END

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>



// CUSTOM START

varying vec4 initialPosition;
varying vec3 initialNormal;

varying vec3 frag_position;
varying vec3 frag_normal;

uniform vec3 center;
uniform float radius;
uniform samplerCube sphericalNormalMap;
uniform mat3 normalMatrix;
uniform mat4 modelMatrix;

uniform float impurityScale;
uniform vec3 colorTransferBegin;
uniform vec3 colorTransferEnd;
uniform float refractionIndex;
uniform float gamma;
uniform float contrast;
uniform float brightness;
uniform float hdrOutput;
uniform float dispersion;
uniform float tracingOpacity;
uniform float gemEnvMapIntensity;

#ifdef PHYSICAL_DISPERSION
	// Per-channel IOR offsets for physical dispersion. refractionIndex is the
	// IOR at the D line (589.3 nm) and dispersion is n(G line, 430.8 nm) minus
	// n(B line, 686.7 nm), 0.044 for diamond. With Cauchy's n = A + B / λ²:
	// n(λ) = n_D + dispersion * (1/λ² - 1/λ_D²) / (1/λ_G² - 1/λ_B²),
	// sampled at 650 nm (red), 550 nm (green) and 450 nm (blue).
	const vec3 DISPERSION_WEIGHTS = vec3(-0.1569, 0.1304, 0.6300);
#endif


vec3 getIBLRadianceVariation( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
	#if defined( ENVMAP_TYPE_CUBE_UV )
		vec3 reflectVec = reflect( - viewDir, normal );
		// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
		reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
		reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
		vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
		return envMapColor.rgb * envMapIntensity * gemEnvMapIntensity;
	#else
		return vec3( 0.0 );
	#endif
}

#if defined( GEM_LIGHTING_ENVIRONMENT )
// gemLighting "environment": no scene lights at all, the environment map lights the first surface and the bounces.
${gemReflectedLight("calculateReflectedLight", "", "        vec3 irradiance = vec3( 0.0 );")}
#define calculateBounceLight calculateReflectedLight
#elif defined( GEM_LIGHTING_FIRST_SURFACE )
${gemReflectedLight("calculateReflectedLight", directLightsBlock, sceneAmbientBlock)}
// gemLighting "firstSurface": internal bounces use the environment and ambient light only: the direct lights are evaluated on the first surface, which keeps the shader small.
${gemReflectedLight("calculateBounceLight", "", sceneAmbientBlock)}
#else
${gemReflectedLight("calculateReflectedLight", directLightsBlock, sceneAmbientBlock)}
#define calculateBounceLight calculateReflectedLight
#endif

vec3 normalLookUp(vec3 dir) {
	vec4 s = textureCube(sphericalNormalMap, dir);
	if(s.a < 1.0/256.0) {
		return normalize(vec3(-s.x, -s.y, -s.z));
	} else if(s.a < 3.0/256.0) {
		return normalize(vec3(-s.x, -s.y, s.z));
	} else if(s.a < 5.0/256.0) {
		return normalize(vec3(-s.x, s.y, -s.z));
	} else if(s.a < 7.0/256.0) {
		return normalize(vec3(s.x, -s.y, -s.z));
	} else if(s.a < 9.0/256.0) {
		return normalize(vec3(-s.x, s.y, s.z));
	} else if(s.a < 11.0/256.0) {
		return normalize(vec3(s.x, -s.y, s.z));
	} else if(s.a < 13.0/256.0) {
		return normalize(vec3(s.x, s.y, -s.z));
	} else {
		return normalize(s.xyz);
	}
}

#ifdef USE_IMPURITYMAP
	float impurityLookUp(vec3 dir) {
		vec3 c = texture2D(impurityMap, dir.xy * 0.5 + 0.5).rgb;
		return (c.x + c.y + c.z) / 3.0;
	}
#endif

vec3 raySphereIntersection(vec3 o, vec3 d) {

	vec3 oc = o - center;
    float a = dot(d, d);
    float b = 2.0 * dot(oc, d);
    float c = dot(oc,oc) - radius*radius;
    float discriminant = b*b - 4.0*a*c;
    if(discriminant < 0.0){
        return vec3(0.0);
    }
    else{
        return o +( (-b + sqrt(discriminant)) / (2.0*a)) * d;
    }
}

#ifdef GEM_PLANE_TRACING
// Intersects the ray with the facet planes of the gem. The cube map stores
// the facet normal and the distance of its plane from the center, so the
// bounding sphere only provides the first guess for the facet that is hit.
vec3 rayGemIntersection(vec3 o, vec3 d, out vec3 n) {
	vec3 p = raySphereIntersection(o, d);
	n = normalize(textureCube(sphericalNormalMap, normalize(p - center)).xyz);
	for(int k = 0; k < 2; k++) {
		vec4 s = textureCube(sphericalNormalMap, normalize(p - center));
		vec3 m = normalize(s.xyz);
		float denominator = dot(d, m);
		if(denominator > 1e-4) {
			float t = (s.a - dot(o - center, m)) / denominator;
			// keep the normal paired with the plane the hit point lies on
			if(t > 0.0) {
				p = o + t * d;
				n = m;
			}
		}
	}
	return p;
}
#endif

// Finds where the ray leaves the gem and the facet normal there. Without
// half-float render targets the map only holds sign-encoded normals, so
// the bounding sphere stands in for the facets.
vec3 traceGem(vec3 o, vec3 d, out vec3 n) {
#ifdef GEM_PLANE_TRACING
	return rayGemIntersection(o, d, n);
#else
	vec3 p = raySphereIntersection(o, d);
	n = normalLookUp(normalize(p - center));
	return p;
#endif
}

vec3 hueToSaturatedColor(float hue) {
    float r,g,b;
    if (hue < 0.25){
		float t = 1.0 - (hue / 0.25);
        r = 1.0;
        g = 1.0;
        b = t;    
	} else if (hue < 0.5){
    	float t = 1.0 - (hue - 0.25 / 0.25);
		r = 1.0;
        g = t;
        b = 0.0;
	} else if (hue < 0.75){
    	float t = 1.0 - (hue - 0.5 / 0.25);
		r = t;
        g = 0.0;
        b = 1.0 - t;
    } else {
    	float t = hue - 0.75 / 0.25;
        r = t;
        g = t;
        b = 1.0;
    }
    return vec3(r, g, b) / 0.5 + 0.5;
}
// CUSTOM END

void main() {    
    // CUSTOM START
    vec3 frag_normal_normalized = frag_normal;
    // CUSTOM END
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>

    // CUSTOM START
	
	#ifdef GEM_PLANE_TRACING
	// Calculate the camera position in model space. The full inverse keeps
	// scaled stones right, where the transposed rotation would not.
	vec3 cameraPositionInModelSpace = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
	#else
	// The legacy transform is kept so models without facet tracing render as before.
	// Extract the translation part of the model matrix
	vec3 translation = modelMatrix[3].xyz;

	// Extract the rotation part of the model matrix (3x3 upper-left submatrix)
	mat3 rotationMatrix = mat3(modelMatrix);

	// Calculate the inverse of the rotation matrix (transpose since it's orthogonal)
	mat3 inverseRotationMatrix;
	inverseRotationMatrix[0] = vec3(rotationMatrix[0].x, rotationMatrix[1].x, rotationMatrix[2].x);
	inverseRotationMatrix[1] = vec3(rotationMatrix[0].y, rotationMatrix[1].y, rotationMatrix[2].y);
	inverseRotationMatrix[2] = vec3(rotationMatrix[0].z, rotationMatrix[1].z, rotationMatrix[2].z);

	// Calculate the camera position in model space
	vec3 cameraPositionInModelSpace = inverseRotationMatrix * (cameraPosition - translation);
	#endif

	// Calculate the initial direction
	vec3 initialDirection = normalize(frag_position.xyz - cameraPositionInModelSpace);

	vec4 outgoingLight2;
	float r_0 = (1.0-refractionIndex)/(1.0+refractionIndex);
	r_0 = r_0*r_0;

	float cos_theta_0 = -dot(initialDirection, frag_normal_normalized);
	float r_0_outside = (refractionIndex-1.0)/(refractionIndex+1.0);
	r_0_outside = r_0_outside*r_0_outside;
	float initialProbability = r_0_outside + (1.0 - r_0_outside)*pow(1.0 - cos_theta_0, 5.0);

	outgoingLight2 = vec4(calculateReflectedLight(frag_position, frag_normal_normalized, initialDirection, material, -1), 1.0);
	// gl_FragColor = outgoingLight2;
	// return;
	if(TRACING_DEPTH > 0) 
		outgoingLight2 *= initialProbability;
		
	vec3 tempColor;

	#ifdef DISPERSION
		const int loop = 3;
		vec3 dispersionColor;
	#else
		const int loop = 1;
	#endif
		#pragma unroll_loop_start
		for(int j = 0; j < loop; j++){
			#ifdef PHYSICAL_DISPERSION
				// per-channel IOR, used at entry, inside (Fresnel, total internal reflection) and at exit
				float channelIor = refractionIndex;
				#ifdef DISPERSION
					channelIor += dispersion * DISPERSION_WEIGHTS[j];
				#endif
				float channelR0 = (1.0 - channelIor) / (1.0 + channelIor);
				channelR0 = channelR0 * channelR0;
				// The physical exit ratio (channelIor) made the stones flat and
				// bright next to the reference, so the exit keeps 1 / IOR, now
				// per channel. Blue still bends most on the way out.
				float exitRatio = 1.0 / channelIor;
				vec3 refractedDirection = refract(initialDirection, frag_normal_normalized, 1.0 / channelIor);
			#else
				float channelIor = refractionIndex;
				float channelR0 = r_0;
				float exitRatio = 1.0 / refractionIndex;
				vec3 refractedDirection = refract(initialDirection, frag_normal_normalized, 1.0/refractionIndex + float(j)*dispersion * 0.025);
			#endif
			vec3 newNormal;
			vec3 newPosition = traceGem(frag_position, refractedDirection, newNormal);
			vec3 lookUpVector = normalize(newPosition - center);
			vec3 newDirection = reflect(refractedDirection, newNormal);

			float currentProbability = 1.0;

			#ifdef USE_IMPURITYMAP
				float impurityProbability = impurityLookUp(lookUpVector);
				currentProbability -= impurityProbability * impurityScale;
				// gl_FragColor = vec4(vec3(impurityProbability), 1.0);
				// return;
			#endif
			
			// if(0 == TRACING_DEPTH) {
			// 	gl_FragColor = vec4(0.5 * newNormal + 0.5, 1.0);
			// 	return;
			// }

			tempColor = vec3(0.0);
			#pragma unroll_loop_start
			for(int i = 0; i < TRACING_DEPTH; i++) {
				// small position correction to avoid artefacts
				newPosition = newPosition - lookUpVector * 1e-6;
				newPosition = traceGem(newPosition, newDirection, newNormal);
				lookUpVector = normalize(newPosition - center);
			
				float cos_theta = dot(newDirection, newNormal);
				float ratio;
				if(cos_theta > 0.0) {
					ratio = channelIor;
				} else {
					cos_theta = -cos_theta;
					ratio = 1.0 / channelIor;
				}
				float cos_theta_2 = 1.0 - ratio*ratio * (1.0 - cos_theta*cos_theta);
				// share of the light that leaves the stone at this hit, none on total internal reflection
				#ifdef PHYSICAL_FRESNEL
					// 1 - Fresnel reflectance (Schlick, with the angle outside the stone):
					// most light leaves at the first facet it can pass, the rest keeps bouncing
					float probability = 0.0;
					if(cos_theta_2 >= 0.0) probability = 1.0 - (channelR0 + (1.0 - channelR0)*pow(1.0 - sqrt(cos_theta_2), 5.0));
				#else
					// The legacy weight is the reflectance itself, so most light keeps
					// bouncing and the facet pattern gets finer.
					float probability = channelR0 + (1.0 - channelR0)*pow(1.0 - cos_theta, 5.0);
					if(cos_theta_2 < 0.0) probability = 0.0;
				#endif

				vec3 refracted = refract(newDirection, newNormal*-1.0, exitRatio);
				tempColor += probability * currentProbability * calculateBounceLight(newPosition, newNormal*-1.0, reflect(refracted, newNormal), material, i);
				if(i+1 == TRACING_DEPTH)
					tempColor += (1.0 - probability) * currentProbability * calculateBounceLight(newPosition, newNormal, newDirection, material, i);

				newDirection = reflect(newDirection, newNormal);

				// if(i+1 == TRACING_DEPTH) {
				// 	gl_FragColor = vec4(0.5 * newNormal + 0.5, 1.0);
				// 	return;
				// }

				currentProbability *= (1.0 - probability);
			}
			#pragma unroll_loop_end

			#ifdef DISPERSION
				if(j == 0) {
					dispersionColor.r = tempColor.r;	
				} else if(j == 1) {
					dispersionColor.g = tempColor.g;	
				} else if(j == 2) {
					dispersionColor.b = tempColor.b;	
				}
				tempColor = dispersionColor;
			#endif
		}	
		#pragma unroll_loop_end

	if(TRACING_DEPTH > 0)
		outgoingLight2.rgb += (1.0 - initialProbability) * tempColor;

	float alpha = (1.0 - initialProbability) + initialProbability*tracingOpacity;
	gl_FragColor = vec4(outgoingLight2.rgb, alpha*diffuseColor.a);

    // CUSTOM END

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}

`;
