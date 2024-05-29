uniform vec3 diffuse;
uniform vec3 color_0;
uniform vec3 color_1;
uniform vec3 color_2;
uniform vec3 color_3;
uniform vec3 color_4;
uniform vec3 color_5;
uniform vec3 color_6;
uniform vec3 color_7;


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
    uniform sampler2D map_4;
    uniform sampler2D map_5;
    uniform sampler2D map_6;
    uniform sampler2D map_7;

#endif

#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap_0;
    uniform sampler2D alphaMap_1;
    uniform sampler2D alphaMap_2;
    uniform sampler2D alphaMap_3;
    uniform sampler2D alphaMap_4;
    uniform sampler2D alphaMap_5;
    uniform sampler2D alphaMap_6;
    uniform sampler2D alphaMap_7;

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
    } else if ( vMaterialIndex == 4 ) {
        c = color_4;
    } else if ( vMaterialIndex == 5 ) {
        c = color_5;
    } else if ( vMaterialIndex == 6 ) {
        c = color_6;
    } else if ( vMaterialIndex == 7 ) {
        c = color_7;
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
        } else if ( vMaterialIndex == 4 ) {
            diffuseColor *= texture2D( map_4, uv );
        } else if ( vMaterialIndex == 5 ) {
            diffuseColor *= texture2D( map_5, uv );
        } else if ( vMaterialIndex == 6 ) {
            diffuseColor *= texture2D( map_6, uv );
        } else if ( vMaterialIndex == 7 ) {
            diffuseColor *= texture2D( map_7, uv );
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
        } else if ( vMaterialIndex == 4 ) {
            diffuseColor *= texture2D( alphaMap_4, uv );
        } else if ( vMaterialIndex == 5 ) {
            diffuseColor *= texture2D( alphaMap_5, uv );
        } else if ( vMaterialIndex == 6 ) {
            diffuseColor *= texture2D( alphaMap_6, uv );
        } else if ( vMaterialIndex == 7 ) {
            diffuseColor *= texture2D( alphaMap_7, uv );
        } else {
            diffuseColor *= texture2D( alphaMap_0, uv );
        }

    #endif

	#include <color_fragment>
	#include <alphatest_fragment>

	outgoingLight = diffuseColor.rgb;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}