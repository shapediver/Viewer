import * as THREE from 'three'
import {
  MapData,
  MATERIAL_SIDE,
  MaterialData,
  TEXTURE_FILTERING,
  TEXTURE_WRAPPING,
  SDTFItemData,
  SDTFAttributeVisualizationData,
} from '@shapediver/viewer.shared.types'
import { vec4 } from 'gl-matrix'

import { RenderingEngine } from '../RenderingEngine'
import { entry, main } from '../shaders/PCSS'
import { SpecularGlossinessMaterial } from '../materials/SpecularGlossinessMaterial'
import { RenderingManager } from '../managers/RenderingManager'
import { ILoader } from '../interfaces/ILoader'
import { Converter } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

export class MaterialLoader implements ILoader {
    // #region Properties (8)

    private readonly _defaultColor: string = '#00fff7';
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private _materialCache: { [key:string]: (THREE.Material | THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.PointsMaterial | THREE.LineBasicMaterial)} = {};

    private _blending: number = 0.0;
    private _envMap: THREE.CubeTexture | THREE.Texture | null = null;
    private _envMapIntensity: number = 1;
    private _height: number = 1020;
    private _lightSizeUV: number = 0.025;
    private _pointSize: number = 1.0;
    private _textureEncoding: THREE.TextureEncoding = THREE.LinearEncoding;
    private _maxMapCount: number = 0;

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
        for(let m in this._materialCache) {
            if((this._materialCache[m] instanceof THREE.MeshStandardMaterial || this._materialCache[m] instanceof THREE.MeshBasicMaterial)
                && !(<any>this._materialCache[m]).KHR_materials_unlit) {
                (<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>this._materialCache[m]).envMap = e;
                (<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>this._materialCache[m]).needsUpdate = true;
            }
        }
    }

    public assignEnvironmentMapIntensity(e: number) {
        this._envMapIntensity = e;
        for(let m in this._materialCache) {
            if((this._materialCache[m] instanceof THREE.MeshStandardMaterial)
                && !(<any>this._materialCache[m]).KHR_materials_unlit) {
                (<THREE.MeshStandardMaterial>this._materialCache[m]).envMapIntensity = e;
                (<THREE.MeshStandardMaterial>this._materialCache[m]).needsUpdate = true;
            }
        }
    }

    public assignPointSize(p: number) {
        const height = this._renderingEngine.renderer ? this._renderingEngine.renderer.getSize(new THREE.Vector2()).y : 1080;
        if(height === this._height && p * (this._height/1080) === this._pointSize) return;
        this._height = height;
        this._pointSize = p * (this._height/1080);
        for(let m in this._materialCache) {
            if(this._materialCache[m] instanceof THREE.PointsMaterial) {
                (<THREE.PointsMaterial>this._materialCache[m]).size = this._pointSize;
                (<THREE.PointsMaterial>this._materialCache[m]).needsUpdate = true;
            }
        }
    }

    public assignTextureEncoding(e: THREE.TextureEncoding) {
        this._textureEncoding = e;
        for(let m in this._materialCache) {
            if(this._materialCache[m] instanceof THREE.MeshStandardMaterial) {
                if((<THREE.MeshStandardMaterial>this._materialCache[m]).emissiveMap)
                    (<THREE.MeshStandardMaterial>this._materialCache[m]).emissiveMap!.encoding = e;
                if((<THREE.MeshStandardMaterial>this._materialCache[m]).map)
                    (<THREE.MeshStandardMaterial>this._materialCache[m]).map!.encoding = e;
                (<THREE.MeshStandardMaterial>this._materialCache[m]).needsUpdate = true;
            }
        }
    }

    public emptyMaterialCache() {
        this._materialCache = {};
    }

    public removeFromMaterialCache(id: string) {
        if(this._materialCache[id])
            delete this._materialCache[id];
    }

    public init(): void {}

    /**
     * Create a material object with the provided material data.
     * 
     * @param material the material data
     * @returns the material object
     */
    public load(
        visualizationData: SDTFAttributeVisualizationData,
        materialProperties?: MaterialData, 
        materialSettings?: {
            mode?: number,
            useVertexTangents?: boolean,
            useVertexColors?: boolean,
            useFlatShading?: boolean,
            useMorphTargets?: boolean,
            useMorphNormals?: boolean
        },
    ): THREE.Material {
        let mapCount = 0;
        const properties: any = {};

        properties.color = new THREE.Color(visualizationData.color);
        properties.side = THREE.DoubleSide;

        if(visualizationData.opacity < 1) {
            properties.opacity = visualizationData.opacity;
            properties.transparent = true;
        }
        
        let material = new THREE.MeshBasicMaterial(properties);
        if(materialProperties) {
            material.userData = {
                SDid: materialProperties.id,
                SDversion: materialProperties.version
            }
            this._materialCache[materialProperties.id + '_' + materialProperties.version] = material;
        }

        this.maxMapCount = Math.max(this.maxMapCount, mapCount);
        return material;
    }

    public updateMaterials(): void {
        for(let m in this._materialCache)
            this._materialCache[m].needsUpdate = true;
    }

    public updateSoftShadow(lightSizeUV: number, blending: number) {
        this._lightSizeUV = lightSizeUV;
        this._blending = blending;
        for(let m in this._materialCache) {
            if(this._materialCache[m].userData.shader) {
                this._materialCache[m].userData.shader.uniforms.lightSizeUV.value = lightSizeUV;
                this._materialCache[m].userData.shader.uniforms.blending.value = blending;
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

    public get maxMapCount(): number {
        return this._maxMapCount;
    }
    
    public set maxMapCount(value: number) {
        this._maxMapCount = value;
    }

    // #endregion Private Methods (1)
}