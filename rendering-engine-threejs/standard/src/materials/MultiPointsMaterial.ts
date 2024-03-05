import * as THREE from 'three';
import { frag, vert } from '../shaders/multi_points';

// #region Interfaces (1)

export interface MultiPointsMaterialParameters extends THREE.PointsMaterialParameters {
    // #region Properties (21)

    alphaMap_0?: THREE.Texture | null | undefined;
    alphaMap_1?: THREE.Texture | null | undefined;
    alphaMap_2?: THREE.Texture | null | undefined;
    alphaMap_3?: THREE.Texture | null | undefined;
    alphaMap_4?: THREE.Texture | null | undefined;
    alphaMap_5?: THREE.Texture | null | undefined;
    alphaMap_6?: THREE.Texture | null | undefined;
    alphaMap_7?: THREE.Texture | null | undefined;
    color_0?: THREE.ColorRepresentation | undefined;
    color_1?: THREE.ColorRepresentation | undefined;
    color_2?: THREE.ColorRepresentation | undefined;
    color_3?: THREE.ColorRepresentation | undefined;
    color_4?: THREE.ColorRepresentation | undefined;
    color_5?: THREE.ColorRepresentation | undefined;
    color_6?: THREE.ColorRepresentation | undefined;
    color_7?: THREE.ColorRepresentation | undefined;
    fog?: boolean | undefined;
    map_0?: THREE.Texture | null | undefined;
    map_1?: THREE.Texture | null | undefined;
    map_2?: THREE.Texture | null | undefined;
    map_3?: THREE.Texture | null | undefined;
    map_4?: THREE.Texture | null | undefined;
    map_5?: THREE.Texture | null | undefined;
    map_6?: THREE.Texture | null | undefined;
    map_7?: THREE.Texture | null | undefined;
    materialIndexDataTexture?: THREE.DataTexture | null | undefined;
    materialIndexDataTextureSize?: number | undefined;
    sizeAttenuation_0?: boolean | undefined;
    sizeAttenuation_1?: boolean | undefined;
    sizeAttenuation_2?: boolean | undefined;
    sizeAttenuation_3?: boolean | undefined;
    sizeAttenuation_4?: boolean | undefined;
    sizeAttenuation_5?: boolean | undefined;
    sizeAttenuation_6?: boolean | undefined;
    sizeAttenuation_7?: boolean | undefined;
    size_0?: number | undefined;
    size_1?: number | undefined;
    size_2?: number | undefined;
    size_3?: number | undefined;
    size_4?: number | undefined;
    size_5?: number | undefined;
    size_6?: number | undefined;
    size_7?: number | undefined;

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
    public alphaMap_4: THREE.Texture | null = null;
    public alphaMap_5: THREE.Texture | null = null;
    public alphaMap_6: THREE.Texture | null = null;
    public alphaMap_7: THREE.Texture | null = null;
    public color_0: THREE.Color = new THREE.Color(0xffffff);
    public color_1: THREE.Color = new THREE.Color(0xffffff);
    public color_2: THREE.Color = new THREE.Color(0xffffff);
    public color_3: THREE.Color = new THREE.Color(0xffffff);
    public color_4: THREE.Color = new THREE.Color(0xffffff);
    public color_5: THREE.Color = new THREE.Color(0xffffff);
    public color_6: THREE.Color = new THREE.Color(0xffffff);
    public color_7: THREE.Color = new THREE.Color(0xffffff);
    public isMultiPointsMaterial: boolean;
    public map_0: THREE.Texture | null = null;
    public map_1: THREE.Texture | null = null;
    public map_2: THREE.Texture | null = null;
    public map_3: THREE.Texture | null = null;
    public map_4: THREE.Texture | null = null;
    public map_5: THREE.Texture | null = null;
    public map_6: THREE.Texture | null = null;
    public map_7: THREE.Texture | null = null;
    public materialIndexDataTexture: THREE.DataTexture | null = null;
    public materialIndexDataTextureSize: number = 1024;
    public sizeAttenuation_0: boolean = true;
    public sizeAttenuation_1: boolean = true;
    public sizeAttenuation_2: boolean = true;
    public sizeAttenuation_3: boolean = true;
    public sizeAttenuation_4: boolean = true;
    public sizeAttenuation_5: boolean = true;
    public sizeAttenuation_6: boolean = true;
    public sizeAttenuation_7: boolean = true;
    public size_0: number = 1.0;
    public size_1: number = 1.0;
    public size_2: number = 1.0;
    public size_3: number = 1.0;
    public size_4: number = 1.0;
    public size_5: number = 1.0;
    public size_6: number = 1.0;
    public size_7: number = 1.0;

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
            sizeAttenuation_3: { value: true },

