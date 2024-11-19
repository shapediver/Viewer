import { Color, GeometryData, InstanceData, MaterialStandardData } from '@shapediver/viewer.shared.types';
import { ITag3D } from '@shapediver/viewer.data-engine.shared-types';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2';
import { Logger, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services';
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine';
import { mat4, vec3 } from 'gl-matrix';

// #region Type aliases (1)

/**
 * The font info object contains the glb file path and the dimensions of the font.
 * 
 * There can either be a single glb file for both ascii and non-ascii characters or separate glb files for each.
 * The advantage of having separate glb files is that the ascii glb can be loaded once and the non-ascii glb can be loaded only when needed.
 */
export type FontInfo = {
    glb: string;
    height: number;
    width: number;
} | {
    glb: {
        ascii: string;
        other: string;
    },
    height: number;
    width: number;
};

// #endregion Type aliases (1)

// #region Classes (1)

export class Tag3dEngine {
    // #region Properties (6)

    private readonly _logger: Logger = Logger.instance;

    private static _asciiGlb: ITreeNode | undefined;
    private static _fontInfo: FontInfo = {
        glb: {
            ascii: 'https://viewer.shapediver.com/v3/gltf/tag3dASCII.glb',
            other: 'https://viewer.shapediver.com/v3/gltf/tag3dNonASCII.glb'
        },
        height: 1467,
        width: 833
    };
    private static _instance: Tag3dEngine;
    private static _mainGlb: ITreeNode | undefined;
    private static _nonAsciiGlb: ITreeNode | undefined;

    // #endregion Properties (6)

    // #region Public Static Getters And Setters (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Getters And Setters (1)

    // #region Public Static Methods (1)

    public static setFontInfo(fontInfo: FontInfo) {
        this._fontInfo = fontInfo;
        this._mainGlb = undefined;
        this._asciiGlb = undefined;
        this._nonAsciiGlb = undefined;
    }

    // #endregion Public Static Methods (1)

    // #region Public Methods (1)

    /**
     * Load the tag3d content into a scene graph node.
     * 
     * @param content the tag3d content
     * @returns the scene graph node 
     */
    public async loadContent(content: ShapeDiverResponseOutputContent): Promise<ITreeNode> {
        const node = new TreeNode('tag3d');

        if (!content)
            throw new ShapeDiverViewerDataProcessingError('Tag3dEngine.loadContent: Invalid content was provided to tag3d engine.');

        if (typeof Tag3dEngine._fontInfo.glb === 'string') {
            // if there is a single glb for both ascii and non-ascii characters defined
            // but the glb has not been loaded yet, we load it now
            if (!Tag3dEngine._mainGlb) {
                const geometryEngine = GeometryEngine.instance;
                Tag3dEngine._mainGlb = await geometryEngine.loadContent({
                    href: Tag3dEngine._fontInfo.glb,
                    format: 'glb'
                }, 'Tag3dEngine.loadContent');
            }
        } else {
            // if there are separate glbs for ascii and non-ascii characters defined
            // but the glb for ascii has not been loaded yet, we load it now
            // the glb for non-ascii characters is loaded when the character is encountered
            if (!Tag3dEngine._asciiGlb) {
                const geometryEngine = GeometryEngine.instance;
                Tag3dEngine._asciiGlb = await geometryEngine.loadContent({
                    href: Tag3dEngine._fontInfo.glb.ascii,
                    format: 'glb'
                }, 'Tag3dEngine.loadContent');
            }
        }

        if (content.data && Array.isArray(content.data)) {
            const textTagDictionary: {
                [key: string]: {
                    characterNode: ITreeNode,
                    transformations: mat4[],
                    colors: Color[]
                }
            } = {};

            const dictionaryPromises: Promise<{
                [key: string]: {
                    characterNode: ITreeNode,
                    transformations: mat4[],
                    colors: Color[]
                }
            } | undefined>[] = [];
            for (let i = 0; i < content.data.length; i++) {
                const tag3dInfo: ITag3D = content.data[i];
                const dictionary = this.loadTag(tag3dInfo);
                if (dictionary) dictionaryPromises.push(dictionary);
            }

            await Promise.all(dictionaryPromises).then((dictionaries) => {
                for (const dictionary of dictionaries) {
                    for (const key in dictionary) {
                        if (textTagDictionary[key] === undefined) {
                            textTagDictionary[key] = dictionary[key];
                        } else {
                            textTagDictionary[key].transformations.push(...dictionary[key].transformations);
                            textTagDictionary[key].colors.push(...dictionary[key].colors);
                        }
                    }
                }
            });

            const tag3dNode = new TreeNode('tag3dDictionary');
            for (const key in textTagDictionary) {
                const { characterNode, transformations, colors } = textTagDictionary[key];
                const meshNode = new TreeNode('mesh_' + key);
                meshNode.addChild(characterNode);

                if (transformations.length === 1) {
                    // there is only once instance of the character
                    // we add it as usual
                    meshNode.addTransformation({
                        id: 'tag3d_transformation',
                        matrix: transformations[0]
                    });

                    const material = new MaterialStandardData({ color: colors[0], metalness: 0, roughness: 1 });
                    // apply the color to the material
                    // if we do that before, the color will be applied to all instances and will be multiplied
                    // with the color of the instance
                    characterNode.traverseData((data) => {
                        if (data instanceof GeometryData)
                            data.material = material;
                    });
                } else {
                    // there are multiple instances of the character
                    // we therefore create an instance matrices data object
                    const instanceData = new InstanceData(transformations, colors);
                    meshNode.addData(instanceData);
                }
                tag3dNode.addChild(meshNode);
            }
            node.addChild(tag3dNode);
        } else {
            throw new ShapeDiverViewerDataProcessingError('Tag3dEngine.loadContent: No tag3d data was provided to tag3d engine.');
        }
        return node;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    /**
     * Load the tag 3d content into separate characters.
     * For each character, a node is created and the character is added as a geometry data object.
     * The nodes are then added to a dictionary with the character as the key.
     * 
     * Instance matrices are provided depending on the number of instances of the character.
     * 
     * @param tag3dInfo 
     * @returns 
     */
    private async loadTag(tag3dInfo: ITag3D): Promise<{
        [key: string]: {
            characterNode: ITreeNode,
            transformations: mat4[],
            colors: Color[]
        }
    } | undefined> {
        const characterGlb = Tag3dEngine._fontInfo.glb === 'string' ? Tag3dEngine._mainGlb! : Tag3dEngine._asciiGlb!;
        const material = new MaterialStandardData({ color: '#ffffff', metalness: 0, roughness: 1 });

        tag3dInfo.size = tag3dInfo.size ? +tag3dInfo.size : 1;
        if (tag3dInfo.text === undefined || tag3dInfo.text === '' || /^[ \t\n\r]*$/.test(tag3dInfo.text))
            return;

        // split into lines
        const lines = tag3dInfo.text.split(/\r\n|\r|\n/g);
        // split into characters per line
        const charactersPerLine = lines.map(line => line.split(''));

        const characterWidth = Tag3dEngine._fontInfo.width / 1000;
        const characterHeight = (Tag3dEngine._fontInfo.height / 1000) * 1.25;

        let maxLineWidth = 0;
        const maxLineHeight = characterHeight * charactersPerLine.length;
        let lineHeight = -characterHeight;

        const characterDictionary: {
            [key: string]: {
                characterNode: ITreeNode,
                transformations: mat4[],
                colors: Color[]
            }
        } = {};

        for (let i = 0; i < charactersPerLine.length; ++i) {
            const characters = charactersPerLine[i];
            if (characters.length === 0) continue;

            let lineWidth = 0;
            // loop through characters in line
            for (let j = 0; j < characters.length; ++j) {
                const char = characters[j];

                let nodesWithName = characterGlb.getNodesByName(char);
                if (nodesWithName.length === 0) {
                    if (typeof Tag3dEngine._fontInfo.glb !== 'string') {
                        // if the character is not found in the ascii glb, try to load the non-ascii glb
                        // and search for the character there
                        if (!Tag3dEngine._nonAsciiGlb) {
                            const geometryEngine = GeometryEngine.instance;
                            Tag3dEngine._nonAsciiGlb = await geometryEngine.loadContent({
                                href: Tag3dEngine._fontInfo.glb.other,
                                format: 'glb'
                            }, 'Tag3dEngine.loadContent');
                        }

                        nodesWithName = Tag3dEngine._nonAsciiGlb.getNodesByName(char);
                    }
                }

                if (nodesWithName.length !== 0) {
                    const transformationMatrix = mat4.fromTranslation(mat4.create(), vec3.fromValues(lineWidth, lineHeight, 0));

                    if (characterDictionary[char] === undefined) {
                        // if the character does not exist yet, create it
                        const characterNode = new TreeNode(char);
                        nodesWithName.forEach(n => {
                            n.traverseData((data) => {
                                if (data instanceof GeometryData) {
                                    const clone = data.clone();
                                    clone.material = material;
                                    characterNode.addData(clone);
                                }
                            });
                        });

                        characterDictionary[char] = {
                            characterNode,
                            transformations: [transformationMatrix],
                            colors: [tag3dInfo.color]
                        };
                    } else {
                        // if the character already exists, add the transformation matrix to the list
                        characterDictionary[char].transformations.push(transformationMatrix);
                        characterDictionary[char].colors.push(tag3dInfo.color);
                    }
                } else {
                    if(char !== ' ')
                        this._logger.warn(`Tag3dEngine.loadContent: Character ${char} not found in font.`);
                }

                lineWidth += characterWidth * tag3dInfo.size;
            }

            maxLineWidth = Math.max(maxLineWidth, lineWidth);
            lineHeight -= characterHeight * tag3dInfo.size;
        }

        const tagJustTranslation = vec3.create();

        switch ((tag3dInfo.justification as string)) {
            case 'TL':
                break;
            case 'TC':
                tagJustTranslation[0] = -maxLineWidth * 0.5;
                break;
            case 'TR':
                tagJustTranslation[0] = -maxLineWidth;
                break;
            case 'ML':
                tagJustTranslation[1] = maxLineHeight * 0.5;
                break;
            case 'MC':
                tagJustTranslation[0] = -maxLineWidth * 0.5;
                tagJustTranslation[1] = maxLineHeight * 0.5;
                break;
            case 'MR':
                tagJustTranslation[0] = -maxLineWidth;
                tagJustTranslation[1] = maxLineHeight * 0.5;
                break;
            case 'BL':
                tagJustTranslation[1] = maxLineHeight;
                break;
            case 'BC':
                tagJustTranslation[0] = -maxLineWidth * 0.5;
                tagJustTranslation[1] = maxLineHeight;
                break;
            case 'BR':
                tagJustTranslation[0] = -maxLineWidth;
                tagJustTranslation[1] = maxLineHeight;
                break;
        }

        const tagJustTranslationMatrix = mat4.fromTranslation(mat4.create(), tagJustTranslation);
        const scalingMatrix = mat4.fromScaling(mat4.create(), vec3.fromValues(tag3dInfo.size, tag3dInfo.size, tag3dInfo.size));
        const rotationMatrix = mat4.create();
        const translationMatrix = mat4.create();

        if (tag3dInfo.location.xAxis !== undefined) {
            mat4.set(rotationMatrix,
                tag3dInfo.location.xAxis.X, tag3dInfo.location.xAxis.Y, tag3dInfo.location.xAxis.Z, 0,
                tag3dInfo.location.yAxis.X, tag3dInfo.location.yAxis.Y, tag3dInfo.location.yAxis.Z, 0,
                tag3dInfo.location.normal.X, tag3dInfo.location.normal.Y, tag3dInfo.location.normal.Z, 0,
                0, 0, 0, 1
            );

            mat4.fromTranslation(translationMatrix, vec3.fromValues(tag3dInfo.location.origin.X, tag3dInfo.location.origin.Y, tag3dInfo.location.origin.Z));
        }

        // add the justifications to the characters
        Object.values(characterDictionary).forEach(character => {
            character.transformations.forEach(transformation => {
                // apply the justification translation
                mat4.multiply(transformation, transformation, tagJustTranslationMatrix);
                // apply the scaling matrix
                mat4.multiply(transformation, transformation, scalingMatrix);
                // apply the global rotation matrix
                mat4.multiply(transformation, rotationMatrix, transformation);
                // apply the global translation matrix
                mat4.multiply(transformation, translationMatrix, transformation);
            });
        });

        return characterDictionary;
    }

    // #endregion Private Methods (1)
}

// #endregion Classes (1)
