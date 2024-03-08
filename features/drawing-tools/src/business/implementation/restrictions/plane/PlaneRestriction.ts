import THREE from 'three';
import { AbstractRestriction } from '../AbstractRestriction';
import { AngularRestriction, AngularRestrictionProperties } from './snap/AngularRestriction';
import { DrawingToolsManager } from '../../DrawingToolsManager';
import { GridRestriction, GridRestrictionProperties } from './snap/GridRestriction';
import { IRay } from '@shapediver/viewer.features.interaction';
import { IRestriction, RestrictionProperties } from '../../../interfaces/IRestriction';
import { ISnapRestriction } from '../../../interfaces/ISnapRestriction';
import { UuidGenerator } from '@shapediver/viewer.shared.services';
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

    /**
     * grid snap restriction
     */
    gridSnapRestriction: GridRestrictionProperties;

    /**
     * angular snap restriction
     */
    angularSnapRestriction: AngularRestrictionProperties;
} & RestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class PlaneRestriction extends AbstractRestriction implements IRestriction {
    // #region Properties (6)

    readonly #uuidGenerator = UuidGenerator.instance;

    private _gridHelper?: THREE.GridHelper;
    private _gridSize: number = 100;
    private _normal: vec3;
    private _origin: vec3;
    private _snapRestrictions: { [key: string]: ISnapRestriction; } = {};

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, properties: PlaneRestrictionProperties) {
        super(drawingToolsManager, id);
        this._normal = properties.normal;
        this._origin = properties.origin || drawingToolsManager.customizationProperties.geometry.origin;
        this.createGridVisualization();

        this._snapRestrictions['grid'] = new GridRestriction(this._drawingToolsManager, this.#uuidGenerator.create(), properties.gridSnapRestriction, properties);
        this._snapRestrictions['angular'] = new AngularRestriction(this._drawingToolsManager, this.#uuidGenerator.create(), properties.angularSnapRestriction, properties);
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (9)

    public get angularRestriction(): AngularRestriction {
        return this._snapRestrictions['angular'] as AngularRestriction;
    }

    public get gridRestriction(): GridRestriction {
        return this._snapRestrictions['grid'] as GridRestriction;
    }

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

    public get snapRestrictions(): { [key: string]: ISnapRestriction; } {
        return this._snapRestrictions;
    }

    // #endregion Public Getters And Setters (9)

    // #region Public Methods (2)

    public rayTrace(ray: IRay): vec3 {
        if (this.enabled === false) return vec3.create();

        // find intersection of ray and plane
        const t = (vec3.dot(this._origin, this._normal) - vec3.dot(ray.origin, this._normal)) / vec3.dot(ray.direction, this._normal);
        const intersection = vec3.add(vec3.create(), ray.origin, vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(t, t, t)));
        return intersection;
    }

    public snap(point: vec3, metaData?: { index?: number | undefined; } | undefined): vec3 | undefined {
        if (this.enabled === false) return;

        const sortedSnapRestrictions = Object.values(this._snapRestrictions).sort((a, b) => b.priority - a.priority);

        // group snap restrictions by priority
        const groupedSnapRestrictions: { [key: number]: ISnapRestriction[] } = {};
        for (const snapRestriction of sortedSnapRestrictions) {
            if (!groupedSnapRestrictions[snapRestriction.priority]) groupedSnapRestrictions[snapRestriction.priority] = [];
            groupedSnapRestrictions[snapRestriction.priority].push(snapRestriction);
        }

        // call snap method for each group
        for (const snapRestrictions of Object.values(groupedSnapRestrictions)) {
            const results = [];
            for (const snapRestriction of snapRestrictions) {
                results.push(snapRestriction.snap(point, metaData));
            }

            const indexedResults = results.map((value, index) => ({ index, value }));

            // find the result that is closest to the point and set the snap restriction to active
            indexedResults.sort((a, b) => {
                if (!a.value) return 1;
                if (!b.value) return -1;
                return vec3.squaredDistance(point, a.value) - vec3.squaredDistance(point, b.value);
            });

            for(const snapRestriction of snapRestrictions) {
                snapRestriction.active = false;
            }

            // if a snap restriction returned a result, return it
            if (indexedResults[0].value !== undefined) {
                snapRestrictions[indexedResults[0].index].active = true;
                return indexedResults[0].value;
            }
        }
    }

    // #endregion Public Methods (2)

    // #region Protected Methods (1)

    protected visibilityChanged(visible: boolean): void { }

    // #endregion Protected Methods (1)

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
