import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { Converter, HttpClient, HttpResponse, Logger, LOGGINGTOPIC, ShapeDiverBackendError, ShapeDiverViewerDataProcessingError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
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

    private _loadData?: (img: string) => Promise<HttpResponse<any>> = this._httpClient.loadData.bind(this._httpClient);;
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
    public async loadContent(content: ShapeDiverResponseOutputContent): Promise<TreeNode> {
        const node = new TreeNode(content.name || 'material');
        if (!content) {
            const error = new ShapeDiverViewerDataProcessingError('MaterialEngine.loadContent: Invalid content was provided to material engine.');
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `MaterialEngine.loadContent`, error);
        }

        const material = new MaterialStandardData();
        node.data.push(material);

        if (content.data) {
            const data: IMaterialContentData = content.data;
            if (data.materialpreset)
                await this.loadPresetMaterial(data.materialpreset, material);

            if (data.materialType && data.materialType !== 'standard') {
                // gem material https://shapediver.atlassian.net/browse/SS-2514
            } else {
                if (data.version) {
                    if (data.version === '1.0') {
                        await this.loadMaterialV1(data, material);
                    } else if (data.version === '2.0') {
                        await this.loadMaterialV2(data, material);
                    } else if (data.version === '3.0') {
                        await this.loadMaterialV3(data, material);
                    } else {
                        const error = new ShapeDiverViewerDataProcessingError('MaterialEngine.loadContent: Material data version not supported.');
                        throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `MaterialEngine.loadContent`, error);
                    }
                }
            }
        } else {
            const error = new ShapeDiverViewerDataProcessingError('MaterialEngine.loadContent: No material data was provided to material engine.');
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `MaterialEngine.loadContent`, error);
        }
        return node;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (9)

    private async assignGeneralDefinition(id: { class: string, specific: string }, generalDefinition: IPresetMaterialDefinition, specificDefinition: IPresetMaterialDefinition, material: MaterialStandardData) {
        if (generalDefinition.transparencytexture && !specificDefinition.transparencytexture) {
            const map = await this.loadMap(generalDefinition.transparencytexture, id.class);
            if (map) material.alphaMap = map;
        }
        if (generalDefinition.hasOwnProperty('alphaThreshold') && !specificDefinition.hasOwnProperty('alphaThreshold')) material.alphaCutoff = generalDefinition.alphaThreshold!;
        if (generalDefinition.bumptexture && !specificDefinition.bumptexture) {
            const map = await this.loadMap(generalDefinition.bumptexture, id.class);
            if (map) material.bumpMap = map;
        }
        if (generalDefinition.hasOwnProperty('bumpAmplitude') && !specificDefinition.hasOwnProperty('bumpAmplitude')) material.bumpScale = generalDefinition.bumpAmplitude!;
        if (generalDefinition.color && !specificDefinition.color) material.color = this._converter.toColor(generalDefinition.color);
        if (generalDefinition.bitmaptexture && !specificDefinition.bitmaptexture) {
            const map = await this.loadMap(generalDefinition.bitmaptexture, id.class);
            if (map) material.map = map;
        }
        if (generalDefinition.hasOwnProperty('metalness') && !specificDefinition.hasOwnProperty('metalness')) material.metalness = generalDefinition.metalness!;
        if (generalDefinition.metalnesstexture && !specificDefinition.metalnesstexture) {
            const map = await this.loadMap(generalDefinition.metalnesstexture, id.class);
            if (map) material.metalnessMap = map;
        }
        if (generalDefinition.normaltexture && !specificDefinition.normaltexture) {
            const map = await this.loadMap(generalDefinition.normaltexture, id.class);
            if (map) material.normalMap = map;
        }
        if (generalDefinition.hasOwnProperty('transparency') && !specificDefinition.hasOwnProperty('transparency')) material.opacity = 1 - generalDefinition.transparency!;
        if (generalDefinition.hasOwnProperty('roughness') && !specificDefinition.hasOwnProperty('roughness')) material.roughness = generalDefinition.roughness!;
        if (generalDefinition.roughnesstexture && !specificDefinition.roughnesstexture) {
            const map = await this.loadMap(generalDefinition.roughnesstexture, id.class);
            if (map) material.roughnessMap = map;
        }
        if (generalDefinition.side && !specificDefinition.side) material.side = generalDefinition.side === 'front' ? MATERIAL_SIDE.FRONT : generalDefinition.side === 'back' ? MATERIAL_SIDE.BACK : MATERIAL_SIDE.DOUBLE;
    }

    private async assignSpecificDefinition(id: { class: string, specific: string }, specificDefinition: IPresetMaterialDefinition, material: MaterialStandardData) {
        if (specificDefinition.transparencytexture) {
            const map = await this.loadMap(specificDefinition.transparencytexture, id.class + '/' + id.specific);
            if (map) material.alphaMap = map;
        }
        if (specificDefinition.hasOwnProperty('alphaThreshold')) material.alphaCutoff = specificDefinition.alphaThreshold!;
        if (specificDefinition.bumptexture) {
            const map = await this.loadMap(specificDefinition.bumptexture, id.class + '/' + id.specific);
            if (map) material.bumpMap = map;
        }
        if (specificDefinition.hasOwnProperty('bumpAmplitude')) material.bumpScale = specificDefinition.bumpAmplitude!;
        if (specificDefinition.color) material.color = this._converter.toColor(specificDefinition.color);
        if (specificDefinition.bitmaptexture) {
            const map = await this.loadMap(specificDefinition.bitmaptexture, id.class + '/' + id.specific);
            if (map) material.map = map;
        }
        if (specificDefinition.hasOwnProperty('metalness')) material.metalness = specificDefinition.metalness!;
        if (specificDefinition.metalnesstexture) {
            const map = await this.loadMap(specificDefinition.metalnesstexture, id.class + '/' + id.specific);
            if (map) material.metalnessMap = map;
        }
        if (specificDefinition.normaltexture) {
            const map = await this.loadMap(specificDefinition.normaltexture, id.class + '/' + id.specific);
            if (map) material.normalMap = map;
        }
        if (specificDefinition.hasOwnProperty('transparency')) material.opacity = 1 - specificDefinition.transparency!;
        if (specificDefinition.hasOwnProperty('roughness')) material.roughness = specificDefinition.roughness!;
        if (specificDefinition.roughnesstexture) {
            const map = await this.loadMap(specificDefinition.roughnesstexture, id.class + '/' + id.specific);
            if (map) material.roughnessMap = map;
        }
        if (specificDefinition.side) material.side = specificDefinition.side === 'front' ? MATERIAL_SIDE.FRONT : specificDefinition.side === 'back' ? MATERIAL_SIDE.BACK : MATERIAL_SIDE.DOUBLE;
    }

    private getClassAndSpecificID(id: number): { class: string, specific: string } {
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
                image = <HTMLImageElement>await this._converter.responseToImage(await this._loadData!(url));
            } else {
                image = <HTMLImageElement>await this._converter.responseToImage(await this._loadData!('https://viewer.shapediver.com/v2/materials/1024/' + id + '/' + url));
            }
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `MaterialEngine.loadMap`, e);
        }
        return new MapData(image);
    }

    public async loadMapWithProperties(texture: ITexture): Promise<MapData | null> {
        let image: HTMLImageElement;
        try {
            image = <HTMLImageElement>await this._converter.responseToImage(await this._loadData!(texture.href!));
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `MaterialEngine.loadMapWithProperties`, e);
        }

        const wrapS = texture.wrapS === 1 ? TEXTURE_WRAPPING.CLAMP_TO_EDGE : texture.wrapS === 2 ? TEXTURE_WRAPPING.MIRRORED_REPEAT : TEXTURE_WRAPPING.REPEAT;
        const wrapT = texture.wrapT === 1 ? TEXTURE_WRAPPING.CLAMP_TO_EDGE : texture.wrapT === 2 ? TEXTURE_WRAPPING.MIRRORED_REPEAT : TEXTURE_WRAPPING.REPEAT;
        const center = texture.center ? vec2.fromValues(texture.center[0], texture.center[1]) : vec2.fromValues(0, 0);
        const color = texture.color ? vec4.fromValues(texture.color[0] / 255, texture.color[1] / 255, texture.color[2] / 255, texture.color[3] / 255) : vec4.fromValues(1, 1, 1, 1);
        const offset = texture.offset ? vec2.fromValues(texture.offset[0], texture.offset[1]) : vec2.fromValues(0, 0);
        const repeat = texture.repeat ? vec2.fromValues(texture.repeat[0], texture.repeat[1]) : vec2.fromValues(1, 1);

        return new MapData(image, wrapS, wrapT, TEXTURE_FILTERING.LINEAR_MIPMAP_LINEAR, TEXTURE_FILTERING.LINEAR, center, this._converter.toColor(color), offset, repeat, texture.rotation || 0);
    }

    public async loadMaterialV1(data: IMaterialContentDataV1, material: MaterialStandardData) {
        // ambient is ignored

        if (data.color) {
            material.color = this._converter.toColor(data.color);
        } else if (data.diffuse) {
            material.color = this._converter.toColor(data.diffuse);
        }

        if (data.emission)
            material.emissiveness = this._converter.toColor(data.emission);

        // specular is ignored

        if (data.shine || data.shine === 0) {
            material.metalness = Math.min(1, data.shine);
            material.roughness = 1 - (Math.min(1, data.shine));
        }

        if (data.hasOwnProperty('transparency'))
            material.opacity = 1 - data.transparency!;

        if (data.bitmaptexture) {
            const map = await this.loadMap(data.bitmaptexture);
            if (map) material.map = map;
        }

        if (data.bumptexture) {
            const map = await this.loadMap(data.bumptexture);
            if (map) material.bumpMap = map;
        }

        if (data.transparencytexture) {
            const map = await this.loadMap(data.transparencytexture);
            if (map) material.alphaMap = map;
        }
    }

    public async loadMaterialV2(data: IMaterialContentDataV2, material: MaterialStandardData) {
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

        if (data.bitmaptexture) {
            const map = await this.loadMap(data.bitmaptexture);
            if (map) material.map = map;
        }

        if (data.metalnesstexture) {
            const map = await this.loadMap(data.metalnesstexture);
            if (map) material.metalnessMap = map;
        }

        if (data.roughnesstexture) {
            const map = await this.loadMap(data.roughnesstexture);
            if (map) material.roughnessMap = map;
        }

        if (data.bumptexture) {
            const map = await this.loadMap(data.bumptexture);
            if (map) material.bumpMap = map;
        }

        if (data.normaltexture) {
            const map = await this.loadMap(data.normaltexture);
            if (map) material.normalMap = map;
        }

        if (data.transparencytexture) {
            const map = await this.loadMap(data.transparencytexture);
            if (map) material.alphaMap = map;
        }

        // line material https://shapediver.atlassian.net/browse/SS-2272
    }

    public async loadMaterialV3(data: IMaterialContentDataV3, material: MaterialStandardData) {
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
            const map = await this.loadMapWithProperties(data.bitmaptexture);
            if (map) material.map = map;
        }

        if (data.metalnesstexture) {
            const map = await this.loadMapWithProperties(data.metalnesstexture);
            if (map) material.metalnessMap = map;
        }

        if (data.roughnesstexture) {
            const map = await this.loadMapWithProperties(data.roughnesstexture);
            if (map) material.roughnessMap = map;
        }

        if (data.bumptexture) {
            const map = await this.loadMapWithProperties(data.bumptexture);
            if (map) material.bumpMap = map;
        }

        if (data.normaltexture) {
            const map = await this.loadMapWithProperties(data.normaltexture);
            if (map) material.normalMap = map;
        }

        if (data.transparencytexture) {
            const map = await this.loadMapWithProperties(data.transparencytexture);
            if (map) material.alphaMap = map;
        }

        // line material https://shapediver.atlassian.net/browse/SS-2272
    }

    public async loadPresetMaterial(preset: number, material: MaterialStandardData) {
        const idStrings = this.getClassAndSpecificID(preset);
        if (materialDatabase[idStrings.class] && materialDatabase[idStrings.class][idStrings.specific]) {
            await this.assignSpecificDefinition(idStrings, materialDatabase[idStrings.class][idStrings.specific], material);
            await this.assignGeneralDefinition(idStrings, materialDatabase[idStrings.class].properties, materialDatabase[idStrings.class][idStrings.specific], material);
        } else if (materialDatabase[idStrings.class] && materialDatabase[idStrings.class]['00']) {
            await this.assignSpecificDefinition({ class: idStrings.class, specific: '00' }, materialDatabase[idStrings.class]['00'], material);
            await this.assignGeneralDefinition({ class: idStrings.class, specific: '00' }, materialDatabase[idStrings.class].properties, materialDatabase[idStrings.class]['00'], material);
        } else {
            await this.assignSpecificDefinition({ class: '00', specific: '00' }, materialDatabase['00']['00'], material);
            await this.assignGeneralDefinition({ class: '00', specific: '00' }, materialDatabase['00'].properties, materialDatabase['00']['00'], material);
        }
    }

    // #endregion Private Methods (9)
}