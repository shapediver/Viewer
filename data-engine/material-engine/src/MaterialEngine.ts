import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';

import { container, singleton } from 'tsyringe';
import httpClient from '@shapediver/viewer.utils.http-client';
import { ImageLoader } from '@shapediver/viewer.utils.image-loader';
import { MapData, MaterialData, SessionOutputContent, MATERIAL_SIDE, MATERIAL_ALPHA } from '@shapediver/viewer.shared.types';

singleton()
export class MaterialEngine {
    // #region Constructors (1)

    private _dataBase: any;
    private _imageLoader: ImageLoader;

    constructor() {
        this._imageLoader = container.resolve(ImageLoader);

        httpClient.get('https://viewer.shapediver.com/v2/materials/db.json').then((res) => { this._dataBase = res.data; });
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

        if (content.data && content.data.materialpreset) 
            await this.loadPresetMaterial(content.data.materialpreset, material);

        // can get
        // 1. preset
        // 2. definition
        // 3. from gltf def v1 -> very simple
        // 4. from gltf def v2
        return node;
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

    private async loadPresetMaterial(preset: number, material: MaterialData) {
        const idStrings = this.getClassAndSpecificID(preset);
        if (this._dataBase[idStrings.class] && this._dataBase[idStrings.class][idStrings.specific]) {
            await this.castDefinition(idStrings, this._dataBase[idStrings.class].properties, this._dataBase[idStrings.class][idStrings.specific], material);
        } else if (this._dataBase[idStrings.class]) {
            await this.castDefinition(idStrings, this._dataBase[idStrings.class].properties, this._dataBase[idStrings.class]['00'], material);
        }
    }

    private async loadMap(id: string, url: string): Promise<MapData> {
        const image = await this._imageLoader.load('https://viewer.shapediver.com/v2/materials/1024/' + id + '/' + url);
        return new MapData(image);        
    }

    private async castDefinition(id: { class: string, specific: string }, oldDefinitionProperties: any, oldDefinition: any, material: MaterialData) {
        if (oldDefinitionProperties.hasOwnProperty('transparencytexture')) material.alphaMap = await this.loadMap(id.class, oldDefinitionProperties.transparencytexture);
        if (oldDefinitionProperties.hasOwnProperty('alphaThreshold')) material.alphaCutoff = oldDefinitionProperties.alphaThreshold;
        if (oldDefinitionProperties.hasOwnProperty('bumptexture')) material.bumpMap = await this.loadMap(id.class, oldDefinitionProperties.bumptexture);
        if (oldDefinitionProperties.hasOwnProperty('bumpAmplitude')) material.bumpScale = oldDefinitionProperties.bumpAmplitude;
        // TODO
        if (oldDefinitionProperties.hasOwnProperty('color')) material.color = oldDefinitionProperties.color;
        if (oldDefinitionProperties.hasOwnProperty('bitmaptexture')) material.map = await this.loadMap(id.class, oldDefinitionProperties.bitmaptexture);
        if (oldDefinitionProperties.hasOwnProperty('metalness')) material.metalness = oldDefinitionProperties.metalness;
        if (oldDefinitionProperties.hasOwnProperty('metalnesstexture')) material.metalnessMap = await this.loadMap(id.class, oldDefinitionProperties.metalnesstexture);
        if (oldDefinitionProperties.hasOwnProperty('normaltexture')) material.normalMap = await this.loadMap(id.class, oldDefinitionProperties.normaltexture);
        if (oldDefinitionProperties.hasOwnProperty('transparency')) material.opacity = 1 - oldDefinitionProperties.transparency;
        if (oldDefinitionProperties.hasOwnProperty('roughness')) material.roughness = oldDefinitionProperties.roughness;
        if (oldDefinitionProperties.hasOwnProperty('roughnesstexture')) material.roughnessMap = await this.loadMap(id.class, oldDefinitionProperties.roughnesstexture);
        if (oldDefinitionProperties.hasOwnProperty('side')) material.side = oldDefinitionProperties.side === ('front' || 'back') ? oldDefinitionProperties.side : 'double';

        if (oldDefinition.hasOwnProperty('transparencytexture')) material.alphaMap = await this.loadMap(id.class + '/' + id.specific, oldDefinition.transparencytexture);
        if (oldDefinition.hasOwnProperty('alphaThreshold')) material.alphaCutoff = oldDefinition.alphaThreshold;
        if (oldDefinition.hasOwnProperty('bumptexture')) material.bumpMap = await this.loadMap(id.class + '/' + id.specific, oldDefinition.bumptexture);
        if (oldDefinition.hasOwnProperty('bumpAmplitude')) material.bumpScale = oldDefinition.bumpAmplitude;
        // TODO
        if (oldDefinition.hasOwnProperty('color')) material.color = oldDefinition.color;
        if (oldDefinition.hasOwnProperty('bitmaptexture')) material.map = await this.loadMap(id.class + '/' + id.specific, oldDefinition.bitmaptexture);
        if (oldDefinition.hasOwnProperty('metalness')) material.metalness = oldDefinition.metalness;
        if (oldDefinition.hasOwnProperty('metalnesstexture')) material.metalnessMap = await this.loadMap(id.class + '/' + id.specific, oldDefinition.metalnesstexture);
        if (oldDefinition.hasOwnProperty('normaltexture')) material.normalMap = await this.loadMap(id.class + '/' + id.specific, oldDefinition.normaltexture);
        if (oldDefinition.hasOwnProperty('transparency')) material.opacity = 1 - oldDefinition.transparency;
        if (oldDefinition.hasOwnProperty('roughness')) material.roughness = oldDefinition.roughness;
        if (oldDefinition.hasOwnProperty('roughnesstexture')) material.roughnessMap = await this.loadMap(id.class + '/' + id.specific, oldDefinition.roughnesstexture);
        if (oldDefinition.hasOwnProperty('side')) material.side = oldDefinition.side === ('front' || 'back') ? oldDefinition.side : 'double';
    }

    // #endregion Public Methods (1)
}