import { AbstractRestriction } from '../AbstractRestriction';
import { GeometryMathManager } from '../../GeometryMathManager';
import { IPlane, Plane } from '@shapediver/viewer.shared.math';
import { IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import {
    IRestriction,
    RestrictionMetaData,
    RestrictionPropertiesBase,
    RestrictionResult
} from '../../../interfaces/IRestriction';
import { ISnapRestriction } from '../../../interfaces/ISnapRestriction';
import { ITreeNode, IViewportApi } from '@shapediver/viewer';
import { IVisualizationSettings } from '../../../interfaces/IVisualizationSettings';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type CameraPlaneRestrictionProperties = RestrictionPropertiesBase;

// #endregion Type aliases (1)

// #region Classes (1)

export class CameraPlaneRestriction extends AbstractRestriction implements IRestriction {
    // #region Properties (3)

    readonly #viewport: IViewportApi;

    #dragPlane?: IPlane;
    #snapRestrictions: { [key: string]: ISnapRestriction } = {};

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, geometryMathManager: GeometryMathManager, parentNode: ITreeNode, id: string, settings: IVisualizationSettings, properties: CameraPlaneRestrictionProperties) {
        super(viewport, parentNode, id, properties);

        this.#viewport = viewport;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get priority(): number {
        return -1;
    }

    public get snapRestrictions(): { [key: string]: ISnapRestriction; } {
        return this.#snapRestrictions;
    }

    // #endregion Public Getters And Setters (2)

    // #region Public Methods (1)

    public rayTrace(ray: IRay, metaData: RestrictionMetaData): RestrictionResult | undefined {
        const cameraDirection = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), this.#viewport.camera!.target, this.#viewport.camera!.position));
        this.#dragPlane = new Plane().setFromNormalAndCoplanarPoint(cameraDirection, metaData.startPoint || vec3.create());

        const distance = this.#dragPlane?.intersect(ray.origin, ray.direction);
        if (distance && distance > 0) {
            const point = vec3.add(vec3.create(), vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(distance, distance, distance)), ray.origin);
            return {
                distance,
                point,
                restriction: this
            };
        }
        return;
    }

    // #endregion Public Methods (1)

    // #region Protected Methods (1)

    protected visibilityChanged(): void { }

    // #endregion Protected Methods (1)
}

// #endregion Classes (1)
