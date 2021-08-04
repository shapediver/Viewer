import * as THREE from 'three'
import {
  MapData,
  MATERIAL_SIDE,
  MaterialData,
  TEXTURE_FILTERING,
  TEXTURE_WRAPPING,
} from '@shapediver/viewer.shared.types'
import { vec4 } from 'gl-matrix'

import { RenderingEngine } from '../RenderingEngine'
import { entry, main } from '../shaders/PCSS'
import { SpecularGlossinessMaterial } from '../materials/SpecularGlossinessMaterial'
import { RenderingManager } from '../managers/RenderingManager'
import { ILoader } from '../interfaces/ILoader'

export class MaterialLoader implements ILoader {
    // #region Properties (8)

    private readonly _defaultColor: string = '#00fff7';
    private readonly _materialLibrary: (THREE.Material | THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.PointsMaterial | THREE.LineBasicMaterial)[] = [];

    private _blending: number = 0.0;
    private _envMap: THREE.CubeTexture | THREE.Texture | null = null;
    private _envMapIntensity: number = 1;
    private _height: number = 1020;
    private _lightSizeUV: number = 0.025;
    private _pointSize: number = 1.0;
    private _textureEncoding: THREE.TextureEncoding = THREE.LinearEncoding;

    // #endregion Properties (8)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        let shader = THREE.ShaderChunk.shadowmap_pars_fragment;
        if (!shader.includes('PCSS implementation')) {
            shader = shader.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP' + main);
            shader = shader.replace(shader.substr(shader.indexOf('#if defined( SHADOWMAP_TYPE_PCF )'), shader.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )') - shader.indexOf('#if defined( SHADOWMAP_TYPE_PCF )')), '#if defined( SHADOWMAP_TYPE_PCF )\n' + entry);
        }
        THREE.ShaderChunk.shadowmap_pars_fragment = shader;

        // THREE.ShaderChunk.envmap_fragment = THREE.ShaderChunk.envmap_fragment.replace(
        //     `vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );`,
        //     `vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.zy ) );`
        // )
        THREE.ShaderChunk.envmap_fragment = THREE.ShaderChunk.envmap_fragment.replace(
            `vec4 envColor = textureCubeUV( envMap, reflectVec, 0.0 );`,
            `vec4 envColor = textureCubeUV( envMap, reflectVec.xzy, 0.0 );`
        )
        // THREE.ShaderChunk.envmap_physical_pars_fragment = THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
        //     `vec4 envMapColor = textureCubeLodEXT( envMap, queryVec, float( maxMIPLevel ) );`,
        //     `vec4 envMapColor = textureCubeLodEXT( envMap, queryVec.xzy, float( maxMIPLevel ) );`
        // )
        // THREE.ShaderChunk.envmap_physical_pars_fragment = THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
        //     `vec4 envMapColor = textureCube( envMap, queryVec, float( maxMIPLevel ) );`,
        //     `vec4 envMapColor = textureCube( envMap, queryVec.xzy, float( maxMIPLevel ) );`
        // )
        THREE.ShaderChunk.envmap_physical_pars_fragment = THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
            `vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );`,
            `vec4 envMapColor = textureCubeUV( envMap, worldNormal.xzy, 1.0 );`
        )
        // THREE.ShaderChunk.envmap_physical_pars_fragment = THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
        //     `vec4 envMapColor = textureCubeLodEXT( envMap, queryReflectVec, specularMIPLevel );`,
        //     `vec4 envMapColor = textureCubeLodEXT( envMap, queryReflectVec.xzy, specularMIPLevel );`
        // )
        // THREE.ShaderChunk.envmap_physical_pars_fragment = THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
        //     `vec4 envMapColor = textureCube( envMap, queryReflectVec, specularMIPLevel );`,
        //     `vec4 envMapColor = textureCube( envMap, queryReflectVec.xzy, specularMIPLevel );`
        // )
        THREE.ShaderChunk.envmap_physical_pars_fragment = THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
            `vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );`,
            `vec4 envMapColor = textureCubeUV( envMap, reflectVec.xzy, roughness );`
        )
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    public assignEnvironmentMap(e: THREE.CubeTexture | THREE.Texture | null) {
        this._envMap = e;
        for(let i = 0; i < this._materialLibrary.length; i++) {
            if((this._materialLibrary[i] instanceof THREE.MeshStandardMaterial || this._materialLibrary[i] instanceof THREE.MeshBasicMaterial)
                && !(<any>this._materialLibrary[i]).KHR_materials_unlit) {
                (<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>this._materialLibrary[i]).envMap = e;
                (<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>this._materialLibrary[i]).needsUpdate = true;
            }
        }
    }

    public assignEnvironmentMapIntensity(e: number) {
        this._envMapIntensity = e;
        for(let i = 0; i < this._materialLibrary.length; i++) {
            if((this._materialLibrary[i] instanceof THREE.MeshStandardMaterial)
                && !(<any>this._materialLibrary[i]).KHR_materials_unlit) {
                (<THREE.MeshStandardMaterial>this._materialLibrary[i]).envMapIntensity = e;
                (<THREE.MeshStandardMaterial>this._materialLibrary[i]).needsUpdate = true;
            }
        }
    }

    public assignPointSize(p: number) {
        const height = this._renderingEngine.renderer ? this._renderingEngine.renderer.getSize(new THREE.Vector2()).y : 1080;
        if(height === this._height && p * (this._height/1080) === this._pointSize) return;
        this._height = height;
        this._pointSize = p * (this._height/1080);
        for(let i = 0; i < this._materialLibrary.length; i++) {
            if(this._materialLibrary[i] instanceof THREE.PointsMaterial) {
                (<THREE.PointsMaterial>this._materialLibrary[i]).size = this._pointSize;
                (<THREE.PointsMaterial>this._materialLibrary[i]).needsUpdate = true;
            }
        }
    }

    public assignTextureEncoding(e: THREE.TextureEncoding) {
        this._textureEncoding = e;
        for(let i = 0; i < this._materialLibrary.length; i++) {
            if(this._materialLibrary[i] instanceof THREE.MeshStandardMaterial) {
                if((<THREE.MeshStandardMaterial>this._materialLibrary[i]).emissiveMap)
                    (<THREE.MeshStandardMaterial>this._materialLibrary[i]).emissiveMap!.encoding = e;
                if((<THREE.MeshStandardMaterial>this._materialLibrary[i]).map)
                    (<THREE.MeshStandardMaterial>this._materialLibrary[i]).map!.encoding = e;
                (<THREE.MeshStandardMaterial>this._materialLibrary[i]).needsUpdate = true;
            }
        }
    }

    public init(): void {}

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

            if(materialProperties.color !== undefined)
                properties.color = new THREE.Color(materialProperties.color);
            
            if(!materialProperties.color !== undefined && materialProperties.map !== undefined && materialProperties.map.color !== undefined)
                properties.color = new THREE.Color(materialProperties.map.color);

            if(!materialProperties.color !== undefined && materialProperties.map !== undefined && materialProperties.map.color !== undefined && !(materialSettings !== undefined && materialSettings.useVertexColors))
                properties.color = new THREE.Color(this._defaultColor);

            if((materialSettings !== undefined && materialSettings.useVertexColors) && materialProperties.color === this._defaultColor)
                properties.color = new THREE.Color('#d3d3d3');
            // displacementMap

            // displacementScale

            // displacementBias

            if(materialProperties.emissiveness !== undefined)
                properties.emissive = new THREE.Color(materialProperties.emissiveness);

            if (materialProperties.emissiveMap !== undefined) {
                properties.emissiveMap = this.createTexture(materialProperties.emissiveMap);
                properties.emissiveMap.encoding = this._textureEncoding;
            }

            // emissiveIntensity

            properties.envMap = this._envMap;
            properties.envMapIntensity = this._envMapIntensity;

            // lightMap

            // lightMapIntensity

            if (materialProperties.map !== undefined) {
                properties.map = this.createTexture(materialProperties.map);
                properties.map.encoding = this._textureEncoding;
            }

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
        
            if(materialProperties.KHR_materials_pbrSpecularGlossiness !== undefined)
                properties.KHR_materials_pbrSpecularGlossiness = materialProperties.KHR_materials_pbrSpecularGlossiness;
        
            if (properties.KHR_materials_pbrSpecularGlossiness === true) {
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

            if(materialProperties.KHR_materials_unlit !== undefined)
                properties.KHR_materials_unlit = materialProperties.KHR_materials_unlit;
                
        } else {
            properties.color = new THREE.Color(this._defaultColor);
            properties.side = THREE.DoubleSide;
        }

        // THREE.JS is stupid and logs millions of warnings, this is how we avoid them PART 1
        const oldConsoleWarn = console.warn;
        console.warn = () => {};

        let material: THREE.Material;
        if(materialSettings && materialSettings.mode === 0) {
            properties.size = this._pointSize;
            material = new THREE.PointsMaterial(properties);
        } else if(materialSettings && (materialSettings.mode === 1 || materialSettings.mode === 2 || materialSettings.mode === 3)) {
            material = new THREE.LineBasicMaterial(properties);
        } else {
            if(properties.KHR_materials_pbrSpecularGlossiness === true) {
                material = new SpecularGlossinessMaterial(properties);
                (<any>material).KHR_materials_pbrSpecularGlossiness = true;
                const before = material.onBeforeCompile;
                material.onBeforeCompile = (shader: THREE.Shader, renderer: THREE.WebGLRenderer) => {
                    before(shader, renderer);
                    shader.uniforms.lightSizeUV = { value: this._lightSizeUV };
                    shader.uniforms.blending = { value: this._blending };
                    material.userData.shader = shader;
                };
            } else if(properties.KHR_materials_unlit === true) {
                if(properties.envMap) delete properties.envMap;
                material = new THREE.MeshBasicMaterial(properties);
                (<any>material).KHR_materials_unlit = true;
            } else {
                material = new THREE.MeshStandardMaterial(properties);
                material.onBeforeCompile = (shader: THREE.Shader) => {
                    shader.uniforms.lightSizeUV = { value: this._lightSizeUV };
                    shader.uniforms.blending = { value: this._blending };
                    material.userData.shader = shader;
                };
            }
        }

        // THREE.JS is stupid and logs millions of warnings, this is how we avoid them PART 2
        console.warn = oldConsoleWarn;

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

    // #endregion Public Methods (7)

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