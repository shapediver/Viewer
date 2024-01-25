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