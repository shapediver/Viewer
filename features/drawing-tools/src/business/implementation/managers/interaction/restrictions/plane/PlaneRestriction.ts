import { AbstractRestriction } from '../AbstractRestriction';
import { AngularRestriction, AngularRestrictionProperties } from './snap/AngularRestriction';
import { DrawingToolsManager } from '../../../../DrawingToolsManager';
import { GridRestriction, GridRestrictionProperties } from './snap/GridRestriction';
import { IRay } from '@shapediver/viewer.features.interaction';
import { IRestriction, RestrictionMetaData, RestrictionProperties } from '../../../../../interfaces/IRestriction';
import { ISnapRestriction } from '../../../../../interfaces/ISnapRestriction';
import { mat4, vec3 } from 'gl-matrix';
import { UuidGenerator } from '@shapediver/viewer.shared.services';

// #region Type aliases (1)

export type PlaneRestrictionProperties = {
    /**
     * The origin of the plane.
     * 
     * @default vec3.fromValues(0, 0, 0)
     */
    origin?: vec3

    /**
     * Vector U of the plane
     * with the cross product of vector_u and vector_v the normal of the plane can be calculated
     */
    vector_u?: vec3;

    /**
     * Vector V of the plane
     * with the cross product of vector_u and vector_v the normal of the plane can be calculated
     */
    vector_v?: vec3;

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
    // #region Properties (10)

    readonly #uuidGenerator = UuidGenerator.instance;

    #angularRestriction: AngularRestriction;
    #gridRestriction: GridRestriction;
    #normal: vec3;
    #origin: vec3;
    #snapRestrictions: { [key: string]: ISnapRestriction };
    #transformationFromXYPlaneMatrix: mat4 = mat4.create();
    #transformationToXYPlaneMatrix: mat4 = mat4.create();
    #vectorU: vec3;
    #vectorV: vec3;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, properties: PlaneRestrictionProperties) {
        super(drawingToolsManager, id);
        properties.vector_u = properties.vector_u ? vec3.normalize(vec3.create(), properties.vector_u) : vec3.fromValues(1, 0, 0);
        properties.vector_v = properties.vector_v ? vec3.normalize(vec3.create(), properties.vector_v) : vec3.fromValues(0, 1, 0);

        this.#normal = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), properties.vector_u, properties.vector_v));
        if (vec3.dot(properties.vector_u, properties.vector_v) !== 0)
            properties.vector_v = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.#normal, properties.vector_u));

        this.#vectorU = properties.vector_u;
        this.#vectorV = properties.vector_v;
        this.#origin = properties.origin || vec3.create();

        this.createTransformationMatrices();

        this.#gridRestriction = new GridRestriction(drawingToolsManager, this, properties.gridSnapRestriction);
        this.#angularRestriction = new AngularRestriction(drawingToolsManager, this, properties.angularSnapRestriction);

        this.#snapRestrictions = {
            grid: this.#gridRestriction,
            angular: this.#angularRestriction
        };
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (13)

    public get angularRestriction(): AngularRestriction {
        return this.#angularRestriction;
    }

    public get gridRestriction(): GridRestriction {
        return this.#gridRestriction;
    }

    public get normal(): vec3 {
        return this.#normal;
    }

    public get origin(): vec3 {
        return this.#origin;
    }

    public set origin(value: vec3) {
        this.#origin = value;
        this.#gridRestriction.updatePlaneDefinition(this.#origin, this.#vectorU, this.#vectorV, this.#normal);
        this.createTransformationMatrices();
    }

    public get priority(): number {
        return -1;
    }

    public get snapRestrictions(): { [key: string]: ISnapRestriction; } {
        return this.#snapRestrictions;
    }

    public get transformationFromXYPlaneMatrix(): mat4 {
        return this.#transformationFromXYPlaneMatrix;
    }

    public get transformationToXYPlaneMatrix(): mat4 {
        return this.#transformationToXYPlaneMatrix;
    }

    public get vectorU(): vec3 {
        return this.#vectorU;
    }

    public set vectorU(value: vec3) {
        this.#vectorU = value;
        this.#normal = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.#vectorU, this.#vectorV));

        if (vec3.dot(this.#vectorU, this.#vectorV) !== 0)
            this.#vectorV = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.#normal, this.#vectorU));

        this.createTransformationMatrices();
        this.#gridRestriction.updatePlaneDefinition(this.#origin, this.#vectorU, this.#vectorV, this.#normal);
        this.#angularRestriction.updatePlaneDefinition(this.#origin, this.#vectorU, this.#vectorV, this.#normal);
    }

    public get vectorV(): vec3 {
        return this.#vectorV;
    }

    public set vectorV(value: vec3) {
        this.#vectorV = value;
        this.#normal = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.#vectorU, this.#vectorV));

        if (vec3.dot(this.#vectorU, this.#vectorV) !== 0)
            this.#vectorV = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.#normal, this.#vectorU));

        this.createTransformationMatrices();
        this.#gridRestriction.updatePlaneDefinition(this.#origin, this.#vectorU, this.#vectorV, this.#normal);
        this.#angularRestriction.updatePlaneDefinition(this.#origin, this.#vectorU, this.#vectorV, this.#normal);
    }

    // #endregion Public Getters And Setters (13)

    // #region Public Methods (1)

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): vec3 | undefined {
        if (this.enabled === false) return vec3.create();

        let origin = this.#origin;
        if (metaData?.referencePoint)
            origin = vec3.sub(vec3.create(), this.#origin, vec3.scale(vec3.create(), this.#normal, vec3.dot(vec3.sub(vec3.create(), this.#origin, metaData.referencePoint), this.#normal)));

        // find intersection of ray and plane
        const t = (vec3.dot(origin, this.#normal) - vec3.dot(ray.origin, this.#normal)) / vec3.dot(ray.direction, this.#normal);
        const intersection = vec3.add(vec3.create(), ray.origin, vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(t, t, t)));
        return this.snap(intersection, metaData);
    }

    // #endregion Public Methods (1)

    // #region Protected Methods (1)

    protected visibilityChanged(): void { }

    // #endregion Protected Methods (1)

    // #region Private Methods (2)

    private createTransformationMatrices(): void {
        // Calculate the transformation matrix for the rotation
        const rotationMatrix = mat4.fromValues(
            this.#vectorU[0], this.#vectorV[0], this.#normal[0], 0,
            this.#vectorU[1], this.#vectorV[1], this.#normal[1], 0,
            this.#vectorU[2], this.#vectorV[2], this.#normal[2], 0,
            0, 0, 0, 1
        );

        const rotationMatrixInverse = mat4.invert(mat4.create(), rotationMatrix);
        const pivotMatrix = mat4.fromTranslation(mat4.create(), vec3.fromValues(this.#origin[0], this.#origin[1], this.#origin[2]));
        const pivotMatrixInverse = mat4.fromTranslation(mat4.create(), vec3.fromValues(-this.#origin[0], -this.#origin[1], -this.#origin[2]));

        mat4.multiply(this.#transformationToXYPlaneMatrix, pivotMatrix, rotationMatrix);
        mat4.multiply(this.#transformationToXYPlaneMatrix, this.#transformationToXYPlaneMatrix, pivotMatrixInverse);

        mat4.multiply(this.#transformationFromXYPlaneMatrix, pivotMatrix, rotationMatrixInverse);
        mat4.multiply(this.#transformationFromXYPlaneMatrix, this.#transformationFromXYPlaneMatrix, pivotMatrixInverse);
    }

    private snap(point: vec3, metaData?: RestrictionMetaData): vec3 | undefined {
        if (this.enabled === false) return;

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

            for (const snapRestriction of snapRestrictions) {
                snapRestriction.active = false;
            }

            // if a snap restriction returned a result, return it
            if (indexedResults[0].value !== undefined) {
                snapRestrictions[indexedResults[0].index].active = true;
                return indexedResults[0].value;
            }
        }

        return point;
    }

    // #endregion Private Methods (2)
}

// #endregion Classes (1)
