import THREE from 'three';
import { AbstractRestriction } from '../../AbstractRestriction';
import { DrawingToolsManager } from '../../../DrawingToolsManager';
import { ISnapRestriction, SnapRestrictionProperties } from '../../../../interfaces/ISnapRestriction';
import { PlaneRestrictionProperties } from '../PlaneRestriction';
import { vec3, mat4 } from 'gl-matrix';

// #region Type aliases (1)

/**
 * Properties for the grid restriction
 */
export type GridRestrictionProperties = {
    /**
     * Size of the grid unit
     */
    gridUnit?: number;
} & SnapRestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class GridRestriction extends AbstractRestriction implements ISnapRestriction {
    // #region Properties (10)

    #active: boolean = false;
    #gridHelper?: THREE.GridHelper;
    #gridSize: number = 100;
    #gridUnit: number;
    #normal: vec3;
    #origin: vec3;
    #priority: number = 0;
    #rotationMatrix: mat4 = mat4.create();
    #rotationMatrixInverse: mat4 = mat4.create();

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, planeProperties: PlaneRestrictionProperties, properties?: GridRestrictionProperties) {
        super(drawingToolsManager, id);
        this.#normal = planeProperties.normal || vec3.fromValues(0, 0, 1);
        this.#gridUnit = properties?.gridUnit || 1;
        this.#origin = planeProperties.origin || drawingToolsManager.settings.geometry.origin;
        this.#priority = properties?.priority || 0;

        this.#rotationMatrix = this.rotateToXYPlane();
        this.#rotationMatrixInverse = mat4.invert(mat4.create(), this.#rotationMatrix);

        // calculate offset of grid size to origin
        this.createGridVisualization();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (6)

    public get active(): boolean {
        return this.#active;
    }

    public set active(value: boolean) {
        this.#active = value;
        if (this.#gridHelper) this.#gridHelper.visible = value;
    }

    public get gridUnit(): number {
        return this.#gridUnit;
    }

    public set gridUnit(value: number) {
        this.#gridUnit = value;
        this.createGridVisualization();
    }

    public get priority(): number {
        return this.#priority;
    }

    public set priority(value: number) {
        this.#priority = value;
    }

    // #endregion Public Getters And Setters (6)

    // #region Public Methods (1)

    // public get
    public snap(point: vec3): vec3 | undefined {
        if (!this.enabled) return;

        /**
         * Idea: we rotate to the xy-plane, snap the point to the grid, and then rotate back to the original plane
         */

        // Apply the rotation to the point
        const rotatedPoint = vec3.transformMat4(vec3.create(), point, this.#rotationMatrix);

        // Calculate the offset of the rotated point from the rotated origin
        const offset = vec3.sub(vec3.create(), rotatedPoint, this.#origin);

        // Snap the offset to the grid
        const snappedOffset = vec3.fromValues(
            this.#gridUnit * Math.round(offset[0] / this.#gridUnit),
            this.#gridUnit * Math.round(offset[1] / this.#gridUnit),
            rotatedPoint[2] // No snapping in the Z direction
        );

        // Move the snapped point back to the original coordinate system
        const snappedPoint = vec3.add(vec3.create(), this.#origin, snappedOffset);
        const finalSnappedPoint = vec3.transformMat4(vec3.create(), snappedPoint, this.#rotationMatrixInverse);

        return finalSnappedPoint;
    }

    // #endregion Public Methods (1)

    // #region Protected Methods (1)

    protected visibilityChanged(visible: boolean): void { }

    // #endregion Protected Methods (1)

    // #region Private Methods (3)

    private createGridVisualization(): void {
        if (this.#gridHelper) {
            this.object3D.remove(this.#gridHelper);
            this.#gridHelper.dispose();
        }

        this.#gridHelper = new THREE.GridHelper(this.#gridSize, this.#gridSize / this.#gridUnit, 0x666666, 0x222222);
        this.#gridHelper.position.copy(new THREE.Vector3(this.#origin[0], this.#origin[1], this.#origin[2]));
        this.#gridHelper.visible = false;

        this.#gridHelper.renderOrder = -1;
        (this.#gridHelper.material as THREE.LineBasicMaterial).depthTest = false;
        (this.#gridHelper.material as THREE.LineBasicMaterial).transparent = true;

        // rotate grid helper to match axis
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(this.#normal[0], this.#normal[1], this.#normal[2]));
        this.#gridHelper.quaternion.copy(quaternion);

        this.object3D.add(this.#gridHelper);
    }

    private rotateToXYPlane(): mat4 {
        // Normalize the normal vector
        const normalizedNormal = vec3.normalize(vec3.create(), this.#normal);

        // Calculate the angle between the normal and the positive Z-axis
        const angle = Math.acos(normalizedNormal[2]);

        // Calculate the axis of rotation using the cross product with the Z-axis
        const axis = vec3.cross(vec3.create(), [0, 0, 1], normalizedNormal);
        const normalizedAxis = vec3.normalize(vec3.create(), axis);

        // Construct the rotation matrix
        const rotationMatrix = mat4.create();
        mat4.fromRotation(rotationMatrix, angle, normalizedAxis);

        return rotationMatrix;
    }

    // #endregion Private Methods (3)
}

// #endregion Classes (1)
