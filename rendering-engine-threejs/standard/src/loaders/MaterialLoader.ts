/* eslint-disable @typescript-eslint/no-empty-function */

import * as THREE from 'three';
import { Converter, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services';
import { entry, main } from '../shaders/PCSS';
import { ENVIRONMENT_MAP_TYPE } from './EnvironmentMapLoader';
import { GemMaterial, GemMaterialParameters } from '../materials/GemMaterial';
import { ILoader } from '../interfaces/ILoader';
import { mat4, quat } from 'gl-matrix';
import { MeshUnlitMaterialParameters } from '../materials/MeshUnlitMaterialParameters';
import { RenderingEngine } from '../RenderingEngine';
import { SDColor } from '../objects/SDColor';
import { SpecularGlossinessMaterial, SpecularGlossinessMaterialParameters } from '../materials/SpecularGlossinessMaterial';
import {
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
} from '@shapediver/viewer.shared.types';

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

export const adaptShaders = () => {
    let shader = THREE.ShaderChunk.shadowmap_pars_fragment;
    if (!shader.includes('PCSS implementation')) {
        shader = shader.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP' + main);
        shader = shader.replace(shader.substr(shader.indexOf('#if defined( SHADOWMAP_TYPE_PCF )'), shader.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )') - shader.indexOf('#if defined( SHADOWMAP_TYPE_PCF )')), '#if defined( SHADOWMAP_TYPE_PCF )\n' + entry);
    }
    THREE.ShaderChunk.shadowmap_pars_fragment = shader;

    // set the uniform for the background envmap calculation initially
    THREE.ShaderLib.backgroundCube.uniforms.envMapRotation = { value: new THREE.Matrix4() };

    // console.log(THREE.ShaderChunk.envmap_common_pars_fragment)
    if (!THREE.ShaderChunk.cube_uv_reflection_fragment.includes('uniform mat4 envMapRotation;')) {
        THREE.ShaderChunk.cube_uv_reflection_fragment = THREE.ShaderChunk.cube_uv_reflection_fragment.replace(
            '#ifdef ENVMAP_TYPE_CUBE_UV',
            `uniform mat4 envMapRotation;
            #ifdef ENVMAP_TYPE_CUBE_UV`
        );
    }

    // console.log(THREE.ShaderChunk.envmap_fragment.includes(`vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );`))
    THREE.ShaderChunk.envmap_fragment = THREE.ShaderChunk.envmap_fragment.replace(
        'vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );',
        `
        #ifdef ENVMAP_TYPE_LDR
            vec4 adjustedEnvReflectVector = vec4( flipEnvMap * reflectVec.x, reflectVec.yz, 1.0 ) * envMapRotation;
            vec4 envColor = textureCube( envMap, adjustedEnvReflectVector.xyz );
        #else
            vec4 adjustedEnvReflectVector = vec4( flipEnvMap * reflectVec.x, reflectVec.zy, 1.0 ) * envMapRotation;
            vec4 envColor = textureCube( envMap, adjustedEnvReflectVector.xyz );
        #endif
        `
    );

    // console.log(THREE.ShaderChunk.backgroundCube_frag.includes(`vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );`))
    THREE.ShaderChunk.backgroundCube_frag = THREE.ShaderChunk.backgroundCube_frag.replace(
        'vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );',
        `
        vec4 adjustedEnvReflectVector = vec4( flipEnvMap * vWorldDirection.x, vWorldDirection.zy, 1.0 ) * envMapRotation;
        vec4 texColor = textureCube( envMap, adjustedEnvReflectVector.xyz );
        `
    );
    THREE.ShaderLib.backgroundCube.fragmentShader = THREE.ShaderChunk.backgroundCube_frag;

    // console.log(THREE.ShaderChunk.cube_uv_reflection_fragment.includes(`vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );`))
    THREE.ShaderChunk.cube_uv_reflection_fragment = THREE.ShaderChunk.cube_uv_reflection_fragment.replace(
        'vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );',
        `
        vec4 adjustedEnvReflectVector = vec4(sampleDir.xzy, 1.0) * envMapRotation;
        vec3 color0 = bilinearCubeUV( envMap, adjustedEnvReflectVector.xyz, mipInt );      
        `

    );

    // console.log(THREE.ShaderChunk.cube_uv_reflection_fragment.includes(`vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );`))
    THREE.ShaderChunk.cube_uv_reflection_fragment = THREE.ShaderChunk.cube_uv_reflection_fragment.replace(
        'vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );',
        `
        vec4 adjustedEnvReflectVector = vec4(sampleDir.xzy, 1.0) * envMapRotation;
        vec3 color1 = bilinearCubeUV( envMap, adjustedEnvReflectVector.xyz, mipInt + 1.0 );        
        `
    );

    if (!THREE.ShaderChunk.lights_fragment_maps.includes('vec3 reflectVec')) {
        const index = THREE.ShaderChunk.lights_fragment_maps.lastIndexOf('#endif');
        THREE.ShaderChunk.lights_fragment_maps = THREE.ShaderChunk.lights_fragment_maps.substring(0, index) +
            `#else
            #ifdef ENVMAP_TYPE_NONE
                vec3 reflectVec = reflect( -geometry.viewDir, geometry.normal );
                reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
                vec4 adjustedEnvReflectVector = vec4(reflectVec, 1.0);
                radiance += (vec3((adjustedEnvReflectVector.z + 1.0) / 2.0) + 0.5) / 1.5;
            #endif
        #endif
        ` + THREE.ShaderChunk.lights_fragment_maps.substring(index + '#endif'.length);
    }
};

type ThreeJsTextureCacheObject = {
    texture: THREE.Texture,
    usage: number,
    initialized: boolean
}

export class MaterialLoader implements ILoader {
    // #region Properties (17)

    private readonly _converter: Converter = Converter.instance;

    private _blending: number = 0.0;
    private _defaultLineMaterial?: THREE.LineBasicMaterial;
    private _defaultMaterial?: THREE.MeshPhysicalMaterial;
    private _defaultPointsMaterial?: THREE.PointsMaterial;
    private _envMap: THREE.CubeTexture | THREE.Texture | null = null;
    private _envMapIntensity: number = 1;
    private _envMapType: ENVIRONMENT_MAP_TYPE = ENVIRONMENT_MAP_TYPE.NULL;
    private _environmentMapRotationMatrix: THREE.Matrix4 = new THREE.Matrix4();
    private _height: number = 1020;
    private _lightSizeUV: number = 0.025;
    private _materialCache: {
        [key: string]: {
            materialData: IMaterialAbstractData | MaterialUnlitData | MaterialSpecularGlossinessData | MaterialStandardData | MaterialGemData | MaterialShadowData | null,
            material: (THREE.Material | THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial | THREE.PointsMaterial | THREE.LineBasicMaterial | THREE.ShadowMaterial),
            materialSettings?: MaterialSettings
        }
    } = {};
    private _maxMapCount: number = 0;
    private _pointSize: number = 1.0;
    private _sceneBackgroundNeedsUpdate: boolean = false;
    private _textureEncoding: THREE.ColorSpace = THREE.SRGBColorSpace;
    private _threeJsTextureCache: { [key: string]: ThreeJsTextureCacheObject } = {};

    // #endregion Properties (17)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        THREE.ShaderLib.backgroundCube.uniforms.envMapRotation = { value: this.transformEnvMapRotationMatrix(true) };
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    public get maxMapCount(): number {
        return this._maxMapCount;
    }

    public set maxMapCount(value: number) {
        this._maxMapCount = value;
    }

    public get sceneBackgroundNeedsUpdate(): boolean {
        return this._sceneBackgroundNeedsUpdate;
    }

    public set sceneBackgroundNeedsUpdate(value: boolean) {
        this._sceneBackgroundNeedsUpdate = value;
    }

    public get textureEncoding(): THREE.ColorSpace {
        return this._textureEncoding;
    }

    public set textureEncoding(value: THREE.ColorSpace) {
        this._textureEncoding = value;
        this.assignTextureEncoding();
    }

    public get threeJsTextureCache(): { [key: string]: ThreeJsTextureCacheObject } {
        return this._threeJsTextureCache;
    }

    public set threeJsTextureCache(value: { [key: string]: ThreeJsTextureCacheObject }) {
        this._threeJsTextureCache = value;
    }

    // #endregion Public Accessors (8)

    // #region Public Methods (17)

    public assignColorCorrection(value: boolean) {
        const convertColor = (c: THREE.Color | SDColor | undefined, toggle: boolean): THREE.Color | SDColor | undefined => {
            if (!c) return;

            if (c instanceof SDColor) {
                c.colorCorrection(toggle);
                return c;
            } else {
                const sdColor = this._renderingEngine.colorCache.find(color => color.equals(c));
                if (sdColor) {
                    sdColor.colorCorrection(toggle);
                    return sdColor;
                } else {
                    // we check in this case if the converted color has been stored already
                    const clone = c.clone();
                    toggle === true ? clone.convertSRGBToLinear() : clone.convertLinearToSRGB();
                    const sdColorClone = this._renderingEngine.colorCache.find(color => color.equals(clone));

                    if (sdColorClone) {
                        sdColorClone.colorCorrection(toggle);
                        return sdColorClone;
                    } else {
                        // some colors may not have been set by us, but have been set automatically
                        // in this case we expect the color to be linear either way and therefore omit a color correction
                        return c;
                    }
                }
            }
        };

        for (const m in this._materialCache) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const material: any = this._materialCache[m].material;

            if (material.color) material.color = convertColor(material.color, value);
            if (material.specular) material.specular = convertColor(material.specular, value);
            if (material.emissive) material.emissive = convertColor(material.emissive, value);
            if (material.colorTransferBegin) material.colorTransferBegin = convertColor(material.colorTransferBegin, value);
            if (material.colorTransferEnd) material.colorTransferEnd = convertColor(material.colorTransferEnd, value);
            if (material.attenuationColor) material.attenuationColor = convertColor(material.attenuationColor, value);
            if (material.sheencolor) material.sheencolor = convertColor(material.sheencolor, value);
            if (material.specularColor) material.specularColor = convertColor(material.specularColor, value);

            material.needsUpdate = true;
        }
    }

    public assignDefaultMaterialColor() {
        for (const m in this._materialCache) {
            const { material, materialData, materialSettings } = this._materialCache[m];

            // if there is no materialData stored in the cache that means that the default material was used
            if (!materialData && !(materialSettings !== undefined && materialSettings.useVertexColors))
                (<THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial | THREE.PointsMaterial | THREE.LineBasicMaterial | THREE.ShadowMaterial>material).color = this._renderingEngine.createThreeJsColor(this._renderingEngine.defaultMaterialColor);
        }
    }

    public assignEnvironmentMap(e: THREE.CubeTexture | THREE.Texture | null, type: ENVIRONMENT_MAP_TYPE) {
        this._envMap = e;
        this._envMapType = type;
        for (const m in this._materialCache) {
            if ((this._materialCache[m].material instanceof THREE.MeshPhysicalMaterial || this._materialCache[m].material instanceof THREE.MeshStandardMaterial || this._materialCache[m].material instanceof THREE.MeshBasicMaterial)) {
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

                if (this._materialCache[m].materialData instanceof MaterialUnlitData && this._renderingEngine.environmentMapForUnlitMaterials === false) return;

                material.envMap = e;
                material.needsUpdate = true;
                for (const d in material.defines) {
                    if (d.startsWith('ENVMAP_TYPE_'))
                        delete material.defines[d];
                }
                if (material.defines)
                    material.defines['ENVMAP_TYPE_' + this._envMapType.toUpperCase()] = '';

                this.updateEnvironmentMapRotation(this._renderingEngine.environmentMapRotation);
            }
        }
    }

    public assignEnvironmentMapForUnlitMaterials(toggle: boolean) {
        for (const m in this._materialCache) {
            if (this._materialCache[m].material instanceof THREE.MeshBasicMaterial) {
                const material: THREE.MeshBasicMaterial = <THREE.MeshBasicMaterial>this._materialCache[m].material;
                if (this._materialCache[m].materialData &&
                    this._materialCache[m].materialData instanceof MaterialUnlitData &&
                    (<MaterialUnlitData>this._materialCache[m].materialData).envMap !== undefined
                ) continue;

                if (toggle) {
                    material.envMap = this._envMap;
                    material.needsUpdate = true;
                    for (const d in material.defines) {
                        if (d.startsWith('ENVMAP_TYPE_'))
                            delete material.defines[d];
                    }
                    if (material.defines)
                        material.defines['ENVMAP_TYPE_' + this._envMapType.toUpperCase()] = '';

                    material.userData.shader.uniforms.envMapRotation.value = this.transformEnvMapRotationMatrix();
                } else {
                    material.envMap = null;
                    material.needsUpdate = true;
                }
            }
        }
    }

    public assignEnvironmentMapIntensity(value: number) {
        this._envMapIntensity = value;
        for (const m in this._materialCache) {
            if ((this._materialCache[m].material instanceof THREE.MeshPhysicalMaterial || this._materialCache[m].material instanceof THREE.MeshStandardMaterial)) {
                const material: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial = <THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial>this._materialCache[m].material;
                if (this._materialCache[m].materialData &&
                    (
                        this._materialCache[m].materialData instanceof MaterialStandardData ||
                        this._materialCache[m].materialData instanceof MaterialGemData ||
                        this._materialCache[m].materialData instanceof MaterialSpecularGlossinessData ||
                        this._materialCache[m].materialData instanceof MaterialUnlitData
                    ) &&
                    (<MaterialStandardData | MaterialGemData | MaterialSpecularGlossinessData | MaterialUnlitData>this._materialCache[m].materialData).envMap !== undefined
                ) continue;

                material.envMapIntensity = value;
                material.needsUpdate = true;
            }
        }
    }

    public assignPointSize(p: number) {
        const height = this._renderingEngine.renderer ? this._renderingEngine.renderer.getSize(new THREE.Vector2()).y : 1080;
        if (height === this._height && p * (this._height / 1080) === this._pointSize) return;
        this._height = height;
        this._pointSize = p * (this._height / 1080);
        for (const m in this._materialCache) {
            if (this._materialCache[m].material instanceof THREE.PointsMaterial) {
                (<THREE.PointsMaterial>this._materialCache[m].material).size = this._pointSize;
                (<THREE.PointsMaterial>this._materialCache[m].material).needsUpdate = true;
            }
        }
    }

    public cacheSize() {
        return Object.entries(this._materialCache).length;
    }

    public createMaterial(
        type: MATERIAL_TYPE,
        incomingData: IMaterialAbstractData | MaterialUnlitData | MaterialSpecularGlossinessData | MaterialStandardData | MaterialGemData | GeometryData,
        materialData: IMaterialAbstractData | MaterialUnlitData | MaterialSpecularGlossinessData | MaterialStandardData | MaterialGemData | null,
        materialSettings?: MaterialSettings
    ) {
        const { properties, mapCount } = this.getMaterialProperties(materialData, type, materialSettings);
        this.maxMapCount = Math.max(this.maxMapCount, mapCount);

        let material: THREE.PointsMaterial | THREE.LineBasicMaterial | THREE.MeshBasicMaterial | THREE.MeshPhysicalMaterial | SpecularGlossinessMaterial | GemMaterial | THREE.ShadowMaterial;
        if (type === MATERIAL_TYPE.POINT) {
            material = new THREE.PointsMaterial(Object.assign(properties, { size: this._pointSize }));
        } else if (type === MATERIAL_TYPE.LINE) {
            material = new THREE.LineBasicMaterial(properties);
        } else {
            if (materialData instanceof MaterialUnlitData) {
                material = new THREE.MeshBasicMaterial(properties);
            } else {
                if (materialData instanceof MaterialShadowData) {
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
                    const envMapRotationMatrix = this.transformEnvMapRotationMatrix();
                    shader.uniforms.envMapRotation = { value: envMapRotationMatrix };
                    material.userData.shader = shader;
                };

                if (material instanceof SpecularGlossinessMaterial || material instanceof THREE.MeshPhysicalMaterial) {
                    material.defines['ENVMAP_TYPE_' + this._envMapType.toUpperCase()] = '';

                    if (materialSettings && materialSettings.useVertexTangents) material.normalScale.y *= - 1;
                    if (materialSettings && materialSettings.useVertexTangents && material instanceof THREE.MeshPhysicalMaterial) material.clearcoatNormalScale.y *= - 1;
                    if (materialSettings && materialSettings.useFlatShading) material.flatShading = true;
                }
            }
        }

        if (materialSettings && materialSettings.useVertexColors) material.vertexColors = true;

        if (materialData instanceof MaterialStandardData || materialData instanceof MaterialGemData || materialData instanceof MaterialSpecularGlossinessData || materialData instanceof MaterialUnlitData) {
            if (materialData.envMap !== undefined) {
                const envMapInput = (<MaterialStandardData | MaterialGemData | MaterialSpecularGlossinessData | MaterialUnlitData>materialData).envMap;
                if (envMapInput !== undefined) {
                    const envMapResult = this._renderingEngine.environmentMapLoader.loadEnvMap(envMapInput);
                    envMapResult.map.then(envMap => {
                        if (material instanceof THREE.MeshBasicMaterial && this._renderingEngine.environmentMapForUnlitMaterials === false) return;

                        (<THREE.MeshBasicMaterial | SpecularGlossinessMaterial | GemMaterial | THREE.MeshPhysicalMaterial>material).envMap = envMap;

                        const envMapType = (<THREE.MeshBasicMaterial | SpecularGlossinessMaterial | GemMaterial | THREE.MeshPhysicalMaterial>material).envMap instanceof THREE.CubeTexture ? ENVIRONMENT_MAP_TYPE.LDR : ENVIRONMENT_MAP_TYPE.HDR;
                        for (const d in material.defines) {
                            if (d.startsWith('ENVMAP_TYPE_'))
                                delete material.defines[d];
                        }
                        if (material.defines)
                            material.defines['ENVMAP_TYPE_' + envMapType.toUpperCase()] = '';

                        material.needsUpdate = true;
                    });
                }
            }
        }

        if (materialData)
            materialData.threeJsObject[this._renderingEngine.id] = material;

        material.needsUpdate = true;
        material.userData = {
            SDid: incomingData.id,
            SDversion: incomingData.version
        };

        return material;
    }

    public emptyMaterialCache() {
        this._materialCache = {};
    }

    public getMaterialProperties(
        materialData: IMaterialAbstractData | MaterialUnlitData | MaterialSpecularGlossinessData | MaterialStandardData | MaterialGemData | MaterialShadowData | null,
        type: MATERIAL_TYPE,
        materialSettings?: MaterialSettings
    ): {
        properties: THREE.PointsMaterialParameters | THREE.LineBasicMaterialParameters | MeshUnlitMaterialParameters | THREE.MeshPhysicalMaterialParameters | SpecularGlossinessMaterialParameters | GemMaterialParameters | THREE.ShadowMaterialParameters,
        mapCount: number
    } {
        const generalProperties: THREE.PointsMaterialParameters | THREE.LineBasicMaterialParameters | MeshUnlitMaterialParameters | THREE.MeshPhysicalMaterialParameters | SpecularGlossinessMaterialParameters | GemMaterialParameters | THREE.ShadowMaterialParameters = {};

        let mapCount = 0;

        // if no MaterialStandardData is provided, we return our default
        if (!materialData) {
            generalProperties.color = this._renderingEngine.createThreeJsColor(this._renderingEngine.defaultMaterialColor);
            if (materialSettings !== undefined && materialSettings.useVertexColors)
                generalProperties.color = this._renderingEngine.createThreeJsColor('#d3d3d3');
            generalProperties.side = THREE.DoubleSide;
            if (!(type === MATERIAL_TYPE.POINT || type === MATERIAL_TYPE.LINE)) {
                (<THREE.MeshPhysicalMaterialParameters>generalProperties).envMap = this._envMap;
                (<THREE.MeshPhysicalMaterialParameters>generalProperties).envMapIntensity = this._envMapIntensity;
            }
            return { properties: generalProperties, mapCount };
        }

        /**
         * We know evaluate properties that can be applied to all materials
         */

        generalProperties.alphaTest = materialData.alphaCutoff;

        if (materialData.opacity !== undefined) {
            generalProperties.opacity = materialData.opacity;
            generalProperties.transparent = generalProperties.opacity < 1;
        }

        if (materialData.alphaMode === MATERIAL_ALPHA.BLEND) {
            generalProperties.transparent = true;
            generalProperties.depthWrite = false;
        } else if (!generalProperties.transparent) {
            generalProperties.transparent = false;
        }

        if (materialData.color !== undefined)
            generalProperties.color = this._renderingEngine.createThreeJsColor(materialData.color);

        if (materialData.color === undefined && materialData.map !== undefined && materialData.map.color !== undefined)
            generalProperties.color = this._renderingEngine.createThreeJsColor(materialData.map.color);

        if (materialData.color === undefined && materialData.map !== undefined && materialData.map.color === undefined && !(materialSettings !== undefined && materialSettings.useVertexColors))
            generalProperties.color = this._renderingEngine.createThreeJsColor(this._renderingEngine.defaultMaterialColor);

        if ((materialSettings !== undefined && materialSettings.useVertexColors) && (materialData.color === this._converter.toHexColor(this._renderingEngine.defaultMaterialColor) || materialData.color + 'ff' === this._converter.toHexColor(this._renderingEngine.defaultMaterialColor) || materialData.color === this._renderingEngine.defaultMaterialColor || materialData.color === this._renderingEngine.defaultMaterialColor + 'ff' || materialData.color === undefined))
            generalProperties.color = this._renderingEngine.createThreeJsColor('#d3d3d3');

        if (materialData.side !== undefined)
            generalProperties.side = materialData.side === MATERIAL_SIDE.BACK ? THREE.BackSide : materialData.side === MATERIAL_SIDE.FRONT ? THREE.FrontSide : THREE.DoubleSide;

        /**
         * 
         * First exit, lines ans points
         * 
         */

        if (type === MATERIAL_TYPE.POINT) {
            (<THREE.PointsMaterialParameters>generalProperties).size = this._pointSize;
            return { properties: generalProperties, mapCount };
        } else if (type === MATERIAL_TYPE.LINE) {
            return { properties: generalProperties, mapCount };
        }

        /**
         * 
         * Second exit, the shadow material
         * 
         */

        if (materialData instanceof MaterialShadowData)
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
            basicProperties.map.colorSpace = this._textureEncoding;
            mapCount++;
        }

        /**
         * 
         * Third exit, the unlit material
         * 
         */

        if (materialData instanceof MaterialUnlitData)
            return { properties: basicProperties, mapCount };

        /**
         * We know evaluate properties that can be applied to MeshPhysicalMaterials, SpecularGlossinessMaterials and GemMaterialParameters
         */

        const standardProperties: THREE.MeshPhysicalMaterialParameters | SpecularGlossinessMaterialParameters | GemMaterialParameters = basicProperties;

        if (materialData.shading !== undefined)
            standardProperties.flatShading = materialData.shading !== 'smooth';

        if (materialData.bumpMap !== undefined) {
            standardProperties.bumpMap = this.createTexture(materialData.bumpMap);
            mapCount++;
        }

        standardProperties.bumpScale = materialData.bumpScale;

        if (materialData.emissiveness !== undefined)
            standardProperties.emissive = this._renderingEngine.createThreeJsColor(materialData.emissiveness);

        if (materialData.emissiveMap !== undefined) {
            standardProperties.emissiveMap = this.createTexture(materialData.emissiveMap);
            standardProperties.emissiveMap.colorSpace = this._textureEncoding;
            mapCount++;
        }

        standardProperties.envMap = this._envMap;
        standardProperties.envMapIntensity = this._envMapIntensity;

        if (materialData.normalMap !== undefined) {
            standardProperties.normalMap = this.createTexture(materialData.normalMap);
            mapCount++;
        }

        if (materialData.normalScale !== undefined)
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
                specularGlossinessProperties.specularMap2 = this.createTexture(materialData.specularGlossinessMap);
                specularGlossinessProperties.specularMap2.colorSpace = THREE.SRGBColorSpace;
                specularGlossinessProperties.glossinessMap = specularGlossinessProperties.specularMap2;
                mapCount++;
            } else {
                if (materialData.specularMap !== undefined) {
                    specularGlossinessProperties.specularMap2 = this.createTexture(materialData.specularMap);
                    specularGlossinessProperties.specularMap2.colorSpace = THREE.SRGBColorSpace;
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

            gemProperties.sphericalNormalMap = <THREE.CubeTexture><unknown>materialData.sphericalNormalMap;

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
        throw new ShapeDiverViewerDataProcessingError('MaterialLoader.getMaterialProperties: No proper material properties were found.');
    }

    public init(): void { }

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
        if (!(incomingData instanceof GeometryData))
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

        if (!materialData) {
            // evaluate which type of material properties we are constructing
            if (materialSettings && materialSettings.mode === 0) {
                if (this._defaultPointsMaterial) return this._defaultPointsMaterial;
            } else if (materialSettings && (materialSettings.mode === 1 || materialSettings.mode === 2 || materialSettings.mode === 3)) {
                if (this._defaultLineMaterial) return this._defaultLineMaterial;
            } else {
                if (this._defaultMaterial) return this._defaultMaterial;
            }

            const material = this.createMaterial(type, incomingData, materialData, materialSettings);
            if (type === MATERIAL_TYPE.POINT) {
                this._defaultPointsMaterial = <THREE.PointsMaterial>material;
            } else if (type === MATERIAL_TYPE.LINE) {
                this._defaultLineMaterial = <THREE.LineBasicMaterial>material;
            } else {
                this._defaultMaterial = <THREE.MeshPhysicalMaterial>material;
            }

            this._materialCache[type + '_' + JSON.stringify(materialSettings)] = {
                material,
                materialData,
                materialSettings
            };

            return material;
        }

        const material = this.createMaterial(type, incomingData, materialData, materialSettings);

        if (this._materialCache[incomingData.id + '_' + incomingData.version + '_' + type + '_' + JSON.stringify(materialSettings)]) {
            this._materialCache[incomingData.id + '_' + incomingData.version + '_' + type + '_' + JSON.stringify(materialSettings)].material.copy(material);
            return this._materialCache[incomingData.id + '_' + incomingData.version + '_' + type + '_' + JSON.stringify(materialSettings)].material;
        }

        this._materialCache[incomingData.id + '_' + incomingData.version + '_' + type + '_' + JSON.stringify(materialSettings)] = {
            material,
            materialData,
            materialSettings
        };

        return material;
    }

    public removeFromMaterialCache(id: string) {
        for (const m in this._materialCache) {
            if (m.startsWith(id)) {
                delete this._materialCache[m];
            }
        }
    }

    public transformEnvMapRotationMatrix(backgroundMaterial: boolean = false): THREE.Matrix4 {
        // y - z axis change 
        const matrix = new THREE.Matrix4().fromArray([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
        if (backgroundMaterial === true) {
            return this._envMapType.toUpperCase() === 'LDR' ? this._environmentMapRotationMatrix.clone().invert().multiply(matrix) : this._environmentMapRotationMatrix;
        } else {
            return this._envMapType.toUpperCase() === 'LDR' ? this._environmentMapRotationMatrix.clone().multiply(matrix) : this._environmentMapRotationMatrix;
        }
    }

    public updateEnvironmentMapRotation(quaternion: quat) {
        this._environmentMapRotationMatrix = new THREE.Matrix4().fromArray(mat4.fromQuat(mat4.create(), quaternion)).transpose();
        const envMapRotationMatrix = this.transformEnvMapRotationMatrix();
        const envMapRotationMatrixBackground = this.transformEnvMapRotationMatrix(true);

        for (const m in this._materialCache)
            if (this._materialCache[m].material.userData.shader) {
                this._materialCache[m].material.userData.shader.uniforms.envMapRotation.value = envMapRotationMatrix;
            }

        // set the new uniform value as the default if the environment is recomputed
        THREE.ShaderLib.backgroundCube.uniforms.envMapRotation = { value: envMapRotationMatrixBackground };

        this._sceneBackgroundNeedsUpdate = true;
    }

    public updateMaterials(): void {
        for (const m in this._materialCache)
            this._materialCache[m].material.needsUpdate = true;
    }

    public updateSoftShadow(lightSizeUV: number, blending: number) {
        this._lightSizeUV = lightSizeUV;
        this._blending = blending;
        for (const m in this._materialCache) {
            if (this._materialCache[m].material.userData.shader) {
                this._materialCache[m].material.userData.shader.uniforms.lightSizeUV.value = lightSizeUV;
                this._materialCache[m].material.userData.shader.uniforms.blending.value = blending;
            }
        }
    }

    // #endregion Public Methods (17)

    // #region Private Methods (3)

    private assignTextureEncoding() {
        for (const m in this._materialCache) {
            if (this._materialCache[m].material instanceof THREE.MeshPhysicalMaterial || this._materialCache[m].material instanceof THREE.MeshStandardMaterial) {
                const material: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial = <THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial>this._materialCache[m].material;
                if (material.emissiveMap) {
                    material.emissiveMap!.colorSpace = this._textureEncoding;
                    material.emissiveMap!.needsUpdate = true;
                }
                if (material.map) {
                    material.map!.colorSpace = this._textureEncoding;
                    material.map!.needsUpdate = true;
                }
                material.needsUpdate = true;
            }
        }
    }

    private createDataKeyFromMap(map: IMapData): string {
        return window.btoa(`${map.image.src}_${map.center}_${map.color}_${map.flipY}_${map.magFilter}_${map.minFilter}_${map.offset}_${map.repeat}_${map.rotation}_${map.texCoord}_${map.wrapS}_${map.wrapT}`);
    }

    private createTexture(map: IMapData): THREE.Texture {
        const key = this.createDataKeyFromMap(map);

        // texture in this structure are only stored until the next scene tree update call
        // therefore no cache management is needed, as these textures need to be created either way
        // the cache is cleared in updateSceneTree
        if (this._threeJsTextureCache[key]) {
            this._threeJsTextureCache[key].usage++;
            return this._threeJsTextureCache[key].texture;
        }

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
                    return THREE.LinearFilter;
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
                    return THREE.LinearFilter;
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
                    return THREE.RepeatWrapping;
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
                    return THREE.RepeatWrapping;
            }
        })();

        texture.center = new THREE.Vector2(map.center[0], map.center[1]);
        texture.offset = new THREE.Vector2(map.offset[0], map.offset[1]);
        texture.repeat = new THREE.Vector2(map.repeat[0], map.repeat[1]);
        texture.rotation = map.rotation;
        if (map.texCoord !== undefined) texture.channel = map.texCoord;

        texture.flipY = map.flipY;
        texture.needsUpdate = true;

        texture.userData.cacheKey = key;

        this._threeJsTextureCache[key] = {
            texture,
            usage: 1,
            initialized: false
        };
        return this._threeJsTextureCache[key].texture;
    }

    // #endregion Private Methods (3)
}