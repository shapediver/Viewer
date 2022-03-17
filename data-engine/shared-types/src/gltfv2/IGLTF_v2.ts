
export const ACCESSORCOMPONENTTYPE = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5124: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
}

export const ACCESSORCOMPONENTSIZE = {
    5120: 1,
    5121: 1,
    5122: 2,
    5123: 2,
    5125: 4,
    5126: 4
}

export const ACCESSORTYPE = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
};

export interface IGLTF_v2_Accessor {
    bufferView?: number,
    byteOffset?: number,
    componentType: number,
    normalized?: boolean,
    count: number,
    max?: number[],
    min?: number[],
    type: string,
    sparse?: {
        count: number,
        indices: {
            bufferView: number,
            byteOffset?: number,
            componentType: number,
            extensions?: { [id: string]: any },
            extras?: any
        },
        values: {
            bufferView: number,
            byteOffset?: number,
            extensions?: { [id: string]: any },
            extras?: any
        },
        extensions?: { [id: string]: any },
        extras?: any
    },
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Animation {
    channels: {
        sampler: number,
        target: {
            node: number,
            path: string,
            extensions?: { [id: string]: any },
            extras?: any
        },
        extensions?: { [id: string]: any },
        extras?: any
    }[],
    samplers: {
        input: number,
        interpolation?: string,
        output: number,
        extensions?: { [id: string]: any },
        extras?: any
    }[],
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Asset {
    copyright?: string,
    generator?: string,
    version: string,
    minVersion?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Buffer {
    byteLength: number,
    uri?: string,
    name?: string,
    type?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_BufferView {
    buffer: number,
    byteLength: number,
    byteOffset?: number,
    byteStride?: number,
    target?: number,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Camera {
    perspective?: {
        aspectRatio?: number,
        yfov: number,
        zfar?: number,
        znear: number,
        extensions?: { [id: string]: any },
        extras?: any
    },
    orthographic?: {
        xmag: number,
        ymag: number,
        zfar: number,
        znear: number,
        extensions?: { [id: string]: any },
        extras?: any
    },
    type: string,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Image {
    uri?: string,
    mimeType?: string,
    bufferView?: number,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness {
    diffuseFactor?: number[],
    diffuseTexture?: {
        index: number,
        texCoord?: number,
        extensions?: { [id: string]: any },
        extras?: any
    },
    specularFactor?: number[],
    glossinessFactor?: number,
    specularGlossinessTexture?: {
        index: number,
        texCoord?: number,
        extensions?: { [id: string]: any },
        extras?: any
    }
}

export interface ISHAPEDIVER_materials_preset {
    version: string, 
    materialpreset: number,
    color: number[]
}

export interface IGLTF_v2_Material {
    name?: string,
    pbrMetallicRoughness?: {
        baseColorFactor?: number[],
        baseColorTexture?: {
            index: number,
            texCoord?: number,
            extensions?: { [id: string]: any },
            extras?: any
        },
        metallicFactor?: number,
        roughnessFactor?: number,
        metallicRoughnessTexture?: {
            index: number,
            texCoord?: number,
            extensions?: { [id: string]: any },
            extras?: any
        },
        extensions?: { [id: string]: any },
        extras?: any
    },
    normalTexture?: {
        index: number,
        texCoord?: number,
        scale?: number,
        extensions?: { [id: string]: any },
        extras?: any
    },
    occlusionTexture?: {
        index: number,
        texCoord?: number,
        strength?: number,
        extensions?: { [id: string]: any },
        extras?: any
    },
    emissiveTexture?: {
        index: number,
        texCoord?: number,
        extensions?: { [id: string]: any },
        extras?: any
    },
    emissiveFactor?: number[],
    alphaMode?: string,
    alphaCutoff?: number,
    doubleSided?: boolean,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Primitive {
    attributes: {
        [key: string]: number
    },
    indices?: number,
    material?: number,
    mode?: number,
    targets?: {
        [id: string]: number
    }[],
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Mesh {
    primitives?: IGLTF_v2_Primitive[],
    weights?: number[],
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Node {
    children?: number[],
    mesh?: number,
    skin?: number,
    camera?: number,
    matrix?: number[],
    translation?: number[],
    rotation?: number[],
    scale?: number[],
    weights?: number[],
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Sampler {
    magFilter?: number,
    minFilter?: number,
    wrapS?: number,
    wrapT?: number,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Scene {
    nodes?: number[],
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v2_Skin {
    inverseBindMatrices?: number,
    skeleton?: number,
    joints: number[],
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}
export interface IGLTF_v2_Texture {
    sampler?: number,
    source: number,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}
export interface IGLTF_v2 {
    extensionsUsed?: string[],
    extensionsRequired?: string[],
    accessors?: IGLTF_v2_Accessor[],
    animations?: IGLTF_v2_Animation[],
    asset: IGLTF_v2_Asset,
    buffers?: IGLTF_v2_Buffer[],
    bufferViews?: IGLTF_v2_BufferView[],
    cameras?: IGLTF_v2_Camera[],
    images?: IGLTF_v2_Image[],
    materials?: IGLTF_v2_Material[],
    meshes?: IGLTF_v2_Mesh[],
    nodes?: IGLTF_v2_Node[],
    samplers?: IGLTF_v2_Sampler[],
    scene?: number,
    scenes?: IGLTF_v2_Scene[],
    skins?: IGLTF_v2_Skin[],
    textures?: IGLTF_v2_Texture[],
    extensions?: { [id: string]: any },
    extras?: any
}