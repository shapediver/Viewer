import { DrawingToolsManager } from '../../../DrawingToolsManager';
import { GeometryMathManager } from '../../geometry/GeometryMathManager';
import { GeometryState } from '../../geometry/GeometryState';
import { InteractionManager } from '../InteractionManager';
import { IRay, IViewportApi } from '@shapediver/viewer.features.interaction';
import { MATERIAL_INDEX, Settings } from '../../../../interfaces/IDrawingToolsManager';
import { RestrictionManager } from '../RestrictionManager';
import { ShapeDiverViewerDrawingToolsError } from '@shapediver/viewer.shared.services';

export class InsertionInteractionHandler {
    // #region Properties (10)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #geometryState: GeometryState;
    readonly #restrictionManager: RestrictionManager;
    readonly #settings: Settings;
    readonly #viewport: IViewportApi;

    #alreadyInserted: boolean = false;
    #insertionActive: boolean = false;
    #insertionActiveClosed: boolean = false;
    #insertionActiveIndex: number = -1;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, interactionManager: InteractionManager) {
        this.#drawingToolsManager = drawingToolsManager;

        this.#settings = drawingToolsManager.settings;
        this.#viewport = drawingToolsManager.viewport;
        this.#geometryMathManager = drawingToolsManager.geometryMathManager;
        this.#restrictionManager = interactionManager.restrictionManager;
        this.#geometryState = drawingToolsManager.geometryState;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get alreadyInserted(): boolean {
        return this.#alreadyInserted;
    }

    public get insertionActive(): boolean {
        return this.#insertionActive;
    }

    // #endregion Public Getters And Setters (2)

    // #region Public Methods (4)

    public finalizeInsertion(): void {
        if (this.#insertionActive === true && this.#alreadyInserted === true) {
            this.#geometryState.makePointPersistent(this.#insertionActiveIndex);

            if (this.#insertionActiveClosed === true) {
                this.#insertionActiveClosed = false;
                const numberOfPoints = this.#geometryState.getPointCount();
                if (this.#settings.geometry.minPoints !== undefined && numberOfPoints < this.#settings.geometry.minPoints) {
                    throw new ShapeDiverViewerDrawingToolsError('Not enough points, minimum points: ' + this.#settings.geometry.minPoints);
                } else if (this.#settings.geometry.maxPoints !== undefined && numberOfPoints > this.#settings.geometry.maxPoints) {
                    throw new ShapeDiverViewerDrawingToolsError('Too many points, maximum points: ' + this.#settings.geometry.maxPoints);
                } else {
                    this.#drawingToolsManager.update();
                    return;
                }
            } else {
                this.#drawingToolsManager.updateMaterialIndex(this.#insertionActiveIndex, MATERIAL_INDEX.DEFAULT);
            }
        }

        this.#insertionActive = false;
        this.#alreadyInserted = false;
        this.#insertionActiveIndex = -1;
    }

    public onMove(ray: IRay): void {
        if (this.#insertionActive === false) return;

        if (this.#geometryState.getPointCount() > 0 && this.#insertionActive === true && this.#insertionActiveClosed === false) {
            const restrictedPoint = this.#restrictionManager.rayTrace(ray, { index: this.#geometryState.getPointCount() - 1 });
            if (restrictedPoint) {
                this.#drawingToolsManager.movePointTemporary(this.#geometryState.getPointCount() - 1, restrictedPoint);

                if (this.#settings.geometry.close === true && this.#settings.geometry.autoClose === false && this.#insertionActiveClosed === false) {
                    // if restricted point is close to the first point, remove the current insertion point and draw a line to the first point
                    const firstPoint = this.#geometryState.getPosition(0);

                    if (this.#geometryMathManager.screenSpaceDistanceCheck(firstPoint, restrictedPoint, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor).check === true) {
                        this.#geometryState.closeLoop = true;
                        this.#drawingToolsManager.removePointTemporary(this.#insertionActiveIndex);
                        this.#insertionActiveClosed = true;
                    }
                }
            }
        } else if (this.#geometryState.getPointCount() > 0 && this.#insertionActive === true && this.#insertionActiveClosed === true) {
            const restrictedPoint = this.#restrictionManager.rayTrace(ray, { index: this.#geometryState.getPointCount() - 1 });
            if (restrictedPoint) {
                // if restricted point is close to the first point, remove the current insertion point and draw a line to the first point
                const firstPoint = this.#geometryState.getPosition(0);

                if (this.#geometryMathManager.screenSpaceDistanceCheck(firstPoint, restrictedPoint, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor).check === true) {
                    this.#geometryState.closeLoop = false;
                    this.#insertionActiveIndex = this.#geometryState.getPointCount();
                    this.#drawingToolsManager.addPointTemporary(this.#insertionActiveIndex, restrictedPoint);
                    this.#insertionActiveClosed = false;
                }
            }
        }
    }

    public startInsertion(event: PointerEvent): void {
        if (this.#insertionActive === false) {
            // get current ray
            const ray = this.#viewport.pointerEventToRay(event);

            // add a point at the ray intersection
            const restrictedPoint = this.#restrictionManager.rayTrace(ray);
            // add at last position
            this.#insertionActiveIndex = this.#geometryState.getPointCount();
            this.#drawingToolsManager.addPointTemporary(this.#insertionActiveIndex, restrictedPoint);
            this.#drawingToolsManager.updateMaterialIndex(this.#insertionActiveIndex, MATERIAL_INDEX.INSERTION_HOVERED);

            this.#insertionActive = true;
            this.#alreadyInserted = true;
        }
    }

    public stopInsertion(): void {
        if (this.#insertionActive === true) {
            if (this.#insertionActiveClosed === true) {
                this.#geometryState.closeLoop = false;
                this.#insertionActiveClosed = false;
            } else {
                // remove last added point
                this.#drawingToolsManager.removePointTemporary(this.#insertionActiveIndex);
            }
            this.#insertionActive = false;
            this.#alreadyInserted = false;
            this.#insertionActiveIndex = -1;
        }
    }

    // #endregion Public Methods (4)
}