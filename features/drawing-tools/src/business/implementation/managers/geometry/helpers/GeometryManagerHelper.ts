import * as THREE from 'three';
import { DrawingToolsManager, MATERIAL_INDEX } from '../../../DrawingToolsManager';
import { EventEngine, EVENTTYPE_DRAWING_TOOLS, ShapeDiverViewerDrawingToolsError } from '@shapediver/viewer.shared.services';
import { GeometryManager } from '../GeometryManager';
import { GeometryState } from '../GeometryState';
import { IViewportApi } from '@shapediver/viewer';
import { vec3 } from 'gl-matrix';

export class GeometryManagerHelper {
    // #region Properties (6)

    readonly #eventEngine = EventEngine.instance;
    readonly #geometryManager: GeometryManager;
    readonly #geometryState: GeometryState;
    readonly #viewport: IViewportApi;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, geometryManager: GeometryManager, geometryState: GeometryState) {
        this.#geometryManager = geometryManager;
        this.#geometryState = geometryState;
        this.#viewport = drawingToolsManager.viewport;
    }

    // #endregion Constructors (1)

    // #region Public Methods (5)

    public addPoint(insertionIndex: number, position?: vec3 | undefined, temporary = false): void {
        const positionArrayLength = this.#geometryState.positionArray.length / 3;
        const scaledIndex = insertionIndex * 3;
        if (insertionIndex < 0 || insertionIndex > positionArrayLength) {
            throw new ShapeDiverViewerDrawingToolsError('The insertion index is out of range. Please provide a valid index.');
        }

        const newPositionArray = new Float32Array(this.#geometryState.positionArray.length + 3);

        let p: vec3;
        if (position) {
            p = position;
        } else if (insertionIndex === 0) {
            p = [this.#geometryState.positionArray.at(scaledIndex + 0)!, this.#geometryState.positionArray.at(scaledIndex + 1)!, this.#geometryState.positionArray.at(scaledIndex + 2)!];
        } else if (insertionIndex === positionArrayLength) {
            p = [this.#geometryState.positionArray.at(scaledIndex - 3)!, this.#geometryState.positionArray.at(scaledIndex - 2)!, this.#geometryState.positionArray.at(scaledIndex - 1)!];
        } else {
            const p1 = vec3.fromValues(this.#geometryState.positionArray.at(scaledIndex + 0)!, this.#geometryState.positionArray.at(scaledIndex + 1)!, this.#geometryState.positionArray.at(scaledIndex + 2)!);
            const p2 = vec3.fromValues(this.#geometryState.positionArray.at(scaledIndex + 3)!, this.#geometryState.positionArray.at(scaledIndex + 4)!, this.#geometryState.positionArray.at(scaledIndex + 5)!);
            p = vec3.div(vec3.create(), vec3.add(vec3.create(), p2, p1), vec3.fromValues(2, 2, 2));
            // get neighboring point and calculate center
        }

        newPositionArray.set([...this.#geometryState.positionArray.slice(0, scaledIndex), ...p, ...this.#geometryState.positionArray.slice(scaledIndex, this.#geometryState.positionArray.length)]);

        // set the material index at that point to 0 and move the other indices back
        const materialIndexArray = this.#geometryState.materialIndexArray.slice(0, insertionIndex).concat([0], this.#geometryState.materialIndexArray.slice(insertionIndex, this.#geometryState.materialIndexArray.length - 1));
        this.#geometryState.updateMaterialIndexArray(materialIndexArray);
        this.#geometryState.updateData(newPositionArray, temporary);

        this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.ADDED, { viewportId: this.#viewport.id, drawingToolsId: this.#geometryManager.parentNode.id, temporary, index: insertionIndex });
    }

    public movePoint(index: number, point: vec3, temporary = false): void {
        const threeJsPointsGeometry: THREE.Points = this.#geometryState.geometryDataPoints.convertedObject[this.#viewport.id] as THREE.Points;
        threeJsPointsGeometry.geometry.attributes['position'].setXYZ(index, point[0], point[1], point[2]);
        threeJsPointsGeometry.geometry.attributes['position'].needsUpdate = true;

        if (this.#geometryState.geometryDataLines) {
            const threeJsLinesGeometry: THREE.LineSegments = this.#geometryState.geometryDataLines.convertedObject[this.#viewport.id] as THREE.LineSegments;
            threeJsLinesGeometry.geometry.attributes['position'].setXYZ(index, point[0], point[1], point[2]);
            threeJsLinesGeometry.geometry.attributes['position'].needsUpdate = true;
        }

        if (temporary === false) {
            // adjust position array
            const positionArray = new Float32Array(this.#geometryState.positionArray);
            positionArray.set([...positionArray.slice(0, index * 3), ...point, ...positionArray.slice(index * 3 + 3, positionArray.length)]);
            this.#geometryState.updateData(positionArray, temporary);
        }

        this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.MOVED, { viewportId: this.#viewport.id, drawingToolsId: this.#geometryManager.parentNode.id, temporary, index });
    }

    public removePoint(removalIndex: number, temporary = false): void {
        const positionArrayLength = this.#geometryState.positionArray.length / 3;
        if (removalIndex < 0 || removalIndex >= positionArrayLength) {
            throw new ShapeDiverViewerDrawingToolsError('The removal index is out of range. Please provide a valid index.');
        }

        /**
         * Adjust the position attribute
         * 
         * Logic:
         *  - remove :D
         */
        const newPositionArray = new Float32Array(this.#geometryState.positionArray.length - 3);
        if (removalIndex > 0 && removalIndex < positionArrayLength) {
            newPositionArray.set([...this.#geometryState.positionArray.slice(0, Math.max(removalIndex, 0) * 3), ...this.#geometryState.positionArray.slice(Math.min(removalIndex + 1, this.#geometryState.positionArray.length) * 3, this.#geometryState.positionArray.length)]);
        } else if (removalIndex === 0) {
            newPositionArray.set(this.#geometryState.positionArray.slice(3, this.#geometryState.positionArray.length));
        } else {
            newPositionArray.set(this.#geometryState.positionArray.slice(0, this.#geometryState.positionArray.length - 3));
        }

        // remove material index
        const materialIndexArray = this.#geometryState.materialIndexArray.slice(0, removalIndex).concat(this.#geometryState.materialIndexArray.slice(removalIndex + 1, this.#geometryState.materialIndexArray.length));
        materialIndexArray.push(0);
        this.#geometryState.updateMaterialIndexArray(materialIndexArray);
        this.#geometryState.updateData(newPositionArray, temporary);

        this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.REMOVED, { viewportId: this.#viewport.id, drawingToolsId: this.#geometryManager.parentNode.id, temporary, index: removalIndex });
    }

    public resetMaterialIndices(): void {
        this.#geometryState.updateMaterialIndexArray(new Array(this.#geometryState.materialIndexArray.length).fill(0));
    }

    public updateMaterialIndex(index: number, materialIndex: MATERIAL_INDEX): void {
        // change material index
        this.#geometryState.materialIndexArray[index] = materialIndex;
        this.#geometryState.updateMaterialIndexArray(this.#geometryState.materialIndexArray);
    }

    // #endregion Public Methods (5)
}