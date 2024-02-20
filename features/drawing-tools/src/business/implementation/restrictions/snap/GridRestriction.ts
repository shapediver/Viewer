import THREE from 'three';
import { AbstractRestriction } from '../AbstractRestriction';
import { DrawingToolsManager } from '../../DrawingToolsManager';
import { ISnapRestriction } from '../../../interfaces/ISnapRestriction';
import { RestrictionType } from '../../../interfaces/IRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

/**
 * Properties for the grid restriction
 */
export type GridRestrictionProperties = {
    /**
     * Size of the grid
     */
    gridSize: number;
    /**
     * Size of the grid unit
     */
    gridUnit: number;
    /**
     * Origin of the grid
     */
    origin: vec3;
    /**
     * Normal of the grid
     */
    normal: vec3;
};

// #endregion Type aliases (1)

// #region Classes (1)

export class GridRestriction extends AbstractRestriction implements ISnapRestriction {
    // #region Properties (6)

    private _gridHelper?: THREE.GridHelper;
    private _gridSize: number = 100;
    private _gridUnit: number;
    private _normal: vec3;
    private _offset: vec3 = vec3.create();
    private _origin: vec3;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, properties: GridRestrictionProperties) {
        super(drawingToolsManager, id, RestrictionType.SNAP);
        this._normal = properties.normal;
        this._gridUnit = properties.gridUnit;
        this._origin = properties.origin;

        // calculate offset of grid size to origin
        this.calculateOffset();
        this.createGridVisualization();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (8)

    public get gridSize(): number {
        return this._gridSize;
    }

    public set gridSize(value: number) {
        this._gridSize = value;
        this.createGridVisualization();
    }

    public get gridUnit(): number {
        return this._gridUnit;
    }

    public set gridUnit(value: number) {
        this._gridUnit = value;
        this.calculateOffset();
        this.createGridVisualization();
    }

    public get normal(): vec3 {
        return this._normal;
    }

    public set normal(value: vec3) {
        this._normal = value;
        this.createGridVisualization();
    }

    public get origin(): vec3 {
        return this._origin;
    }

    public set origin(value: vec3) {
        this._origin = value;
        this.calculateOffset();
        this.createGridVisualization();
    }

    // #endregion Public Getters And Setters (8)

    // #region Public Methods (1)

    // public get
    public restrictPointPosition(point: vec3): vec3 {
        if (this.enabled === false) return point;

        const x = Math.round(point[0] / this._gridUnit) * this._gridUnit - this._offset[0];
        const y = Math.round(point[1] / this._gridUnit) * this._gridUnit - this._offset[1];
        const z = Math.round(point[2] / this._gridUnit) * this._gridUnit - this._offset[2];
        const gridPoint = vec3.fromValues(x, y, z);

        // // find the axis that is furthest from the plane in absolute value
        // const difference = vec3.sub(vec3.create(), point, gridPoint);
        // const absoluteDifference = vec3.fromValues(Math.abs(difference[0]), Math.abs(difference[1]), Math.abs(difference[2]));

        return gridPoint;

        // // if the difference is smaller than 20% of the grid size, return the grid point
        // if(vec3.length(absoluteDifference) < this._gridUnit * 0.20) return gridPoint;

        // // if all differences are between 40% and 60% of the grid size, return the center point
        // const xDifferenceBetween40And60 = absoluteDifference[0] > this._gridUnit * 0.4 && absoluteDifference[0] < this._gridUnit * 0.6;
        // const yDifferenceBetween40And60 = absoluteDifference[1] > this._gridUnit * 0.4 && absoluteDifference[1] < this._gridUnit * 0.6;
        // const zDifferenceBetween40And60 = absoluteDifference[2] > this._gridUnit * 0.4 && absoluteDifference[2] < this._gridUnit * 0.6;
        // if ( (xDifferenceBetween40And60 && yDifferenceBetween40And60 && this._axis === 'z')
        //     || (xDifferenceBetween40And60 && zDifferenceBetween40And60 && this._axis === 'y')
        //     || (yDifferenceBetween40And60 && zDifferenceBetween40And60 && this._axis === 'x')
        // )
        //     return vec3.fromValues(
        //         gridPoint[0] + Math.sign(difference[0]) * this._gridUnit * 0.5,
        //         gridPoint[1] + Math.sign(difference[1]) * this._gridUnit * 0.5,
        //         gridPoint[2] + Math.sign(difference[2]) * this._gridUnit * 0.5
        //     );

        // // otherwise return dismiss the largest difference, and return the point on the line

        // if(absoluteDifference[0] > absoluteDifference[1] && absoluteDifference[0] > absoluteDifference[2]) {
        //     // if the difference is between 40% and 60% of the grid size, return the center point on line
        //     if(xDifferenceBetween40And60)
        //         return vec3.fromValues(gridPoint[0] + Math.sign(difference[0]) * this._gridUnit * 0.5, gridPoint[1], gridPoint[2]);

        //     return vec3.fromValues(point[0], gridPoint[1], gridPoint[2]);
        // }

        // if(absoluteDifference[1] > absoluteDifference[0] && absoluteDifference[1] > absoluteDifference[2]) {
        //     // if the difference is between 40% and 60% of the grid size, return the center point on line
        //     if(yDifferenceBetween40And60)
        //         return vec3.fromValues(gridPoint[0], gridPoint[1] + Math.sign(difference[1]) * this._gridUnit * 0.5, gridPoint[2]);

        //     return vec3.fromValues(gridPoint[0], point[1], gridPoint[2]);
        // }

        // if(absoluteDifference[2] > absoluteDifference[0] && absoluteDifference[2] > absoluteDifference[1]) {
        //     // if the difference is between 40% and 60% of the grid size, return the center point on line
        //     if(zDifferenceBetween40And60)
        //         return vec3.fromValues(gridPoint[0], gridPoint[1], gridPoint[2] + Math.sign(difference[2]) * this._gridUnit * 0.5);

        //     return vec3.fromValues(gridPoint[0], gridPoint[1], point[2]);
        // }

        // return gridPoint;
    }

    // #endregion Public Methods (1)

    // #region Protected Methods (1)

    protected visibilityChanged(visible: boolean): void { }

    // #endregion Protected Methods (1)

    // #region Private Methods (2)

    private calculateOffset(): void {
        this._offset[0] = this._gridUnit * Math.round(this._origin[0] / this._gridUnit) - this._origin[0];
        this._offset[1] = this._gridUnit * Math.round(this._origin[1] / this._gridUnit) - this._origin[1];
        this._offset[2] = this._gridUnit * Math.round(this._origin[2] / this._gridUnit) - this._origin[2];
    }

    private createGridVisualization(): void {
        if (this._gridHelper) {
            this._object3D.remove(this._gridHelper);
            this._gridHelper.dispose();
        }

        this._gridHelper = new THREE.GridHelper(this._gridSize, this._gridSize / this._gridUnit, 0x666666, 0x222222);
        this._gridHelper.position.copy(new THREE.Vector3(this._origin[0], this._origin[1], this._origin[2]));

        this._gridHelper.renderOrder = -1;
        (this._gridHelper.material as THREE.LineBasicMaterial).depthTest = false;
        (this._gridHelper.material as THREE.LineBasicMaterial).transparent = true;

        // rotate grid helper to match axis
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(this._normal[0], this._normal[1], this._normal[2]));
        this._gridHelper.quaternion.copy(quaternion);

        this._object3D.add(this._gridHelper);
    }

    // #endregion Private Methods (2)
}

// #endregion Classes (1)
