import { DrawingToolsManager } from '../../../DrawingToolsManager';
import { GeometryMathManager } from '../../geometry/GeometryMathManager';
import { GeometryState } from '../../geometry/GeometryState';
import { InteractionManager } from '../InteractionManager';
import { IRay, IViewportApi } from '@shapediver/viewer.features.interaction';
import { MATERIAL_INDEX, Settings } from '../../../../interfaces/IDrawingToolsManager';
import { RestrictionManager } from '../RestrictionManager';

export class InsertionInteractionHandler {
    // #region Properties (11)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #geometryState: GeometryState;
    readonly #restrictionManager: RestrictionManager;
    readonly #settings: Settings;
    readonly #viewport: IViewportApi;

    #alreadyInserted: boolean = false;
    #insertionActive: boolean = false;
    #insertionActiveIndex: number = -1;

    // #endregion Properties (11)

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

    public finalizeInsertion(): boolean {
        let result = false;

        if (this.#insertionActive === true && this.#alreadyInserted === true) {
            this.#geometryState.makePointPersistent(this.#insertionActiveIndex);

            // if there are more than 2 points and the geometry can be closed, check if the last point is close to the first point
            if (this.#geometryState.getPointCount() > 3 && this.#geometryState.checkNumberOfPoints(this.#geometryState.getPointCount() - 1) && this.#settings.geometry.close === true && this.#settings.geometry.autoClose === false) {
                // if restricted point is close to the first point, remove the current insertion point and draw a line to the first point
                const firstPoint = this.#geometryState.getPosition(0);
                const lastPoint = this.#geometryState.getPosition(this.#insertionActiveIndex);

                if (this.#geometryMathManager.screenSpaceDistanceCheck(firstPoint, lastPoint, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor).check === true) {
                    this.#geometryState.closeLoop = true;
                    this.#drawingToolsManager.removePoint(this.#insertionActiveIndex);
                    result = true;
                } else {
                    this.#drawingToolsManager.updateMaterialIndex(this.#insertionActiveIndex, MATERIAL_INDEX.DEFAULT);
                }
            } else {
                this.#drawingToolsManager.updateMaterialIndex(this.#insertionActiveIndex, MATERIAL_INDEX.DEFAULT);
            }
        }

        this.#insertionActive = false;
        this.#alreadyInserted = false;
        this.#insertionActiveIndex = -1;

        return result;
    }

    public onMove(ray: IRay): void {
        if (this.#insertionActive === false) return;

        if (this.#geometryState.getPointCount() > 0 && this.#insertionActive === true) {
            const restrictedPoint = this.#restrictionManager.rayTrace(ray, { index: this.#insertionActiveIndex });

            if (restrictedPoint) {
                // if there are more than 2 points and the geometry can be closed, check if the last point is close to the first point
                if (this.#geometryState.getPointCount() > 3 && this.#geometryState.checkNumberOfPoints(this.#geometryState.getPointCount() - 1) && this.#settings.geometry.close === true && this.#settings.geometry.autoClose === false) {
                    // if restricted point is close to the first point, remove the current insertion point and draw a line to the first point
                    const firstPoint = this.#geometryState.getPosition(0);
                    const lastPoint = restrictedPoint;
    
                    if (lastPoint && this.#geometryMathManager.screenSpaceDistanceCheck(firstPoint, lastPoint, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor).check === true) {
                        // close the geometry
                        this.#drawingToolsManager.updateMaterialIndex(this.#insertionActiveIndex, MATERIAL_INDEX.SELECTED_HOVERED);
                        this.#drawingToolsManager.movePointTemporary(this.#insertionActiveIndex, firstPoint);
                    } else {
                        // not close enough to close the geometry
                        this.#drawingToolsManager.updateMaterialIndex(this.#insertionActiveIndex, MATERIAL_INDEX.INSERTION_HOVERED);
                        this.#drawingToolsManager.movePointTemporary(this.#insertionActiveIndex, restrictedPoint);
                    }
                } else {
                    // not enough points to close the geometry or auto close is enabled
                    this.#drawingToolsManager.updateMaterialIndex(this.#insertionActiveIndex, MATERIAL_INDEX.INSERTION_HOVERED);
                    this.#drawingToolsManager.movePointTemporary(this.#insertionActiveIndex, restrictedPoint);
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
            // remove last added point
            this.#drawingToolsManager.removePointTemporary(this.#insertionActiveIndex);
            this.#insertionActive = false;
            this.#alreadyInserted = false;
            this.#insertionActiveIndex = -1;
        }
    }

    // #endregion Public Methods (4)
}