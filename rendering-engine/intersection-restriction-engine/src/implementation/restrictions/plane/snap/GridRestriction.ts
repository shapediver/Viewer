import * as THREE from 'three';
import { AbstractSnapRestriction } from '../../AbstractSnapRestriction';
import {
    Box,
    ITreeNode,
    IViewportApi,
    sceneTree
} from '@shapediver/viewer';
import { GeometryMathManager } from '../../../GeometryMathManager';
import { IRay } from '@shapediver/viewer.shared.types';
import {
    RestrictionMetaData,
    RestrictionResult
} from '../../../../interfaces/IRestriction';
import { ISnapRestriction, SnapRestrictionProperties } from '../../../../interfaces/ISnapRestriction';
import { PlaneRestriction } from '../PlaneRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

/**
 * Properties for the grid restriction
 */
export type GridRestrictionProperties = {
    /**
     * Size of the grid unit
     */
    gridUnit?: number;

    /**
     * If the grid unit is editable for change to the end user.
     * If it is not editable, the grid unit cannot be changed from the default value.
     */
    gridUnitEditable?: boolean;
} & SnapRestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class GridRestriction extends AbstractSnapRestriction implements ISnapRestriction {
    // #region Properties (9)

    readonly #activationKey: string;
    readonly #planeRestriction: PlaneRestriction;

    #active: boolean = false;
    #gridHelper?: THREE.GridHelper;
    #gridSize: number = 100;
    #gridUnit: number;
    #gridUnitEditable: boolean = true;
    #offsetFromUnit: vec3 = vec3.create();
    #priority: number = 0;

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, geometryMathManager: GeometryMathManager, parentNode: ITreeNode, planeRestriction: PlaneRestriction, properties?: GridRestrictionProperties) {
        super(viewport, parentNode, 'grid');

        this.#planeRestriction = planeRestriction;

        this.#activationKey = properties?.activationKey || 'g';
        this.enabled = properties?.enabled ?? false;
        this._enabledEditable = properties?.enabledEditable ?? true;
        this.#gridUnit = properties?.gridUnit || 1;
        this.#gridUnitEditable = properties?.gridUnitEditable ?? true;
        this.#priority = properties?.priority || 0;

        // create the offset of the grid size to origin
        this.createOffsetFromUnit();

        // calculate offset of grid size to origin
        this.createGridVisualization();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (8)

    public get active(): boolean {
        return this.#active;
    }

    public set active(value: boolean) {
        this.#active = value;

        if (this.#gridHelper) this.#gridHelper.visible = value;
    }

    public get enabledEditable(): boolean {
        return this._enabledEditable;
    }

    public get gridUnit(): number {
        return this.#gridUnit;
    }

    public set gridUnit(value: number) {
        if (this.#gridUnitEditable === false) return;

        this.#gridUnit = value;
        this.createOffsetFromUnit();
        this.createGridVisualization();
    }

    public get gridUnitEditable(): boolean {
        return this.#gridUnitEditable;
    }

    public get priority(): number {
        return this.#priority;
    }

    public set priority(value: number) {
        this.#priority = value;
    }

    // #endregion Public Getters And Setters (8)

    // #region Public Methods (2)

    // public get
    public snap(ray: IRay, point: vec3, distance: number, metaData: RestrictionMetaData): RestrictionResult | undefined {
        // if the restriction is not enabled OR the activation key is set and the key is not pressed, return
        if (this.enabled === false && !(metaData?.toggledKeys?.length === 1 && metaData?.toggledKeys[0] === this.#activationKey)) return;

        /**
         * Explanation of the following code:
         * 1. Calculate the projection of the origin onto the plane that is created by the point and the normal
         * 2. Move the grid helper to the projected origin
         */

        // vector from the point to the origin
        const v = vec3.sub(vec3.create(), this.#planeRestriction.origin, point);

        // dot product of the vector and the normal
        const dot = vec3.dot(v, this.#planeRestriction.normal);

        // projection of the origin onto the plane that is created by the point and the normal
        const projectedOrigin = vec3.sub(vec3.create(), this.#planeRestriction.origin, vec3.scale(vec3.create(), this.#planeRestriction.normal, dot));

        // we move the grid helper to the projected origin
        if (this.#gridHelper) {
            this.#gridHelper.position.copy(new THREE.Vector3(projectedOrigin[0], projectedOrigin[1], projectedOrigin[2]));
            this.#gridHelper.visible = false;
        }

        /**
         * Explanation of the following code:
         * 1. Rotate the point so that the normal of the plane is aligned with the Z axis (with previously calculated transformation matrix)
         * 2. Snap the point to the grid
         * 3. Rotate the point back to the original coordinate system (with previously calculated transformation matrix)
         */

        // Apply the transformation to the point
        const rotatedPoint = vec3.transformMat4(vec3.create(), point, this.#planeRestriction.transformationToXYPlaneMatrix);

        // Snap the offset to the grid
        const snappedOffset = vec3.create();
        snappedOffset[0] = Math.round(rotatedPoint[0] / this.#gridUnit) * this.#gridUnit - this.#offsetFromUnit[0];
        snappedOffset[1] = Math.round(rotatedPoint[1] / this.#gridUnit) * this.#gridUnit - this.#offsetFromUnit[1];
        snappedOffset[2] = rotatedPoint[2];

        // Move the snapped point back to the original coordinate system
        const snappedPoint = vec3.transformMat4(vec3.create(), snappedOffset, this.#planeRestriction.transformationFromXYPlaneMatrix);

        return { targetPoint: snappedPoint, closestIntersectionPoint: point, distanceOriginToClosestIntersectionPointSquared: distance, distanceClosestPointToTargetPointSquared: vec3.sqrDist(snappedPoint, point), restriction: this.#planeRestriction, snapRestriction: this };
    }

    public updatePlaneDefinition(): void {
        this.createOffsetFromUnit();
        this.createGridVisualization();
    }

    // #endregion Public Methods (2)

    // #region Protected Methods (1)

    protected visibilityChanged(visible: boolean): void {
        if (visible === false) {
            if (this.#gridHelper) {
                this.#gridHelper.visible = false;
            }
        }
    }

    // #endregion Protected Methods (1)

    // #region Private Methods (2)

    private createGridVisualization(): void {
        if (this.#gridHelper) {
            this._object3D.remove(this.#gridHelper);
            this.#gridHelper.dispose();
        }

        const bb = new Box();
        for (let i = 0; i < sceneTree.root.children.length; i++) {
            if ((sceneTree.root.children[i] as unknown as { sessionNode?: boolean }).sessionNode === true) {
                bb.union(sceneTree.root.children[i].boundingBox);
            }
        }

        const radius = bb.boundingSphere.radius;
        this.#gridSize = radius * 2;
        if (this.#gridSize === Infinity || this.#gridSize === -Infinity || isNaN(this.#gridSize) || this.#gridSize === 0)
            this.#gridSize = 100;

        // if the grid size is not divisible by the grid unit, we need to adjust the grid size
        let gridSize = this.#gridUnit * Math.ceil(this.#gridSize / this.#gridUnit);
        // if the number of divisions is odd, we need to add one more division
        if (gridSize / this.#gridUnit % 2 === 1)
            gridSize += this.#gridUnit;

        // todo  adjust grid size so that is divisible by grid unit
        this.#gridHelper = new THREE.GridHelper(gridSize, gridSize / this.#gridUnit, 0x666666, 0x222222);
        const adjustedOrigin = vec3.add(vec3.create(), this.#planeRestriction.origin, this.#offsetFromUnit);
        this.#gridHelper.position.copy(new THREE.Vector3(adjustedOrigin[0], adjustedOrigin[1], adjustedOrigin[2]));
        this.#gridHelper.visible = false;

        this.#gridHelper.renderOrder = 100;
        (this.#gridHelper.material as THREE.LineBasicMaterial).depthTest = false;
        (this.#gridHelper.material as THREE.LineBasicMaterial).transparent = true;

        // three.js uses a right-handed coordinate system, so we need to rotate the grid helper
        const rotationMatrix = new THREE.Matrix4().fromArray([
            this.#planeRestriction.vectorU[0], this.#planeRestriction.vectorU[1], this.#planeRestriction.vectorU[2], 0,
            this.#planeRestriction.vectorV[0], this.#planeRestriction.vectorV[1], this.#planeRestriction.vectorV[2], 0,
            this.#planeRestriction.normal[0], this.#planeRestriction.normal[1], this.#planeRestriction.normal[2], 0,
            0, 0, 0, 1
        ]);

        this.#gridHelper.rotation.setFromRotationMatrix(rotationMatrix);
        // three.js grid helper is created in the XY plane, so we need to rotate it by 90 degrees around the X axis
        this.#gridHelper.rotateX(Math.PI / 2);

        this._object3D.add(this.#gridHelper);
    }

    private createOffsetFromUnit(): void {
        // Calculate the offset of the rotated point from the rotated origin
        this.#offsetFromUnit[0] = this.#gridUnit * Math.round(this.#planeRestriction.origin[0] / this.#gridUnit) - this.#planeRestriction.origin[0];
        this.#offsetFromUnit[1] = this.#gridUnit * Math.round(this.#planeRestriction.origin[1] / this.#gridUnit) - this.#planeRestriction.origin[1];
        this.#offsetFromUnit[2] = this.#gridUnit * Math.round(this.#planeRestriction.origin[2] / this.#gridUnit) - this.#planeRestriction.origin[2];
    }

    // #endregion Private Methods (2)
}

// #endregion Classes (1)
