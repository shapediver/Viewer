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
    gridSize?: number;

    /**
     * Origin of the grid
     */
    origin?: vec3;

    /**
     * Normal of the grid
     */
    normal?: vec3;

    /**
     * grid snap restriction
     */
    gridSnapRestriction?: GridRestrictionProperties;

    /**
     * angular snap restriction
     */
    angularSnapRestriction?: AngularRestrictionProperties;
} & RestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class PlaneRestriction extends AbstractRestriction implements IRestriction {
    // #region Properties (6)

    readonly #uuidGenerator = UuidGenerator.instance;

    #gridHelper?: THREE.GridHelper;
    #gridSize: number;
    #normal: vec3;
    #origin: vec3;
    #snapRestrictions: { [key: string]: ISnapRestriction; } = {};

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, properties: PlaneRestrictionProperties) {
        super(drawingToolsManager, id);
        this.#normal = properties.normal || vec3.fromValues(0, 0, 1);
        properties.origin = properties.origin || drawingToolsManager.settings.geometry.origin;
        this.#origin = properties.origin;
        this.#gridSize = properties.gridSize || 100;
        this.createGridVisualization();

        this.#snapRestrictions['grid'] = new GridRestriction(this.drawingToolsManager, this.#uuidGenerator.create(), properties, properties.gridSnapRestriction);
        this.#snapRestrictions['angular'] = new AngularRestriction(this.drawingToolsManager, this.#uuidGenerator.create(), properties, properties.angularSnapRestriction);
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (9)

    public get angularRestriction(): AngularRestriction {
        return this.#snapRestrictions['angular'] as AngularRestriction;
    }

    public get gridRestriction(): GridRestriction {
        return this.#snapRestrictions['grid'] as GridRestriction;
    }

    public get gridSize(): number {
        return this.#gridSize;
    }

    public set gridSize(value: number) {
        this.#gridSize = value;
        this.createGridVisualization();
    }

    public get normal(): vec3 {
        return this.#normal;
    }

    public set normal(value: vec3) {
        this.#normal = value;
        this.createGridVisualization();
    }

    public get origin(): vec3 {
        return this.#origin;
    }

    public set origin(value: vec3) {
        this.#origin = value;
        this.createGridVisualization();
    }

    public get snapRestrictions(): { [key: string]: ISnapRestriction; } {
        return this.#snapRestrictions;
    }

    // #endregion Public Getters And Setters (9)

    // #region Public Methods (2)

    public rayTrace(ray: IRay): vec3 {
        if (this.canBeActive() === false) return vec3.create();

        // find intersection of ray and plane
        const t = (vec3.dot(this.#origin, this.#normal) - vec3.dot(ray.origin, this.#normal)) / vec3.dot(ray.direction, this.#normal);
        const intersection = vec3.add(vec3.create(), ray.origin, vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(t, t, t)));
        return intersection;
    }

    public snap(point: vec3, metaData?: { index?: number | undefined; } | undefined): vec3 | undefined {
        if (this.canBeActive() === false) return;

        const sortedSnapRestrictions = Object.values(this.#snapRestrictions).sort((a, b) => b.priority - a.priority);

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
        if (this.#gridHelper) {
            this.object3D.remove(this.#gridHelper);
            this.#gridHelper.dispose();
        }

        this.#gridHelper = new THREE.GridHelper(this.#gridSize, 2, 0x666666, 0x222222);
        this.#gridHelper.position.copy(new THREE.Vector3(this.#origin[0], this.#origin[1], this.#origin[2]));

        this.#gridHelper.renderOrder = -1;
        (this.#gridHelper.material as THREE.LineBasicMaterial).depthTest = false;
        (this.#gridHelper.material as THREE.LineBasicMaterial).transparent = true;

        // rotate grid helper to match axis
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(this.#normal[0], this.#normal[1], this.#normal[2]));
        this.#gridHelper.quaternion.copy(quaternion);

        this.object3D.add(this.#gridHelper);
    }

    // #endregion Private Methods (1)
}

// #endregion Classes (1)
