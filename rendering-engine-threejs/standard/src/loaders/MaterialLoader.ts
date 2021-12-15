import * as THREE from 'three'
import {
  MapData,
  MATERIAL_SIDE,
  MaterialData,
  TEXTURE_FILTERING,
  TEXTURE_WRAPPING,
  MATERIAL_ALPHA,
  PRIMITIVE_MODE,
} from '@shapediver/viewer.shared.types'
import { vec4 } from 'gl-matrix'

import { RenderingEngine } from '../RenderingEngine'
import { entry, main } from '../shaders/PCSS'
import { SpecularGlossinessMaterial, SpecularGlossinessMaterialParameters } from '../materials/SpecularGlossinessMaterial'
import { RenderingManager } from '../managers/RenderingManager'
import { ILoader } from '../interfaces/ILoader'
import { MeshUnlitMaterialParameters } from '../materials/MeshUnlitMaterialParameters'
import { Logger, LOGGINGTOPIC, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

export enum MATERIAL_TYPE {
    POINT = 'point',
    LINE = 'line',
    UNLIT = 'unlit',
    SPECULAR_GLOSSINESS = 'specular_glossiness',
    METALNESS_ROUGHNESS = 'metalness_roughness'
}

export type MaterialSettings = {
    mode: PRIMITIVE_MODE,
    useVertexTangents: boolean,
    useVertexColors: boolean,
    useFlatShading: boolean,
    useMorphTargets: boolean,
    useMorphNormals: boolean
}

export class MaterialLoader implements ILoader {
    // #region Properties (8)

    private readonly _defaultColor: string = '#00fff7';
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
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

        if(!THREE.ShaderChunk.lights_fragment_maps.includes('vec3 reflectVec')) {
            var index = THREE.ShaderChunk.lights_fragment_maps.lastIndexOf('#endif');
            THREE.ShaderChunk.lights_fragment_maps = THREE.ShaderChunk.lights_fragment_maps.substring(0, index) +
            `#else
                vec3 reflectVec = reflect( -geometry.viewDir, geometry.normal );
                reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
                radiance += (vec3((reflectVec.z + 1.0) / 2.0) + 0.5) / 1.5;
            #endif
            ` + THREE.ShaderChunk.lights_fragment_maps.substring(index + '#endif'.length);
        }
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
        for(let m in this._materialCache) {
            if(m.startsWith(id)) {
                delete this._materialCache[m];
            }
        }
    }

    public init(): void {}

    public getMaterialProperties(
        materialData: MaterialData | null,
        type: MATERIAL_TYPE,
        materialSettings?: MaterialSettings
    ): {
        properties: THREE.PointsMaterialParameters | THREE.LineBasicMaterialParameters | MeshUnlitMaterialParameters | THREE.MeshStandardMaterialParameters | SpecularGlossinessMaterialParameters,
        mapCount: number
    } {
        const generalProperties: THREE.PointsMaterialParameters | THREE.LineBasicMaterialParameters | MeshUnlitMaterialParameters | THREE.MeshStandardMaterialParameters | SpecularGlossinessMaterialParameters = {}
        
        let mapCount = 0;


        // if no MaterialData is provided, we return our default
        if(!materialData) {
            generalProperties.color = new THREE.Color(this._defaultColor);
            if(materialSettings !== undefined && materialSettings.useVertexColors)
                generalProperties.color = new THREE.Color('#d3d3d3');
            generalProperties.side = THREE.DoubleSide;
            return { properties: generalProperties, mapCount };
        }

        /**
         * We know evaluate properties that can be applied to all materials
         */

        generalProperties.alphaTest = materialData.alphaCutoff;

        if(materialData.opacity !== undefined){
            generalProperties.opacity = materialData.opacity;
            generalProperties.transparent = generalProperties.opacity < 1;
            generalProperties.depthWrite = !(generalProperties.opacity < 1);
        }
            
        if(materialData.alphaMode === MATERIAL_ALPHA.BLEND) {
            generalProperties.format = THREE.RGBAFormat;
            generalProperties.transparent = true;
            generalProperties.depthWrite = false;
        } else if(!generalProperties.transparent) {
            generalProperties.format = THREE.RGBFormat;
            generalProperties.transparent = false;
        }

        if(materialData.color !== undefined)
            generalProperties.color = new THREE.Color(materialData.color);
        
        if(!materialData.color !== undefined && materialData.map !== undefined && materialData.map.color !== undefined)
            generalProperties.color = new THREE.Color(materialData.map.color);

        if(!materialData.color !== undefined && materialData.map !== undefined && materialData.map.color !== undefined && !(materialSettings !== undefined && materialSettings.useVertexColors))
            generalProperties.color = new THREE.Color(this._defaultColor);

        if((materialSettings !== undefined && materialSettings.useVertexColors) && materialData.color === this._defaultColor)
            generalProperties.color = new THREE.Color('#d3d3d3');

        if(materialData.side !== undefined)
            generalProperties.side = materialData.side === MATERIAL_SIDE.BACK ? THREE.BackSide : materialData.side === MATERIAL_SIDE.FRONT ? THREE.FrontSide : THREE.DoubleSide;
    

        /**
         * First exit, lines ans points
         */

        if(type === MATERIAL_TYPE.POINT) {
            (<THREE.PointsMaterialParameters>generalProperties).size = this._pointSize;
            return { properties: generalProperties, mapCount };
        } else if(type === MATERIAL_TYPE.LINE) {
            return { properties: generalProperties, mapCount };
        }

        /**
         * We know evaluate properties that can be applied to basic mesh materials (and the ones extending from them)
         */

        const basicProperties: MeshUnlitMaterialParameters | THREE.MeshStandardMaterialParameters | SpecularGlossinessMaterialParameters = generalProperties;

        if (materialData.alphaMap !== undefined) {
            basicProperties.format = THREE.RGBAFormat;
            basicProperties.alphaMap = this.createTexture(materialData.alphaMap);
            basicProperties.transparent = true;
            basicProperties.depthWrite = false;
            mapCount++;
        }

        if (materialData.aoMap !== undefined) {
            basicProperties.aoMap = this.createTexture(materialData.aoMap);
            mapCount++;
        }

        if (materialData.aoMapIntensity !== undefined) {
            basicProperties.aoMapIntensity = materialData.aoMapIntensity;
        }

        if (materialData.map !== undefined) {
            basicProperties.map = this.createTexture(materialData.map);
            basicProperties.map.encoding = this._textureEncoding;
            mapCount++;
        }

        /**
         * Second exit, the unlit material
         */

        if(type === MATERIAL_TYPE.UNLIT) {
            if(materialData.KHR_materials_unlit !== undefined)
                (<MeshUnlitMaterialParameters>basicProperties).KHR_materials_unlit = materialData.KHR_materials_unlit;

            return { properties: basicProperties, mapCount };
        }

        /**
         * We know evaluate properties that can be applied to MeshStandardMaterials and SpecularGlossinessMaterials
         */

        const standardProperties: THREE.MeshStandardMaterialParameters | SpecularGlossinessMaterialParameters = basicProperties;

        if(materialData.shading !== undefined)
            standardProperties.flatShading = materialData.shading !== 'smooth';

        if (materialData.bumpMap !== undefined) {
            standardProperties.bumpMap = this.createTexture(materialData.bumpMap);
            mapCount++;
        }

        standardProperties.bumpScale = materialData.bumpScale;

        if(materialData.emissiveness !== undefined)
            standardProperties.emissive = new THREE.Color(materialData.emissiveness);

        if (materialData.emissiveMap !== undefined) {
            standardProperties.emissiveMap = this.createTexture(materialData.emissiveMap);
            standardProperties.emissiveMap.encoding = this._textureEncoding;
            mapCount++;
        }

        standardProperties.envMap = this._envMap;
        standardProperties.envMapIntensity = this._envMapIntensity;

        if (materialData.normalMap !== undefined) {
            standardProperties.normalMap = this.createTexture(materialData.normalMap);
            mapCount++;
        }

        if(materialData.normalScale !== undefined)
            standardProperties.normalScale = new THREE.Vector2(materialData.normalScale, -materialData.normalScale);

        /**
         * Separation between the two for metalness/roughness and specular/glossiness workflow
         */

        if (type === MATERIAL_TYPE.METALNESS_ROUGHNESS) {
            const meshStandardProperties: THREE.MeshStandardMaterialParameters = standardProperties;

            meshStandardProperties.metalness = materialData.metalness;
            meshStandardProperties.roughness = materialData.roughness;

            if (materialData.metalnessRoughnessMap !== undefined) {
                meshStandardProperties.metalnessMap = this.createTexture(materialData.metalnessRoughnessMap);
                meshStandardProperties.roughnessMap = meshStandardProperties.metalnessMap;
                mapCount++;
            } else {
                if (materialData.metalnessMap !== undefined) {
                    meshStandardProperties.metalnessMap = this.createTexture(materialData.metalnessMap);
                    mapCount++;
                }
                if (materialData.roughnessMap !== undefined) {
                    meshStandardProperties.roughnessMap = this.createTexture(materialData.roughnessMap);
                    mapCount++;
                }
            }
            return { properties: meshStandardProperties, mapCount };

        } else if (type === MATERIAL_TYPE.SPECULAR_GLOSSINESS) {
            const specularGlossinessProperties: SpecularGlossinessMaterialParameters = standardProperties;

            if (materialData.KHR_materials_pbrSpecularGlossiness !== undefined)
                specularGlossinessProperties.KHR_materials_pbrSpecularGlossiness = materialData.KHR_materials_pbrSpecularGlossiness;

            if (specularGlossinessProperties.KHR_materials_pbrSpecularGlossiness === true) {
                specularGlossinessProperties.specular = materialData.specular;
                specularGlossinessProperties.glossiness = materialData.glossiness;

                if (materialData.specularGlossinessMap !== undefined) {
                    specularGlossinessProperties.specularMap = this.createTexture(materialData.specularGlossinessMap);
                    specularGlossinessProperties.glossinessMap = specularGlossinessProperties.specularMap;
                    mapCount++;
                } else {
                    if (materialData.specularMap !== undefined) {
                        specularGlossinessProperties.specularMap = this.createTexture(materialData.specularMap);
                        mapCount++;
                    }
                    if (materialData.glossinessMap !== undefined) {
                        specularGlossinessProperties.glossinessMap = this.createTexture(materialData.glossinessMap);
                        mapCount++;
                    }
                }
            }

            return { properties: specularGlossinessProperties, mapCount };
        }

        // we should never get here
        const error = new ShapeDiverViewerDataProcessingError(`MaterialLoader.getMaterialProperties: No proper material properties were found.`);
        throw this._logger.handleError(LOGGINGTOPIC.DATAPROCESSING, `MaterialLoader.getMaterialProperties`, error);
    }

    /**
     * Create a material object with the provided material data.
     * 
     * @param material the material data
     * @returns the material object
     */
    public load(
        materialData: MaterialData | null, 
        materialSettings?: MaterialSettings
    ): THREE.Material {

        // evaluate which type of material properties we are constructing
        let type: MATERIAL_TYPE;
        if(materialSettings && materialSettings.mode === 0) {
            type = MATERIAL_TYPE.POINT;
        } else if(materialSettings && (materialSettings.mode === 1 || materialSettings.mode === 2 || materialSettings.mode === 3)) {
            type = MATERIAL_TYPE.LINE;
        } else {
            if(materialData && materialData.KHR_materials_unlit) {
                type = MATERIAL_TYPE.UNLIT;
            } else if(materialData && materialData.KHR_materials_pbrSpecularGlossiness) {
                type = MATERIAL_TYPE.SPECULAR_GLOSSINESS;
            } else {
                type = MATERIAL_TYPE.METALNESS_ROUGHNESS;
            }
        }

        if(materialData && this._materialCache[materialData.id + '_' + materialData.version + '_' + type]) 
            return this._materialCache[materialData.id + '_' + materialData.version + '_' + type];

        let {properties, mapCount} = this.getMaterialProperties(materialData, type, materialSettings);
        this.maxMapCount = Math.max(this.maxMapCount, mapCount);

        let material: THREE.PointsMaterial | THREE.LineBasicMaterial | THREE.MeshBasicMaterial | THREE.MeshStandardMaterial | SpecularGlossinessMaterial;
        if(type === MATERIAL_TYPE.POINT) {
            material = new THREE.PointsMaterial(properties);
        } else if(type === MATERIAL_TYPE.LINE) {
            material = new THREE.LineBasicMaterial(properties);
        } else if(type === MATERIAL_TYPE.UNLIT) {
            material = new THREE.MeshBasicMaterial(properties);
        } else {
            if(type === MATERIAL_TYPE.SPECULAR_GLOSSINESS) {
                material = new SpecularGlossinessMaterial(properties);
            } else {
                material = new THREE.MeshStandardMaterial(properties);
            }
            const before = material.onBeforeCompile;
            material.onBeforeCompile = (shader: THREE.Shader, renderer: THREE.WebGLRenderer) => {
                before(shader, renderer);
                shader.uniforms.lightSizeUV = { value: this._lightSizeUV };
                shader.uniforms.blending = { value: this._blending };
                material.userData.shader = shader;
            };

            if (materialSettings && materialSettings.useVertexTangents && material.normalScale ) material.normalScale.y *= - 1;
            if (materialSettings && materialSettings.useFlatShading) material.flatShading = true;
        }
            
        if (materialSettings && materialSettings.useVertexColors) material.vertexColors = true;

        if(materialData) {
            material.userData = {
                SDid: materialData.id,
                SDversion: materialData.version
            }
        }
        
        if(materialData && this._materialCache[materialData.id + '_' + materialData.version + '_' + type]) {
            this._materialCache[materialData.id + '_' + materialData.version + '_' + type].copy(material)
            return this._materialCache[materialData.id + '_' + materialData.version + '_' + type];
        }

        material.needsUpdate = true;
        if(materialData) this._materialCache[materialData.id + '_' + materialData.version + '_' + type] = material;

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