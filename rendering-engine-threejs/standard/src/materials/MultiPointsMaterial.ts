import * as THREE from 'three';
import { frag, vert } from '../shaders/multi_points';

// #region Interfaces (1)

export interface MultiPointsMaterialParameters extends THREE.PointsMaterialParameters {
    // #region Properties (21)

    alphaMap_3?: THREE.Texture | null | undefined;
    alphaMap_0?: THREE.Texture | null | undefined;
    alphaMap_1?: THREE.Texture | null | undefined;
    alphaMap_2?: THREE.Texture | null | undefined;
    color_3?: THREE.ColorRepresentation | undefined;
    color_0?: THREE.ColorRepresentation | undefined;
    color_1?: THREE.ColorRepresentation | undefined;
    color_2?: THREE.ColorRepresentation | undefined;
    fog?: boolean | undefined;
    map_3?: THREE.Texture | null | undefined;
    map_0?: THREE.Texture | null | undefined;
    map_1?: THREE.Texture | null | undefined;
    map_2?: THREE.Texture | null | undefined;
    materialIndexDataTexture?: THREE.DataTexture | null | undefined;
    materialIndexDataTextureSize?: number | undefined;
    size_3?: number | undefined;
    sizeAttenuation_3?: boolean | undefined;
    sizeAttenuation_0?: boolean | undefined;
    sizeAttenuation_1?: boolean | undefined;
    sizeAttenuation_2?: boolean | undefined;
    size_0?: number | undefined;
    size_1?: number | undefined;
    size_2?: number | undefined;

    // #endregion Properties (21)
}

// #endregion Interfaces (1)

// #region Classes (1)

export class MultiPointsMaterial extends THREE.PointsMaterial {
    // #region Properties (22)

    public alphaMap_0: THREE.Texture | null = null;
    public alphaMap_1: THREE.Texture | null = null;
    public alphaMap_2: THREE.Texture | null = null;
    public alphaMap_3: THREE.Texture | null = null;
    public color_0: THREE.Color = new THREE.Color(0xff0000);
    public color_1: THREE.Color = new THREE.Color(0x00ff00);
    public color_2: THREE.Color = new THREE.Color(0x0000ff);
    public color_3: THREE.Color = new THREE.Color(0x0000ff);
    public isMultiPointsMaterial: boolean;
    public map_0: THREE.Texture | null = null;
    public map_1: THREE.Texture | null = null;
    public map_2: THREE.Texture | null = null;
    public map_3: THREE.Texture | null = null;
    public materialIndexDataTexture: THREE.DataTexture | null = null;
    public materialIndexDataTextureSize: number = 1024;
    public sizeAttenuation_0: boolean = true;
    public sizeAttenuation_1: boolean = true;
    public sizeAttenuation_2: boolean = true;
    public sizeAttenuation_3: boolean = true;
    public size_0: number = 1.0;
    public size_1: number = 1.0;
    public size_2: number = 1.0;
    public size_3: number = 1.0;

    // #endregion Properties (22)

    // #region Constructors (1)

