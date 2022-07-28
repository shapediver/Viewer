import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { Converter, HttpClient, HttpResponse, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerDataProcessingError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
import {
    MapData,
    MATERIAL_SIDE,
    MaterialStandardData,
    TEXTURE_FILTERING,
    TEXTURE_WRAPPING,
} from '@shapediver/viewer.shared.types'
import { vec2, vec3, vec4 } from 'gl-matrix'

import { materialDatabase } from './materialDatabase'
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2'
import { IMaterialContentData, IMaterialContentDataV1, IMaterialContentDataV2, IMaterialContentDataV3, IPresetMaterialDefinition, ITexture } from '@shapediver/viewer.data-engine.shared-types'

@singleton()
export class MaterialEngine {
    // #region Properties (3)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor() { }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
       * Load the material content into a scene graph node.
       * 
       * @param content the material content
       * @returns the scene graph node 
       */
    public async loadContent(content: ShapeDiverResponseOutputContent): Promise<ITreeNode> {
        const node = new TreeNode(content.name || 'material');
        if (!content) {
            const error = new ShapeDiverViewerDataProcessingError('MaterialEngine.loadContent: Invalid content was provided to material engine.');
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `MaterialEngine.loadContent`, error);
        }

        let material = new MaterialStandardData();

        if (content.data) {

            const data: IMaterialContentData = content.data;
            let presetData: IMaterialContentDataV3 | undefined;
            if (data.materialpreset)
                presetData = this.loadPresetMaterialDefinition(data.materialpreset);

            if (data.materialType && data.materialType !== 'standard') {
                // gem material https://shapediver.atlassian.net/browse/SS-2514
            } else {
                if (data.version) {
                    if (data.version === '1.0') {
                        material = await this.loadMaterialV3(this.loadMaterialDefinitionV1(data, presetData));
                    } else if (data.version === '2.0') {
                        material = await this.loadMaterialV3(this.loadMaterialDefinitionV2(data, presetData));
                    } else if (data.version === '3.0') {
                        material = await this.loadMaterialV3(this.loadMaterialDefinitionV3(data, presetData));
                    } else {
                        const error = new ShapeDiverViewerDataProcessingError('MaterialEngine.loadContent: Material data version not supported.');
                        throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `MaterialEngine.loadContent`, error);
                    }
                }
            }
        } else {
            const error = new ShapeDiverViewerDataProcessingError('MaterialEngine.loadContent: No material data was provided to material engine.');
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `MaterialEngine.loadContent`, error);
        }
        
        node.data.push(material);
        return node;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (9)

    private assignGeneralDefinition(id: { class: string, specific: string }, generalDefinition: IPresetMaterialDefinition, specificDefinition: IPresetMaterialDefinition, definition: IMaterialContentDataV3) {
        const promises: Promise<MapData | null>[] = [];

        if (generalDefinition.transparencytexture && !specificDefinition.transparencytexture)
            definition.transparencytexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + generalDefinition.transparencytexture
            }

        if (generalDefinition.hasOwnProperty('alphaThreshold') && !specificDefinition.hasOwnProperty('alphaThreshold'))
            definition.alphaThreshold = generalDefinition.alphaThreshold;

        if (generalDefinition.bumptexture && !specificDefinition.bumptexture) 
            definition.bumptexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + generalDefinition.bumptexture
            }
        
        if (generalDefinition.hasOwnProperty('bumpAmplitude') && !specificDefinition.hasOwnProperty('bumpAmplitude')) 
            definition.bumpAmplitude = generalDefinition.bumpAmplitude!;

        if (generalDefinition.color && !specificDefinition.color) 
            definition.color = generalDefinition.color;

        if (generalDefinition.bitmaptexture && !specificDefinition.bitmaptexture)
            definition.bitmaptexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + generalDefinition.bitmaptexture
            }
        
        if (generalDefinition.hasOwnProperty('metalness') && !specificDefinition.hasOwnProperty('metalness')) 
            definition.metalness = generalDefinition.metalness!;
        
        if (generalDefinition.metalnesstexture && !specificDefinition.metalnesstexture)
            definition.metalnesstexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + generalDefinition.metalnesstexture
            }
       
        if (generalDefinition.normaltexture && !specificDefinition.normaltexture)
            definition.normaltexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + generalDefinition.normaltexture
            }

        if (generalDefinition.hasOwnProperty('transparency') && !specificDefinition.hasOwnProperty('transparency')) 
            definition.transparency = generalDefinition.transparency;
            
        if (generalDefinition.hasOwnProperty('roughness') && !specificDefinition.hasOwnProperty('roughness')) 
            definition.roughness = generalDefinition.roughness!;

        if (generalDefinition.roughnesstexture && !specificDefinition.roughnesstexture) 
            definition.roughnesstexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + generalDefinition.roughnesstexture
            }

        if (generalDefinition.side && !specificDefinition.side) 
            definition.side = generalDefinition.side;
    }

    private assignSpecificDefinition(id: { class: string, specific: string }, specificDefinition: IPresetMaterialDefinition, definition: IMaterialContentDataV3) {
        if (specificDefinition.transparencytexture)
            definition.transparencytexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + id.specific + '/' + specificDefinition.transparencytexture
            }

        if (specificDefinition.hasOwnProperty('alphaThreshold'))
            definition.alphaThreshold = specificDefinition.alphaThreshold!;

        if (specificDefinition.bumptexture)
            definition.bumptexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + id.specific + '/' + specificDefinition.bumptexture
            }

        if (specificDefinition.hasOwnProperty('bumpAmplitude')) 
            definition.bumpAmplitude = specificDefinition.bumpAmplitude!;

        if (specificDefinition.color) 
            definition.color = specificDefinition.color;

        if (specificDefinition.bitmaptexture)
            definition.bitmaptexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + id.specific + '/' + specificDefinition.bitmaptexture
            }

        if (specificDefinition.hasOwnProperty('metalness'))
            definition.metalness = specificDefinition.metalness!;

        if (specificDefinition.metalnesstexture)
            definition.metalnesstexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + id.specific + '/' + specificDefinition.metalnesstexture
            }
            
        if (specificDefinition.normaltexture)
            definition.normaltexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + id.specific + '/' + specificDefinition.normaltexture
            }

        if (specificDefinition.hasOwnProperty('transparency')) 
            definition.transparency = specificDefinition.transparency!;

        if (specificDefinition.hasOwnProperty('roughness')) 
            definition.roughness = specificDefinition.roughness!;

        if (specificDefinition.roughnesstexture)
            definition.roughnesstexture = {
                href: 'https://viewer.shapediver.com/v2/materials/1024/' + id.class + '/' + id.specific + '/' + specificDefinition.roughnesstexture
            }

        if (specificDefinition.side) 
            definition.side = specificDefinition.side;
    }

    private getClassAndSpecificId(id: number): { class: string, specific: string } {
        // for a while, we had documented the presets to be 10, 20, 30 and 40 here, we allow for the few cases where this was used to succeed
        if (id < 100 && id % 10 == 0) id /= 10;

        // if the id is less than 10, multiply it by 100
        if (id < 10) id *= 100;

        const cast = (id: number): string => {
            let idString = String(id);
            return idString.padStart(2, '0').slice(0, 2);
        };

        return {
            class: cast(Math.floor(id / 100)),
            specific: cast(id - (Math.floor(id / 100) * 100))
        };
    }

    public async loadMap(url: string, id?: string): Promise<MapData | null> {
        let image: HTMLImageElement;
        try {
            if (!id) {
                image = <HTMLImageElement>await this._converter.responseToImage(await this._httpClient.loadTexture(url));
            } else {
                image = <HTMLImageElement>await this._converter.responseToImage(await this._httpClient.loadTexture('https://viewer.shapediver.com/v2/materials/1024/' + id + '/' + url));
            }
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `MaterialEngine.loadMap`, e);
        }
        return new MapData(image);
    }

    public async loadMapWithProperties(texture: ITexture): Promise<MapData | null> {
        let image: HTMLImageElement;
        try {
            image = <HTMLImageElement>await this._converter.responseToImage(await this._httpClient.loadTexture(texture.href!));
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `MaterialEngine.loadMapWithProperties`, e);
        }

        const wrapS = texture.wrapS === 1 ? TEXTURE_WRAPPING.CLAMP_TO_EDGE : texture.wrapS === 2 ? TEXTURE_WRAPPING.MIRRORED_REPEAT : TEXTURE_WRAPPING.REPEAT;
        const wrapT = texture.wrapT === 1 ? TEXTURE_WRAPPING.CLAMP_TO_EDGE : texture.wrapT === 2 ? TEXTURE_WRAPPING.MIRRORED_REPEAT : TEXTURE_WRAPPING.REPEAT;
        const center = texture.center ? vec2.fromValues(texture.center[0], texture.center[1]) : vec2.fromValues(0, 0);
        const color = texture.color ? vec4.fromValues(texture.color[0] / 255, texture.color[1] / 255, texture.color[2] / 255, texture.color[3] / 255) : vec4.fromValues(1, 1, 1, 1);
        const offset = texture.offset ? vec2.fromValues(texture.offset[0], texture.offset[1]) : vec2.fromValues(0, 0);
        const repeat = texture.repeat ? vec2.fromValues(texture.repeat[0], texture.repeat[1]) : vec2.fromValues(1, 1);

        return new MapData(image, wrapS, wrapT, TEXTURE_FILTERING.LINEAR_MIPMAP_LINEAR, TEXTURE_FILTERING.LINEAR, center, this._converter.toColor(color), offset, repeat, texture.rotation || 0);
    }
    
    public loadMaterialDefinitionV1(data: IMaterialContentDataV1, presetData: IMaterialContentDataV3 = {}): IMaterialContentDataV3 {
        // ambient is ignored

        if (data.color) {
            presetData.color = data.color;
        } else if (data.diffuse) {
            presetData.color = data.diffuse;
        }

        // emission is ignored

        // specular is ignored

        if (data.shine || data.shine === 0) {
            presetData.metalness = Math.min(1, data.shine);
            presetData.roughness = 1 - (Math.min(1, data.shine));
        }

        if (data.hasOwnProperty('transparency'))
            presetData.transparency = data.transparency!;

        if (data.bitmaptexture)
            presetData.bitmaptexture = {
                href: data.bitmaptexture
            }

        if (data.bumptexture)
            presetData.bumptexture = {
                href: data.bumptexture
            } 

        if (data.transparencytexture)
            presetData.transparencytexture = {
                href: data.transparencytexture
            }
            
        return presetData;
    }
    
    public loadMaterialDefinitionV2(data: IMaterialContentDataV2, presetData: IMaterialContentDataV3 = {}): IMaterialContentDataV3 {
        // ambient is ignored

        if (data.color)
            presetData.color = data.color;

        presetData.side = data.side;

        if (data.metalness || data.metalness === 0)
            presetData.metalness = data.metalness;

        if (data.roughness || data.roughness === 0)
            presetData.roughness = data.roughness;

        if (data.hasOwnProperty('transparency'))
            presetData.transparency = data.transparency!;

        if (data.alphaThreshold || data.alphaThreshold === 0)
            presetData.alphaThreshold = data.alphaThreshold;

        if (data.bitmaptexture)
            presetData.bitmaptexture = {
                href: data.bitmaptexture
            }

        if (data.metalnesstexture)
            presetData.metalnesstexture = {
                href: data.metalnesstexture
            }

        if (data.roughnesstexture)
            presetData.roughnesstexture = {
                href: data.roughnesstexture
            }

        if (data.bumptexture)
            presetData.bumptexture = {
                href: data.bumptexture
            }

        if (data.normaltexture)
            presetData.normaltexture = {
                href: data.normaltexture
            }

        if (data.transparencytexture)
            presetData.transparencytexture = {
                href: data.transparencytexture
            }
            
        return presetData;
    }

    public loadMaterialDefinitionV3(data: IMaterialContentDataV3, presetData: IMaterialContentDataV3 = {}): IMaterialContentDataV3 {
        // ambient is ignored

        if (data.color)
            presetData.color = data.color;

        presetData.side = data.side;

        if (data.metalness || data.metalness === 0)
            presetData.metalness = data.metalness;

        if (data.roughness || data.roughness === 0)
            presetData.roughness = data.roughness;

        if (data.hasOwnProperty('transparency'))
            presetData.transparency = data.transparency!;

        if (data.alphaThreshold || data.alphaThreshold === 0)
            presetData.alphaThreshold = data.alphaThreshold;

        if (data.bumpAmplitude || data.bumpAmplitude === 0)
            presetData.bumpAmplitude = data.bumpAmplitude;

        if (data.bitmaptexture)
            presetData.bitmaptexture = data.bitmaptexture;

        if (data.metalnesstexture)
            presetData.metalnesstexture = data.metalnesstexture;

        if (data.roughnesstexture)
            presetData.roughnesstexture = data.roughnesstexture;

        if (data.bumptexture)
            presetData.bumptexture = data.bumptexture;

        if (data.normaltexture)
            presetData.normaltexture = data.normaltexture;

        if (data.transparencytexture)
            presetData.transparencytexture = data.transparencytexture;

        // line material https://shapediver.atlassian.net/browse/SS-2272

        return presetData;
    }

    public async loadMaterialV3(data: IMaterialContentDataV3): Promise<MaterialStandardData> {
        const material = new MaterialStandardData();
        const promises: Promise<MapData | null>[] = [];
        // ambient is ignored

        if (data.color)
            material.color = this._converter.toColor(data.color);

        material.side = data.side === 'front' ? MATERIAL_SIDE.FRONT : data.side === 'back' ? MATERIAL_SIDE.BACK : MATERIAL_SIDE.DOUBLE;

        if (data.metalness || data.metalness === 0)
            material.metalness = data.metalness;

        if (data.roughness || data.roughness === 0)
            material.roughness = data.roughness;

        if (data.hasOwnProperty('transparency'))
            material.opacity = 1 - data.transparency!;

        if (data.alphaThreshold || data.alphaThreshold === 0)
            material.alphaCutoff = data.alphaThreshold;

        if (data.bumpAmplitude || data.bumpAmplitude === 0)
            material.bumpScale = data.bumpAmplitude;

        if (data.bitmaptexture) {
            promises.push(
                this.loadMapWithProperties(data.bitmaptexture).then(map => {
                    if (map) material.map = map;
                    return map;
                })
            )
        }

        if (data.metalnesstexture) {
            promises.push(
                this.loadMapWithProperties(data.metalnesstexture).then(map => {
                    if (map) material.metalnessMap = map;
                    return map;
                })
            )
        }

        if (data.roughnesstexture) {
            promises.push(
                this.loadMapWithProperties(data.roughnesstexture).then(map => {
                    if (map) material.roughnessMap = map;
                    return map;
                })
            )
        }

        if (data.bumptexture) {
            promises.push(
                this.loadMapWithProperties(data.bumptexture).then(map => {
                    if (map) material.bumpMap = map;
                    return map;
                })
            )
        }

        if (data.normaltexture) {
            promises.push(
                this.loadMapWithProperties(data.normaltexture).then(map => {
                    if (map) material.normalMap = map;
                    return map;
                })
            )
        }

        if (data.transparencytexture) {
            promises.push(
                this.loadMapWithProperties(data.transparencytexture).then(map => {
                    if (map) material.alphaMap = map;
                    return map;
                })
            )
        }

        // line material https://shapediver.atlassian.net/browse/SS-2272
        await Promise.all(promises);

        return material;
    }

    public loadPresetMaterialDefinition(preset: number): IMaterialContentDataV3 {
        const definition: IMaterialContentDataV3 = {};
        const idStrings = this.getClassAndSpecificId(preset);
        if (materialDatabase[idStrings.class] && materialDatabase[idStrings.class][idStrings.specific]) {
            this.assignSpecificDefinition(idStrings, materialDatabase[idStrings.class][idStrings.specific], definition);
            this.assignGeneralDefinition(idStrings, materialDatabase[idStrings.class].properties, materialDatabase[idStrings.class][idStrings.specific], definition);
        } else if (materialDatabase[idStrings.class] && materialDatabase[idStrings.class]['00']) {
            this.assignSpecificDefinition({ class: idStrings.class, specific: '00' }, materialDatabase[idStrings.class]['00'], definition);
            this.assignGeneralDefinition({ class: idStrings.class, specific: '00' }, materialDatabase[idStrings.class].properties, materialDatabase[idStrings.class]['00'], definition);
        } else {
            this.assignSpecificDefinition({ class: '00', specific: '00' }, materialDatabase['00']['00'], definition);
            this.assignGeneralDefinition({ class: '00', specific: '00' }, materialDatabase['00'].properties, materialDatabase['00']['00'], definition);
        }
        return definition;
    }

    public async loadPresetMaterial(preset: number): Promise<MaterialStandardData> {
        return this.loadMaterialV3(this.loadPresetMaterialDefinition(preset));
    }

    // #endregion Private Methods (9)
}