export const ao_compose = `
uniform sampler2D inputTexture;
uniform highp sampler2D depthTexture;
uniform float power;
uniform vec3 color;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    #if __VERSION__ >= 130 // GLSL 3.0 or higher
        float unpackedDepth = textureLod(depthTexture, uv, 0.).r;
        float ao = unpackedDepth > 0.9999 ? 1.0 : textureLod(inputTexture, uv, 0.0).a;
    #else // GLSL 1.0
        float unpackedDepth = texture2D(depthTexture, uv).r;
        float ao = unpackedDepth > 0.9999 ? 1.0 : texture2D(inputTexture, uv).a;
    #endif

    ao = pow(ao, power);

    vec3 aoColor = mix(color, vec3(1.), ao);

    aoColor *= inputColor.rgb;

    outputColor = vec4(aoColor, inputColor.a);
}
`;