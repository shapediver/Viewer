import { IDragAnchor } from '../../interfaces/IDragAnchor';
import { mat4, vec3 } from 'gl-matrix';

export const calculateDragMatrix =
    (
        snapPoint: vec3,
        snapRotation: {
            axis: vec3,
            angle: number
        },
        dragOrigin: vec3,
        dragAnchors: IDragAnchor[] = [],
        closestPoint: vec3
    ): {
        matrix: mat4,
        dragAnchor?: IDragAnchor,
        point: vec3
    } => {
        if (dragAnchors.length > 0) {
            const results: {
                matrix: mat4,
                point: vec3,
                dragAnchor: IDragAnchor
            }[] = [];
            for (let i = 0; i < dragAnchors.length; i++) {
                const matrix = calculateMatrix(dragAnchors[i].position, dragAnchors[i].rotation || { axis: vec3.fromValues(0, 0, 1), angle: 0 }, snapPoint, snapRotation);
                const point = vec3.transformMat4(vec3.create(), dragOrigin!, matrix);
                results.push({ matrix, point, dragAnchor: dragAnchors[i] });
            }
            results.sort((a, b) => vec3.distance(a.point, closestPoint!) - vec3.distance(b.point, closestPoint!));
            return results[0];
        } else {
            return {
                matrix: calculateMatrix(dragOrigin, { axis: vec3.fromValues(0, 0, 1), angle: 0 }, snapPoint, snapRotation),
                point: dragOrigin
            };
        }
    };

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

    let invertedDragMatrix = mat4.invert(mat4.create(), dragMatrix);
    if (!invertedDragMatrix)
        invertedDragMatrix = mat4.create();

    mat4.multiply(rotationMatrix, rotationMatrix, invertedDragMatrix);

    // apply snap matrix
    const snapMatrix = mat4.fromRotation(mat4.create(), snapRotation.angle, snapRotation.axis);
    mat4.multiply(rotationMatrix, rotationMatrix, snapMatrix);

    // the dragAnchor in the rotated space
    const dragPointTransformed = vec3.transformMat4(vec3.create(), dragPoint, rotationMatrix);

    // distance between snap point and transformed anchor
    const dragTranslation = vec3.sub(vec3.create(), snapPoint, dragPointTransformed);

    // transformation of the difference
    let invertedRotationMatrix = mat4.invert(mat4.create(), rotationMatrix);
    if (!invertedRotationMatrix)
        invertedRotationMatrix = mat4.create();

    vec3.transformMat4(dragTranslation, dragTranslation, invertedRotationMatrix);
    const translationMatrix = mat4.fromTranslation(mat4.create(), dragTranslation);

    return mat4.multiply(mat4.create(), rotationMatrix, translationMatrix);
};
