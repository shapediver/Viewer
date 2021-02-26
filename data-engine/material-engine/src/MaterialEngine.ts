import { TreeNode } from '@shapediver/viewer.shared.node-tree';

import { container, singleton } from 'tsyringe';
import { HttpClient, ImageLoader } from '@shapediver/viewer.shared.utils';
import { MapData, MaterialData, SessionOutputContent, MATERIAL_SIDE, TEXTURE_WRAPPING, TEXTURE_FILTERING } from '@shapediver/viewer.shared.types';
import { vec2, vec3, vec4 } from 'gl-matrix';

interface IPresetMaterialDefinition {
    // #region Properties (13)

    alphaThreshold?: number;
    bitmaptexture?: string;
    bumpAmplitude?: number;
    bumptexture?: string;
    color?: number[];
    metalness?: number;
    metalnesstexture?: string;
    normaltexture?: string;
    roughness?: number;
    roughnesstexture?: string;
    side?: string;
    transparency?: number;
    transparencytexture?: string;

    // #endregion Properties (13)
}

interface ITexture {
    // #region Properties (13)

    href?: string,
    canvas?: any,
    offset?: number[],
    repeat?: number[],
    rotation?: number,
    center?: number[],
    color?: number[],
    wrapS?: number,
    wrapT?: number

    // #endregion Properties (13)
}

@singleton()
export class MaterialEngine {
    // #region Properties (2)

