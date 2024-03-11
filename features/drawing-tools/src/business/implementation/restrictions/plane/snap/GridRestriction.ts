import THREE from 'three';
import { AbstractRestriction } from '../../AbstractRestriction';
import { DrawingToolsManager } from '../../../DrawingToolsManager';
import { ISnapRestriction, SnapRestrictionProperties } from '../../../../interfaces/ISnapRestriction';
import { PlaneRestrictionProperties } from '../PlaneRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

/**
 * Properties for the grid restriction
 */
export type GridRestrictionProperties = {
    /**
     * Size of the grid unit
     */
    gridUnit: number;
} & SnapRestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class GridRestriction extends AbstractRestriction implements ISnapRestriction {
    // #region Properties (6)

    #active: boolean = false;
    #gridHelper?: THREE.GridHelper;
    #gridSize: number = 100;
    #gridUnit: number;
    #normal: vec3;
    #offset: vec3 = vec3.create();
    #origin: vec3;
    #priority: number = 0;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, properties: GridRestrictionProperties, planeProperties: PlaneRestrictionProperties) {
        super(drawingToolsManager, id);
        this.#normal = planeProperties.normal;
        this.#gridUnit = properties.gridUnit;
        this.#origin = planeProperties.origin || drawingToolsManager.customizationProperties.geometry.origin;
        this.#priority = properties.priority;

        // calculate offset of grid size to origin
        this.calculateOffset();
        this.createGridVisualization();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (8)

    public get active(): boolean {
        return this.#active;
    }

    public set active(value: boolean) {
        this.#active = value;
        if(this.#gridHelper) this.#gridHelper.visible = value;
    }

    public get gridUnit(): number {
        return this.#gridUnit;
    }

    public set gridUnit(value: number) {
        this.#gridUnit = value;
        this.calculateOffset();
        this.createGridVisualization();
    }

    public get priority(): number {
        return this.#priority;
    }

    public set priority(value: number) {
        this.#priority = value;
    }

    // #endregion Public Getters And Setters (8)

    // #region Public Methods (1)

    // public get
    public snap(point: vec3): vec3 | undefined {
        if (this.enabled === false) return;

        const x = Math.round(point[0] / this.#gridUnit) * this.#gridUnit - this.#offset[0];
        const y = Math.round(point[1] / this.#gridUnit) * this.#gridUnit - this.#offset[1];
        const z = Math.round(point[2] / this.#gridUnit) * this.#gridUnit - this.#offset[2];
        const gridPoint = vec3.fromValues(x, y, z);

        // // find the axis that is furthest from the plane in absolute value
        // const difference = vec3.sub(vec3.create(), point, gridPoint);
        // const absoluteDifference = vec3.fromValues(Math.abs(difference[0]), Math.abs(difference[1]), Math.abs(difference[2]));

        return gridPoint;

        // // if the difference is smaller than 20% of the grid size, return the grid point
        // if(vec3.length(absoluteDifference) < this.#gridUnit * 0.20) return gridPoint;

        // // if all differences are between 40% and 60% of the grid size, return the center point
        // const xDifferenceBetween40And60 = absoluteDifference[0] > this.#gridUnit * 0.4 && absoluteDifference[0] < this.#gridUnit * 0.6;
        // const yDifferenceBetween40And60 = absoluteDifference[1] > this.#gridUnit * 0.4 && absoluteDifference[1] < this.#gridUnit * 0.6;
        // const zDifferenceBetween40And60 = absoluteDifference[2] > this.#gridUnit * 0.4 && absoluteDifference[2] < this.#gridUnit * 0.6;
        // if ( (xDifferenceBetween40And60 && yDifferenceBetween40And60 && this.#axis === 'z')
        //     || (xDifferenceBetween40And60 && zDifferenceBetween40And60 && this.#axis === 'y')
        //     || (yDifferenceBetween40And60 && zDifferenceBetween40And60 && this.#axis === 'x')
        // )
        //     return vec3.fromValues(
        //         gridPoint[0] + Math.sign(difference[0]) * this.#gridUnit * 0.5,
        //         gridPoint[1] + Math.sign(difference[1]) * this.#gridUnit * 0.5,
        //         gridPoint[2] + Math.sign(difference[2]) * this.#gridUnit * 0.5
        //     );

        // // otherwise return dismiss the largest difference, and return the point on the line

        // if(absoluteDifference[0] > absoluteDifference[1] && absoluteDifference[0] > absoluteDifference[2]) {
        //     // if the difference is between 40% and 60% of the grid size, return the center point on line
        //     if(xDifferenceBetween40And60)
        //         return vec3.fromValues(gridPoint[0] + Math.sign(difference[0]) * this.#gridUnit * 0.5, gridPoint[1], gridPoint[2]);

        //     return vec3.fromValues(point[0], gridPoint[1], gridPoint[2]);
        // }

        // if(absoluteDifference[1] > absoluteDifference[0] && absoluteDifference[1] > absoluteDifference[2]) {
        //     // if the difference is between 40% and 60% of the grid size, return the center point on line
        //     if(yDifferenceBetween40And60)
        //         return vec3.fromValues(gridPoint[0], gridPoint[1] + Math.sign(difference[1]) * this.#gridUnit * 0.5, gridPoint[2]);

        //     return vec3.fromValues(gridPoint[0], point[1], gridPoint[2]);
        // }

        // if(absoluteDifference[2] > absoluteDifference[0] && absoluteDifference[2] > absoluteDifference[1]) {
        //     // if the difference is between 40% and 60% of the grid size, return the center point on line
        //     if(zDifferenceBetween40And60)
        //         return vec3.fromValues(gridPoint[0], gridPoint[1], gridPoint[2] + Math.sign(difference[2]) * this.#gridUnit * 0.5);

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
        this.#offset[0] = this.#gridUnit * Math.round(this.#origin[0] / this.#gridUnit) - this.#origin[0];
        this.#offset[1] = this.#gridUnit * Math.round(this.#origin[1] / this.#gridUnit) - this.#origin[1];
        this.#offset[2] = this.#gridUnit * Math.round(this.#origin[2] / this.#gridUnit) - this.#origin[2];
    }

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

    // #endregion Private Methods (2)
}

// #endregion Classes (1)
