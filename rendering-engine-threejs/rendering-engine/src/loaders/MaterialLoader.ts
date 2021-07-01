import * as THREE from 'three';
import { MaterialData, TEXTURE_WRAPPING, TEXTURE_FILTERING, MapData, MATERIAL_SIDE } from '@shapediver/viewer.shared.types';
import { vec4 } from 'gl-matrix';
import { RenderingEngine } from '../RenderingEngine';
import { main, entry } from "../shaders/PCSS";
import { SpecularGlossinessMaterial } from '../materials/SpecularGlossinessMaterial';

export class MaterialLoader {
    // #region Properties (5)

    private readonly _defaultColor: string = '#00fff7';
    private readonly _materialLibrary: (THREE.Material | THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.PointsMaterial | THREE.LineBasicMaterial)[] = [];

    private _blending: number = 0.0;
    private _lightSizeUV: number = 0.025;

    private _envMap: THREE.CubeTexture | THREE.Texture | null = null;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        let shader = THREE.ShaderChunk.shadowmap_pars_fragment;
        if (!shader.includes('PCSS implementation')) {
            shader = shader.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP' + main);
            shader = shader.replace(shader.substr(shader.indexOf('#if defined( SHADOWMAP_TYPE_PCF )'), shader.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )') - shader.indexOf('#if defined( SHADOWMAP_TYPE_PCF )')), '#if defined( SHADOWMAP_TYPE_PCF )\n' + entry);
        }
        THREE.ShaderChunk.shadowmap_pars_fragment = shader;
    }

    // #endregion Constructors (1)

    // #region Public Methods (4)

    public assignEnvironmentMap(e: THREE.CubeTexture | THREE.Texture | null) {
        this._envMap = e;
        for(let i = 0; i < this._materialLibrary.length; i++) {
            if(this._materialLibrary[i] instanceof THREE.MeshStandardMaterial || this._materialLibrary[i] instanceof THREE.MeshBasicMaterial) {
                (<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>this._materialLibrary[i]).envMap = e;
                (<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>this._materialLibrary[i]).needsUpdate = true;
            }
        }
    }

