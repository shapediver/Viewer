import { AbstractRestriction } from '../../AbstractRestriction';
import { DrawingToolsManager } from '../../../../../DrawingToolsManager';
import { GeometryMathManager } from '../../../../geometry/GeometryMathManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { ISnapRestriction, SnapRestrictionProperties } from '../../../../../../interfaces/ISnapRestriction';
import { PlaneRestriction } from '../PlaneRestriction';
import { RestrictionMetaData } from '../../../../../../interfaces/IRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type AxisRestrictionProperties = {
    activationKeyX?: string;
    activationKeyY?: string;
    activationKeyZ?: string;
    activationKeyPlane?: string;
} & SnapRestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class AxisRestriction extends AbstractRestriction implements ISnapRestriction {
    // #region Properties (8)

    readonly #activationKeyX: string;
    readonly #activationKeyY: string;
    readonly #activationKeyZ: string;
    readonly #activationKeyPlane: string;
    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #planeRestriction: PlaneRestriction;

    #active: boolean = false;
    #geometryMathManager: GeometryMathManager;
    #priority: number = 0;

    // #endregion Properties (8)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, planeRestriction: PlaneRestriction, properties?: AxisRestrictionProperties) {
        super(drawingToolsManager, 'axis');
        this.#drawingToolsManager = drawingToolsManager;
        this.#planeRestriction = planeRestriction;
        this.#geometryMathManager = drawingToolsManager.geometryMathManager;

        this.#activationKeyX = properties?.activationKeyX || 'x';
        this.#activationKeyY = properties?.activationKeyY || 'y';
        this.#activationKeyZ = properties?.activationKeyZ || 'z';
        this.#activationKeyPlane = properties?.activationKeyPlane || 'p';

        this.#priority = properties?.priority || 1;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (5)

    public get active(): boolean {
        return this.#active;
    }

    public set active(value: boolean) {
        this.#active = value;

        // if (this.#gridHelper) this.#gridHelper.visible = value;
    }

    public get enabledEditable(): boolean {
        return this._enabledEditable;
    }

    public get priority(): number {
        return this.#priority;
    }

    public set priority(value: number) {
        this.#priority = value;
    }

    // #endregion Public Getters And Setters (5)

    // #region Public Methods (2)

    public snap(ray: IRay, point: vec3, metaData?: RestrictionMetaData): vec3 | undefined {
        if (this.enabled === false) return;
        if (!metaData || !metaData.referencePoint) return;

        const xPressed = this.#drawingToolsManager.keyPressed(this.#activationKeyX);
        const yPressed = this.#drawingToolsManager.keyPressed(this.#activationKeyY);
        const zPressed = this.#drawingToolsManager.keyPressed(this.#activationKeyZ);
        const pPressed = this.#drawingToolsManager.keyPressed('p');

        if (xPressed) {
            return this.#geometryMathManager.closestPoint({ origin: metaData.referencePoint, direction: this.#planeRestriction.vectorU }, point);
        } else if (yPressed) {
            return this.#geometryMathManager.closestPoint({ origin: metaData.referencePoint, direction: this.#planeRestriction.vectorV }, point);
        } else if (zPressed) {
            return this.#geometryMathManager.closestPointsRayRay({ origin: metaData.referencePoint, direction: this.#planeRestriction.normal }, ray).closestPointOnRay1;
        } else if (pPressed) {
            return this.#geometryMathManager.closestPointOnPlane(this.#planeRestriction.origin, this.#planeRestriction.normal, point);
        }
    }

    public updatePlaneDefinition(): void {}

    // #endregion Public Methods (2)

    // #region Protected Methods (1)

    protected visibilityChanged(): void { }

    // #endregion Protected Methods (1)
}

// #endregion Classes (1)
