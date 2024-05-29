import { addListener, FLAG_TYPE, IViewportApi } from '@shapediver/viewer';
import { DeletionInteractionHandler } from './handlers/DeletionInteractionHandler';
import { DrawingToolsEventResponseMapping } from '../../../interfaces/events/EventResponseMapping';
import { DrawingToolsManager, Settings } from '../../DrawingToolsManager';
import { EventManager } from './EventManager';
import { EVENTTYPE_DRAWING_TOOLS, IEvent, ShapeDiverViewerDrawingToolsError } from '@shapediver/viewer.shared.services';
import { GeometryMathManager } from '../geometry/GeometryMathManager';
import { GeometryState } from '../geometry/GeometryState';
import { IManager } from '../../../interfaces/IManager';
import { InsertionInteractionHandler } from './handlers/InsertionInteractionHandler';
import { InteractionManagerHelper } from './helpers/InteractionManagerHelper';
import { IRay } from '@shapediver/viewer.features.interaction';
import { MidPointInteractionHandler } from './handlers/MidPointInteractionHandler';
import { RestrictionManager } from './RestrictionManager';

export class InteractionManager implements IManager {
    // #region Properties (13)

    readonly #deletionInteractionHandler: DeletionInteractionHandler;
    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #geometryState: GeometryState;
    readonly #insertionInteractionHandler: InsertionInteractionHandler;
    readonly #interactionManagerHelper: InteractionManagerHelper;
    readonly #midPointInteractionHandler: MidPointInteractionHandler;
    readonly #restrictionManager: RestrictionManager;
    readonly #settings: Settings;
    readonly #viewport: IViewportApi;

    #cameraFreezeFlag: string = '';
    #eventManager: EventManager;
    #lastEvent?: PointerEvent;

    // #endregion Properties (13)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawingToolsManager;
        this.#settings = drawingToolsManager.settings;
        this.#viewport = drawingToolsManager.viewport;
        this.#geometryMathManager = this.#drawingToolsManager.geometryMathManager;
        this.#geometryState = this.#drawingToolsManager.geometryState;

        this.#restrictionManager = new RestrictionManager(this.#drawingToolsManager);

