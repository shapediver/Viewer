import { addListener, FLAG_TYPE, IViewportApi } from '@shapediver/viewer';
import { DeletionInteractionHandler } from './handlers/DeletionInteractionHandler';
import { DrawingToolsEventResponseMapping } from '../../../interfaces/events/EventResponseMapping';
import { DrawingToolsManager } from '../../DrawingToolsManager';
import { EVENTTYPE_DRAWING_TOOLS, IEvent } from '@shapediver/viewer.shared.services';
import { GeometryMathManager } from '../geometry/GeometryMathManager';
import { IManager } from '../../../interfaces/IManager';
import { InsertionInteractionHandler } from './handlers/InsertionInteractionHandler';
import { InteractionManagerHelper } from './helpers/InteractionManagerHelper';
import { IRay } from '@shapediver/viewer.features.interaction';
import { MidPointInteractionHandler } from './handlers/MidPointInteractionHandler';
import { RestrictionManager } from './RestrictionManager';

export class InteractionManager implements IManager {
    // #region Properties (11)

    readonly #deletionInteractionHandler: DeletionInteractionHandler;
    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #insertionInteractionHandler: InsertionInteractionHandler;
    readonly #interactionManagerHelper: InteractionManagerHelper;
    readonly #midPointInteractionHandler: MidPointInteractionHandler;
    readonly #restrictionManager: RestrictionManager;
    readonly #viewport: IViewportApi;

    #cameraFreezeFlag: string = '';
    #lastEvent?: PointerEvent;
    #onDownPointer?: PointerEvent;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawingToolsManager;
        this.#viewport = drawingToolsManager.viewport;
        this.#geometryMathManager = this.#drawingToolsManager.geometryMathManager;

        this.#restrictionManager = new RestrictionManager(this.#drawingToolsManager);

        this.#deletionInteractionHandler = new DeletionInteractionHandler(this.#drawingToolsManager, this);
        this.#insertionInteractionHandler = new InsertionInteractionHandler(this.#drawingToolsManager, this);
        this.#midPointInteractionHandler = new MidPointInteractionHandler(this.#drawingToolsManager, this);

        this.#interactionManagerHelper = new InteractionManagerHelper(this.#drawingToolsManager, this);

