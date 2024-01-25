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