    /**
     * Create a material object with the provided material data.
     * 
     * @param material the material data
     * @returns the material object
     */
    public load(
        materialProperties: MaterialData, 
        materialSettings?: {
            mode?: number,
            useVertexTangents?: boolean,
            useVertexColors?: boolean,
            useFlatShading?: boolean,
            useMorphTargets?: boolean,
            useMorphNormals?: boolean
        }
    ): THREE.Material {
        const properties: any = {};
        if (materialProperties) {

            properties.alphaTest = materialProperties.alphaCutoff;

            // blendDst

            // blendDstAlpha

            // blendEquation

            // blendEquationAlpha

            // blending

            // blendSrc

            // blendSrcAlpha

            // clipIntersection

            // clippingPlanes

            // clipShadows

            // colorWrite

            // depthFunc

            // depthWrite

            // stencilWrite

            // stencilWriteMask

            // stencilFunc

            // stencilFail

            // stencilZFail

            // stencilZPass

            if(materialProperties.shading !== undefined)
                properties.flatShading = materialProperties.shading !== 'smooth';

            // fog

            if(materialProperties.opacity !== undefined){
                properties.opacity = materialProperties.opacity;
                properties.transparent = properties.opacity < 1;
            }

            // polygonOffset

            // polygonOffsetFactor

            // polygonOffsetUnits

            // precision

            // premultipliedAlpha

            // dithering

            // shadowSide

            // toneMapped

            // visible

            if (materialProperties.alphaMap !== undefined) {
                properties.alphaMap = this.createTexture(materialProperties.alphaMap);
                properties.transparent = true;
            }

            if (materialProperties.aoMap !== undefined) {
                properties.aoMap = this.createTexture(materialProperties.aoMap);
            }

            if (materialProperties.aoMapIntensity !== undefined) {
                properties.aoMapIntensity = materialProperties.aoMapIntensity;
            }

            if (materialProperties.bumpMap !== undefined)
            properties.bumpMap = this.createTexture(materialProperties.bumpMap);

            properties.bumpScale = materialProperties.bumpScale;

            if(materialProperties.color)
                properties.color = new THREE.Color(materialProperties.color);
            
            if(!materialProperties.color && materialProperties.map && materialProperties.map.color)
                properties.color = new THREE.Color(materialProperties.map.color);

            if(!materialProperties.color && !materialProperties.map && !(materialSettings && materialSettings.useVertexColors))
                properties.color = new THREE.Color(this._defaultColor);

            // displacementMap

            // displacementScale

            // displacementBias

            if(materialProperties.emissiveness)
                properties.emissive = new THREE.Color(materialProperties.emissiveness);

            if (materialProperties.emissiveMap !== undefined)
                properties.emissiveMap = this.createTexture(materialProperties.emissiveMap);

            // emissiveIntensity

            properties.envMap = this._envMap;

            // envMapIntensity

            // lightMap

            // lightMapIntensity

            if (materialProperties.map !== undefined)
                properties.map = this.createTexture(materialProperties.map);

            properties.metalness = materialProperties.metalness;

            properties.roughness = materialProperties.roughness;

            if (materialProperties.metalnessRoughnessMap !== undefined) {
                properties.metalnessMap = this.createTexture(materialProperties.metalnessRoughnessMap);
                properties.roughnessMap = properties.metalnessMap;
            } else {
                if (materialProperties.metalnessMap !== undefined)
                    properties.metalnessMap = this.createTexture(materialProperties.metalnessMap);
                if (materialProperties.roughnessMap !== undefined)
                    properties.roughnessMap = this.createTexture(materialProperties.roughnessMap);
            }

            // morphNormals

            // morphTargets

            if (materialProperties.normalMap !== undefined)
                properties.normalMap = this.createTexture(materialProperties.normalMap);

            // normalMapType

            if(materialProperties.normalScale !== undefined)
                properties.normalScale = new THREE.Vector2(materialProperties.normalScale, -materialProperties.normalScale);

            // refractionRatio

            // skinning

            // wireframe

            // wireframeLinecap

            // wireframeLinejoin

            // wireframeLinewidth

            if(materialProperties.side !== undefined)
                properties.side = materialProperties.side === MATERIAL_SIDE.BACK ? THREE.BackSide : materialProperties.side === MATERIAL_SIDE.FRONT ? THREE.FrontSide : THREE.DoubleSide;
        
            if(materialProperties.specularGlossinessWorkflow !== undefined)
                properties.specularGlossinessWorkflow = materialProperties.specularGlossinessWorkflow;
        
            if (properties.specularGlossinessWorkflow === true) {
                properties.specular = materialProperties.specular;
                properties.glossiness = materialProperties.glossiness;
    
                if (materialProperties.specularGlossinessMap !== undefined) {
                    properties.specularMap = this.createTexture(materialProperties.specularGlossinessMap);
                    properties.glossinessMap = properties.specularMap;
                } else {
                    if (materialProperties.specularMap !== undefined)
                        properties.specularMap = this.createTexture(materialProperties.specularMap);
                    if (materialProperties.glossinessMap !== undefined)
                        properties.glossinessMap = this.createTexture(materialProperties.glossinessMap);
                }
            }

                
        } else {
            properties.color = new THREE.Color(this._defaultColor);
            properties.side = THREE.DoubleSide;
        }

        let material: THREE.Material;
        if(materialSettings && materialSettings.mode === 0) {
            material = new THREE.PointsMaterial(properties);
        } else if(materialSettings && (materialSettings.mode === 1 || materialSettings.mode === 2 || materialSettings.mode === 3)) {
            material = new THREE.LineBasicMaterial(properties);
        } else {
            if(properties.specularGlossinessWorkflow === true) {
                material = new SpecularGlossinessMaterial(properties);
                
                const before = material.onBeforeCompile;
                material.onBeforeCompile = (shader: THREE.Shader, renderer: THREE.WebGLRenderer) => {
                    before(shader, renderer);
                    shader.uniforms.lightSizeUV = { value: this._lightSizeUV };
                    shader.uniforms.blending = { value: this._blending };
                    material.userData.shader = shader;
                };
            } else {
                material = new THREE.MeshStandardMaterial(properties);
                material.onBeforeCompile = (shader: THREE.Shader) => {
                    shader.uniforms.lightSizeUV = { value: this._lightSizeUV };
                    shader.uniforms.blending = { value: this._blending };
                    material.userData.shader = shader;
                };
            }
        }

        if (materialSettings && materialSettings.useVertexTangents) {
            (<any>material).vertexTangents = true;
            if ( (<any>material).normalScale ) (<any>material).normalScale.y *= - 1;
            if ( (<any>material).clearcoatNormalScale ) (<any>material).clearcoatNormalScale.y *= - 1;
        }
        if (materialSettings && materialSettings.useVertexColors) (<any>material).vertexColors = true;
        if (materialSettings && materialSettings.useFlatShading) (<any>material).flatShading = true;
        if (materialSettings && materialSettings.useMorphTargets) (<any>material).morphTargets = true;
        if (materialSettings && materialSettings.useMorphNormals) (<any>material).morphNormals = true;

        material.needsUpdate = true;
        this._materialLibrary.push(material);
        return material;
    }

