import { ITreeNode } from '@shapediver/viewer';
import { mat4 } from 'gl-matrix';

/**
 * Update the gumball transformation of a node.
 * 
 * If a transformation is provided, the gumball transformation is updated.
 * If no transformation is provided, the gumball transformation is removed.
 * 
 * @param node The node to update the gumball transformation of.
 * @param transformation The transformation to apply to the gumball.
 */
export const updateGumballTransformation = (node: ITreeNode, transformation?: mat4) => {
    if (transformation) {
        const transformIndex = node.transformations.findIndex(t => t.id === 'SD_gumball_matrix');
        if (transformIndex !== -1) {
            node.transformations[transformIndex].matrix = transformation;
            node.updateVersion();
        } else {
            node.transformations.push({
                id: 'SD_gumball_matrix',
                matrix: transformation
            });
            node.updateVersion();
        }
    } else {
        const transformIndex = node.transformations.findIndex(t => t.id === 'SD_gumball_matrix');
        if (transformIndex !== -1) {
            node.transformations.splice(transformIndex, 1);
            node.updateVersion();
        }
    }
};