export const ao_utils = `
uniform mat4 viewMatrixInverse;
uniform mat4 projectionMatrixInverse;

vec3 computeWorldPosition(float depth, vec2 coord, bool useCameraMatrixWorld) {
    // Convert depth to normalized device coordinates (NDC)
    float z = depth * 2.0 - 1.0;
    vec4 clipSpacePosition = vec4(coord * 2.0 - 1.0, z, 1.0);

    // Transform to view space
    vec4 viewSpacePosition = projectionMatrixInverse * clipSpacePosition;

    // Perspective division
    viewSpacePosition /= viewSpacePosition.w;

    // Transform to world space using the selected method
    vec4 worldSpacePosition;
    if (useCameraMatrixWorld) {
        // Use cameraMatrixWorld directly
        worldSpacePosition = cameraMatrixWorld * viewSpacePosition;
    } else {
        // Use viewMatrixInverse
        worldSpacePosition = viewMatrixInverse * viewSpacePosition;
    }

    return worldSpacePosition.xyz;
}

vec3 computeNormal(vec2 vUv) {
    vec2 size = vec2(textureSize(depthTexture, 0));
    ivec2 p = ivec2(vUv * size);
    float c0 = texelFetch(depthTexture, p, 0).x;
    float l2 = texelFetch(depthTexture, p - ivec2(2, 0), 0).x;
    float l1 = texelFetch(depthTexture, p - ivec2(1, 0), 0).x;
    float r1 = texelFetch(depthTexture, p + ivec2(1, 0), 0).x;
    float r2 = texelFetch(depthTexture, p + ivec2(2, 0), 0).x;
    float b2 = texelFetch(depthTexture, p - ivec2(0, 2), 0).x;
    float b1 = texelFetch(depthTexture, p - ivec2(0, 1), 0).x;
    float t1 = texelFetch(depthTexture, p + ivec2(0, 1), 0).x;
    float t2 = texelFetch(depthTexture, p + ivec2(0, 2), 0).x;
    float dl = abs((2.0 * l1 - l2) - c0);
    float dr = abs((2.0 * r1 - r2) - c0);
    float db = abs((2.0 * b1 - b2) - c0);
    float dt = abs((2.0 * t1 - t2) - c0);
    vec3 ce = computeWorldPosition(c0, vUv, true).xyz;
    vec3 dpdx = (dl < dr) ? ce - computeWorldPosition(l1, (vUv - vec2(1.0 / size.x, 0.0)), true).xyz
                          : -ce + computeWorldPosition(r1, (vUv + vec2(1.0 / size.x, 0.0)), true).xyz;
    vec3 dpdy = (db < dt) ? ce - computeWorldPosition(b1, (vUv - vec2(0.0, 1.0 / size.y)), true).xyz
                          : -ce + computeWorldPosition(t1, (vUv + vec2(0.0, 1.0 / size.y)), true).xyz;
    return normalize(cross(dpdx, dpdy));
}

bool areDepthsOnSamePlane(
    float depth1, 
    float depth2, 
    vec2 coord1, 
    vec2 coord2,
    vec3 planeNormal, 
    float epsilon
) {
    // Reconstruct world positions
    vec3 worldPos1 = computeWorldPosition(depth1, coord1, false);
    vec3 worldPos2 = computeWorldPosition(depth2, coord2, false);

    // Compute the vector between the two positions
    vec3 pointVector = worldPos2 - worldPos1;

    if (length(pointVector) < 1e-6) {
        return true; // Indicates invalid inputs
    }

    // Check if the vector is orthogonal to the plane normal
    return abs(dot(normalize(pointVector), normalize(planeNormal))) < epsilon;
}
`;