import * as THREE from 'three'
import {
  MapData,
  MATERIAL_SIDE,
  TEXTURE_FILTERING,
  TEXTURE_WRAPPING,
  MATERIAL_ALPHA,
  PRIMITIVE_MODE,
  IMaterialAbstractData,
  MaterialUnlitData,
  MaterialSpecularGlossinessData,
  MaterialGemData,
  MaterialStandardData,
  IMapData,
  MaterialShadowData,
  GeometryData,
} from '@shapediver/viewer.shared.types'
import { vec4 } from 'gl-matrix'

import { RenderingEngine } from '../RenderingEngine'
import { entry, main } from '../shaders/PCSS'
import { SpecularGlossinessMaterial, SpecularGlossinessMaterialParameters } from '../materials/SpecularGlossinessMaterial'
import { RenderingManager } from '../managers/RenderingManager'
import { ILoader } from '../interfaces/ILoader'
import { MeshUnlitMaterialParameters } from '../materials/MeshUnlitMaterialParameters'
import { Converter, Logger, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import { ENVIRONMENT_MAP_TYPE } from './EnvironmentMapLoader'
import { GemMaterial, GemMaterialParameters } from '../materials/GemMaterial'
import { SDColor } from '../objects/SDColor'

export enum MATERIAL_TYPE {
    POINT = 'point',
    LINE = 'line',
    MESH = 'mesh',
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

    private readonly _converter: Converter = Converter.instance;
    private readonly _defaultColor: string = '#199b9b';
    private readonly _logger: Logger = Logger.instance;
    private _materialCache: {
        [key: string]: {
            materialData: IMaterialAbstractData | MaterialUnlitData | MaterialSpecularGlossinessData | MaterialStandardData | MaterialGemData | MaterialShadowData | null,
            material: (THREE.Material | THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial | THREE.PointsMaterial | THREE.LineBasicMaterial | THREE.ShadowMaterial)
        }
    } = {};
    private _defaultPointsMaterial?: THREE.PointsMaterial;
    private _defaultLineMaterial?: THREE.LineBasicMaterial;
    private _defaultMaterial?: THREE.MeshPhysicalMaterial;

    private _blending: number = 0.0;
    private _envMap: THREE.CubeTexture | THREE.Texture | null = null;
    private _height: number = 1020;
    private _lightSizeUV: number = 0.025;
    private _pointSize: number = 1.0;
    private _textureEncoding: THREE.TextureEncoding = THREE.sRGBEncoding;
    private _maxMapCount: number = 0;
    private _envMapType: ENVIRONMENT_MAP_TYPE = ENVIRONMENT_MAP_TYPE.NULL;

    // #endregion Properties (8)

    // #region Constructors (1)
    
    public cacheSize() {
        return Object.entries(this._materialCache).length;
    }

    constructor(private readonly _renderingEngine: RenderingEngine) {
        let shader = THREE.ShaderChunk.shadowmap_pars_fragment;
        if (!shader.includes('PCSS implementation')) {
            shader = shader.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP' + main);
            shader = shader.replace(shader.substr(shader.indexOf('#if defined( SHADOWMAP_TYPE_PCF )'), shader.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )') - shader.indexOf('#if defined( SHADOWMAP_TYPE_PCF )')), '#if defined( SHADOWMAP_TYPE_PCF )\n' + entry);
        }
        THREE.ShaderChunk.shadowmap_pars_fragment = shader;

        // console.log(THREE.ShaderChunk.envmap_fragment.includes(`vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );`))
        THREE.ShaderChunk.envmap_fragment = THREE.ShaderChunk.envmap_fragment.replace(
            `vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );`,
            `
            #ifdef ENVMAP_TYPE_LDR
                vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
            #else
                vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.zy ) );
            #endif
            `
        )

        // console.log(THREE.ShaderChunk.backgroundCube_frag.includes(`vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );`))
        THREE.ShaderChunk.backgroundCube_frag = THREE.ShaderChunk.backgroundCube_frag.replace(
            `vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );`,
            `
            #ifdef ENVMAP_TYPE_LDR
                vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
            #else
                vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.zy ) );
            #endif`
        )
        
        // console.log(THREE.ShaderChunk.cube_uv_reflection_fragment.includes(`vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );`))
        THREE.ShaderChunk.cube_uv_reflection_fragment = THREE.ShaderChunk.cube_uv_reflection_fragment.replace(
            `vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );`,
            `
            #ifdef ENVMAP_TYPE_LDR
                vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );            
            #else
                vec3 color0 = bilinearCubeUV( envMap, sampleDir.xzy, mipInt );            
            #endif`
        )

        // console.log(THREE.ShaderChunk.cube_uv_reflection_fragment.includes(`vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );`))
        THREE.ShaderChunk.cube_uv_reflection_fragment = THREE.ShaderChunk.cube_uv_reflection_fragment.replace(
            `vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );`,
            `
            #ifdef ENVMAP_TYPE_LDR
                vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );            
            #else
                vec3 color1 = bilinearCubeUV( envMap, sampleDir.xzy, mipInt + 1.0 );        
            #endif`
        )

        if(!THREE.ShaderChunk.lights_fragment_maps.includes('vec3 reflectVec')) {
            var index = THREE.ShaderChunk.lights_fragment_maps.lastIndexOf('#endif');
            THREE.ShaderChunk.lights_fragment_maps = THREE.ShaderChunk.lights_fragment_maps.substring(0, index) +
            `#else
                #ifdef ENVMAP_TYPE_NONE
                    vec3 reflectVec = reflect( -geometry.viewDir, geometry.normal );
                    reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
                    radiance += (vec3((reflectVec.z + 1.0) / 2.0) + 0.5) / 1.5;
                #endif
            #endif
            ` + THREE.ShaderChunk.lights_fragment_maps.substring(index + '#endif'.length);
        }
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    public assignEnvironmentMap(e: THREE.CubeTexture | THREE.Texture | null, type: ENVIRONMENT_MAP_TYPE) {
        this._envMap = e;
        this._envMapType = type;
        for(let m in this._materialCache) {
            if((this._materialCache[m].material instanceof THREE.MeshPhysicalMaterial || this._materialCache[m].material instanceof THREE.MeshStandardMaterial || this._materialCache[m].material instanceof THREE.MeshBasicMaterial)) {
                const material: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial | THREE.MeshBasicMaterial = <THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>this._materialCache[m].material;
                if (this._materialCache[m].materialData &&
                    (
                        this._materialCache[m].materialData instanceof MaterialStandardData ||
                        this._materialCache[m].materialData instanceof MaterialGemData ||
                        this._materialCache[m].materialData instanceof MaterialSpecularGlossinessData ||
                        this._materialCache[m].materialData instanceof MaterialUnlitData
                    ) &&
                    (<MaterialStandardData | MaterialGemData | MaterialSpecularGlossinessData | MaterialUnlitData>this._materialCache[m].materialData).envMap !== undefined
                ) continue;

                if(this._materialCache[m].materialData instanceof MaterialUnlitData && this._renderingEngine.environmentMapForUnlitMaterials === false) return;

                material.envMap = e;
                material.needsUpdate = true;
                for(let d in material.defines) {
                    if(d.startsWith('ENVMAP_TYPE_'))
                        delete material.defines[d];
                }
                if(material.defines)
                    material.defines['ENVMAP_TYPE_'+this._envMapType.toUpperCase()] = '';
            }
        }
    }

    
    public assignEnvironmentMapForUnlitMaterials(toggle: boolean) {
        for(let m in this._materialCache) {
            if(this._materialCache[m].material instanceof THREE.MeshBasicMaterial) {
                const material: THREE.MeshBasicMaterial = <THREE.MeshBasicMaterial>this._materialCache[m].material;
                if (this._materialCache[m].materialData && 
                    this._materialCache[m].materialData instanceof MaterialUnlitData &&
                    (<MaterialUnlitData>this._materialCache[m].materialData).envMap !== undefined
                ) continue;

                if(toggle) {
                    material.envMap = this._envMap;
                    material.needsUpdate = true;
                    for(let d in material.defines) {
                        if(d.startsWith('ENVMAP_TYPE_'))
                            delete material.defines[d];
                    }
                    if(material.defines)
                        material.defines['ENVMAP_TYPE_'+this._envMapType.toUpperCase()] = '';

                } else {
                    material.envMap = null;
                    material.needsUpdate = true;
                }
            }
        }
    }

    public assignPointSize(p: number) {
        const height = this._renderingEngine.renderer ? this._renderingEngine.renderer.getSize(new THREE.Vector2()).y : 1080;
        if(height === this._height && p * (this._height/1080) === this._pointSize) return;
        this._height = height;
        this._pointSize = p * (this._height/1080);
        for(let m in this._materialCache) {
            if(this._materialCache[m].material instanceof THREE.PointsMaterial) {
                (<THREE.PointsMaterial>this._materialCache[m].material).size = this._pointSize;
                (<THREE.PointsMaterial>this._materialCache[m].material).needsUpdate = true;
            }
        }
    }

    private assignTextureEncoding() {
        for(let m in this._materialCache) {
            if(this._materialCache[m].material instanceof THREE.MeshPhysicalMaterial || this._materialCache[m].material instanceof THREE.MeshStandardMaterial) {
                const material: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial = <THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial>this._materialCache[m].material;
                if(material.emissiveMap) {
                    material.emissiveMap!.encoding = this._textureEncoding;
                    material.emissiveMap!.needsUpdate = true;
                }
                if(material.map) {
                    material.map!.encoding = this._textureEncoding;
                    material.map!.needsUpdate = true;
                }
                material.needsUpdate = true;
            }
        }
    }

    public assignColorCorrection(value: boolean) {
        const convertColor = (c: THREE.Color | SDColor | undefined, toggle: boolean): THREE.Color | SDColor | undefined => {
            if(!c) return;

            if(c instanceof SDColor) {
                c.colorCorrection(toggle);
                return c;
            } else {
                const sdColor = this._renderingEngine.colorCache.find(color => color.equals(c));
                if(sdColor) {
                    sdColor.colorCorrection(toggle);
                    return sdColor;
                } else {
                    // some colors may not have been set by us, but have been set automatically
                    // in this case we expect the color to be linear either way and therefore omit a color correction
                    return c;
                }
            }
        }

        for (let m in this._materialCache) {
            const material: any = this._materialCache[m].material;

            material.color = convertColor(material.color, value);
            material.specular = convertColor(material.specular, value);
            material.emissive = convertColor(material.emissive, value);
            material.colorTransferBegin = convertColor(material.colorTransferBegin, value);
            material.colorTransferEnd = convertColor(material.colorTransferEnd, value);
            material.attenuationColor = convertColor(material.attenuationColor, value);
            material.sheencolor = convertColor(material.sheencolor, value);
            material.specularColor = convertColor(material.specularColor, value);

            material.needsUpdate = true;
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
        materialData: IMaterialAbstractData | MaterialUnlitData | MaterialSpecularGlossinessData | MaterialStandardData | MaterialGemData | MaterialShadowData | null,
        type: MATERIAL_TYPE,
        materialSettings?: MaterialSettings
    ): {
        properties: THREE.PointsMaterialParameters | THREE.LineBasicMaterialParameters | MeshUnlitMaterialParameters | THREE.MeshPhysicalMaterialParameters | SpecularGlossinessMaterialParameters | GemMaterialParameters | THREE.ShadowMaterialParameters,
        mapCount: number
    } {
        const generalProperties: THREE.PointsMaterialParameters | THREE.LineBasicMaterialParameters | MeshUnlitMaterialParameters | THREE.MeshPhysicalMaterialParameters | SpecularGlossinessMaterialParameters | GemMaterialParameters | THREE.ShadowMaterialParameters = {}
        
        let mapCount = 0;


        // if no MaterialStandardData is provided, we return our default
        if(!materialData) {
            generalProperties.color = this._renderingEngine.createThreeJsColor(this._defaultColor);
            if(materialSettings !== undefined && materialSettings.useVertexColors)
                generalProperties.color = this._renderingEngine.createThreeJsColor('#d3d3d3');
            generalProperties.side = THREE.DoubleSide;
            if(!(type === MATERIAL_TYPE.POINT || type === MATERIAL_TYPE.LINE)) 
                (<THREE.MeshPhysicalMaterialParameters>generalProperties).envMap = this._envMap;
            return { properties: generalProperties, mapCount };
        }

        /**
         * We know evaluate properties that can be applied to all materials
         */

        generalProperties.alphaTest = materialData.alphaCutoff;

        if(materialData.opacity !== undefined){
            generalProperties.opacity = materialData.opacity;
            generalProperties.transparent = generalProperties.opacity < 1;
        }
            
        if(materialData.alphaMode === MATERIAL_ALPHA.BLEND) {
            generalProperties.transparent = true;
            generalProperties.depthWrite = false;
        } else if(!generalProperties.transparent) {
            generalProperties.transparent = false;
        }

        if(materialData.color !== undefined)
            generalProperties.color = this._renderingEngine.createThreeJsColor(materialData.color);
        
        if(materialData.color === undefined && materialData.map !== undefined && materialData.map.color !== undefined)
            generalProperties.color = this._renderingEngine.createThreeJsColor(materialData.map.color);

        if(materialData.color === undefined && materialData.map !== undefined && materialData.map.color === undefined && !(materialSettings !== undefined && materialSettings.useVertexColors))
            generalProperties.color = this._renderingEngine.createThreeJsColor(this._defaultColor);

        if((materialSettings !== undefined && materialSettings.useVertexColors) && (materialData.color === this._defaultColor || materialData.color === this._defaultColor+'ff' || materialData.color === undefined))
            generalProperties.color = this._renderingEngine.createThreeJsColor('#d3d3d3');

        if(materialData.side !== undefined)
            generalProperties.side = materialData.side === MATERIAL_SIDE.BACK ? THREE.BackSide : materialData.side === MATERIAL_SIDE.FRONT ? THREE.FrontSide : THREE.DoubleSide;

        /**
         * 
         * First exit, lines ans points
         * 
         */

        if(type === MATERIAL_TYPE.POINT) {
            (<THREE.PointsMaterialParameters>generalProperties).size = this._pointSize;
            return { properties: generalProperties, mapCount };
        } else if(type === MATERIAL_TYPE.LINE) {
            return { properties: generalProperties, mapCount };
        }

        /**
         * 
         * Second exit, the shadow material
         * 
         */

        if(materialData instanceof MaterialShadowData) 
            return { properties: generalProperties, mapCount };


        /**
         * We know evaluate properties that can be applied to basic mesh materials (and the ones extending from them)
         */

        const basicProperties: MeshUnlitMaterialParameters | THREE.MeshPhysicalMaterialParameters | SpecularGlossinessMaterialParameters = generalProperties;

        if (materialData.alphaMap !== undefined) {
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
         * 
         * Third exit, the unlit material
         * 
         */

        if(materialData instanceof MaterialUnlitData) 
            return { properties: basicProperties, mapCount };

        /**
         * We know evaluate properties that can be applied to MeshPhysicalMaterials, SpecularGlossinessMaterials and GemMaterialParameters
         */

        const standardProperties: THREE.MeshPhysicalMaterialParameters | SpecularGlossinessMaterialParameters | GemMaterialParameters = basicProperties;

        if(materialData.shading !== undefined)
            standardProperties.flatShading = materialData.shading !== 'smooth';

        if (materialData.bumpMap !== undefined) {
            standardProperties.bumpMap = this.createTexture(materialData.bumpMap);
            mapCount++;
        }

        standardProperties.bumpScale = materialData.bumpScale;

        if(materialData.emissiveness !== undefined) 
            standardProperties.emissive = this._renderingEngine.createThreeJsColor(materialData.emissiveness);

        if (materialData.emissiveMap !== undefined) {
            standardProperties.emissiveMap = this.createTexture(materialData.emissiveMap);
            standardProperties.emissiveMap.encoding = this._textureEncoding;
            mapCount++;
        }

       standardProperties.envMap = this._envMap;

        if (materialData.normalMap !== undefined) {
            standardProperties.normalMap = this.createTexture(materialData.normalMap);
            mapCount++;
        }

        if(materialData.normalScale !== undefined)
            standardProperties.normalScale = new THREE.Vector2(materialData.normalScale, -materialData.normalScale);


        /**
         * 
         * Fourth exit, the specular-glossiness material
         * 
         */
        if (materialData instanceof MaterialSpecularGlossinessData) {
            const specularGlossinessProperties: SpecularGlossinessMaterialParameters = standardProperties;

            specularGlossinessProperties.specular = this._renderingEngine.createThreeJsColor(materialData.specular);
            specularGlossinessProperties.glossiness = materialData.glossiness;

            if (materialData.specularGlossinessMap !== undefined) {
                specularGlossinessProperties.specularMap = this.createTexture(materialData.specularGlossinessMap);
                specularGlossinessProperties.specularMap.encoding = THREE.sRGBEncoding;
                specularGlossinessProperties.glossinessMap = specularGlossinessProperties.specularMap;
                mapCount++;
            } else {
                if (materialData.specularMap !== undefined) {
                    specularGlossinessProperties.specularMap = this.createTexture(materialData.specularMap);
                    specularGlossinessProperties.specularMap.encoding = THREE.sRGBEncoding;
                    mapCount++;
                }
                if (materialData.glossinessMap !== undefined) {
                    specularGlossinessProperties.glossinessMap = this.createTexture(materialData.glossinessMap);
                    mapCount++;
                }
            }

            return { properties: specularGlossinessProperties, mapCount };
        }
        
        /**
         * 
         * Fourth exit, the gem material
         * 
         */
         if (materialData instanceof MaterialGemData) {
            const gemProperties: GemMaterialParameters = standardProperties;

            gemProperties.refractionIndex = materialData.refractionIndex;

            if (materialData.impurityMap !== undefined) {
                gemProperties.impurityMap = this.createTexture(materialData.impurityMap);
                mapCount++;
            }

            gemProperties.impurityScale = materialData.impurityScale;

            if (materialData.colorTransferBegin !== undefined) {
                gemProperties.colorTransferBegin = this._renderingEngine.createThreeJsColor(materialData.colorTransferBegin);
            }

            if (materialData.colorTransferEnd !== undefined) {
                gemProperties.colorTransferEnd = this._renderingEngine.createThreeJsColor(materialData.colorTransferEnd);
            }

            gemProperties.center = new THREE.Vector3(materialData.center[0], materialData.center[1], materialData.center[2]);

            gemProperties.tracingDepth = materialData.tracingDepth;

            gemProperties.radius = materialData.radius;

            gemProperties.sphericalNormalMap = <THREE.CubeTexture><any>materialData.sphericalNormalMap;

            gemProperties.gamma = materialData.gamma;

            gemProperties.contrast = materialData.contrast;

            gemProperties.brightness = materialData.brightness;

            gemProperties.dispersion = materialData.dispersion;

            gemProperties.tracingOpacity = materialData.tracingOpacity;

            gemProperties.roughness = 0;
            gemProperties.metalness = 1;
            
            gemProperties.transparent = true;
            gemProperties.opacity = 1.0;

            gemProperties.side = THREE.FrontSide;

            return { properties: gemProperties, mapCount };
        }


        /**
         * 
         * the final exit, the MeshPhysicalMaterial
         * 
         */
        if (materialData instanceof MaterialStandardData) {
            const meshPhysicalProperties: THREE.MeshPhysicalMaterialParameters = standardProperties;
            
            meshPhysicalProperties.clearcoat = materialData.clearcoat;

            if (materialData.clearcoatMap !== undefined) {
                meshPhysicalProperties.clearcoatMap = this.createTexture(materialData.clearcoatMap);
                mapCount++;
            }

            if (materialData.clearcoatNormalMap !== undefined) {
                meshPhysicalProperties.clearcoatNormalMap = this.createTexture(materialData.clearcoatNormalMap);
                mapCount++;
            }

            meshPhysicalProperties.clearcoatRoughness = materialData.clearcoatRoughness;

            if (materialData.clearcoatRoughnessMap !== undefined) {
                meshPhysicalProperties.clearcoatRoughnessMap = this.createTexture(materialData.clearcoatRoughnessMap);
                mapCount++;
            }

            if (materialData.displacementMap !== undefined) {
                meshPhysicalProperties.displacementMap = this.createTexture(materialData.displacementMap);
                mapCount++;
            }

            meshPhysicalProperties.displacementScale = materialData.displacementScale;

            meshPhysicalProperties.displacementBias = materialData.displacementBias;

            meshPhysicalProperties.ior = materialData.ior;

            meshPhysicalProperties.transmission = materialData.transmission;

            if (materialData.transmissionMap !== undefined) {
                meshPhysicalProperties.transmissionMap = this.createTexture(materialData.transmissionMap);
                mapCount++;
            }

            (<THREE.MeshPhysicalMaterial>meshPhysicalProperties).thickness = materialData.thickness;

            if (materialData.thicknessMap !== undefined) {
                (<THREE.MeshPhysicalMaterial>meshPhysicalProperties).thicknessMap = this.createTexture(materialData.thicknessMap);
                mapCount++;
            }

            meshPhysicalProperties.attenuationDistance = materialData.attenuationDistance;
            meshPhysicalProperties.attenuationColor = this._renderingEngine.createThreeJsColor(materialData.attenuationColor);

            meshPhysicalProperties.sheen = materialData.sheen;
            meshPhysicalProperties.sheenColor = this._renderingEngine.createThreeJsColor(materialData.sheenColor);
            meshPhysicalProperties.sheenRoughness = materialData.sheenRoughness;

            if (materialData.sheenColorMap !== undefined) {
                (<THREE.MeshPhysicalMaterial>meshPhysicalProperties).sheenColorMap = this.createTexture(materialData.sheenColorMap);
                mapCount++;
            }

            if (materialData.sheenRoughnessMap !== undefined) {
                (<THREE.MeshPhysicalMaterial>meshPhysicalProperties).sheenRoughnessMap = this.createTexture(materialData.sheenRoughnessMap);
                mapCount++;
            }

            meshPhysicalProperties.specularIntensity = materialData.specularIntensity;

            if (materialData.specularIntensityMap !== undefined) {
                meshPhysicalProperties.specularIntensityMap = this.createTexture(materialData.specularIntensityMap);
                mapCount++;
            }

            meshPhysicalProperties.specularColor = this._renderingEngine.createThreeJsColor(materialData.specularColor);

            if (materialData.specularColorMap !== undefined) {
                meshPhysicalProperties.specularColorMap = this.createTexture(materialData.specularColorMap);
                mapCount++;
            }

            meshPhysicalProperties.metalness = materialData.metalness;
            meshPhysicalProperties.roughness = materialData.roughness;

            if (materialData.metalnessRoughnessMap !== undefined) {
                meshPhysicalProperties.metalnessMap = this.createTexture(materialData.metalnessRoughnessMap);
                meshPhysicalProperties.roughnessMap = meshPhysicalProperties.metalnessMap;
                mapCount++;
            } else {
                if (materialData.metalnessMap !== undefined) {
                    meshPhysicalProperties.metalnessMap = this.createTexture(materialData.metalnessMap);
                    mapCount++;
                }
                if (materialData.roughnessMap !== undefined) {
                    meshPhysicalProperties.roughnessMap = this.createTexture(materialData.roughnessMap);
                    mapCount++;
                }
            }
            return { properties: meshPhysicalProperties, mapCount };
        }

        // we should never get here
        throw new ShapeDiverViewerDataProcessingError(`MaterialLoader.getMaterialProperties: No proper material properties were found.`);
    }

    public createMaterial(
        type: MATERIAL_TYPE, 
        incomingData: IMaterialAbstractData | MaterialUnlitData | MaterialSpecularGlossinessData | MaterialStandardData | MaterialGemData | GeometryData,
        materialData: IMaterialAbstractData | MaterialUnlitData | MaterialSpecularGlossinessData | MaterialStandardData | MaterialGemData | null, 
        materialSettings?: MaterialSettings
        ) 
    {
        let {properties, mapCount} = this.getMaterialProperties(materialData, type, materialSettings);
        this.maxMapCount = Math.max(this.maxMapCount, mapCount);

        let material: THREE.PointsMaterial | THREE.LineBasicMaterial | THREE.MeshBasicMaterial | THREE.MeshPhysicalMaterial | SpecularGlossinessMaterial | GemMaterial | THREE.ShadowMaterial;
        if(type === MATERIAL_TYPE.POINT) {
            material = new THREE.PointsMaterial(Object.assign(properties, { size: this._pointSize }));
        } else if(type === MATERIAL_TYPE.LINE) {
            material = new THREE.LineBasicMaterial(properties);
        } else {
            if (materialData instanceof MaterialUnlitData) {
                material = new THREE.MeshBasicMaterial(properties);
            } else {
                if(materialData instanceof MaterialShadowData) {
                    material = new THREE.ShadowMaterial({ opacity: properties.opacity, color: properties.color });
                } else if (materialData instanceof MaterialSpecularGlossinessData) {
                    material = new SpecularGlossinessMaterial(properties);
                } else if (materialData instanceof MaterialGemData) {
                    material = new GemMaterial(properties);
                } else {
                    material = new THREE.MeshPhysicalMaterial(properties);
                }
                const before = material.onBeforeCompile;
                material.onBeforeCompile = (shader: THREE.Shader, renderer: THREE.WebGLRenderer) => {
                    before(shader, renderer);
                    shader.uniforms.lightSizeUV = { value: this._lightSizeUV };
                    shader.uniforms.blending = { value: this._blending };
                    material.userData.shader = shader;
                };

                if(material instanceof SpecularGlossinessMaterial || material instanceof THREE.MeshPhysicalMaterial) {
                    material.defines['ENVMAP_TYPE_' + this._envMapType.toUpperCase()] = '';
    
                    if (materialSettings && materialSettings.useVertexTangents) material.normalScale.y *= - 1;
                    if (materialSettings && materialSettings.useVertexTangents && material instanceof THREE.MeshPhysicalMaterial) material.clearcoatNormalScale.y *= - 1;
                    if (materialSettings && materialSettings.useFlatShading) material.flatShading = true;
                }
            }
        }
            
        if (materialSettings && materialSettings.useVertexColors) material.vertexColors = true;

        if (materialData instanceof MaterialStandardData || materialData instanceof MaterialGemData || materialData instanceof MaterialSpecularGlossinessData || materialData instanceof MaterialUnlitData) {
            if(materialData.envMap !== undefined) {
                const envMapInput = (<MaterialStandardData | MaterialGemData | MaterialSpecularGlossinessData | MaterialUnlitData>materialData).envMap;
                if (envMapInput !== undefined) {
                    this._renderingEngine.environmentMapLoader.loadEnvMap(envMapInput).then(envMapResult => {
                        if(material instanceof THREE.MeshBasicMaterial && this._renderingEngine.environmentMapForUnlitMaterials === false) return;

                        (<THREE.MeshBasicMaterial | SpecularGlossinessMaterial | GemMaterial | THREE.MeshPhysicalMaterial>material).envMap = envMapResult.map;

                        const envMapType = (<THREE.MeshBasicMaterial | SpecularGlossinessMaterial | GemMaterial | THREE.MeshPhysicalMaterial>material).envMap instanceof THREE.CubeTexture ? ENVIRONMENT_MAP_TYPE.LDR : ENVIRONMENT_MAP_TYPE.HDR
                        for(let d in material.defines) {
                            if(d.startsWith('ENVMAP_TYPE_'))
                                delete material.defines[d];
                        }
                        if(material.defines)
                            material.defines['ENVMAP_TYPE_'+envMapType.toUpperCase()] = '';

                        material.needsUpdate = true;
                    });
                }
            }
        }

        if(materialData) 
            materialData.threeJsObject[this._renderingEngine.id] = material;

        material.needsUpdate = true;
        material.userData = {
            SDid: incomingData.id,
            SDversion: incomingData.version
        }

        return material;
    }

    /**
     * Create a material object with the provided material data.
     * 
     * @param material the material data
     * @returns the material object
     */
    public load(
        incomingData: IMaterialAbstractData | MaterialUnlitData | MaterialSpecularGlossinessData | MaterialStandardData | MaterialGemData | GeometryData,
        materialSettings?: MaterialSettings
    ): THREE.Material {
        let materialData: IMaterialAbstractData | MaterialUnlitData | MaterialSpecularGlossinessData | MaterialStandardData | MaterialGemData | null = null;
        if(!(incomingData instanceof GeometryData))
            materialData = incomingData;

        // evaluate which type of material properties we are constructing
        let type: MATERIAL_TYPE;
        if (materialSettings && materialSettings.mode === 0) {
            type = MATERIAL_TYPE.POINT;
        } else if (materialSettings && (materialSettings.mode === 1 || materialSettings.mode === 2 || materialSettings.mode === 3)) {
            type = MATERIAL_TYPE.LINE;
        } else {
            type = MATERIAL_TYPE.MESH;
        }

        if(!materialData) {            
            // evaluate which type of material properties we are constructing
            if (materialSettings && materialSettings.mode === 0) {
                if(this._defaultPointsMaterial) return this._defaultPointsMaterial;
            } else if (materialSettings && (materialSettings.mode === 1 || materialSettings.mode === 2 || materialSettings.mode === 3)) {
                if(this._defaultLineMaterial) return this._defaultLineMaterial;
            } else {
                if(this._defaultMaterial) return this._defaultMaterial;
            }

            const material = this.createMaterial(type, incomingData, materialData, materialSettings);
            if (type === MATERIAL_TYPE.POINT) {
                this._defaultPointsMaterial = <THREE.PointsMaterial>material;
            } else if (type === MATERIAL_TYPE.LINE) {
                this._defaultLineMaterial = <THREE.LineBasicMaterial>material;
            } else {
                this._defaultMaterial = <THREE.MeshPhysicalMaterial>material;
            }

            this._materialCache[type + '_' + type] = {
                material,
                materialData
            };

            return material;
        }

        if(this._materialCache[incomingData.id + '_' + incomingData.version + '_' + type]) 
            return this._materialCache[incomingData.id + '_' + incomingData.version + '_' + type].material;

        const material = this.createMaterial(type, incomingData, materialData, materialSettings);
        
        if(this._materialCache[incomingData.id + '_' + incomingData.version + '_' + type]) {
            this._materialCache[incomingData.id + '_' + incomingData.version + '_' + type].material.copy(material)
            return this._materialCache[incomingData.id + '_' + incomingData.version + '_' + type].material;
        }

        this._materialCache[incomingData.id + '_' + incomingData.version + '_' + type] = {
            material,
            materialData
        };

        return material;
    }

    public updateMaterials(): void {
        for(let m in this._materialCache)
            this._materialCache[m].material.needsUpdate = true;
    }

    public updateSoftShadow(lightSizeUV: number, blending: number) {
        this._lightSizeUV = lightSizeUV;
        this._blending = blending;
        for(let m in this._materialCache) {
            if(this._materialCache[m].material.userData.shader) {
                this._materialCache[m].material.userData.shader.uniforms.lightSizeUV.value = lightSizeUV;
                this._materialCache[m].material.userData.shader.uniforms.blending.value = blending;
            }
        }
    }

    // #endregion Public Methods (7)

    // #region Private Methods (1)

    private createTexture(map: IMapData): THREE.Texture {
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

    public get textureEncoding(): THREE.TextureEncoding {
        return this._textureEncoding;
    }
    
    public set textureEncoding(value: THREE.TextureEncoding) {
        this._textureEncoding = value;
        this.assignTextureEncoding();
    }

    // #endregion Private Methods (1)
}