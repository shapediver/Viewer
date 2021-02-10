import * as THREE from 'three';

import { PrimitiveData } from '@shapediver/viewer.shared.types';

export class PrimitiveLoader {
    // #region Public Methods (1)

    public load(primitive: PrimitiveData): THREE.BufferGeometry {
        let geometry = new THREE.BufferGeometry();
        for (let attributeId in primitive.attributes) {
            const bufferAttribute = primitive.attributes[attributeId];
            let buffer: THREE.InterleavedBufferAttribute | THREE.BufferAttribute;

            if(bufferAttribute.hasOffset) {
                buffer = new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(bufferAttribute.array, bufferAttribute.stride!), bufferAttribute.itemSize, bufferAttribute.offset!);
            } else {
                buffer = new THREE.BufferAttribute(bufferAttribute.array, bufferAttribute.itemSize, bufferAttribute.normalized);
            }
            switch (attributeId) {
                case 'POSITION':
                    geometry.setAttribute('position', buffer);
                    break;

                case 'NORMAL':
                    geometry.setAttribute('normal', buffer);
                    break;

                case 'TEXCOORD_0':
                case 'TEXCOORD0':
                case 'TEXCOORD':
                    geometry.setAttribute('uv', buffer);
                    break;

                case 'TEXCOORD_1':
                    geometry.setAttribute('uv2', buffer);
                    break;

                case 'COLOR_0':
                case 'COLOR0':
                case 'COLOR':
                    geometry.setAttribute('color', buffer);
                    break;

                case 'WEIGHT':
                    geometry.setAttribute('skinWeight', buffer);
                    break;

                case 'JOINT':
                    geometry.setAttribute('skinIndex', buffer);
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
                geometry.setIndex(new THREE.BufferAttribute( primitive.indices.array, primitive.indices.itemSize ));
        }
        return geometry;
    }

    // #endregion Public Methods (1)
}