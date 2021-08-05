
export const ACCESSORCOMPONENTTYPE = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5124: Uint32Array,
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
    VEC7: 7,
    VEC10: 10,    
    VEC12: 12,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
};

export interface IGLTF_v1_Accessor {
    bufferView: string,
    byteOffset: number,
    byteStride?: number,
    componentType: number,
    count: number,
    max?: number[],
    min?: number[],
    type: string,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Animation {
    channels?: {
        sampler: string,
        target: {
            id: string,
            path: string,
            extensions?: { [id: string]: any },
            extras?: any
        },
        extensions?: { [id: string]: any },
        extras?: any
    }[],
    parameters?: {
        TIME?: string,
        scale?: string,
        rotation?: string,
        translation?: string
    },
    samplers?: {
        [key: string]: {
            input: string,
            interpolation?: string,
            output: string,
            extensions?: { [id: string]: any },
            extras?: any
        }
    },
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Asset {
    copyright?: string,
    generator?: string,
    premultipliedAlpha?: boolean,
    profile?: {
        api: string,
        version: string,
        extensions?: { [id: string]: any },
        extras?: any
    },
    version: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Buffer {
    byteLength?: number,
    type?: string,
    uri: string,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_BufferView {
    buffer: string,
    byteLength?: number,
    byteOffset: number,
    target?: number,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Camera {
    perspective?: {
        aspectRatio?: number,
        yfov: number,
        zfar: number,
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

export interface IGLTF_v1_Image {
    uri: string,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Material {
    technique?: string,
    values?: {
        [key: string]: number[] | string | number
    },
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Mesh {
    primitives?: {
        attributes?: {
            [key: string]: string
        },
        indices?: string,
        material: string,
        mode?: number,
        extensions?: { [id: string]: any },
        extras?: any
    }[],
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Node {
    children?: string[],
    meshes?: string[],
    skeletons?: string[],
    skin?: string,
    jointName?: string,
    camera?: string,
    matrix?: number[],
    translation?: number[],
    rotation?: number[],
    scale?: number[],
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Program {
    attributes?: string[],
    fragmentShader: string,
    vertexShader: string,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Sampler {
    magFilter?: number,
    minFilter?: number,
    wrapS?: number,
    wrapT?: number,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Scene {
    nodes?: string[],
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Shader {
    type: number,
    uri: string,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Skin {
    bindShapeMatrix?: number[],
    inverseBindMatrices: string,
    jointNames: string[],
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Technique {
    parameters?: {
        count?: number,
        node?: string,
        type: number,
        semantic?: string,
        value?: any,
        extensions?: { [id: string]: any },
        extras?: any
    },
    attributes?: {
        [key: string]: string
    },
    program: string,
    uniforms?: {
        [key: string]: string
    },
    states?: {
        enable?: number[],
        functions?: {
            [key: string]: any
        },
        extensions?: { [id: string]: any },
        extras?: any
    },
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1_Texture {
    format?: number,
    internalFormat?: number,
    sampler: string,
    source: string,
    target?: number,
    type?: number,
    name?: string,
    extensions?: { [id: string]: any },
    extras?: any
}

export interface IGLTF_v1 {
    accessors?: { [id: string]: IGLTF_v1_Accessor },
    animations?: { [id: string]: IGLTF_v1_Animation },
    asset?: IGLTF_v1_Asset,
    buffers?: { [id: string]: IGLTF_v1_Buffer },
    bufferViews?: { [id: string]: IGLTF_v1_BufferView },
    cameras?: { [id: string]: IGLTF_v1_Camera },
    images?: { [id: string]: IGLTF_v1_Image },
    materials?: { [id: string]: IGLTF_v1_Material },
    meshes?: { [id: string]: IGLTF_v1_Mesh },
    nodes?: { [id: string]: IGLTF_v1_Node },
    programs?: { [id: string]: IGLTF_v1_Program },
    samplers?: { [id: string]: IGLTF_v1_Sampler },
    scene?: string,
    scenes?: { [id: string]: IGLTF_v1_Scene },
    shaders?: { [id: string]: IGLTF_v1_Shader },
    skins?: { [id: string]: IGLTF_v1_Skin },
    techniques?: { [id: string]: IGLTF_v1_Technique },
    textures?: { [id: string]: IGLTF_v1_Texture },
    extensionsUsed?: string[],
    extensions?: { [id: string]: any },
    extras?: any
}