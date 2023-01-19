import { vec3, mat4 } from "gl-matrix";
import { Box, IEvent, IOutputApi } from "@shapediver/viewer";
import { IDragEvent } from "@shapediver/viewer.features.interaction";

// the BB of the current texture boundary
export let textureBoundaryBB: Box = new Box();
// the BB of the current ring boundary
export let ringBoundaryBB: Box = new Box();

/**
 * Update the BB of the texture boundary and the ring boundary 
 * according the the data of the outputs "texture_rectangle" and "boundary_rectangle", respectively.
 * 
 * @param outputs 
 */
 export const updateTextureDraggingData = (outputs: { [key: string]: IOutputApi }) => {
    const textureBoundary: number[][] = outputs["texture_rectangle"].content![0]
        .data;
    const textureBoundaryBBMin = vec3.fromValues(Infinity, 0, Infinity);
    const textureBoundaryBBMax = vec3.fromValues(-Infinity, 0, -Infinity);
    textureBoundary.forEach((p) => {
        if (p[0] < textureBoundaryBBMin[0]) textureBoundaryBBMin[0] = p[0];
        if (p[2] < textureBoundaryBBMin[2]) textureBoundaryBBMin[2] = p[2];
        if (p[0] > textureBoundaryBBMax[0]) textureBoundaryBBMax[0] = p[0];
        if (p[2] > textureBoundaryBBMax[2]) textureBoundaryBBMax[2] = p[2];
    });
    textureBoundaryBB = new Box(textureBoundaryBBMin, textureBoundaryBBMax);

    const ringBoundary: number[][] = outputs["boundary_rectangle"].content![0].data;
    const ringBoundaryBBMin = vec3.fromValues(Infinity, 0, Infinity);
    const ringBoundaryBBMax = vec3.fromValues(-Infinity, 0, -Infinity);
    ringBoundary.forEach((p) => {
        if (p[0] < ringBoundaryBBMin[0]) ringBoundaryBBMin[0] = p[0];
        if (p[2] < ringBoundaryBBMin[2]) ringBoundaryBBMin[2] = p[2];
        if (p[0] > ringBoundaryBBMax[0]) ringBoundaryBBMax[0] = p[0];
        if (p[2] > ringBoundaryBBMax[2]) ringBoundaryBBMax[2] = p[2];
    });
    ringBoundaryBB = new Box(ringBoundaryBBMin, ringBoundaryBBMax);
};

/**
 * A callback that is execture on DRAG_MOVE and DRAG_END events.
 * 
 * The current drag matrix is used to create an intermediate bounding box 
 * that is used to evaluate it the texture is still within the ring boundary.
 * 
 * If this is not the case, the matrix is adjusted and the texture node is being updated.
 * 
 * @param e 
 * @returns 
 */
export const texturePositionAdjustementCallback = (e: IEvent): vec3 => {
    const dragEvent = <IDragEvent>e;

    const dragTransformation = dragEvent.node.getTransformation('SD_drag_matrix')!;
    dragTransformation.matrix[13] = 0;

    const draggedTextureBoundaryBB = textureBoundaryBB
        .clone()
        .applyMatrix(dragTransformation.matrix);

    let changed = false;
    if (draggedTextureBoundaryBB.min[0] > ringBoundaryBB.min[0]) {
        changed = true;
        dragTransformation.matrix[12] = ringBoundaryBB.min[0] - textureBoundaryBB.min[0];
    }
    if (draggedTextureBoundaryBB.max[0] < ringBoundaryBB.max[0]) {
        changed = true;
        dragTransformation.matrix[12] = ringBoundaryBB.max[0] - textureBoundaryBB.max[0];
    }
    if (draggedTextureBoundaryBB.min[2] > ringBoundaryBB.min[2]) {
        changed = true;
        dragTransformation.matrix[14] = ringBoundaryBB.min[2] - textureBoundaryBB.min[2];
    }
    if (draggedTextureBoundaryBB.max[2] < ringBoundaryBB.max[2]) {
        changed = true;
        dragTransformation.matrix[14] = ringBoundaryBB.max[2] - textureBoundaryBB.max[2];
    }

    if (changed)
        dragEvent.node.updateVersion();

    
    const draggedCorrectedTextureBoundaryBB = textureBoundaryBB
        .clone()
        .applyMatrix(dragTransformation.matrix);

    return draggedCorrectedTextureBoundaryBB.boundingSphere.center;
}