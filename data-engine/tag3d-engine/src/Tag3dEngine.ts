import * as THREE from 'three'
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { HttpClient, Logger, LOGGING_TOPIC, Converter, StateEngine, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import { AttributeData, GeometryData, MaterialStandardData, PrimitiveData } from '@shapediver/viewer.shared.types'
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2'
import { ITag3D } from '@shapediver/viewer.data-engine.shared-types'
import { TextGeometry } from './three/geometries/TextGeometry'
import { Font } from './three/loaders/FontLoader';
import { font } from './font'

@singleton()
export class Tag3dEngine {
    // #region Properties (5)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    private _font!: Font;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor() {
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Load the tag3d content into a scene graph node.
     * 
     * @param content the tag3d content
     * @returns the scene graph node 
     */
    public async loadContent(content: ShapeDiverResponseOutputContent): Promise<ITreeNode> {
        if(!this._font) {
            this._font = new Font(font);
            this._stateEngine.fontLoaded.resolve(true);
        }

        const node = new TreeNode('tag3d');

        if(this._stateEngine.fontLoaded.resolved === false)
            await this._stateEngine.fontLoaded;

        if (!content) {
            const error = new ShapeDiverViewerDataProcessingError('Tag3dEngine.loadContent: Invalid content was provided to tag3d engine.');
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `Tag3dEngine.loadContent`, error);
        }

        if (content.data && Array.isArray(content.data)) {
            for (let i = 0; i < content.data.length; i++) {
                const tag3dInfo: ITag3D = content.data[i];
                tag3dInfo.size = tag3dInfo.size ? +tag3dInfo.size : 1;
                tag3dInfo.text = tag3dInfo.text || '';
                tag3dInfo.color = this._converter.toColor(tag3dInfo.color);

                const tagLines = tag3dInfo.text.split(/\r\n|\r|\n/g);
                let lineArray = [];

                for (let lineIndex = 0; lineIndex < tagLines.length; ++lineIndex) {
                    if(tagLines[lineIndex] === '') continue;
                    // create tag mesh object
                    let tag = new TextGeometry(tagLines[lineIndex], { size: tag3dInfo.size, height: tag3dInfo.size / 10, font: this._font });
                    lineArray.push(tag);
                }

                // create temporary object
                let parentObject = new THREE.Object3D();
                for (let line of lineArray) {
                    parentObject.add(new THREE.Mesh(line, new THREE.MeshPhongMaterial()));
                }

                // align lines
                let bb, extentsX, extentsY, lineHeight = 0;
                {
                    lineHeight = 0;
                    for (let child of parentObject.children) {
                        bb = new THREE.Box3().setFromObject(child);
                        extentsY = bb.max.y - bb.min.y;
                        lineHeight = Math.max(lineHeight, extentsY);
                    }
                }
                lineHeight *= 1.15;

                lineArray.forEach((line, i) => {
                    line.translate(0, (-i - 1) * lineHeight, 0);
                });

                // justification
                bb = new THREE.Box3().setFromObject(parentObject);

                extentsX = bb.max.x - bb.min.x;
                extentsY = bb.max.y - bb.min.y;
                var tagJustTranslation = new THREE.Vector3(0, 0, 0);

                switch (tag3dInfo.justification) {
                    case 'TL':
                        break;
                    case 'TC':
                        tagJustTranslation.x = -extentsX * 0.5;
                        break;
                    case 'TR':
                        tagJustTranslation.x = -extentsX;
                        break;
                    case 'ML':
                        tagJustTranslation.y = extentsY * 0.5;
                        break;
                    case 'MC':
                        tagJustTranslation.x = -extentsX * 0.5;
                        tagJustTranslation.y = extentsY * 0.5;
                        break;
                    case 'MR':
                        tagJustTranslation.x = -extentsX;
                        tagJustTranslation.y = extentsY * 0.5;
                        break;
                    case 'BL':
                        tagJustTranslation.y = extentsY;
                        break;
                    case 'BC':
                        tagJustTranslation.x = -extentsX * 0.5;
                        tagJustTranslation.y = extentsY;
                        break;
                    case 'BR':
                        tagJustTranslation.x = -extentsX;
                        tagJustTranslation.y = extentsY;
                        break;
                }

                for (let line of lineArray) {
                    line.translate(tagJustTranslation.x, tagJustTranslation.y, tagJustTranslation.z);
                }

                // rotation
                if (tag3dInfo.location.hasOwnProperty('xAxis')) {
                    var rotMatrix = new THREE.Matrix4();
                    rotMatrix.set(tag3dInfo.location.xAxis.X, tag3dInfo.location.yAxis.X, tag3dInfo.location.normal.X, 0, tag3dInfo.location.xAxis.Y, tag3dInfo.location.yAxis.Y, tag3dInfo.location.normal.Y, 0, tag3dInfo.location.xAxis.Z, tag3dInfo.location.yAxis.Z, tag3dInfo.location.normal.Z, 0, 0, 0, 0, 1);
                    for (let line of lineArray) {
                        line.applyMatrix4(rotMatrix);
                        line.translate(tag3dInfo.location.origin.X, tag3dInfo.location.origin.Y, tag3dInfo.location.origin.Z);
                    }
                }

                for (let line of lineArray) {
                    const attributes: {
                        [key: string]: AttributeData
                    } = {};
                    for (let attribute in line.attributes) {
                        let attributeName = attribute.toUpperCase();
                        if(/\d/.test(attributeName) && !attributeName.includes('_')) {
                            const index = attributeName.search(/\d/)
                            attributeName = attributeName.substring(0, index) + '_' + attributeName.substring(index, attributeName.length);
                        } else if(attributeName === 'TEXCOORD' || attributeName === 'COLOR' || attributeName === 'JOINTS' || attributeName === 'WEIGHTS') {
                            attributeName += '_0';
                        } else if (attributeName === 'UV') {
                            attributeName = 'TEXCOORD_0';
                        }
                        attributes[attributeName] = new AttributeData(<Float32Array>line.attributes[attribute].array, line.attributes[attribute].itemSize, 0, 0, 0, false, line.attributes[attribute].array.length / line.attributes[attribute].itemSize)
                    }
                    const child = new TreeNode('tag3d_'+line)
                    child.data.push(new GeometryData(new PrimitiveData(attributes, 4, null, new MaterialStandardData({color: tag3dInfo.color, metalness: 0, roughness: 1}))));
                    node.children.push(child);
                }   
            }
        } else {
            const error = new ShapeDiverViewerDataProcessingError('Tag3dEngine.loadContent: No tag3d data was provided to tag3d engine.');
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `Tag3dEngine.loadContent`, error);
        }
        return node;
    }

    // #endregion Public Methods (1)
}