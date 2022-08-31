#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define SPECULAR
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
#ifdef SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULARINTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
	#ifdef USE_SPECULARCOLORMAP
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
	#ifdef USE_SHEENCOLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEENROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
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
uniform mat4 inverseModelMatrix;
uniform mat3 inverseTransposeModelMatrix;

uniform float impurityScale;
uniform vec3 colorTransferBegin;
uniform vec3 colorTransferEnd;
uniform float refractionIndex;
uniform float gamma;
uniform float contrast;
uniform float brightness;
uniform float dispersion;
uniform float tracingOpacity;


vec3 getIBLRadianceVariation( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
	#if defined( ENVMAP_TYPE_CUBE_UV )
		vec3 reflectVec = reflect( - viewDir, normal );
		// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
		reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
		reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
		vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
		return min(envMapColor.rgb * envMapIntensity, vec3(1.0));
	#else
		return vec3( 0.0 );
	#endif
}

vec3 calculateReflectedLight(vec3 position, vec3 normal, vec3 viewDir, PhysicalMaterial material, int depth) {
	
	GeometricContext currentGeometry;
	currentGeometry.position = (modelMatrix * vec4(position, 1.0)).xyz;
	currentGeometry.normal = normalize(inverseTransposeModelMatrix * normal);
	currentGeometry.viewDir = normalize(inverseTransposeModelMatrix * -viewDir);


    #ifdef USE_CLEARCOAT
        currentGeometry.clearcoatNormal = clearcoatNormal;
    #endif

	ReflectedLight rLight;
	IncidentLight dLight;

	float temp = material.roughness;
	material.roughness = 0.5;

	#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )

		PointLight pointLight;
        #if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
            PointLightShadow pointLightShadow;
        #endif

	    #pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
			pointLight = pointLights[ i ];
            getPointLightInfo( pointLight, currentGeometry, dLight );
            #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
                pointLightShadow = pointLightShadows[ i ];
                dLight.color *= all( bvec2( dLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
            #endif
		    RE_Direct( dLight, currentGeometry, material, rLight );
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
            getSpotLightInfo( spotLight, currentGeometry, dLight );
            #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
                spotLightShadow = spotLightShadows[ i ];
                dLight.color *= all( bvec2( dLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
            #endif
            RE_Direct( dLight, currentGeometry, material, rLight );
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
            getDirectionalLightInfo( directionalLight, currentGeometry, dLight );
            #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
                directionalLightShadow = directionalLightShadows[ i ];
                dLight.color *= all( bvec2( dLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
            #endif
            RE_Direct( dLight, currentGeometry, material, rLight );
        }
        #pragma unroll_loop_end
    #endif
	material.roughness = temp;
	
    #if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
        RectAreaLight rectAreaLight;
        #pragma unroll_loop_start
        for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
            rectAreaLight = rectAreaLights[ i ];
            RE_Direct_RectArea( rectAreaLight, currentGeometry, material, rLight );
        }
        #pragma unroll_loop_end
    #endif
    #if defined( RE_IndirectDiffuse )
        vec3 iblIrradiance = vec3( 0.0 );
        vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
        irradiance += getLightProbeIrradiance( lightProbe, currentGeometry.normal );
        #if ( NUM_HEMI_LIGHTS > 0 )
            #pragma unroll_loop_start
            for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
                irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], currentGeometry.normal );
            }
            #pragma unroll_loop_end
        #endif
    #endif
    #if defined( RE_IndirectSpecular )
        vec3 radiance = vec3( 0.0 );
        vec3 clearcoatRadiance = vec3( 0.0 );
    #endif


    #if defined( RE_IndirectDiffuse )
        #ifdef USE_LIGHTMAP
            vec4 lightMapTexel = texture2D( lightMap, vUv2 );
            vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
            irradiance += lightMapIrradiance;
        #endif
        #if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
            iblIrradiance += getIBLIrradiance( currentGeometry.normal );
        #endif
    #endif
    #if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
        radiance += getIBLRadianceVariation( currentGeometry.viewDir, currentGeometry.normal, material.roughness );
        #ifdef USE_CLEARCOAT
            clearcoatRadiance += getIBLRadianceVariation( currentGeometry.viewDir, currentGeometry.clearcoatNormal, material.clearcoatRoughness );
        #endif
    #endif

    #if defined( RE_IndirectDiffuse )
        RE_IndirectDiffuse( irradiance, currentGeometry, material, rLight );
    #endif
    #if defined( RE_IndirectSpecular )
        RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, currentGeometry, material, rLight );
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
	color.r = min(max(color.r + brightness, 0.0), 1.0);
	color.g = min(max(color.g + brightness, 0.0), 1.0);
	color.b = min(max(color.b + brightness, 0.0), 1.0);

	return color;
}

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
		vec3 c = textureCube(impurityMap, dir.xy).rgb;
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
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;
	#endif
	#include <output_fragment>

    // CUSTOM START
    
	vec3 initialDirection = normalize( frag_position - (inverseModelMatrix*vec4(cameraPosition,1.0)).xyz );

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
			vec3 refractedDirection = refract(initialDirection, frag_normal_normalized, 1.0/refractionIndex + float(j)*dispersion * 0.025);
			vec3 newPosition = raySphereIntersection(frag_position, refractedDirection);
			vec3 lookUpVector = normalize(newPosition - center);
			vec3 newNormal = normalLookUp(lookUpVector);
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
				newPosition = raySphereIntersection(newPosition, newDirection);
				lookUpVector = normalize(newPosition - center);
				newNormal = normalLookUp(lookUpVector);
			
				float cos_theta = dot(newDirection, newNormal);
				float ratio;
				if(cos_theta > 0.0) {
					ratio = refractionIndex;
				} else {
					cos_theta = -cos_theta;
					ratio = 1.0 / refractionIndex;
				}
				float cos_theta_2 = 1.0 - ratio*ratio * (1.0 - cos_theta*cos_theta);
				float probability = r_0 + (1.0 - r_0)*pow(1.0 - cos_theta, 5.0);
				if(cos_theta_2 < 0.0) probability = 0.0;

				vec3 refracted = refract(newDirection, newNormal*-1.0, 1.0/refractionIndex);
				tempColor += probability * currentProbability * calculateReflectedLight(newPosition, newNormal*-1.0, reflect(refracted, newNormal), material, i);
				if(i+1 == TRACING_DEPTH)
					tempColor += (1.0 - probability) * currentProbability * calculateReflectedLight(newPosition, newNormal, newDirection, material, i);

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
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
