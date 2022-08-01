import { Converter, HttpClient } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import {
  IGLTF_v2,
  IGLTF_v2_Material,
  IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness,
  ISHAPEDIVER_materials_preset,
} from '@shapediver/viewer.data-engine.shared-types'
import { vec2 } from 'gl-matrix'
import {
  MATERIAL_ALPHA,
  MATERIAL_SIDE,
  MaterialSpecularGlossinessData,
  MaterialStandardData,
  MaterialUnlitData,
  IMaterialAbstractData,
  IMaterialAbstractDataProperties,
  IMaterialSpecularGlossinessDataProperties,
  IMaterialStandardDataProperties,
  IMaterialUnlitDataProperties,
  MapData,
  IMapData,
} from '@shapediver/viewer.shared.types'
import { MaterialEngine } from '@shapediver/viewer.data-engine.material-engine'

import { GLTF_EXTENSIONS } from '../GLTFLoader'
import { TextureLoader } from './TextureLoader'

export class MaterialLoader {
    // #region Properties (4)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _materialEngine: MaterialEngine = <MaterialEngine>container.resolve(MaterialEngine);

    private _loaded: { [key: string]: IMaterialAbstractData } = {};

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(private readonly _content: IGLTF_v2, private readonly _textureLoader: TextureLoader) { }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public getMaterial(materialId: number): IMaterialAbstractData {
        if (!this._content.materials) throw new Error('MaterialLoader.getMaterial: Materials not available.')
        if (!this._content.materials[materialId]) throw new Error('MaterialLoader.getMaterial: Material not available.')
        if (!this._loaded[materialId]) throw new Error('MaterialLoader.getMaterial: Material not loaded.')
        return this._loaded[materialId];
    }