    public updateMaterials(): void {
        for(let i = 0; i < this._materialLibrary.length; i++)
            this._materialLibrary[i].needsUpdate = true;
    }

    public updateSoftShadow(lightSizeUV: number, blending: number) {
        this._lightSizeUV = lightSizeUV;
        this._blending = blending;
        for(let i = 0; i < this._materialLibrary.length; i++) {
            if(this._materialLibrary[i].userData.shader) {
                this._materialLibrary[i].userData.shader.uniforms.lightSizeUV.value = lightSizeUV;
                this._materialLibrary[i].userData.shader.uniforms.blending.value = blending;
            }
        }
    }

    // #endregion Public Methods (4)

    // #region Private Methods (1)

    private createTexture(map: MapData): THREE.Texture {
        const texture = new THREE.Texture(map.image);
        texture.format = THREE.RGBAFormat;
        texture.minFilter = (() => {
            switch (map.minFilter) {
                case TEXTURE_FILTERING.NEAREST:
                    return THREE.NearestFilter;
                case TEXTURE_FILTERING.NEAREST_MIPMAP_NEAREST:
                    return THREE.NearestMipMapNearestFilter;
                case TEXTURE_FILTERING.LINEAR_MIPMAP_NEAREST:
                    return THREE.LinearMipMapNearestFilter;
                case TEXTURE_FILTERING.NEAREST_MIPMAP_LINEAR:
                    return THREE.NearestMipMapLinearFilter;
                case TEXTURE_FILTERING.LINEAR:
                    return THREE.LinearFilter
                case TEXTURE_FILTERING.LINEAR_MIPMAP_LINEAR:
                default:
                    return THREE.LinearMipMapLinearFilter;
            }
        })();
        texture.magFilter = (() => {
            switch (map.magFilter) {
                case TEXTURE_FILTERING.NEAREST:
                    return THREE.NearestFilter;
                case TEXTURE_FILTERING.LINEAR:
                default:
                    return THREE.LinearFilter
            }
        })();
        texture.wrapS = (() => {
            switch (map.wrapS) {
                case TEXTURE_WRAPPING.CLAMP_TO_EDGE:
                    return THREE.ClampToEdgeWrapping;
                case TEXTURE_WRAPPING.MIRRORED_REPEAT:
                    return THREE.MirroredRepeatWrapping;
                case TEXTURE_WRAPPING.REPEAT:
                default:
                    return THREE.RepeatWrapping
            }
        })();
        texture.wrapT = (() => {
            switch (map.wrapT) {
                case TEXTURE_WRAPPING.CLAMP_TO_EDGE:
                    return THREE.ClampToEdgeWrapping;
                case TEXTURE_WRAPPING.MIRRORED_REPEAT:
                    return THREE.MirroredRepeatWrapping;
                case TEXTURE_WRAPPING.REPEAT:
                default:
                    return THREE.RepeatWrapping
            }
        })();

        texture.center = new THREE.Vector2(map.center[0], map.center[1]);
        texture.offset = new THREE.Vector2(map.offset[0], map.offset[1]);
        texture.repeat = new THREE.Vector2(map.repeat[0], map.repeat[1]);
        texture.rotation = map.rotation;

        texture.flipY = map.flipY;
        texture.needsUpdate = true;
        return texture;
    }

    // #endregion Private Methods (1)
}