        addListener(EVENTTYPE_DRAWING_TOOLS.ADDED, (e: IEvent) => {
            const event = e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.ADDED];
            this.addPoint(event.index!);
        });

        addListener(EVENTTYPE_DRAWING_TOOLS.REMOVED, (e: IEvent) => {
            const event = e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.REMOVED];
            this.removePoint(event.index!);
        });
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get deletionInteractionHandler(): DeletionInteractionHandler {
        return this.#deletionInteractionHandler;
    }

    public get insertionInteractionHandler(): InsertionInteractionHandler {
        return this.#insertionInteractionHandler;
    }

    public get midPointInteractionHandler(): MidPointInteractionHandler {
        return this.#midPointInteractionHandler;
    }

    public get restrictionManager(): RestrictionManager {
        return this.#restrictionManager;
    }

    // #endregion Public Getters And Setters (4)

    // #region Public Methods (10)

    public addPoint(insertionIndex: number): void {
        this.#interactionManagerHelper.addPoint(insertionIndex);
    }

    public close(): void {
        this.#interactionManagerHelper.close();
        this.#restrictionManager.close();
    }

    public deleteSelection(): void {
        this.#deletionInteractionHandler.deleteSelection(this.#interactionManagerHelper.selectedPointIndices);
    }

    public onDown(event: PointerEvent, ray: IRay): void {
        if (this.#drawingToolsManager.closed) return;
        this.#onDownPointer = event;
        this.#interactionManagerHelper.moving = false;

        /**
         * IF INSERT KEY IS PRESSED
         * FINALIZE INSERTION AND START A NEW ONE
         */
        if (this.#insertionInteractionHandler.insertionActive === true) {
            const result = this.#insertionInteractionHandler.finalizeInsertion();
            const distances = this.#geometryMathManager.checkPointDistances(ray);
            this.#interactionManagerHelper.checkHover(distances, ray);
            if(result) {
                this.#drawingToolsManager.update();
                return;
            } else {
                this.#insertionInteractionHandler.startInsertion(event);
                return;
            }
        }
        const distances = this.#geometryMathManager.checkPointDistances(ray);

        /**
         * IF MID POINT INSERTION IS ACTIVE
         * FINISH MID POINT INSERTION IF THE CURRENT INDEX IS THE MID POINT INSERTION INDEX
         */
        if (this.#midPointInteractionHandler.midPointInsertionActive === true) {
            this.#midPointInteractionHandler.finishMidPointInsertion(distances);
            this.#interactionManagerHelper.midPointInserted = true;
        }

        /**
         * CHECK HOVERED POINT
         */
        this.#interactionManagerHelper.checkHover(distances, ray);

        /**
         * IF THERE IS A POINT CLOSE TO THE RAY
         */
        this.#interactionManagerHelper.selectPoint(distances);

        /**
         * IF THE CURRENTLY HOVERED POINT IS SELECTED
         * START DRAGGING
         */
        const draggingStarted = this.#interactionManagerHelper.startDragging(ray);
        if (draggingStarted && !this.#cameraFreezeFlag)
            this.#cameraFreezeFlag = this.#viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);
    }

    /**
     * On mouse move, move the selected point if there is one
     * 
     * @param event 
     * @param ray 
     */
    public onMove(event: PointerEvent, ray: IRay): void {
        if (this.#drawingToolsManager.closed) return;

        // if there are no points, start with the insertion right away
        if (this.#drawingToolsManager.settings.general.autoStart && this.#insertionInteractionHandler.insertionActive === false && this.#drawingToolsManager.getPointsData().length === 0) {
            this.#lastEvent = event;
            this.startInsertion();
        }

        const distanceSquared = this.#onDownPointer ? Math.pow(event.clientX - this.#onDownPointer.clientX, 2) + Math.pow(event.clientY - this.#onDownPointer.clientY, 2) : Infinity;
        const clickThresholdSquared = 25;
        const pointerMoved = distanceSquared > clickThresholdSquared;

        this.#interactionManagerHelper.moving = pointerMoved;

        if (pointerMoved) {
            this.#lastEvent = event;
            /**
             * IF WE ARE DRAGGING A POINT
             * MOVE THE SELECTED POINTS
             */
            this.#interactionManagerHelper.moveSelectedPoints(ray);
        }

        const distances = this.#geometryMathManager.checkPointDistances(ray);
        this.#interactionManagerHelper.checkHover(distances, ray);

        if (pointerMoved) {
            /**
             * IF INSERT KEY IS PRESSED
             * ADD POINT AT RAY INTERSECTION IF THERE IS NONE WAS ADDED
             * MOVE LAST ADDED POINT IF THERE IS ONE
             */
            this.#insertionInteractionHandler.onMove(ray);

            /**
             * IF INSERT KEY IS NOT PRESSED AND DRAGGING IS NOT ACTIVE
             * CHECK IF THERE IS A LINE CLOSE TO THE RAY AND ADD A MID POINT TO IT
             */
            if (this.#insertionInteractionHandler.insertionActive === false && this.#interactionManagerHelper.dragging === false && this.#interactionManagerHelper.selectedPointIndices.length === 0) {
                this.#midPointInteractionHandler.onMove(ray, this.#interactionManagerHelper.hoveredPoint);
            }
        }
        
        if (this.#interactionManagerHelper.dragging) {
            document.body.style.cursor = 'grabbing';
        } else if(this.#interactionManagerHelper.hoveredPoint !== undefined) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    /**
     * On mouse out, deselect the hovered point and remove the stop dragging
     */
    public onOut(): void {
        this.#restrictionManager.showRestrictionVisualization = false;
        this.#insertionInteractionHandler.stopInsertion();
        this.#interactionManagerHelper.onOut();
        this.reset();
    }

    /**
     * On mouse up, check if a point is close to the ray and deselect it
     */
    public onUp(): void {
        if (this.#drawingToolsManager.closed) return;
        this.#interactionManagerHelper.onUp();
        this.reset();
    }

    public removePoint(index: number): void {
        this.#interactionManagerHelper.removePoint(index);
    }

    public startInsertion(): void {
        this.#restrictionManager.showRestrictionVisualization = true;

        this.#midPointInteractionHandler.stopMidPointInsertion();

        if (!this.#cameraFreezeFlag)
            this.#cameraFreezeFlag = this.#viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);

        this.#insertionInteractionHandler.startInsertion(this.#lastEvent!);
    }

    public stopInsertion(): void {
        this.#restrictionManager.showRestrictionVisualization = false;
        this.#insertionInteractionHandler.stopInsertion();
        this.#viewport.removeFlag(this.#cameraFreezeFlag);
        this.#cameraFreezeFlag = '';
    }

    // #endregion Public Methods (10)

    // #region Private Methods (1)

    private reset(): void {
        if (this.#insertionInteractionHandler.insertionActive === false)
            this.#restrictionManager.showRestrictionVisualization = false;
        this.#interactionManagerHelper.reset();
        this.#viewport.removeFlag(this.#cameraFreezeFlag);
        this.#cameraFreezeFlag = '';
    }

    // #endregion Private Methods (1)
}