    public async load(): Promise<void> {
        this._loaded = {};
        if (!this._content.materials) return;

        let promises: Promise<void>[] = [];
        for (let i = 0; i < this._content.materials.length; i++) {
            const materialId = i;
            const material: IGLTF_v2_Material = this._content.materials[materialId];
            const materialExtensions = material.extensions || {};

            const materialDataProperties: IMaterialAbstractDataProperties = {};
            if (material.name !== undefined) materialDataProperties.name = material.name;

            if (materialExtensions[GLTF_EXTENSIONS.SHAPEDIVER_MATERIALS_PRESET]) {
                const materialPreset: ISHAPEDIVER_materials_preset = materialExtensions[GLTF_EXTENSIONS.SHAPEDIVER_MATERIALS_PRESET];
                promises.push(
                    new Promise(async resolve => {
                        const materialData = await this._materialEngine.loadPresetMaterial(materialPreset.materialpreset);
                        materialData.name = material.name;
                        materialData.color = this._converter.toColor(materialPreset.color);
                        this._loaded[materialId] = materialData;
                        resolve();
                    })
                )
                continue;
            }

            if (materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_PBRSPECULARGLOSSINESS]) {
                const pbrSpecularGlossiness: IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness = materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_PBRSPECULARGLOSSINESS];
                const specularGlossinessMaterialDataProperties: IMaterialSpecularGlossinessDataProperties = materialDataProperties;

                specularGlossinessMaterialDataProperties.color = '#ffffff';
                specularGlossinessMaterialDataProperties.opacity = 1.0;

                if (pbrSpecularGlossiness.diffuseFactor !== undefined) {
                    specularGlossinessMaterialDataProperties.color = this._converter.toColor([pbrSpecularGlossiness.diffuseFactor[0] * 255, pbrSpecularGlossiness.diffuseFactor[1] * 255, pbrSpecularGlossiness.diffuseFactor[2] * 255]);
                    specularGlossinessMaterialDataProperties.opacity = pbrSpecularGlossiness.diffuseFactor[3];
                }

                if (pbrSpecularGlossiness.diffuseTexture !== undefined) {
                    const diffuseTextureOptions = pbrSpecularGlossiness.diffuseTexture.extensions && pbrSpecularGlossiness.diffuseTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? pbrSpecularGlossiness.diffuseTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    specularGlossinessMaterialDataProperties.map = this.loadMap(pbrSpecularGlossiness.diffuseTexture.index, diffuseTextureOptions);
                }
                specularGlossinessMaterialDataProperties.emissiveness = '#000000';
                specularGlossinessMaterialDataProperties.glossiness = pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0;
                specularGlossinessMaterialDataProperties.specular = '#ffffff';

                if (pbrSpecularGlossiness.specularFactor !== undefined) {
                    specularGlossinessMaterialDataProperties.specular = this._converter.toColor([pbrSpecularGlossiness.specularFactor[0] * 255, pbrSpecularGlossiness.specularFactor[1] * 255, pbrSpecularGlossiness.specularFactor[2] * 255]);
                }

                if (pbrSpecularGlossiness.specularGlossinessTexture !== undefined) {
                    const specularGlossinessTextureOptions = pbrSpecularGlossiness.specularGlossinessTexture.extensions && pbrSpecularGlossiness.specularGlossinessTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? pbrSpecularGlossiness.specularGlossinessTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    specularGlossinessMaterialDataProperties.specularGlossinessMap = this.loadMap(pbrSpecularGlossiness.specularGlossinessTexture.index, specularGlossinessTextureOptions);
                }
            } else if (materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_UNLIT]) {
                const unlitMaterialDataProperties: IMaterialUnlitDataProperties = materialDataProperties;
                unlitMaterialDataProperties.color = '#ffffff';
                unlitMaterialDataProperties.opacity = 1.0;

                if (material.pbrMetallicRoughness !== undefined) {
                    if (material.pbrMetallicRoughness.baseColorFactor !== undefined) {
                        unlitMaterialDataProperties.color = this._converter.toColor([material.pbrMetallicRoughness.baseColorFactor[0] * 255, material.pbrMetallicRoughness.baseColorFactor[1] * 255, material.pbrMetallicRoughness.baseColorFactor[2] * 255]);
                        unlitMaterialDataProperties.opacity = material.pbrMetallicRoughness.baseColorFactor[3];
                    }
                    if (material.pbrMetallicRoughness.baseColorTexture !== undefined) {
                        const baseColorTextureOptions = material.pbrMetallicRoughness.baseColorTexture.extensions && material.pbrMetallicRoughness.baseColorTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? material.pbrMetallicRoughness.baseColorTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                        unlitMaterialDataProperties.map = this.loadMap(material.pbrMetallicRoughness.baseColorTexture.index, baseColorTextureOptions);
                    }
                }
            } else {
                const standardMaterialDataProperties: IMaterialStandardDataProperties = materialDataProperties;
                if (material.pbrMetallicRoughness !== undefined) {
                    standardMaterialDataProperties.color = '#ffffff';
                    if (material.pbrMetallicRoughness.baseColorFactor !== undefined) {
                        standardMaterialDataProperties.color = this._converter.toColor([material.pbrMetallicRoughness.baseColorFactor[0] * 255, material.pbrMetallicRoughness.baseColorFactor[1] * 255, material.pbrMetallicRoughness.baseColorFactor[2] * 255]);
                        standardMaterialDataProperties.opacity = material.pbrMetallicRoughness.baseColorFactor[3];
                    }
                    if (material.pbrMetallicRoughness.baseColorTexture !== undefined) {
                        const baseColorTextureOptions = material.pbrMetallicRoughness.baseColorTexture.extensions && material.pbrMetallicRoughness.baseColorTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? material.pbrMetallicRoughness.baseColorTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                        standardMaterialDataProperties.map = this.loadMap(material.pbrMetallicRoughness.baseColorTexture.index, baseColorTextureOptions);
                    }
                    if (material.pbrMetallicRoughness.metallicFactor !== undefined) {
                        standardMaterialDataProperties.metalness = material.pbrMetallicRoughness.metallicFactor;
                    }
                    if (material.pbrMetallicRoughness.roughnessFactor !== undefined) {
                        standardMaterialDataProperties.roughness = material.pbrMetallicRoughness.roughnessFactor;
                    }
                    if (material.pbrMetallicRoughness.metallicRoughnessTexture !== undefined) {
                        const metallicRoughnessTextureOptions = material.pbrMetallicRoughness.metallicRoughnessTexture.extensions && material.pbrMetallicRoughness.metallicRoughnessTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? material.pbrMetallicRoughness.metallicRoughnessTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                        standardMaterialDataProperties.metalnessRoughnessMap = this.loadMap(material.pbrMetallicRoughness.metallicRoughnessTexture.index, metallicRoughnessTextureOptions);
                    }
                }
            }

            /**
             * Loading of the general properties
             */

            if (material.normalTexture !== undefined) {
                const normalTextureOptions = material.normalTexture.extensions && material.normalTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? material.normalTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                materialDataProperties.normalMap = this.loadMap(material.normalTexture.index, normalTextureOptions);
                materialDataProperties.normalScale = 1;
                if (material.normalTexture.scale !== undefined) {
                    materialDataProperties.normalScale = material.normalTexture.scale;
                }
            }
            if (material.occlusionTexture !== undefined) {
                const occlusionTextureOptions = material.occlusionTexture.extensions && material.occlusionTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? material.occlusionTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                materialDataProperties.aoMap = this.loadMap(material.occlusionTexture.index, occlusionTextureOptions);
                if (material.occlusionTexture.strength !== undefined) {
                    materialDataProperties.aoMapIntensity = material.occlusionTexture.strength;
                }
            }
            if (material.emissiveTexture !== undefined) {
                const emissiveTextureOptions = material.emissiveTexture.extensions && material.emissiveTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? material.emissiveTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                materialDataProperties.emissiveMap = this.loadMap(material.emissiveTexture.index, emissiveTextureOptions);
            }

            if (material.emissiveFactor !== undefined) {
                materialDataProperties.emissiveness = this._converter.toColor([material.emissiveFactor[0] * 255, material.emissiveFactor[1] * 255, material.emissiveFactor[2] * 255]);
            }
            if (material.alphaMode !== undefined) {
                materialDataProperties.alphaMode = material.alphaMode.toLowerCase() === MATERIAL_ALPHA.MASK ? MATERIAL_ALPHA.MASK : material.alphaMode.toLowerCase() === MATERIAL_ALPHA.BLEND ? MATERIAL_ALPHA.BLEND : MATERIAL_ALPHA.OPAQUE;
                if (materialDataProperties.alphaMode === MATERIAL_ALPHA.MASK) {
                    materialDataProperties.alphaCutoff = material.alphaCutoff !== undefined ? material.alphaCutoff : 0.5;
                }
            }
            if (material.alphaCutoff !== undefined) {
                materialDataProperties.alphaCutoff = material.alphaCutoff;
            }
            if (material.doubleSided !== undefined) {
                materialDataProperties.side = material.doubleSided ? MATERIAL_SIDE.DOUBLE : MATERIAL_SIDE.FRONT;
            }

            /**
             * Early exit for specular glossiness and unlit materials
             */
            if (materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_PBRSPECULARGLOSSINESS]) {
                const specularGlossinessMaterialDataProperties: IMaterialSpecularGlossinessDataProperties = materialDataProperties;
                const materialData = new MaterialSpecularGlossinessData(specularGlossinessMaterialDataProperties);
                this._loaded[materialId] = materialData;
                continue;
            } else if (materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_UNLIT]) {
                const unlitMaterialDataProperties: IMaterialUnlitDataProperties = materialDataProperties;
                const materialData = new MaterialUnlitData(unlitMaterialDataProperties);
                this._loaded[materialId] = materialData;
                continue;
            }

            const standardMaterialDataProperties: IMaterialStandardDataProperties = materialDataProperties;

            if (materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_CLEARCOAT]) {
                const clearcoatExtension = materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_CLEARCOAT];
                if (clearcoatExtension.clearcoatFactor !== undefined) {
                    standardMaterialDataProperties.clearcoat = clearcoatExtension.clearcoatFactor;
                }

                if (clearcoatExtension.clearcoatTexture !== undefined) {
                    const clearcoatTextureOptions = clearcoatExtension.clearcoatTexture.extensions && clearcoatExtension.clearcoatTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? clearcoatExtension.clearcoatTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    standardMaterialDataProperties.clearcoatMap = this.loadMap(clearcoatExtension.clearcoatTexture.index, clearcoatTextureOptions);
                }

                if (clearcoatExtension.clearcoatRoughnessFactor !== undefined) {
                    standardMaterialDataProperties.clearcoatRoughness = clearcoatExtension.clearcoatRoughnessFactor;
                }

                if (clearcoatExtension.clearcoatRoughnessTexture !== undefined) {
                    const clearcoatRoughnessTextureOptions = clearcoatExtension.clearcoatRoughnessTexture.extensions && clearcoatExtension.clearcoatRoughnessTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? clearcoatExtension.clearcoatRoughnessTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    standardMaterialDataProperties.clearcoatRoughnessMap = this.loadMap(clearcoatExtension.clearcoatRoughnessTexture.index, clearcoatRoughnessTextureOptions);
                }

                if (clearcoatExtension.clearcoatNormalTexture !== undefined) {
                    const clearcoatNormalTextureOptions = clearcoatExtension.clearcoatNormalTexture.extensions && clearcoatExtension.clearcoatNormalTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? clearcoatExtension.clearcoatNormalTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    standardMaterialDataProperties.clearcoatNormalMap = this.loadMap(clearcoatExtension.clearcoatNormalTexture.index, clearcoatNormalTextureOptions);
                }
            }

            if (materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_IOR]) {
                const iorExtension = materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_IOR];
                if (iorExtension.ior !== undefined) {
                    standardMaterialDataProperties.ior = iorExtension.ior;
                }
            }

            if (materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_TRANSMISSION]) {
                const transmissionExtension = materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_TRANSMISSION];
                if (transmissionExtension.transmissionFactor !== undefined) {
                    standardMaterialDataProperties.transmission = transmissionExtension.transmissionFactor;
                }

                if (transmissionExtension.transmissionTexture !== undefined) {
                    const transmissionTextureOptions = transmissionExtension.transmissionTexture.extensions && transmissionExtension.transmissionTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? transmissionExtension.transmissionTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    standardMaterialDataProperties.transmissionMap = this.loadMap(transmissionExtension.transmissionTexture.index, transmissionTextureOptions);
                }
            }

            if (materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_VOLUME]) {
                const volumeExtension = materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_VOLUME];
                if (volumeExtension.thicknessFactor !== undefined) {
                    standardMaterialDataProperties.thickness = volumeExtension.thicknessFactor;
                }

                if (volumeExtension.thicknessTexture !== undefined) {
                    const thicknessTextureOptions = volumeExtension.thicknessTexture.extensions && volumeExtension.thicknessTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? volumeExtension.thicknessTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    standardMaterialDataProperties.thicknessMap = this.loadMap(volumeExtension.thicknessTexture.index, thicknessTextureOptions);
                }

                if (volumeExtension.attenuationDistance !== undefined) {
                    standardMaterialDataProperties.attenuationDistance = volumeExtension.attenuationDistance;
                }

                if (volumeExtension.attenuationColor !== undefined) {
                    standardMaterialDataProperties.attenuationColor = this._converter.toColor([volumeExtension.attenuationColor[0] * 255, volumeExtension.attenuationColor[1] * 255, volumeExtension.attenuationColor[2] * 255]);
                }
            }

            if (materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_SHEEN]) {
                const sheenExtension = materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_SHEEN];
                standardMaterialDataProperties.sheen = 1.0;
                if (sheenExtension.sheenColorFactor !== undefined) {
                    standardMaterialDataProperties.sheenColor = this._converter.toColor([sheenExtension.sheenColorFactor[0] * 255, sheenExtension.sheenColorFactor[1] * 255, sheenExtension.sheenColorFactor[2] * 255]);
                }

                if (sheenExtension.sheenRoughnessFactor !== undefined) {
                    standardMaterialDataProperties.sheenRoughness = sheenExtension.sheenRoughnessFactor;
                }

                if (sheenExtension.sheenColorTexture !== undefined) {
                    const sheenColorTextureOptions = sheenExtension.sheenColorTexture.extensions && sheenExtension.sheenColorTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? sheenExtension.sheenColorTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    standardMaterialDataProperties.sheenColorMap = this.loadMap(sheenExtension.sheenColorTexture.index, sheenColorTextureOptions);
                }

                if (sheenExtension.sheenRoughnessTexture !== undefined) {
                    const sheenRoughnessTextureOptions = sheenExtension.sheenRoughnessTexture.extensions && sheenExtension.sheenRoughnessTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? sheenExtension.sheenRoughnessTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    standardMaterialDataProperties.sheenRoughnessMap = this.loadMap(sheenExtension.sheenRoughnessTexture.index, sheenRoughnessTextureOptions);
                }
            }

            if (materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_SPECULAR]) {
                const specularExtension = materialExtensions[GLTF_EXTENSIONS.KHR_MATERIALS_SPECULAR];

                if (specularExtension.specularFactor !== undefined) {
                    standardMaterialDataProperties.specularIntensity = specularExtension.specularFactor;
                }

                if (specularExtension.specularColorFactor !== undefined) {
                    standardMaterialDataProperties.specularColor = this._converter.toColor([specularExtension.specularColorFactor[0] * 255, specularExtension.specularColorFactor[1] * 255, specularExtension.specularColorFactor[2] * 255]);
                }

                if (specularExtension.specularColorTexture !== undefined) {
                    const specularColorTextureOptions = specularExtension.specularColorTexture.extensions && specularExtension.specularColorTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? specularExtension.specularColorTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    standardMaterialDataProperties.specularColorMap = this.loadMap(specularExtension.specularColorTexture.index, specularColorTextureOptions);
                }

                if (specularExtension.specularTexture !== undefined) {
                    const specularTextureOptions = specularExtension.specularTexture.extensions && specularExtension.specularTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] ? specularExtension.specularTexture.extensions[GLTF_EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;
                    standardMaterialDataProperties.specularIntensityMap = this.loadMap(specularExtension.specularTexture.index, specularTextureOptions);
                }
            }

            const materialData = new MaterialStandardData(standardMaterialDataProperties);
            this._loaded[materialId] = materialData;
        }
        await Promise.all(promises);
    }

    // #endregion Public Methods (2)

    // #region Private Methods (1)

    private loadMap(textureId: number, properties?: { offset?: number[], scale?: number[], rotation?: number }): IMapData {
        if (!this._content.textures) throw new Error('Textures not available.')
        const texture = this._content.textures[textureId];
        if (!this._content.images) throw new Error('Images not available.')
        const sampler = this._content.samplers && texture.sampler && this._content.samplers[texture.sampler] ? this._content.samplers[texture.sampler] : {};
        const htmlImage = this._textureLoader.getTexture(textureId);

        return new MapData(
            htmlImage,
            sampler.wrapS,
            sampler.wrapT,
            sampler.minFilter,
            sampler.magFilter,
            undefined,
            undefined,
            properties && properties.offset ? vec2.fromValues(properties.offset[0], properties.offset[1]) : undefined,
            properties && properties.scale ? vec2.fromValues(properties.scale[0], properties.scale[1]) : undefined,
            properties && properties.rotation !== undefined ? properties.rotation : 0,
            false
        );;
    }

    // #endregion Private Methods (1)
}