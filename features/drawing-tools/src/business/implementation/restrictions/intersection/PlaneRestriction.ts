import THREE from 'three';
import { AbstractRestriction } from '../AbstractRestriction';
import { DrawingToolsManager } from '../../DrawingToolsManager';
import { IIntersectionRestriction } from '../../../interfaces/IIntersectionRestriction';
import { IRay } from '@shapediver/viewer.features.interaction';
import { RestrictionType } from '../../../interfaces/IRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type PlaneRestrictionProperties = {
    /**
     * Size of the grid
     */
    gridSize: number;
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

export class PlaneRestriction extends AbstractRestriction implements IIntersectionRestriction {
    // #region Properties (4)

    private _gridHelper?: THREE.GridHelper;
    private _gridSize: number = 100;
    private _normal: vec3;
    private _origin: vec3;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, properties: PlaneRestrictionProperties) {
        super(drawingToolsManager, id, RestrictionType.INTERACTION);
        this._normal = properties.normal;
        this._origin = properties.origin;
        this.createGridVisualization();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (6)

    public get gridSize(): number {
        return this._gridSize;
    }

    public set gridSize(value: number) {
        this._gridSize = value;
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
        this.createGridVisualization();
    }

    // #endregion Public Getters And Setters (6)

    // #region Public Methods (1)

    public rayTrace(ray: IRay): vec3 {
        if (this.enabled === false) return vec3.create();

        // find intersection of ray and plane
        const t = (vec3.dot(this._origin, this._normal) - vec3.dot(ray.origin, this._normal)) / vec3.dot(ray.direction, this._normal);
        const intersection = vec3.add(vec3.create(), ray.origin, vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(t, t, t)));
        return intersection;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private createGridVisualization(): void {
        if (this._gridHelper) {
            this._object3D.remove(this._gridHelper);
            this._gridHelper.dispose();
        }

        this._gridHelper = new THREE.GridHelper(this._gridSize, 2, 0x666666, 0x222222);
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

    // #endregion Private Methods (1)
}

// #endregion Classes (1)
