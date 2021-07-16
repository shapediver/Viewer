import {
	Matrix4,
	Vector2
} from 'three';

/**
 * TODO
 */

const SAOShader = {
	defines: {
		'NUM_SAMPLES': 8,
		'NORMAL_TEXTURE': 0,
		'DIFFUSE_TEXTURE': 0,
		'PERSPECTIVE_CAMERA': 1
	},
	uniforms: {

		'tDepth': { value: null },
		'tDiffuse': { value: null },
		'tNormal': { value: null },
		'size': { value: new Vector2( 512, 512 ) },

		'cameraNear': { value: 1 },
		'cameraFar': { value: 100 },
		'cameraProjectionMatrix': { value: new Matrix4() },
		'cameraInverseProjectionMatrix': { value: new Matrix4() },

		'scale': { value: 1.0 },
		'intensity': { value: 0.1 },
		'bias': { value: 0.5 },

		'minResolution': { value: 0.0 },
		'kernelRadius': { value: 100.0 },
		'randomSeed': { value: 0.0 }
	},
	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

	fragmentShader: /* glsl */`

		varying vec2 vUv;

		#if DIFFUSE_TEXTURE == 1
		uniform sampler2D tDiffuse;
		#endif

		uniform sampler2D tDepth;

		#if NORMAL_TEXTURE == 1
		uniform sampler2D tNormal;
		#endif

		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraInverseProjectionMatrix;

		uniform float scale;
		uniform float intensity;
		uniform float kernelRadius;
		uniform vec2 size;

		// RGBA depth

		#include <common>
		#include <packing>

		vec4 getDefaultColor( const in vec2 screenPosition ) {
			#if DIFFUSE_TEXTURE == 1
			return texture2D( tDiffuse, vUv );
			#else
			return vec4( 1.0 );
			#endif
		}

		vec3 getViewPosition(const in vec2 screenPosition, const in float depth, const in float viewZ) {
			float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];
			vec4 clipPosition = vec4((vec3(screenPosition, depth) - 0.5) * 2.0, 1.0);
			clipPosition *= clipW; // unprojection
		
			return (cameraInverseProjectionMatrix * clipPosition).xyz;
		}

		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
			#else
			return orthographicDepthToViewZ( depth, cameraNear, cameraFar );
			#endif
		}
		
		float getOcclusion(const in vec3 centerViewPosition, const in vec3 centerViewNormal, const in vec3 sampleViewPosition) {
			vec3 viewDelta = sampleViewPosition - centerViewPosition;
			float viewDistance = length(viewDelta);
			float scaledScreenDistance = scale * viewDistance;
			return max(0.0, (dot(centerViewNormal, viewDelta))/scaledScreenDistance)/(1.0 + pow2(scaledScreenDistance));
		}
		
		float getAmbientOcclusion(const in vec3 centerViewPosition) {
			vec3 centerViewNormal = unpackRGBToNormal(texture2D(tNormal, vUv).xyz);
		
			float angle = rand(vUv) * PI2;
			vec2 radius = vec2(kernelRadius * (1.0/float(NUM_SAMPLES)))/size;
			vec2 radiusStep = radius;
			float occlusionSum = 0.0;
			float weightSum = 0.0;
			float angleStep = PI2 * 3.0/float(NUM_SAMPLES);
		
			for(int i = 0; i < NUM_SAMPLES; i ++) {
				vec2 sampleUv = vUv + vec2(cos(angle), sin(angle)) * radius;
				radius += radiusStep;
				angle += PI2 * 3.0/float(NUM_SAMPLES);
		
				float sampleDepth = unpackRGBAToDepth(texture2D(tDepth, sampleUv));
				if(sampleDepth >= (1.0 - EPSILON)) {
					continue;
				}
		
				float sampleViewZ = getViewZ(sampleDepth);
				vec3 sampleViewPosition = getViewPosition(sampleUv, sampleDepth, sampleViewZ);
				occlusionSum += getOcclusion(centerViewPosition, centerViewNormal, sampleViewPosition);
				weightSum += 1.0;
			}
		
			if(weightSum == 0.0) discard;
		
			return occlusionSum * (intensity/weightSum);
		}

		void main() {
			float centerDepth = unpackRGBAToDepth(texture2D(tDepth, vUv));
			if( centerDepth >= ( 1.0 - EPSILON ) ) {
				discard;
			}

			float centerViewZ = getViewZ( centerDepth );
			vec3 viewPosition = getViewPosition( vUv, centerDepth, centerViewZ );
			gl_FragColor = vec4(viewPosition, 1);

			float ambientOcclusion = getAmbientOcclusion( viewPosition );

			gl_FragColor = getDefaultColor( vUv );
			gl_FragColor.xyz *=  1.0 - ambientOcclusion;
		}`

};

export { SAOShader };
