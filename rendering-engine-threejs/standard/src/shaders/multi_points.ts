export const vert = `
attribute float positionIndex;
flat varying int vMaterialIndex;
flat varying int vPositionIndex;

uniform float size_0;
uniform float size_1;
uniform float size_2;
uniform float size_3;

uniform bool sizeAttenuation_0;
uniform bool sizeAttenuation_1;
uniform bool sizeAttenuation_2;
uniform bool sizeAttenuation_3;

uniform highp usampler2D materialIndexDataTexture;

uniform float scale;

float getSize(int materialIndex) {
    if ( materialIndex == 1 ) {
        return size_1;
    } else if ( materialIndex == 2 ) {
        return size_2;
    } else if ( materialIndex == 3 ) {
        return size_3;
    } else {
        return size_0;
    }
}

bool getSizeAttenuation(int materialIndex) {
    if ( materialIndex == 1 ) {
        return sizeAttenuation_1;
    } else if ( materialIndex == 2 ) {
        return sizeAttenuation_2;
    } else if ( materialIndex == 3 ) {
        return sizeAttenuation_3;
    } else {
        return sizeAttenuation_0;
    }
}

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef USE_POINTS_UV

	varying vec2 vUv;
	uniform mat3 uvTransform;

#endif

int retrieveMaterialIndex() {
    vec2 uv = vec2(positionIndex/1024.0, 0.5);

    // get the value of a texture at a specific index
    return int(texture2D(materialIndexDataTexture, uv).r);
}

void main() {
    int materialIndex = retrieveMaterialIndex();
    vMaterialIndex = materialIndex;

    float size = getSize(materialIndex);
    bool sizeAttenuation = getSizeAttenuation(materialIndex);

	#ifdef USE_POINTS_UV

		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

	#endif

	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>

    gl_PointSize = size;

	if(sizeAttenuation) {
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
    }


	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>

}
`;

export const frag = `
uniform vec3 diffuse;
uniform vec3 color_0;
uniform vec3 color_1;
uniform vec3 color_2;
uniform vec3 color_3;

uniform float opacity;
flat varying int vMaterialIndex;
flat varying int vPositionIndex;

#include <common>
#include <color_pars_fragment>

#if defined( USE_POINTS_UV )

	varying vec2 vUv;

#else

	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )

		uniform mat3 uvTransform;

	#endif

#endif

#ifdef USE_MAP

	uniform sampler2D map_0;
	uniform sampler2D map_1;
	uniform sampler2D map_2;
	uniform sampler2D map_3;

#endif

#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap_0;
    uniform sampler2D alphaMap_1;
    uniform sampler2D alphaMap_2;
    uniform sampler2D alphaMap_3;

#endif


#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );

    vec3 c = vec3(1.0, 0.0, 0.0);
    if ( vMaterialIndex == 1 ) {
        c = color_1;
    } else if ( vMaterialIndex == 2 ) {
        c = color_2;
    } else if ( vMaterialIndex == 3 ) {
        c = color_3;
    } else {
        c = color_0;
    }

	vec4 diffuseColor = vec4( c, opacity );

    


	#include <logdepthbuf_fragment>

    #if defined( USE_MAP ) || defined( USE_ALPHAMAP )

        #if defined( USE_POINTS_UV )

            vec2 uv = vUv;

        #else

            vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;

        #endif

    #endif

    #ifdef USE_MAP

        if ( vMaterialIndex == 1 ) {
            diffuseColor *= texture2D( map_1, uv );
        } else if ( vMaterialIndex == 2 ) {
            diffuseColor *= texture2D( map_2, uv );
        } else if ( vMaterialIndex == 3 ) {
            diffuseColor *= texture2D( map_3, uv );
        } else {
            diffuseColor *= texture2D( map_0, uv );
        }

    #endif

    #ifdef USE_ALPHAMAP

        if ( vMaterialIndex == 1 ) {
            diffuseColor *= texture2D( alphaMap_1, uv );
        } else if ( vMaterialIndex == 2 ) {
            diffuseColor *= texture2D( alphaMap_2, uv );
        } else if ( vMaterialIndex == 3 ) {
            diffuseColor *= texture2D( alphaMap_3, uv );
        } else {
            diffuseColor *= texture2D( alphaMap_0, uv );
        }

    #endif

	#include <color_fragment>
	#include <alphatest_fragment>

	outgoingLight = diffuseColor.rgb;

	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`