    private _dataBase: any;
    private readonly _httpClient = container.resolve(HttpClient);
    private readonly _imageLoader = container.resolve(ImageLoader);

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor() {
        this._httpClient.get('https://viewer.shapediver.com/v2/materials/db.json').then((res) => { this._dataBase = res.data; });
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Load the material content into a scene graph node.
     * 
     * @param content the material content
     * @returns the scene graph node 
     */
    public async loadContent(content: SessionOutputContent): Promise<TreeNode> {
        // TODO other formats
        const node = new TreeNode('material');

        const material = new MaterialData();
        node.data.push(material);

        if (content.data) {
            if (content.data.materialpreset) 
                await this.loadPresetMaterial(content.data.materialpreset, material);

            if (content.data.materialType && content.data.materialType !== 'standard') {
                // TODO gem material
            } else {
                if (content.data.version) {
                    if(content.data.version === '1.0')
                        await this.loadMaterialV1(content.data, material);
                    
                    if(content.data.version === '2.0')
                        await this.loadMaterialV2(content.data, material);
                    
                    if(content.data.version === '3.0')
                        await this.loadMaterialV3(content.data, material);
                }
            }
        }
        return node;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (8)

    private async assignGeneralDefinition(id: { class: string, specific: string }, generalDefinition: IPresetMaterialDefinition, specificDefinition: IPresetMaterialDefinition, material: MaterialData) {
        if (generalDefinition.transparencytexture && !specificDefinition.transparencytexture) material.alphaMap = await this.loadMap(generalDefinition.transparencytexture, id.class);
        if (generalDefinition.hasOwnProperty('alphaThreshold') && !specificDefinition.hasOwnProperty('alphaThreshold')) material.alphaCutoff = generalDefinition.alphaThreshold!;
        if (generalDefinition.bumptexture  && !specificDefinition.bumptexture) material.bumpMap = await this.loadMap(generalDefinition.bumptexture, id.class);
        if (generalDefinition.hasOwnProperty('bumpAmplitude') && !specificDefinition.hasOwnProperty('bumpAmplitude')) material.bumpScale = generalDefinition.bumpAmplitude!;
        if (generalDefinition.color  && !specificDefinition.color) material.color = vec4.fromValues(generalDefinition.color[0], generalDefinition.color[1], generalDefinition.color[2], generalDefinition.color[3]);
        if (generalDefinition.bitmaptexture  && !specificDefinition.bitmaptexture) material.map = await this.loadMap(generalDefinition.bitmaptexture, id.class);
        if (generalDefinition.hasOwnProperty('metalness') && !specificDefinition.hasOwnProperty('metalness')) material.metalness = generalDefinition.metalness!;
        if (generalDefinition.metalnesstexture  && !specificDefinition.metalnesstexture) material.metalnessMap = await this.loadMap(generalDefinition.metalnesstexture, id.class);
        if (generalDefinition.normaltexture  && !specificDefinition.normaltexture) material.normalMap = await this.loadMap(generalDefinition.normaltexture, id.class);
        if (generalDefinition.hasOwnProperty('transparency') && !specificDefinition.hasOwnProperty('transparency')) material.opacity = 1 - generalDefinition.transparency!;
        if (generalDefinition.hasOwnProperty('roughness') && !specificDefinition.hasOwnProperty('roughness')) material.roughness = generalDefinition.roughness!;
        if (generalDefinition.roughnesstexture  && !specificDefinition.roughnesstexture) material.roughnessMap = await this.loadMap(generalDefinition.roughnesstexture, id.class);
        if (generalDefinition.side && !specificDefinition.side) material.side = generalDefinition.side === 'front' ? MATERIAL_SIDE.FRONT : generalDefinition.side === 'back' ? MATERIAL_SIDE.BACK : MATERIAL_SIDE.DOUBLE;
    }

    private async assignSpecificDefinition(id: { class: string, specific: string }, specificDefinition: IPresetMaterialDefinition, material: MaterialData) {
        if (specificDefinition.transparencytexture) material.alphaMap = await this.loadMap(specificDefinition.transparencytexture, id.class + '/' + id.specific);
        if (specificDefinition.hasOwnProperty('alphaThreshold')) material.alphaCutoff = specificDefinition.alphaThreshold!;
        if (specificDefinition.bumptexture) material.bumpMap = await this.loadMap(specificDefinition.bumptexture, id.class + '/' + id.specific);
        if (specificDefinition.hasOwnProperty('bumpAmplitude')) material.bumpScale = specificDefinition.bumpAmplitude!;
        if (specificDefinition.color) material.color = vec4.fromValues(specificDefinition.color[0], specificDefinition.color[1], specificDefinition.color[2], specificDefinition.color[3]);
        if (specificDefinition.bitmaptexture) material.map = await this.loadMap(specificDefinition.bitmaptexture, id.class + '/' + id.specific);
        if (specificDefinition.hasOwnProperty('metalness')) material.metalness = specificDefinition.metalness!;
        if (specificDefinition.metalnesstexture) material.metalnessMap = await this.loadMap(specificDefinition.metalnesstexture, id.class + '/' + id.specific);
        if (specificDefinition.normaltexture) material.normalMap = await this.loadMap(specificDefinition.normaltexture, id.class + '/' + id.specific);
        if (specificDefinition.hasOwnProperty('transparency')) material.opacity = 1 - specificDefinition.transparency!;
        if (specificDefinition.hasOwnProperty('roughness')) material.roughness = specificDefinition.roughness!;
        if (specificDefinition.roughnesstexture) material.roughnessMap = await this.loadMap(specificDefinition.roughnesstexture, id.class + '/' + id.specific);
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

    private async loadMap(url: string, id?: string): Promise<MapData> {
        let image: HTMLImageElement;
        if(!id) {
            image = await this._imageLoader.load(url);  
        } else {
            image = await this._imageLoader.load('https://viewer.shapediver.com/v2/materials/1024/' + id + '/' + url);
        }
        return new MapData(image);        
    }

    
    private async loadMapWithProperties(texture: ITexture): Promise<MapData> {
        let image: HTMLImageElement;
        // if(texture.href) {
            image = await this._imageLoader.load(texture.href!);  
        // } else {
        //     image = await this._imageLoader.load();  
        //     // TODO canvas
        // }

        const wrapS = texture.wrapS === 1 ? TEXTURE_WRAPPING.CLAMP_TO_EDGE : texture.wrapS === 2 ? TEXTURE_WRAPPING.MIRRORED_REPEAT : TEXTURE_WRAPPING.REPEAT;
        const wrapT = texture.wrapT === 1 ? TEXTURE_WRAPPING.CLAMP_TO_EDGE : texture.wrapT === 2 ? TEXTURE_WRAPPING.MIRRORED_REPEAT : TEXTURE_WRAPPING.REPEAT;
        const center = texture.center ? vec2.fromValues(texture.center[0], texture.center[1]) : vec2.fromValues(0,0);
        const color = texture.color ? vec4.fromValues(texture.color[0], texture.color[1], texture.color[2], texture.color[3]) : vec4.fromValues(1,1,1,1);
        const offset = texture.offset ? vec2.fromValues(texture.offset[0], texture.offset[1]) : vec2.fromValues(0,0);
        const repeat = texture.repeat ? vec2.fromValues(texture.repeat[0], texture.repeat[1]) : vec2.fromValues(1,1);

        return new MapData(image, wrapS, wrapT, TEXTURE_FILTERING.LINEAR_MIPMAP_LINEAR, TEXTURE_FILTERING.LINEAR, center, color, offset, repeat, texture.rotation || 0);        
    }

    private async loadMaterialV1(data: {
        ambient?: number[],
        diffuse?: number[],
        color?: number[],
        emission?: number[],
        specular?: number[],
        shine?: number,
        transparency?: number,
        bitmaptexture?: string,
        bumptexture?: string,
        transparencytexture?: string,
    }, material: MaterialData) {

        // ambient is ignored
        
        if(data.color) {
            material.color = vec4.fromValues(data.color[0], data.color[1], data.color[2], data.color[3]);
        } else if(data.diffuse) {
            material.color = vec4.fromValues(data.diffuse[0], data.diffuse[1], data.diffuse[2], data.diffuse[3]);
        }

        if(data.emission)
            material.emissiveness = vec3.fromValues(data.emission[0], data.emission[1], data.emission[2]);

        if(data.emission)
            material.emissiveness = vec3.fromValues(data.emission[0], data.emission[1], data.emission[2]);

        // specular is ignored

        if(data.shine) {
            material.metalness = Math.min(1, data.shine);
            material.roughness = 1 - (Math.min(1, data.shine));
        }

        material.opacity = data.hasOwnProperty('transparency') ? 1 - data.transparency! : 1;

        if(data.bitmaptexture)
            material.map = await this.loadMap(data.bitmaptexture);

        if(data.bumptexture)
            material.bumpMap = await this.loadMap(data.bumptexture);

        if(data.transparencytexture)
            material.alphaMap = await this.loadMap(data.transparencytexture);
    }

    private async loadMaterialV2(data: {
        color?: number[],
        side?: string,
        metalness?: number,
        roughness?: number,
        transparency?: number,
        alphaThreshold?: number,
        bitmaptexture?: string,
        metalnesstexture?: string,
        roughnesstexture?: string,
        bumptexture?: string,
        normaltexture?: string,
        transparencytexture?: string,
        line?: any
    }, material: MaterialData) {

        // ambient is ignored
        
        if(data.color) 
            material.color = vec4.fromValues(data.color[0], data.color[1], data.color[2], data.color[3]);

        material.side = data.side === 'front' ? MATERIAL_SIDE.FRONT : data.side === 'back' ? MATERIAL_SIDE.BACK : MATERIAL_SIDE.DOUBLE;

        if(data.metalness)
            material.metalness = data.metalness;

        if(data.roughness)
            material.roughness = data.roughness;

        material.opacity = data.hasOwnProperty('transparency') ? 1 - data.transparency! : 1;
        
        if(data.alphaThreshold)
            material.alphaCutoff = data.alphaThreshold;

        if(data.bitmaptexture)
            material.map = await this.loadMap(data.bitmaptexture);

        if(data.metalnesstexture)
            material.metalnessMap = await this.loadMap(data.metalnesstexture);

        if(data.roughnesstexture)
            material.roughnessMap = await this.loadMap(data.roughnesstexture);

        if(data.bumptexture)
            material.bumpMap = await this.loadMap(data.bumptexture);
 
        if(data.normaltexture)
            material.normalMap = await this.loadMap(data.normaltexture);

        if(data.transparencytexture)
            material.alphaMap = await this.loadMap(data.transparencytexture);

        // TODO line material
    }

 
    private async loadMaterialV3(data: {
        color?: number[],
        side?: string,
        metalness?: number,
        roughness?: number,
        transparency?: number,
        alphaThreshold?: number,
        shadowOpacity?: number,
        lightReflectivity?: number,
        bumpAmplitude?: number,
        threeDNoise?: any
        bitmaptexture?: ITexture,
        metalnesstexture?: ITexture,
        roughnesstexture?: ITexture,
        bumptexture?: ITexture,
        normaltexture?: ITexture,
        transparencytexture?: ITexture,
        line?: any
    }, material: MaterialData) {

        // ambient is ignored
        
        if(data.color) 
            material.color = vec4.fromValues(data.color[0], data.color[1], data.color[2], data.color[3]);

        material.side = data.side === 'front' ? MATERIAL_SIDE.FRONT : data.side === 'back' ? MATERIAL_SIDE.BACK : MATERIAL_SIDE.DOUBLE;

        if(data.metalness)
            material.metalness = data.metalness;

        if(data.roughness)
            material.roughness = data.roughness;

        material.opacity = data.hasOwnProperty('transparency') ? 1 - data.transparency! : 1;
        
        if(data.alphaThreshold)
            material.alphaCutoff = data.alphaThreshold;

        // TODO
        // if(data.shadowOpacity)
        //     material.shadowOpacity = data.shadowOpacity;

        // TODO
        // if(data.lightReflectivity)
        //     material.lightReflectivity = data.lightReflectivity;

        if(data.bumpAmplitude)
            material.bumpScale = data.bumpAmplitude;

        // TODO threeDNoise

        if(data.bitmaptexture)
            material.map = await this.loadMapWithProperties(data.bitmaptexture);

        if(data.metalnesstexture)
            material.metalnessMap = await this.loadMapWithProperties(data.metalnesstexture);

        if(data.roughnesstexture)
            material.roughnessMap = await this.loadMapWithProperties(data.roughnesstexture);

        if(data.bumptexture)
            material.bumpMap = await this.loadMapWithProperties(data.bumptexture);
 
        if(data.normaltexture)
            material.normalMap = await this.loadMapWithProperties(data.normaltexture);

        if(data.transparencytexture)
            material.alphaMap = await this.loadMapWithProperties(data.transparencytexture);

        // TODO line material
    }

    private async loadPresetMaterial(preset: number, material: MaterialData) {
        const idStrings = this.getClassAndSpecificID(preset);
        if (this._dataBase[idStrings.class] && this._dataBase[idStrings.class][idStrings.specific]) {
            await this.assignSpecificDefinition(idStrings, this._dataBase[idStrings.class][idStrings.specific], material);
            await this.assignGeneralDefinition(idStrings, this._dataBase[idStrings.class].properties, this._dataBase[idStrings.class][idStrings.specific], material);
        } else if (this._dataBase[idStrings.class]) {
            await this.assignSpecificDefinition(idStrings, this._dataBase[idStrings.class]['00'], material);
            await this.assignGeneralDefinition(idStrings, this._dataBase[idStrings.class].properties, this._dataBase[idStrings.class]['00'], material);
        }
    }

    // #endregion Private Methods (8)
}