            map_4: { value: null },
            color_4: { value: new THREE.Color(0x0000ff) },
            alphaMap_4: { value: null },
            size_4: { value: 1.0 },
            sizeAttenuation_4: { value: true },

            map_5: { value: null },
            color_5: { value: new THREE.Color(0x0000ff) },
            alphaMap_5: { value: null },
            size_5: { value: 1.0 },
            sizeAttenuation_5: { value: true },

            map_6: { value: null },
            color_6: { value: new THREE.Color(0x0000ff) },
            alphaMap_6: { value: null },
            size_6: { value: 1.0 },
            sizeAttenuation_6: { value: true },

            map_7: { value: null },
            color_7: { value: new THREE.Color(0x0000ff) },
            alphaMap_7: { value: null },
            size_7: { value: 1.0 },
            sizeAttenuation_7: { value: true }
        };

        (this as any)._extraUniforms = uniforms;

        this.onBeforeCompile = function (shader) {
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
            },

            map_4: {
                get: function () {
                    return uniforms.map_4.value;
                },
                set: function (v) {
                    uniforms.map_4.value = v;
                }
            },
            color_4: {
                get: function () {
                    return uniforms.color_4.value;
                },
                set: function (v) {
                    uniforms.color_4.value = v;
                }
            },
            alphaMap_4: {
                get: function () {
                    return uniforms.alphaMap_4.value;
                },
                set: function (v) {
                    uniforms.alphaMap_4.value = v;
                }
            },
            size_4: {
                get: function () {
                    return uniforms.size_4.value;
                },
                set: function (v) {
                    uniforms.size_4.value = v;
                }
            },
            sizeAttenuation_4: {
                get: function () {
                    return uniforms.sizeAttenuation_4.value;
                },
                set: function (v) {
                    uniforms.sizeAttenuation_4.value = v;
                }
            },

            map_5: {
                get: function () {
                    return uniforms.map_5.value;
                },
                set: function (v) {
                    uniforms.map_5.value = v;
                }
            },
            color_5: {
                get: function () {
                    return uniforms.color_5.value;
                },
                set: function (v) {
                    uniforms.color_5.value = v;
                }
            },
            alphaMap_5: {
                get: function () {
                    return uniforms.alphaMap_5.value;
                },
                set: function (v) {
                    uniforms.alphaMap_5.value = v;
                }
            },
            size_5: {
                get: function () {
                    return uniforms.size_5.value;
                },
                set: function (v) {
                    uniforms.size_5.value = v;
                }
            },
            sizeAttenuation_5: {
                get: function () {
                    return uniforms.sizeAttenuation_5.value;
                },
                set: function (v) {
                    uniforms.sizeAttenuation_5.value = v;
                }
            },

            map_6: {
                get: function () {
                    return uniforms.map_6.value;
                },
                set: function (v) {
                    uniforms.map_6.value = v;
                }
            },
            color_6: {
                get: function () {
                    return uniforms.color_6.value;
                },
                set: function (v) {
                    uniforms.color_6.value = v;
                }
            },
            alphaMap_6: {
                get: function () {
                    return uniforms.alphaMap_6.value;
                },
                set: function (v) {
                    uniforms.alphaMap_6.value = v;
                }
            },
            size_6: {
                get: function () {
                    return uniforms.size_6.value;
                },
                set: function (v) {
                    uniforms.size_6.value = v;
                }
            },
            sizeAttenuation_6: {
                get: function () {
                    return uniforms.sizeAttenuation_6.value;
                },
                set: function (v) {
                    uniforms.sizeAttenuation_6.value = v;
                }
            },

            map_7: {
                get: function () {
                    return uniforms.map_7.value;
                },
                set: function (v) {
                    uniforms.map_7.value = v;
                }
            },
            color_7: {
                get: function () {
                    return uniforms.color_7.value;
                },
                set: function (v) {
                    uniforms.color_7.value = v;
                }
            },
            alphaMap_7: {
                get: function () {
                    return uniforms.alphaMap_7.value;
                },
                set: function (v) {
                    uniforms.alphaMap_7.value = v;
                }
            },
            size_7: {
                get: function () {
                    return uniforms.size_7.value;
                },
                set: function (v) {
                    uniforms.size_7.value = v;
                }
            },
            sizeAttenuation_7: {
                get: function () {
                    return uniforms.sizeAttenuation_7.value;
                },
                set: function (v) {
                    uniforms.sizeAttenuation_7.value = v;
                }
            }
        });

        this.materialIndexDataTexture = params.materialIndexDataTexture ?? null;
        this.materialIndexDataTextureSize = params.materialIndexDataTextureSize ?? 1024;

        this.map_0 = params.map_0 ?? null;
        this.color_0 = new THREE.Color(params.color_0 ?? 0xffffff);
        this.alphaMap_0 = params.alphaMap_0 ?? null;
        this.size_0 = params.size_0 ?? 1.0;
        this.sizeAttenuation_0 = params.sizeAttenuation_0 ?? true;

        this.map_1 = params.map_1 ?? null;
        this.color_1 = new THREE.Color(params.color_1 ?? 0xffffff);
        this.alphaMap_1 = params.alphaMap_1 ?? null;
        this.size_1 = params.size_1 ?? 1.0;
        this.sizeAttenuation_1 = params.sizeAttenuation_1 ?? true;

        this.map_2 = params.map_2 ?? null;
        this.color_2 = new THREE.Color(params.color_2 ?? 0xffffff);
        this.alphaMap_2 = params.alphaMap_2 ?? null;
        this.size_2 = params.size_2 ?? 1.0;
        this.sizeAttenuation_2 = params.sizeAttenuation_2 ?? true;

        this.map_3 = params.map_3 ?? null;
        this.color_3 = new THREE.Color(params.color_3 ?? 0xffffff);
        this.alphaMap_3 = params.alphaMap_3 ?? null;
        this.size_3 = params.size_3 ?? 1.0;
        this.sizeAttenuation_3 = params.sizeAttenuation_3 ?? true;

        this.map_4 = params.map_4 ?? null;
        this.color_4 = new THREE.Color(params.color_4 ?? 0xffffff);
        this.alphaMap_4 = params.alphaMap_4 ?? null;
        this.size_4 = params.size_4 ?? 1.0;
        this.sizeAttenuation_4 = params.sizeAttenuation_4 ?? true;

        this.map_5 = params.map_5 ?? null;
        this.color_5 = new THREE.Color(params.color_5 ?? 0xffffff);
        this.alphaMap_5 = params.alphaMap_5 ?? null;
        this.size_5 = params.size_5 ?? 1.0;
        this.sizeAttenuation_5 = params.sizeAttenuation_5 ?? true;

        this.map_6 = params.map_6 ?? null;
        this.color_6 = new THREE.Color(params.color_6 ?? 0xffffff);
        this.alphaMap_6 = params.alphaMap_6 ?? null;
        this.size_6 = params.size_6 ?? 1.0;
        this.sizeAttenuation_6 = params.sizeAttenuation_6 ?? true;

        this.map_7 = params.map_7 ?? null;
        this.color_7 = new THREE.Color(params.color_7 ?? 0xffffff);
        this.alphaMap_7 = params.alphaMap_7 ?? null;
        this.size_7 = params.size_7 ?? 1.0;
        this.sizeAttenuation_7 = params.sizeAttenuation_7 ?? true;

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

        this.map_4 = source.map_4;
        this.color_4.copy(source.color_4);
        this.alphaMap_4 = source.alphaMap_4;
        this.size_4 = source.size_4;
        this.sizeAttenuation_4 = source.sizeAttenuation_4;

        this.map_5 = source.map_5;
        this.color_5.copy(source.color_5);
        this.alphaMap_5 = source.alphaMap_5;
        this.size_5 = source.size_5;
        this.sizeAttenuation_5 = source.sizeAttenuation_5;

        this.map_6 = source.map_6;
        this.color_6.copy(source.color_6);
        this.alphaMap_6 = source.alphaMap_6;
        this.size_6 = source.size_6;
        this.sizeAttenuation_6 = source.sizeAttenuation_6;

        this.map_7 = source.map_7;
        this.color_7.copy(source.color_7);
        this.alphaMap_7 = source.alphaMap_7;
        this.size_7 = source.size_7;
        this.sizeAttenuation_7 = source.sizeAttenuation_7;

        return this;
    }

    // #endregion Public Methods (1)
}

// #endregion Classes (1)
