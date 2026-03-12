import {ITreeNode} from "@shapediver/viewer";

import {mat4} from "gl-matrix";

/**
 * Update the transform control matrix of a node.
 *
 * If a transformation is provided, the transform control matrix is updated.
 * If no transformation is provided, the transform control matrix is removed.
 *
 * @param node The node to update the transform control matrix of.
 * @param transformation The transformation to apply to the transform control matrix.
 */
export const updateTransformation = (
	node: ITreeNode,
	transformation?: mat4,
) => {
	if (transformation) {
		const transformIndex = node.transformations.findIndex(
			(t) => t.id === "SD_transformation_tools_matrix",
		);
		if (transformIndex !== -1) {
			node.transformations[transformIndex].matrix = transformation;
			node.updateVersion();
		} else {
			node.transformations.push({
				id: "SD_transformation_tools_matrix",
				matrix: transformation,
			});
			node.updateVersion();
		}
	} else {
		const transformIndex = node.transformations.findIndex(
			(t) => t.id === "SD_transformation_tools_matrix",
		);
		if (transformIndex !== -1) {
			node.transformations.splice(transformIndex, 1);
			node.updateVersion();
		}
	}
};
