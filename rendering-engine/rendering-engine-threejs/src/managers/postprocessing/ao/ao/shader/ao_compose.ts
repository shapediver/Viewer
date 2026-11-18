export const ao_compose = `
uniform highp sampler2D inputTexture;
uniform highp sampler2D depthTexture;
uniform highp sampler2D normalTexture;
uniform float power;
uniform vec3 color;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float unpackedDepth = textureLod(depthTexture, uv, 0.).r;

    float ao = unpackedDepth > 0.99975 ? 1.0 : textureLod(inputTexture, uv, 0.0).a;
    // alpha 0 in the normal texture marks gems, they are not darkened
    if (textureLod(normalTexture, uv, 0.0).a < 0.5) ao = 1.0;
    ao = pow(ao, power);

    vec3 aoColor = mix(color, vec3(1.), ao);

    aoColor *= inputColor.rgb;

    outputColor = vec4(aoColor, inputColor.a);
}
`;