    constructor(params: MultiPointsMaterialParameters) {
        super();

        this.isMultiPointsMaterial = true;

        const uniforms: { [key: string]: { value: unknown } } = {
            materialIndexDataTexture: { value: null },
            materialIndexDataTextureSize: { value: 1024 },

            map_0: { value: null },
            color_0: { value: new THREE.Color(0xff0000) },
            alphaMap_0: { value: null },
            size_0: { value: 1.0 },
            sizeAttenuation_0: { value: true },

            map_1: { value: null },
            color_1: { value: new THREE.Color(0x00ff00) },
            alphaMap_1: { value: null },
            size_1: { value: 1.0 },
            sizeAttenuation_1: { value: true },

            map_2: { value: null },
            color_2: { value: new THREE.Color(0x0000ff) },
            alphaMap_2: { value: null },
            size_2: { value: 1.0 },
            sizeAttenuation_2: { value: true },

            map_3: { value: null },
            color_3: { value: new THREE.Color(0x0000ff) },
            alphaMap_3: { value: null },
            size_3: { value: 1.0 },
            sizeAttenuation_3: { value: true }
        };

        (this as any)._extraUniforms = uniforms;

        this.onBeforeCompile = function (shader) {
            console.log(shader)
            for (const uniformName in uniforms) {
                shader.uniforms[uniformName] = uniforms[uniformName];
            }
            shader.vertexShader = vert;
            shader.fragmentShader = frag;
        };

        Object.defineProperties(this, {
            materialIndexDataTexture: {
                get: function () {
                    return uniforms.materialIndexDataTexture.value;
                },
                set: function (v) {
                    uniforms.materialIndexDataTexture.value = v;
                }
            },
            materialIndexDataTextureSize: {
                get: function () {
                    return uniforms.materialIndexDataTextureSize.value;
                },
                set: function (v) {
                    uniforms.materialIndexDataTextureSize.value = v;
                }
            },
            map_0: {
                get: function () {
                    return uniforms.map_0.value;
                },
                set: function (v) {
                    uniforms.map_0.value = v;
                }
            },
            color_0: {
                get: function () {
                    return uniforms.color_0.value;
                },
                set: function (v) {
                    uniforms.color_0.value = v;
                }
            },
            alphaMap_0: {
                get: function () {
                    return uniforms.alphaMap_0.value;
                },
                set: function (v) {
                    uniforms.alphaMap_0.value = v;
                }
            },
            size_0: {
                get: function () {
                    return uniforms.size_0.value;
                },
                set: function (v) {
                    uniforms.size_0.value = v;
                }
            },
            sizeAttenuation_0: {
                get: function () {
                    return uniforms.sizeAttenuation_0.value;
                },
                set: function (v) {
                    uniforms.sizeAttenuation_0.value = v;
                }
            },

            map_1: {
                get: function () {
                    return uniforms.map_1.value;
                },
                set: function (v) {
                    uniforms.map_1.value = v;
                }
            },
            color_1: {
                get: function () {
                    return uniforms.color_1.value;
                },
                set: function (v) {
                    uniforms.color_1.value = v;
                }
            },
            alphaMap_1: {
                get: function () {
                    return uniforms.alphaMap_1.value;
                },
                set: function (v) {
                    uniforms.alphaMap_1.value = v;
                }
            },
            size_1: {
                get: function () {
                    return uniforms.size_1.value;
                },
                set: function (v) {
                    uniforms.size_1.value = v;
                }
            },
            sizeAttenuation_1: {
                get: function () {
                    return uniforms.sizeAttenuation_1.value;
                },
                set: function (v) {
                    uniforms.sizeAttenuation_1.value = v;
                }
            },

            map_2: {
                get: function () {
                    return uniforms.map_2.value;
                },
                set: function (v) {
                    uniforms.map_2.value = v;
                }
            },
            color_2: {
                get: function () {
                    return uniforms.color_2.value;
                },
                set: function (v) {
                    uniforms.color_2.value = v;
                }
            },
            alphaMap_2: {
                get: function () {
                    return uniforms.alphaMap_2.value;
                },
                set: function (v) {
                    uniforms.alphaMap_2.value = v;
                }
            },
            size_2: {
                get: function () {
                    return uniforms.size_2.value;
                },
                set: function (v) {
                    uniforms.size_2.value = v;
                }
            },
            sizeAttenuation_2: {
                get: function () {
                    return uniforms.sizeAttenuation_2.value;
                },
                set: function (v) {
                    uniforms.sizeAttenuation_2.value = v;
                }
            },
            

            map_3: {
                get: function () {
                    return uniforms.map_3.value;
                },
                set: function (v) {
                    uniforms.map_3.value = v;
                }
            },
            color_3: {
                get: function () {
                    return uniforms.color_3.value;
                },
                set: function (v) {
                    uniforms.color_3.value = v;
                }
            },
            alphaMap_3: {
                get: function () {
                    return uniforms.alphaMap_3.value;
                },
                set: function (v) {
                    uniforms.alphaMap_3.value = v;
                }
            },
            size_3: {
                get: function () {
                    return uniforms.size_3.value;
                },
                set: function (v) {
                    uniforms.size_3.value = v;
                }
            },
            sizeAttenuation_3: {
                get: function () {
                    return uniforms.sizeAttenuation_3.value;
                },
                set: function (v) {
                    uniforms.sizeAttenuation_3.value = v;
                }
            }
        });

        this.materialIndexDataTexture = params.materialIndexDataTexture ?? null;
        this.materialIndexDataTextureSize = params.materialIndexDataTextureSize ?? 1024;

        this.map_0 = params.map_0 ?? null;
        this.color_0 = new THREE.Color(params.color_0 ?? 0xff000);
        this.alphaMap_0 = params.alphaMap_0 ?? null;
        this.size_0 = params.size_0 ?? 1.0;
        this.sizeAttenuation_0 = params.sizeAttenuation_0 ?? true;

        this.map_1 = params.map_1 ?? null;
        this.color_1 = new THREE.Color(params.color_1 ?? 0x00ff00);
        this.alphaMap_1 = params.alphaMap_1 ?? null;
        this.size_1 = params.size_1 ?? 1.0;
        this.sizeAttenuation_1 = params.sizeAttenuation_1 ?? true;

        this.map_2 = params.map_2 ?? null;
        this.color_2 = new THREE.Color(params.color_2 ?? 0x0000ff);
        this.alphaMap_2 = params.alphaMap_2 ?? null;
        this.size_2 = params.size_2 ?? 1.0;
        this.sizeAttenuation_2 = params.sizeAttenuation_2 ?? true;

        this.map_3 = params.map_3 ?? null;
        this.color_3 = new THREE.Color(params.color_3 ?? 0x0000ff);
        this.alphaMap_3 = params.alphaMap_3 ?? null;
        this.size_3 = params.size_3 ?? 1.0;
        this.sizeAttenuation_3 = params.sizeAttenuation_3 ?? true;

        this.setValues(params);
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public copy(s: THREE.Material) {
        super.copy(s);

        const source = s as MultiPointsMaterial;

        this.materialIndexDataTexture = source.materialIndexDataTexture;
        this.materialIndexDataTextureSize = source.materialIndexDataTextureSize;

        this.map_0 = source.map_0;
        this.color_0.copy(source.color_0);
        this.alphaMap_0 = source.alphaMap_0;
        this.size_0 = source.size_0;
        this.sizeAttenuation_0 = source.sizeAttenuation_0;

        this.map_1 = source.map_1;
        this.color_1.copy(source.color_1);
        this.alphaMap_1 = source.alphaMap_1;
        this.size_1 = source.size_1;
        this.sizeAttenuation_1 = source.sizeAttenuation_1;

        this.map_2 = source.map_2;
        this.color_2.copy(source.color_2);
        this.alphaMap_2 = source.alphaMap_2;
        this.size_2 = source.size_2;
        this.sizeAttenuation_2 = source.sizeAttenuation_2;

        this.map_3 = source.map_3;
        this.color_3.copy(source.color_3);
        this.alphaMap_3 = source.alphaMap_3;
        this.size_3 = source.size_3;
        this.sizeAttenuation_3 = source.sizeAttenuation_3;

        return this;
    }

    // #endregion Public Methods (1)
}

// #endregion Classes (1)
