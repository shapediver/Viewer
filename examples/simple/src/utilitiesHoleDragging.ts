import { vec3, mat4, vec2 } from "gl-matrix";
import { Box, IBox, IEvent, IOutputApi } from "@shapediver/viewer";
import { IDragEvent } from "@shapediver/viewer.features.interaction";

// the BB of the current texture boundary
export let holeBoundaryBB: Box = new Box();
export let boundaryPoints: vec3[] = [];

let currentPosition: vec3 = vec3.create();
let currentPositionTransformed: vec3 = vec3.create();

/**
 * Update the BB of the hole_rectangle and gather the boundary_pnts
 * according the the data of the outputs "boundary_pnts" and "hole_rectangle", respectively.
 * 
 * @param outputs 
 */
 export const updateHoleDraggingData = (outputs: { [key: string]: IOutputApi }) => {
    const boundary: number[][] = outputs["boundary_pnts"].content![0]
        .data;

    boundaryPoints = [];
    for(let i = 0; i < boundary.length; i++)
        boundaryPoints.push(vec3.fromValues(boundary[i][0], boundary[i][1], boundary[i][2]));

    const holeBoundary: number[][] = outputs["hole_rectangle"].content![0].data;
    console.log(holeBoundary)
    const holeBoundaryBBMin = vec3.fromValues(Infinity, 0, Infinity);
    const holeBoundaryBBMax = vec3.fromValues(-Infinity, 0, -Infinity);
    holeBoundary.forEach((p) => {
        if (p[0] < holeBoundaryBBMin[0]) holeBoundaryBBMin[0] = p[0];
        if (p[2] < holeBoundaryBBMin[2]) holeBoundaryBBMin[2] = p[2];
        if (p[0] > holeBoundaryBBMax[0]) holeBoundaryBBMax[0] = p[0];
        if (p[2] > holeBoundaryBBMax[2]) holeBoundaryBBMax[2] = p[2];
    });
    holeBoundaryBB = new Box(holeBoundaryBBMin, holeBoundaryBBMax);

    currentPosition = vec3.create();
    currentPositionTransformed = vec3.create();
};

/**
 * Intersection between two lines
 * 
 * @param line1 
 * @param line2 
 * @returns 
 */
const lineIntersection = (line1: {start: vec3, end: vec3}, line2: {start: vec3, end: vec3}) => {
    let a = line1.start[0], b = line1.start[2], c = line1.end[0], d = line1.end[2];
    let p = line2.start[0], q = line2.start[2], r = line2.end[0], s = line2.end[2];

    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
      return false;
    } else {
      lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
      gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
      return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
  };

/**
 * Intersection between a line a polygon
 *
 * @param line
 * @param polygon
 * @returns
 */
const lineInPolygon = (line: {start: vec3, end: vec3}, polygon: vec3[]) => {
    for (let i = 0; i < polygon.length; i++) {
        let j = (i + 1) % polygon.length;
        if(lineIntersection(line, { start: polygon[i], end: polygon[j]})) return false;
    }
    return true;
}

/**
 * Check if a point is inside a polygon
 * 
 * @param point 
 * @param polygon 
 * @returns 
 */
const pointInPolygon = (point: vec3, polygon: vec3[]): boolean => {
    let x = point[0], y = point[2];

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][2];
        let xj = polygon[j][0], yj = polygon[j][2];

        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}
/**
 * A callback that is execture on DRAG_MOVE and DRAG_END events.
 * 
 * The current drag matrix is used to create an intermediate bounding box 
 * that is used to evaluate it the hole is still inside the polygon shape.
 * 
 * If this is not the case, the matrix is adjusted and the hole node is being updated.
 * 
 * @param e 
 * @returns 
 */
export const holePositionAdjustementCallback = (e: IEvent): vec3 => {
    const dragEvent = <IDragEvent>e;

    const dragTransformation = dragEvent.node.getTransformation('SD_drag_matrix')!;

    const draggedHoleBoundaryBB = holeBoundaryBB
        .clone()
        .applyMatrix(dragTransformation.matrix);
    
    // get the current center
    const center = draggedHoleBoundaryBB.boundingSphere.center;

    // create the four corner points of the rectangle
    const minMin = vec3.fromValues(draggedHoleBoundaryBB.min[0], 0, draggedHoleBoundaryBB.min[2]);
    const minMax = vec3.fromValues(draggedHoleBoundaryBB.min[0], 0, draggedHoleBoundaryBB.max[2]);
    const maxMax = vec3.fromValues(draggedHoleBoundaryBB.max[0], 0, draggedHoleBoundaryBB.max[2]);
    const maxMin = vec3.fromValues(draggedHoleBoundaryBB.max[0], 0, draggedHoleBoundaryBB.min[2]);

    // deterime if the points are even inside the polygon
    if (
        pointInPolygon(minMin, boundaryPoints) &&
        pointInPolygon(minMax, boundaryPoints) &&
        pointInPolygon(maxMin, boundaryPoints) &&
        pointInPolygon(maxMax, boundaryPoints)
    ) {
        // if all points are inside, check if the lines are
        if(
            lineInPolygon({start: minMin, end: minMax}, boundaryPoints) &&
            lineInPolygon({start: minMax, end: maxMax}, boundaryPoints) &&
            lineInPolygon({start: maxMax, end: maxMin}, boundaryPoints) &&
            lineInPolygon({start: maxMin, end: minMin}, boundaryPoints)
        ) {
            // save the position
            currentPosition = center;
            currentPositionTransformed = vec3.fromValues(dragTransformation.matrix[12], dragTransformation.matrix[13], dragTransformation.matrix[14]);
            return currentPosition;
        }
    }

    // if the rectangle is outside, reset to the last valid position
    dragTransformation.matrix[12] = currentPositionTransformed[0];
    dragTransformation.matrix[13] = 0;
    dragTransformation.matrix[14] = currentPositionTransformed[2];

    dragEvent.node.updateVersion();

    return currentPosition;
}