        this.#eventManager = new EventManager(this.#viewport, {
            onDown: this.onDown.bind(this),
            onUp: this.onUp.bind(this),
            onOut: this.onOut.bind(this),
            onMove: this.onMove.bind(this),
            onKeyDown: this.onKeyDown.bind(this),
            onKeyUp: this.onKeyUp.bind(this)
        });

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
        this.#eventManager.close();
        this.#restrictionManager.close();
    }

    public keyPressed(event: MouseEvent | KeyboardEvent, key: string): boolean {
        if (event instanceof MouseEvent) {
            if (key === 'Ctrl') {
                return event.ctrlKey;
            } else if (key === 'Shift') {
                return event.shiftKey;
            } else if (key === 'Alt') {
                return event.altKey;
            }
        } else if (event instanceof KeyboardEvent) {
            if (key === 'Ctrl') {
                return event.key === 'Control' || event.ctrlKey;
            } else if (key === 'Shift') {
                return event.key === 'Shift' || event.shiftKey;
            } else if (key === 'Alt') {
                return event.key === 'Alt' || event.altKey;
            } else {
                return event.code === key;
            }
        }
        return false;
    }

    public onDown(event: PointerEvent, ray: IRay): void {
        if (this.#drawingToolsManager.closed) return;
        this.#interactionManagerHelper.moving = false;

        const deleteKeyPressed = this.keyPressed(event, this.#settings.controls.delete);
        const insertKeyPressed = this.keyPressed(event, this.#settings.controls.insert);

        /**
         * IF DELETE AND INSERT KEY ARE PRESSED
         * DO NOTHING
         */
        if (deleteKeyPressed === true && insertKeyPressed === true) return;

        /**
         * IF DELETE KEY IS PRESSED
         * REMOVE POINT IF THERE IS ONE CLOSE TO THE RAY
         */
        if (deleteKeyPressed && this.#geometryState.canRemovePoint()) {
            this.#deletionInteractionHandler.deletePoint(ray);

            if (!this.#cameraFreezeFlag)
                this.#cameraFreezeFlag = this.#viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);
        }

        /**
         * IF INSERT KEY IS PRESSED
         * FINALIZE INSERTION
         */
        if (insertKeyPressed) {
            this.#insertionInteractionHandler.finalizeInsertion();
        }

        /**
         * CHECK HOVERED POINT
         */
        this.#interactionManagerHelper.checkHover(event, ray);

        /**
         * IF INSERT OR DELETE KEY IS PRESSED
         * WE DO NOT WANT TO SELECT / DESELECT A POINT
         */
        if (insertKeyPressed === true || deleteKeyPressed === true) return;

        const distances = this.#geometryMathManager.checkPointDistances(ray);

        /**
         * IF MID POINT INSERTION IS ACTIVE
         * FINISH MID POINT INSERTION IF THE CURRENT INDEX IS THE MID POINT INSERTION INDEX
         */
        this.#midPointInteractionHandler.finishMidPointInsertion(distances);

        this.#interactionManagerHelper.selectPoint(distances);

        /**
         * IF THE CURRENTLY HOVERED POINT IS SELECTED
         * START DRAGGING
         */
        const draggingStarted = this.#interactionManagerHelper.startDragging(ray);
        if (draggingStarted && !this.#cameraFreezeFlag)
            this.#cameraFreezeFlag = this.#viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);
    }

    public onKeyDown(event: KeyboardEvent): void {
        if (this.#drawingToolsManager.closed) return;

        const insertKeyPressed = this.keyPressed(event, this.#settings.controls.insert);
        const cancelKeyPressed = this.keyPressed(event, this.#settings.controls.cancel);
        const finishKeyPressed = this.keyPressed(event, this.#settings.controls.finish);
        const deleteKeyPressed = this.keyPressed(event, this.#settings.controls.delete);
        const updateKeyPressed = this.keyPressed(event, this.#settings.controls.update);

        /**
         * IF FINISH KEY IS PRESSED
         * CLOSE THE DRAWING TOOLS
         */
        if (finishKeyPressed) {
            const numberOfPoints = this.#geometryState.getPointCount();
            if (this.#settings.geometry.minPoints !== undefined && numberOfPoints < this.#settings.geometry.minPoints) {
                throw new ShapeDiverViewerDrawingToolsError('Not enough points, minimum points: ' + this.#settings.geometry.minPoints);
            } else if (this.#settings.geometry.maxPoints !== undefined && numberOfPoints > this.#settings.geometry.maxPoints) {
                throw new ShapeDiverViewerDrawingToolsError('Too many points, maximum points: ' + this.#settings.geometry.maxPoints);
            } else {
                this.#drawingToolsManager.finish();
            }
        }

        /**
         * IF UPDATE KEY IS PRESSED
         * UPDATE THE DRAWING TOOLS
         */
        if (updateKeyPressed) {
            const numberOfPoints = this.#geometryState.getPointCount();
            if (this.#settings.geometry.minPoints !== undefined && numberOfPoints < this.#settings.geometry.minPoints) {
                throw new ShapeDiverViewerDrawingToolsError('Not enough points, minimum points: ' + this.#settings.geometry.minPoints);
            } else if (this.#settings.geometry.maxPoints !== undefined && numberOfPoints > this.#settings.geometry.maxPoints) {
                throw new ShapeDiverViewerDrawingToolsError('Too many points, maximum points: ' + this.#settings.geometry.maxPoints);
            } else {
                this.#drawingToolsManager.update();
            }
        }

        /**
         * IF CANCEL KEY IS PRESSED
         * REMOVE ALL SELECTED POINTS
         */
        if (cancelKeyPressed) {
            this.#drawingToolsManager.cancel();
        }

        /**
         * IF DELETE KEY IS PRESSED
         * CANCEL MID POINT INSERTION IF THERE IS ONE
         */
        if (deleteKeyPressed) {
            this.#midPointInteractionHandler.stopMidPointInsertion();
        }

        /**
         * IF INSERT KEY IS PRESSED
         * ADD POINT AT RAY INTERSECTION
         */
        if (insertKeyPressed && this.#geometryState.canAddPoint()) {
            this.#midPointInteractionHandler.stopMidPointInsertion();

            if (!this.#cameraFreezeFlag)
                this.#cameraFreezeFlag = this.#viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);

            this.#insertionInteractionHandler.startInsertion(this.#lastEvent);
        }
    }

    public onKeyUp(event: KeyboardEvent): void {
        if (this.#drawingToolsManager.closed) return;

        const insertKeyPressed = this.keyPressed(event, this.#settings.controls.insert);

        /**
         * IF INSERT KEY IS RELEASED
         * FINALIZE INSERTION OR REMOVE LAST ADDED POINT
         */
        if (insertKeyPressed) {
            this.#viewport.removeFlag(this.#cameraFreezeFlag);
            this.#cameraFreezeFlag = '';
            this.#restrictionManager.showRestrictionVisualization = false;

            this.#insertionInteractionHandler.stopInsertion();
        }
    }

    /**
     * On mouse move, move the selected point if there is one
     * 
     * @param event 
     * @param ray 
     */
    public onMove(event: PointerEvent, ray: IRay): void {
        if (this.#drawingToolsManager.closed) return;
        this.#interactionManagerHelper.moving = true;
        this.#lastEvent = event;

        const insertKeyPressed = this.keyPressed(event, this.#settings.controls.insert);
        const deleteKeyPressed = this.keyPressed(event, this.#settings.controls.delete);

        /**
         * IF WE ARE DRAGGING A POINT
         * MOVE THE SELECTED POINTS
         */
        this.#interactionManagerHelper.moveSelectedPoints(ray);

        this.#interactionManagerHelper.checkHover(event, ray);

        /**
         * IF INSERT KEY IS PRESSED
         * ADD POINT AT RAY INTERSECTION IF THERE IS NONE WAS ADDED
         * MOVE LAST ADDED POINT IF THERE IS ONE
         */
        if (insertKeyPressed && (this.#geometryState.canAddPoint() || this.#insertionInteractionHandler.alreadyInserted === true)) {
            this.#insertionInteractionHandler.onMove(ray);
        }

        /**
         * IF INSERT KEY IS NOT PRESSED AND DRAGGING IS NOT ACTIVE
         * CHECK IF THERE IS A LINE CLOSE TO THE RAY AND ADD A MID POINT TO IT
         */
        if (insertKeyPressed === false && deleteKeyPressed === false && this.#interactionManagerHelper.dragging === false && this.#interactionManagerHelper.selectedPointIndices.length === 0) {
            this.#midPointInteractionHandler.onMove(ray, this.#interactionManagerHelper.hoveredPoint);
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

    // #endregion Public Methods (10)

    // #region Private Methods (1)

    private reset(): void {
        this.#interactionManagerHelper.reset();
        this.#restrictionManager.showRestrictionVisualization = false;
        this.#viewport.removeFlag(this.#cameraFreezeFlag);
        this.#cameraFreezeFlag = '';
    }

    // #endregion Private Methods (1)
}
