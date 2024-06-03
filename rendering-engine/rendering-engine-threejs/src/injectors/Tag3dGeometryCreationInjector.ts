import * as THREE from 'three';
import {
    AttributeData,
    GeometryData,
    MaterialStandardData,
    PRIMITIVE_MODE,
    PrimitiveData
} from '@shapediver/viewer.shared.types';
import { Font } from '../three/loaders/FontLoader';
import { font } from '../three/font';
import { ITag3D } from '@shapediver/viewer.data-engine.shared-types';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { StateEngine } from '@shapediver/viewer.shared.services';
import { TextGeometry } from '../three/geometries/TextGeometry';

export class Tag3dGeometryCreationInjector {
    // #region Properties (2)

    readonly #stateEngine: StateEngine = StateEngine.instance;

    public _font!: Font;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor() {
        this._font = new Font(font);
        this.#stateEngine.fontLoaded.resolve(true);
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public convertTag3dToGeometry(tag3dInfo: ITag3D): ITreeNode | undefined {
        const node = new TreeNode('tag3d_' + tag3dInfo.version);

        tag3dInfo.size = tag3dInfo.size ? +tag3dInfo.size : 1;
        if (tag3dInfo.text === undefined || tag3dInfo.text === '' || /^[ \t\n\r]*$/.test(tag3dInfo.text))
            return;

        const tagLines = tag3dInfo.text.split(/\r\n|\r|\n/g);
        const lineArray = [];

        for (let lineIndex = 0; lineIndex < tagLines.length; ++lineIndex) {
            if (tagLines[lineIndex] === '') continue;
            // create tag mesh object
            const tag = new TextGeometry(tagLines[lineIndex], { size: tag3dInfo.size, height: tag3dInfo.size / 10, font: this._font });
            lineArray.push(tag);
        }

        // create temporary object
        const parentObject = new THREE.Object3D();
        for (const line of lineArray) {
            parentObject.add(new THREE.Mesh(line, new THREE.MeshPhongMaterial()));
        }

        // align lines
        let bb, tempExtentsY, lineHeight = 0;
        {
            lineHeight = 0;
            for (const child of parentObject.children) {
                bb = new THREE.Box3().setFromObject(child);
                tempExtentsY = bb.max.y - bb.min.y;
                lineHeight = Math.max(lineHeight, tempExtentsY);
            }
        }
        lineHeight *= 1.15;

        lineArray.forEach((line, i) => {
            line.translate(0, (-i - 1) * lineHeight, 0);
        });

        // justification
        bb = new THREE.Box3().setFromObject(parentObject);

        const extentsX = bb.max.x - bb.min.x;
        const extentsY = bb.max.y - bb.min.y;
        const tagJustTranslation = new THREE.Vector3(0, 0, 0);

        switch ((tag3dInfo.justification as string)) {
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

        for (const line of lineArray) {
            line.translate(tagJustTranslation.x, tagJustTranslation.y, tagJustTranslation.z);
        }

        // rotation
        if (tag3dInfo.location.xAxis !== undefined) {
            const rotMatrix = new THREE.Matrix4();
            rotMatrix.set(tag3dInfo.location.xAxis.X, tag3dInfo.location.yAxis.X, tag3dInfo.location.normal.X, 0, tag3dInfo.location.xAxis.Y, tag3dInfo.location.yAxis.Y, tag3dInfo.location.normal.Y, 0, tag3dInfo.location.xAxis.Z, tag3dInfo.location.yAxis.Z, tag3dInfo.location.normal.Z, 0, 0, 0, 0, 1);
            for (const line of lineArray) {
                line.applyMatrix4(rotMatrix);
                line.translate(tag3dInfo.location.origin.X, tag3dInfo.location.origin.Y, tag3dInfo.location.origin.Z);
            }
        }

        for (const line of lineArray) {
            const attributes: {
                [key: string]: AttributeData
            } = {};
            for (const attribute in line.attributes) {
                let attributeName = attribute.toUpperCase();
                if (/\d/.test(attributeName) && !attributeName.includes('_')) {
                    const index = attributeName.search(/\d/);
                    attributeName = attributeName.substring(0, index) + '_' + attributeName.substring(index, attributeName.length);
                } else if (attributeName === 'TEXCOORD' || attributeName === 'COLOR' || attributeName === 'JOINTS' || attributeName === 'WEIGHTS') {
                    attributeName += '_0';
                } else if (attributeName === 'UV') {
                    attributeName = 'TEXCOORD_0';
                }
                attributes[attributeName] = new AttributeData(<Float32Array>(<THREE.BufferAttribute>line.attributes[attribute]).array, line.attributes[attribute].itemSize, 0, 0, 0, false, (<Float32Array>(<THREE.BufferAttribute>line.attributes[attribute]).array).length / line.attributes[attribute].itemSize);
            }
            const child = new TreeNode('tag3d_' + line);
            child.data.push(new GeometryData(new PrimitiveData(attributes, null), PRIMITIVE_MODE.TRIANGLES, new MaterialStandardData({ color: tag3dInfo.color, metalness: 0, roughness: 1 })));
            node.children.push(child);
        }

        return node;
    }

    // #endregion Public Methods (1)
}