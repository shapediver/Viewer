import { AbstractRestriction } from '../AbstractRestriction';
import { DrawingToolsManager } from '../../../../DrawingToolsManager';
import { GeometryMathManager } from '../../../geometry/GeometryMathManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { IRestriction, RestrictionMetaData, RestrictionProperties } from '../../../../../interfaces/IRestriction';
import { ISnapRestriction } from '../../../../../interfaces/ISnapRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type AxisRestrictionProperties = {
    activationKeyX?: string;
    activationKeyY?: string;
    activationKeyZ?: string;
} & RestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class AxisRestriction extends AbstractRestriction implements IRestriction {
    // #region Properties (7)

    readonly #activationKeyX: string;
    readonly #activationKeyY: string;
    readonly #activationKeyZ: string;
    readonly #drawingToolsManager: DrawingToolsManager;

    #geometryMathManager: GeometryMathManager;
    #snapRestrictions: { [key: string]: ISnapRestriction; } = {};

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, properties: AxisRestrictionProperties) {
        super(drawingToolsManager, id);
        this.#drawingToolsManager = drawingToolsManager;
        this.#geometryMathManager = drawingToolsManager.geometryMathManager;

        this.#activationKeyX = properties.activationKeyX || 'x';
        this.#activationKeyY = properties.activationKeyY || 'y';
        this.#activationKeyZ = properties.activationKeyZ || 'z';
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get priority(): number {
        return 1;
    }

    public get snapRestrictions(): { [key: string]: ISnapRestriction; } {
        return this.#snapRestrictions;
    }

    // #endregion Public Getters And Setters (2)

    // #region Public Methods (1)

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): vec3 | undefined {
        if (this.enabled === false) return;
        if (!metaData || !metaData.referencePoint) return;

        const xPressed = this.#drawingToolsManager.keyPressed(this.#activationKeyX);
        const yPressed = this.#drawingToolsManager.keyPressed(this.#activationKeyY);
        const zPressed = this.#drawingToolsManager.keyPressed(this.#activationKeyZ);
        const xyPressed = this.#drawingToolsManager.keyPressed(`${this.#activationKeyX}+${this.#activationKeyY}`);
        const xzPressed = this.#drawingToolsManager.keyPressed(`${this.#activationKeyX}+${this.#activationKeyZ}`);
        const yzPressed = this.#drawingToolsManager.keyPressed(`${this.#activationKeyY}+${this.#activationKeyZ}`);
        const xyzPressed = this.#drawingToolsManager.keyPressed(`${this.#activationKeyX}+${this.#activationKeyY}+${this.#activationKeyZ}`);

        if (xPressed) {
            const { closestPointOnRay2 } = this.#geometryMathManager.closestPointsRayRay(ray, { origin: metaData.referencePoint, direction: vec3.fromValues(1, 0, 0) });
            return closestPointOnRay2;
        } else if (yPressed) {
            const { closestPointOnRay2 } = this.#geometryMathManager.closestPointsRayRay(ray, { origin: metaData.referencePoint, direction: vec3.fromValues(0, 1, 0) });
            return closestPointOnRay2;
        } else if (zPressed) {
            const { closestPointOnRay2 } = this.#geometryMathManager.closestPointsRayRay(ray, { origin: metaData.referencePoint, direction: vec3.fromValues(0, 0, 1) });
            return closestPointOnRay2;
        } else if (xyPressed) {
            const { closestPointOnRay2 } = this.#geometryMathManager.closestPointsRayRay(ray, { origin: metaData.referencePoint, direction: vec3.fromValues(1, 1, 0) });
            return closestPointOnRay2;
        } else if (xzPressed) {
            const { closestPointOnRay2 } = this.#geometryMathManager.closestPointsRayRay(ray, { origin: metaData.referencePoint, direction: vec3.fromValues(1, 0, 1) });
            return closestPointOnRay2;
        } else if (yzPressed) {
            const { closestPointOnRay2 } = this.#geometryMathManager.closestPointsRayRay(ray, { origin: metaData.referencePoint, direction: vec3.fromValues(0, 1, 1) });
            return closestPointOnRay2;
        } else if (xyzPressed) {
            const { closestPointOnRay2 } = this.#geometryMathManager.closestPointsRayRay(ray, { origin: metaData.referencePoint, direction: vec3.fromValues(1, 1, 1) });
            return closestPointOnRay2;
        }
    }

    // #endregion Public Methods (1)

    // #region Protected Methods (1)

    protected visibilityChanged(): void { }

    // #endregion Protected Methods (1)
}

// #endregion Classes (1)
