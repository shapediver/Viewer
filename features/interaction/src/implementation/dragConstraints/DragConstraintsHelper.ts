import { mat4, vec3 } from "gl-matrix";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { InteractionData } from "../InteractionData";

export const calculateDragMatrix =
    (
        node: ITreeNode,
        snapPoint: vec3,
        snapRotation: {
            axis: vec3,
            angle: number
        },
        dragOrigin: vec3,
        closestPoint: vec3
    ) => {
        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        if (data && data.dragAnchors.length > 0) {
            const results: {
                matrix: mat4,
                transformedPoint: vec3
            }[] = [];
            for (let i = 0; i < data.dragAnchors.length; i++) {
                const matrix = calculateMatrix(data.dragAnchors[i].position, data.dragAnchors[i].rotation || { axis: vec3.fromValues(0, 0, 1), angle: 0 }, snapPoint, snapRotation);
                const transformedPoint = vec3.transformMat4(vec3.create(), dragOrigin!, matrix);
                results.push({ matrix, transformedPoint })
            }
            results.sort((a, b) => vec3.distance(a.transformedPoint, closestPoint!) - vec3.distance(b.transformedPoint, closestPoint!));
            return results[0].matrix;
        } else {
            return calculateMatrix(dragOrigin, { axis: vec3.fromValues(0, 0, 1), angle: 0 }, snapPoint, snapRotation);
        }
    }

const calculateMatrix = (
    dragPoint: vec3,
    dragRotation: {
        axis: vec3,
        angle: number
    },
    snapPoint: vec3,
    snapRotation: {
        axis: vec3,
        angle: number
    }
) => {
    const rotationMatrix = mat4.create();

    // apply inverted anchor matrix
    const dragMatrix = mat4.fromRotation(mat4.create(), dragRotation.angle, dragRotation.axis);
    mat4.multiply(rotationMatrix, rotationMatrix, mat4.invert(mat4.create(), dragMatrix));

    // apply snap matrix
    const snapMatrix = mat4.fromRotation(mat4.create(), snapRotation.angle, snapRotation.axis);
    mat4.multiply(rotationMatrix, rotationMatrix, snapMatrix);

    // the dragAnchor in the rotated space
    const dragPointTransformed = vec3.transformMat4(vec3.create(), dragPoint, rotationMatrix)

    // distance between snap point and transformed anchor
    const dragTranslation = vec3.sub(vec3.create(), snapPoint, dragPointTransformed);

    // transformation of the difference
    vec3.transformMat4(dragTranslation, dragTranslation, mat4.invert(mat4.create(), rotationMatrix));
    const translationMatrix = mat4.fromTranslation(mat4.create(), dragTranslation);

    return mat4.multiply(mat4.create(), rotationMatrix, translationMatrix);
}
