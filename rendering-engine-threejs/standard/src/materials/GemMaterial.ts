import * as THREE from 'three';
import { frag, vert } from '../shaders/gem';

export interface GemMaterialParameters extends THREE.MeshPhysicalMaterialParameters {
    // #region Properties (4)

    refractionIndex?: number | undefined;
    impurityMap?: THREE.Texture | null | undefined;
    impurityScale?: number | undefined;
    colorTransferBegin?: THREE.Color | undefined;
    colorTransferEnd?: THREE.Color | undefined;
    center?: THREE.Vector3 | undefined;
    radius?: number | undefined;
    sphericalNormalMap?: THREE.CubeTexture | null | undefined;
    gamma?: number | undefined;
    contrast?: number | undefined;
    brightness?: number | undefined;
    dispersion?: number | undefined;
    tracingDepth?: number | undefined;
    tracingOpacity?: number | undefined;
    inverseModelMatrix?: THREE.Matrix4 | undefined;
    inverseTransposeModelMatrix?: THREE.Matrix3 | undefined;

    // #endregion Properties (4)
}

export class GemMaterial extends THREE.MeshPhysicalMaterial {
    // #region Properties (1)

    public isGemMaterial: boolean;
    
    public refractionIndex: number = 2.4;
    public impurityMap: THREE.Texture | null = null;
    public impurityScale: number = 1.0;
    public colorTransferBegin: THREE.Color = new THREE.Color(0xffffff);
    public colorTransferEnd: THREE.Color = new THREE.Color(0xffffff);
    public center: THREE.Vector3 = new THREE.Vector3(0,0,0);
    public tracingDepth: number = 5;
    public radius: number = 1.0;
    public sphericalNormalMap: THREE.CubeTexture | null = null;
    public gamma: number = 1.0;
    public contrast: number = 1.0;
    public brightness: number = 0.0;
    public dispersion: number = 0.0;
    public tracingOpacity: number = 0.0;
    public inverseModelMatrix: THREE.Matrix4 = new THREE.Matrix4();
    public inverseTransposeModelMatrix: THREE.Matrix3 = new THREE.Matrix3();

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(params: GemMaterialParameters) {
        super();

        this.isGemMaterial = true;

        const uniforms: { [key: string]: { value: any } } = {
            refractionIndex: { value: 2.4 },
            impurityMap: { value: null },
            impurityScale: { value: 1.0 },
            colorTransferBegin: { value: new THREE.Color(0xffffff) },
            colorTransferEnd: { value: new THREE.Color(0xffffff) },
            center: { value: new THREE.Vector3(0,0,0) },
            tracingDepth: { value: 5 },
            radius: { value: 1.0 },
            sphericalNormalMap: { value: null },
            gamma: { value: 1.0 },
            contrast: { value: 1.0 },
            brightness: { value: 0.0 },
            dispersion: { value: 0.0 },
            tracingOpacity: { value: 0.0 },
            inverseModelMatrix: {value: new THREE.Matrix4()},
            inverseTransposeModelMatrix: {value: new THREE.Matrix3()},
        };

        (<any>this)._extraUniforms = uniforms;

        this.onBeforeCompile = function (shader) {
            for (const uniformName in uniforms) {
                shader.uniforms[uniformName] = uniforms[uniformName];
            }
            shader.vertexShader = vert;
            shader.fragmentShader = frag;
        };

        Object.defineProperties(this, {
            tracingDepth: {
                get: function () {
                    return uniforms.tracingDepth.value;
                },
                set: function (v) {
                    uniforms.tracingDepth.value = v;

                    if (v) {
                        this.defines.TRACING_DEPTH = Math.floor(v);
                    } else {
                        delete this.defines.TRACING_DEPTH;
                    }
                }
            },
            refractionIndex: {
                get: function () {
                    return uniforms.refractionIndex.value;
                },
                set: function (v) {
                    uniforms.refractionIndex.value = v;
                }
            },
            impurityMap: {
                get: function () {
                    return uniforms.impurityMap.value;
                },
                set: function (v) {
                    uniforms.impurityMap.value = v;

                    if (v) {
                        this.defines.USE_IMPURITYMAP = '';
                        this.defines.USE_UV = '';
                    } else {
                        delete this.defines.USE_IMPURITYMAP;
                        delete this.defines.USE_UV;
                    }
                }
            },
            impurityScale: {
                get: function () {
                    return uniforms.impurityScale.value;
                },
                set: function (v) {
                    uniforms.impurityScale.value = v;
                }
            },
            colorTransferBegin: {
                get: function () {
                    return uniforms.colorTransferBegin.value;
                },
                set: function (v) {
                    uniforms.colorTransferBegin.value = v;
                }
            },
            colorTransferEnd: {
                get: function () {
                    return uniforms.colorTransferEnd.value;
                },
                set: function (v) {
                    uniforms.colorTransferEnd.value = v;
                }
            },
            center: {
                get: function () {
                    return uniforms.center.value;
                },
                set: function (v) {
                    uniforms.center.value = v;
                }
            },
            radius: {
                get: function () {
                    return uniforms.radius.value;
                },
                set: function (v) {
                    uniforms.radius.value = v;
                }
            },
            sphericalNormalMap: {
                get: function () {
                    return uniforms.sphericalNormalMap.value;
                },
                set: function (v) {
                    uniforms.sphericalNormalMap.value = v;

                    if (v) {
                        this.defines.USE_UV = '';
                    } else {
                        delete this.defines.USE_UV;
                    }
                }
            },
            gamma: {
                get: function () {
                    return uniforms.gamma.value;
                },
                set: function (v) {
                    uniforms.gamma.value = v;
                }
            },
            contrast: {
                get: function () {
                    return uniforms.contrast.value;
                },
                set: function (v) {
                    uniforms.contrast.value = v;
                }
            },
            brightness: {
                get: function () {
                    return uniforms.brightness.value;
                },
                set: function (v) {
                    uniforms.brightness.value = v;
                }
            },
            dispersion: {
                get: function () {
                    return uniforms.dispersion.value;
                },
                set: function (v) {
                    uniforms.dispersion.value = v;
                    if (v !== 0) {
                        this.defines.DISPERSION = '';
                    } else {
                        delete this.defines.DISPERSION;
                    }
                }
            },
            tracingOpacity: {
                get: function () {
                    return uniforms.tracingOpacity.value;
                },
                set: function (v) {
                    uniforms.tracingOpacity.value = v;
                }
            },
            inverseModelMatrix: {
                get: function () {
                    return uniforms.inverseModelMatrix.value;
                },
                set: function (v) {
                    uniforms.inverseModelMatrix.value = v;
                }
            },
            inverseTransposeModelMatrix: {
                get: function () {
                    return uniforms.inverseTransposeModelMatrix.value;
                },
                set: function (v) {
                    uniforms.inverseTransposeModelMatrix.value = v;
                }
            }
        });

        this.refractionIndex = params.refractionIndex || 2.4;
        this.impurityMap = params.impurityMap || null;
        this.impurityScale = params.impurityScale || 1;
        this.colorTransferBegin.copy(params.colorTransferBegin || new THREE.Color(0xffffff));
        this.colorTransferEnd.copy(params.colorTransferEnd || new THREE.Color(0xffffff));
        this.center.copy(params.center || new THREE.Vector3(0,0,0));
        this.tracingDepth = params.tracingDepth || 5;
        this.radius = params.radius || 1;
        this.sphericalNormalMap = params.sphericalNormalMap || null;
        this.gamma = params.gamma || 1;
        this.contrast = params.contrast || 1;
        this.brightness = params.brightness || 0;
        this.dispersion = params.dispersion || 0;
        this.tracingOpacity = params.tracingOpacity || 0;
        this.inverseModelMatrix = params.inverseModelMatrix || new THREE.Matrix4();
        this.inverseTransposeModelMatrix = params.inverseTransposeModelMatrix || new THREE.Matrix3();

        this.setValues(params);
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public copy(source: GemMaterial) {
        super.copy(source);

        this.refractionIndex = (<any>source).refractionIndex;
        this.impurityMap = (<any>source).impurityMap;
        this.impurityScale = (<any>source).impurityScale;
        this.colorTransferBegin.copy((<any>source).colorTransferBegin);
        this.colorTransferEnd.copy((<any>source).colorTransferEnd);
        this.center.copy((<any>source).center);
        this.tracingDepth = (<any>source).tracingDepth;
        this.radius = (<any>source).radius;
        this.sphericalNormalMap = (<any>source).sphericalNormalMap;
        this.gamma = (<any>source).gamma;
        this.contrast = (<any>source).contrast;
        this.brightness = (<any>source).brightness;
        this.dispersion = (<any>source).dispersion;
        this.tracingOpacity = (<any>source).tracingOpacity;
        this.inverseModelMatrix = (<any>source).inverseModelMatrix;
        this.inverseTransposeModelMatrix = (<any>source).inverseTransposeModelMatrix;
        
        return this;
    }

    // #endregion Public Methods (1)
}
