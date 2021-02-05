import * as BABYLON from 'babylonjs';

import { PrimitiveData } from '@shapediver/viewer.shared.types';

export class PrimitiveLoader {
    // #region Public Methods (1)

    public load(primitive: PrimitiveData): BABYLON.VertexData {
        let vertexData = new BABYLON.VertexData();

        for (let attributeId in primitive.attributes) {
            const bufferAttribute = primitive.attributes[attributeId];
            switch (attributeId) {
                case 'POSITION':
                    vertexData.positions = <any>bufferAttribute.array;
                    break;

                case 'NORMAL':
                    vertexData.normals = <any>bufferAttribute.array;
                    break;

                case 'TEXCOORD_0':
                case 'TEXCOORD0':
                case 'TEXCOORD':
                    vertexData.uvs = <any>bufferAttribute.array;
                    break;

                case 'TEXCOORD_1':
                    vertexData.uvs2 = <any>bufferAttribute.array;
                    break;

                case 'COLOR_0':
                case 'COLOR0':
                case 'COLOR':
                    vertexData.colors = <any>bufferAttribute.array;
                    break;

                case 'WEIGHT':
                    //geometry.setAttribute('skinWeight', buffer);
                    break;

                case 'JOINT':
                    //geometry.setAttribute('skinIndex', buffer);
                    break;

                default:
                // if (!primitive.material) break;
                // var material = json.materials[primitive.material];
                // if (!material.technique) break;
                // var parameters = json.techniques[material.technique].parameters || {};
                // for (var attributeName in parameters) {
                //     if (parameters[attributeName]['semantic'] === attributeId) {
                //         geometry.setAttribute(attributeName, bufferAttribute);
                //     }
                // }
            }

            if (primitive.indices)
                vertexData.indices = <any>primitive.indices.array;
        }
        return vertexData;
    }

    // #endregion Public Methods (1)
}