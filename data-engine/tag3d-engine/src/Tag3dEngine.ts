import { TreeNode } from '@shapediver/viewer.shared.node-tree';
import * as THREE from 'three';
import { container, singleton } from 'tsyringe';
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.monitoring';
import { ShapeDiverResponseOutputPart } from '@shapediver/api.geometry-api-dto-v1';
import { Converter } from '@shapediver/viewer.shared.utils';
import { AttributeData, GeometryData, MaterialData, PrimitiveData } from '@shapediver/viewer.shared.types';

enum JUSTIFICATION {
    TOP_LEFT = 'TL',
    TOP_CENTER = 'TC',
    TOP_RIGHT = 'TR',
    MIDDLE_LEFT = 'ML',
    MIDDLE_CENTER = 'MC',
    MIDDLE_RIGHT = 'MR',
    BOTTOM_LEFT = 'BL',
    BOTTOM_CENTER = 'BC',
    BOTTOM_RIGHT = 'BR'
}

interface Tag3dDefinition {
    color: string,
    justification: JUSTIFICATION,
    location: {
        normal: { X: number, Y: number, Z: number },
        yAxis: { X: number, Y: number, Z: number },
        xAxis: { X: number, Y: number, Z: number },
        origin: { X: number, Y: number, Z: number }
    },
    size?: number,
    text?: string,
    version: string
}

@singleton()
export class Tag3dEngine {
    // #region Properties (2)

    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private _font!: THREE.Font;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor() {
        new THREE.FontLoader().load('https://viewer.shapediver.com/graphik_regular.typeface.json', r => this._font = r);
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Load the tag3d content into a scene graph node.
     * 
     * @param content the tag3d content
     * @returns the scene graph node 
     */
    public async loadContent(content: ShapeDiverResponseOutputPart): Promise<TreeNode> {
        const node = new TreeNode('tag3d');

        if (!content) {
            this._logger.error(LOGGINGTOPIC.DATAPROCESSING, 'Tag3dEngine.loadContent: Invalid content was provided to tag3d engine.', new Error());
            return node;
        }

        if (content.data && Array.isArray(content.data)) {
            for (let i = 0; i < content.data.length; i++) {
                const tag3dInfo: Tag3dDefinition = content.data[i];
                tag3dInfo.size = tag3dInfo.size ? +tag3dInfo.size : 1;
                tag3dInfo.text = tag3dInfo.text || '';
                tag3dInfo.color = this._converter.toColor(tag3dInfo.color);

                const tagLines = tag3dInfo.text.split(/\r\n|\r|\n/g);
                let lineArray = [];

                for (let lineIndex = 0; lineIndex < tagLines.length; ++lineIndex) {
                    // create tag mesh object
                    let tag = new THREE.TextBufferGeometry(tagLines[lineIndex], { size: tag3dInfo.size, height: tag3dInfo.size / 10, font: this._font });
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
                        attributes[attribute.toUpperCase()] = new AttributeData(<Float32Array>line.attributes[attribute].array, line.attributes[attribute].itemSize)
                    }
                    node.data.push(new GeometryData(new PrimitiveData(attributes, 4, null, new MaterialData({color: tag3dInfo.color}))));
                }   

            }
        } else {
            this._logger.error(LOGGINGTOPIC.DATAPROCESSING, 'Tag3dEngine.loadContent: No tag3d data was provided to tag3d engine.', new Error());
        }
        return node;
    }

    // #endregion Public Methods (1)
}