import {
    Callbacks,
    DefaultTextures,
    IDrawingToolsManager,
    MATERIAL_INDEX,
    PointsData,
    Settings,
    SettingsOptional
} from '../interfaces/IDrawingToolsManager';
import { DrawingToolsEventResponseMapping } from '../interfaces/events/EventResponseMapping';
import {
    EventEngine,
    EVENTTYPE_DRAWING_TOOLS,
    IEvent,
    ShapeDiverViewerDrawingToolsError,
    UuidGenerator
} from '@shapediver/viewer.shared.services';
import { EventManager } from './managers/interaction/EventManager';
import {
    FLAG_TYPE,
    ITreeNode,
    IViewportApi,
    sceneTree,
    TreeNode
} from '@shapediver/viewer';
import { GeometryManager } from './managers/geometry/GeometryManager';
import { GeometryMathManager } from './managers/geometry/GeometryMathManager';
import { GeometryState } from './managers/geometry/GeometryState';
import { HistoryManager } from './managers/HistoryManager';
import { InteractionManager } from './managers/interaction/InteractionManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { IRestriction, RESTRICTION_TYPE, RestrictionProperties } from '../interfaces/IRestriction';
import { RestrictionManager } from './managers/interaction/RestrictionManager';
import { TextVisualizationManager } from './managers/TextVisualizationManager';
import { vec3 } from 'gl-matrix';

export class DrawingToolsManager implements IDrawingToolsManager {
    // #region Properties (17)

    readonly #callbacks: Callbacks;
    readonly #defaultTextures: DefaultTextures;
    readonly #eventEngine = EventEngine.instance;
    readonly #eventManager: EventManager;
    readonly #geometryManager: GeometryManager;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #historyManager: HistoryManager;
    readonly #interactionManager: InteractionManager;
    readonly #keysPressed: { [key: string]: boolean } = {};
    readonly #parentNode: ITreeNode;
    readonly #settings: Settings;
    readonly #textVisualizationManager: TextVisualizationManager;
    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
    readonly #viewport: IViewportApi;

    #closed: boolean = false;
    #continuousRenderingFlag?: string;
    #uuid = this.#uuidGenerator.create();

    // #endregion Properties (17)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, callbacks: Callbacks, settings: SettingsOptional, defaultTextures?: DefaultTextures) {
        this.#viewport = viewport;
        this.#callbacks = callbacks;
        this.#settings = this.cleanSettings(settings);
        this.#defaultTextures = defaultTextures!;

        this.#parentNode = new TreeNode(`DrawingToolsManager_${this.#uuid}`);
        sceneTree.root.addChild(this.#parentNode);
        sceneTree.root.updateVersion(false, false);

        this.#historyManager = new HistoryManager(this);
        this.#geometryMathManager = new GeometryMathManager(this);
        this.#geometryManager = new GeometryManager(this);
        this.#interactionManager = new InteractionManager(this);
        this.#textVisualizationManager = new TextVisualizationManager(this);

        this.#eventManager = new EventManager(this.#viewport, {
            onDown: this.onDown.bind(this),
            onUp: this.onUp.bind(this),
            onOut: this.onOut.bind(this),
            onMove: this.onMove.bind(this),
            onKeyDown: this.onKeyDown.bind(this),
            onKeyUp: this.onKeyUp.bind(this)
        });

        this.#continuousRenderingFlag = this.#viewport.addFlag(FLAG_TYPE.CONTINUOUS_RENDERING);

        // special case, the scene is still empty, so we create a grid by default and show the scene
        if (sceneTree.root.boundingBox.isEmpty())
            this.#viewport.show = true;

        // add listener for geometry changes, if autoUpdate is enabled the drawing tool will update automatically
        this.#eventEngine.addListener(EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, (e: IEvent) => {
            const event = e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED];
            if (event.temporary === false && event.points !== undefined && event.recordHistory !== false) {
                if (this.#settings.general.autoUpdate && this.#interactionManager.insertionInteractionHandler.insertionActive === false) {
                    this.update();
                }
            }
        });
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (22)

    public get callbacks(): Callbacks {
        return this.#callbacks;
    }

    public get closed(): boolean {
        return this.#closed;
    }

    public get defaultTextures(): DefaultTextures {
        return this.#defaultTextures;
    }

    public get geometryManager(): GeometryManager {
        return this.#geometryManager;
    }

    public get geometryMathManager(): GeometryMathManager {
        return this.#geometryMathManager;
    }

    public get geometryState(): GeometryState {
        return this.#geometryManager.geometryState;
    }

    public get historyManager(): HistoryManager {
        return this.#historyManager;
    }

    public get indicesArrayLines(): Uint8Array | null | undefined {
        return this.#geometryManager.geometryState.indicesArrayLines;
    }

    public get insertionActive(): boolean {
        return this.#interactionManager.insertionInteractionHandler.insertionActive;
    }

    public get interactionManager(): InteractionManager {
        return this.#interactionManager;
    }

    public get parentNode(): ITreeNode {
        return this.#parentNode;
    }

    public get positionArray(): Float32Array {
        return this.#geometryManager.geometryState.positionArray;
    }

    public get restrictionManager(): RestrictionManager {
        return this.#interactionManager.restrictionManager;
    }

    public get restrictions(): { [key: string]: IRestriction } {
        return this.restrictionManager.restrictions;
    }

    public get settings(): Settings {
        return this.#settings;
    }

    public get showDistanceLabels(): boolean {
        return this.#textVisualizationManager.showDistanceLabels;
    }

    public set showDistanceLabels(value: boolean) {
        this.#textVisualizationManager.showDistanceLabels = value;
    }

    public get showPointLabels(): boolean {
        return this.#textVisualizationManager.showPointLabels;
    }

    public set showPointLabels(value: boolean) {
        this.#textVisualizationManager.showPointLabels = value;
    }

    public get textVisualizationManager(): TextVisualizationManager {
        return this.#textVisualizationManager;
    }

    public get uuid(): string {
        return this.#uuid;
    }

    public get viewport(): IViewportApi {
        return this.#viewport;
    }

    // #endregion Public Getters And Setters (22)

    // #region Public Methods (28)

    /**
     * Add a point to the drawing tool.
     * 
     * @param index 
     * @param position 
     * @returns 
     */
    public addPoint(index: number, position?: vec3 | undefined, temporary = false): void {
        if (this.#closed) return;
        if (!this.#geometryManager.canAddPoint()) {
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS, {
                viewportId: this.viewport.id,
                drawingToolsId: this.#uuid,
                message: `The maximum amount of points (${this.#settings.geometry.maxPoints}) has been exceeded.`
            });
            throw new ShapeDiverViewerDrawingToolsError(`The maximum amount of points (${this.#settings.geometry.maxPoints}) has been exceeded.`);
        }
        this.#geometryManager.addPoint(index, position, temporary);
    }

    public addPointTemporary(index: number, position?: vec3 | undefined): void {
        this.addPoint(index, position, true);
    }

    /**
     * Add a ray tracing intersection restriction to the drawing tool.
     * 
     * @param planeProperties 
     * @returns 
     */
    public addRestriction(properties: RestrictionProperties, token?: string): string | undefined {
        return this.#interactionManager.restrictionManager.addRestriction(properties, token);
    }

    public canRedo(): boolean {
        return this.#historyManager.canRedo();
    }

    public canUndo(): boolean {
        return this.#historyManager.canUndo();
    }

    public cancel(): void {
        if (this.#closed) return;
        try {
            this.#callbacks.onCancel();
        } catch (e) {
            throw new ShapeDiverViewerDrawingToolsError('An error occurred while cancelling the drawing tool.');
        }
        this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.CANCEL, { viewportId: this.viewport.id, drawingToolsId: this.#uuid });
        this.close();
    }

    public close(): void {
        if (this.#closed) return;
        if (this.#continuousRenderingFlag)
            this.#viewport.removeFlag(this.#continuousRenderingFlag);
        this.#eventManager.close();
        this.#geometryMathManager.close();
        this.#geometryManager.close();
        this.#interactionManager.close();
        this.#textVisualizationManager.close();

        sceneTree.root.removeChild(this.#parentNode);
        sceneTree.root.updateVersion(false, false);
        this.#closed = true;
    }

    public getPointsData(): PointsData {
        return this.geometryState.getPointsData();
    }

    public keyPressed(key: string): boolean {
        const pressedKeys = Object.keys(this.#keysPressed).filter(key => this.#keysPressed[key] === true);

        // check if it the only key that is pressed
        if (key.includes('+')) {
            const keys = key.split('+');

            // there are more keys pressed than the keys in the combination
            if (keys.length !== pressedKeys.length) return false;
            let result = true;
            for (let i = 0; i < keys.length; i++)
                result = result && (this.#keysPressed[keys[i]] || false);

            return result;
        } else {
            // there are also other keys pressed
            if (pressedKeys.length > 1) return false;

            return this.#keysPressed[key] || false;
        }
    }

    public movePoint(index: number, position: vec3, temporary = false): void {
        this.#geometryManager.movePoint(index, position, temporary);
    }

    public movePointTemporary(index: number, position: vec3): void {
        this.movePoint(index, position, true);
    }

    public onDown(event: PointerEvent, ray: IRay): void {
        if (this.closed) return;
        this.#interactionManager.onDown(event, ray);
    }

    public onKeyDown(event: KeyboardEvent): void {
        if (this.closed) return;

        this.#keysPressed[event.key] = true;

        const insertKeyPressed = this.keyPressed(this.#settings.controls.insert);
        const cancelKeyPressed = this.keyPressed(this.#settings.controls.cancel);
        const confirmKeyPressed = this.keyPressed(this.#settings.controls.confirm);
        const deleteKeyPressed = this.keyPressed(this.#settings.controls.delete);
        const undoKeyPressed = this.keyPressed(this.#settings.controls.undo);
        const redoKeyPressed = this.keyPressed(this.#settings.controls.redo);

        /**
         * IF CONFIRM KEY IS PRESSED
         * - IF INSERTION IS ACTIVE, STOP INSERTION
         * - IF INSERTION IS NOT ACTIVE, UPDATE DRAWING TOOL
         */
        if (confirmKeyPressed) {
            if (this.insertionActive) {
                this.#interactionManager.stopInsertion();
                this.update();
            } else {
                this.update();
            }
        }

        /**
         * IF CANCEL KEY IS PRESSED
         * - IF INSERTION IS ACTIVE, STOP INSERTION
         * - IF INSERTION IS NOT ACTIVE, CANCEL DRAWING TOOL
         */
        if (cancelKeyPressed) {
            if (this.insertionActive) {
                this.#interactionManager.stopInsertion();
            } else {
                this.cancel();
            }
        }

        /**
         * IF INSERT KEY IS PRESSED
         * - START INSERTION
         */
        if (insertKeyPressed) {
            this.startInsertion();
        }

        /**
         * IF DELETE KEY IS PRESSED
         * - DELETE SELECTION
         */
        if (deleteKeyPressed) {
            this.#interactionManager.deleteSelection();
        }

        /**
         * IF UNDO KEY IS PRESSED
         * - UNDO
         */
        if (undoKeyPressed) {
            this.#historyManager.undo();
        }

        /**
         * IF REDO KEY IS PRESSED
         * - REDO
         */
        if (redoKeyPressed) {
            this.#historyManager.redo();
        }
    }

    public onKeyUp(event: KeyboardEvent): void {
        if (this.closed) return;
        this.#keysPressed[event.key] = false;
    }

    public onMove(event: PointerEvent, ray: IRay): void {
        if (this.closed) return;
        if (!this.#continuousRenderingFlag)
            this.#continuousRenderingFlag = this.#viewport.addFlag(FLAG_TYPE.CONTINUOUS_RENDERING);
        this.#interactionManager.onMove(event, ray);
    }

    public onOut(): void {
        if (this.closed) return;
        this.#interactionManager.onOut();
        if (this.#continuousRenderingFlag) {
            this.#viewport.removeFlag(this.#continuousRenderingFlag);
            this.#continuousRenderingFlag = undefined;
        }
    }

    public onUp(): void {
        if (this.closed) return;
        this.#interactionManager.onUp();
    }

    public redo(): void {
        this.#historyManager.redo();
    }

    /**
     * Remove a point from the drawing tool.
     * 
     * @param index 
     * @returns 
     */
    public removePoint(index: number, temporary = false): void {
        if (this.#closed) return;
        if (!this.geometryState.canRemovePoint()) {
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS, {
                viewportId: this.viewport.id,
                drawingToolsId: this.#uuid,
                message: `The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met.`
            });
            throw new ShapeDiverViewerDrawingToolsError(`The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met.`);
        }

        this.#geometryManager.removePoint(index, temporary);
    }

    public removePointTemporary(index: number): void {
        this.removePoint(index, true);
    }

    public removePoints(indices: number[]): void {
        if (this.#closed) return;

        if (!this.geometryState.canRemovePoint(indices.length)) {
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS, {
                viewportId: this.viewport.id,
                drawingToolsId: this.#uuid,
                message: `The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met.`
            });
            throw new ShapeDiverViewerDrawingToolsError(`The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met.`);
        }

        this.#geometryManager.removePoints(indices);
    }

    /**
     * Remove a restriction from the drawing tool.
     * 
     * @param token 
     */
    public removeRestriction(token: string): void {
        this.#interactionManager.restrictionManager.removeRestriction(token);
    }

    public resetMaterialIndices(): void {
        this.#geometryManager.resetMaterialIndices();
    }

    public startInsertion() {
        if (this.geometryState.canAddPoint()) {
            this.#interactionManager.startInsertion();
        } else {
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS, {
                viewportId: this.viewport.id,
                drawingToolsId: this.#uuid,
                message: `The maximum amount of points (${this.#settings.geometry.maxPoints}) has been exceeded.`
            });
            throw new ShapeDiverViewerDrawingToolsError(`The maximum amount of points (${this.#settings.geometry.maxPoints}) has been exceeded.`);
        }
    }

    public undo(): void {
        this.#historyManager.undo();
    }

    public update(): PointsData | undefined {
        if (this.#closed) return;

        const pointsCount = this.geometryState.getPointCount();
        if (this.#settings.geometry.minPoints !== undefined && pointsCount < this.#settings.geometry.minPoints) {
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS, {
                viewportId: this.viewport.id,
                drawingToolsId: this.#uuid,
                message: `The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met. Current number of points: ${pointsCount}.`
            });
            throw new ShapeDiverViewerDrawingToolsError(`The minimum amount of points (${this.#settings.geometry.maxPoints}) has not been met. Current number of points: ${pointsCount}.`);
        } else if (this.#settings.geometry.maxPoints !== undefined && pointsCount > this.#settings.geometry.maxPoints) {
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS, {
                viewportId: this.viewport.id,
                drawingToolsId: this.#uuid,
                message: `The maximum amount of points (${this.#settings.geometry.maxPoints}) has been exceeded. Current number of points: ${pointsCount}.`
            });
            throw new ShapeDiverViewerDrawingToolsError(`The maximum amount of points (${this.#settings.geometry.maxPoints}) has been exceeded. Current number of points: ${pointsCount}.`);
        } else {
            const pointsData = this.geometryState.getPointsData();
            try {
                this.#callbacks.onUpdate(pointsData);
                this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.UPDATE, { viewportId: this.viewport.id, drawingToolsId: this.#uuid });
            } catch (e) {
                throw new ShapeDiverViewerDrawingToolsError('An error occurred while updating the drawing tool.');
            }
            if (this.#settings.general.closeOnUpdate) this.close();
            return pointsData;
        }
    }

    public updateMaterialIndex(index: number, materialIndex: MATERIAL_INDEX): void {
        this.#geometryManager.updateMaterialIndex(index, materialIndex);
    }

    public updateTextVisualization(): void {
        this.#textVisualizationManager.createPointLabels();
        this.#textVisualizationManager.createDistanceLabels();
    }

    // #endregion Public Methods (28)

    // #region Private Methods (1)

    private cleanSettings(settingsOptional: SettingsOptional): Settings {
        if (typeof settingsOptional === 'string') settingsOptional = JSON.parse(settingsOptional);

        const settings: Settings = {
            geometry: {
                points: [],
                mode: 'lines',
                close: true,
                autoClose: false
            },
            restrictions: {},
            visualization: {
                distanceMultiplicationFactor: settingsOptional.visualization?.distanceMultiplicationFactor === undefined ? 2 : settingsOptional.visualization.distanceMultiplicationFactor,
                pointLabels: settingsOptional.visualization?.pointLabels === undefined ? false : settingsOptional.visualization.pointLabels,
                distanceLabels: settingsOptional.visualization?.distanceLabels === undefined ? true : settingsOptional.visualization.distanceLabels,
                points: settingsOptional.visualization?.points === undefined ? {
                    size_0: 15, size_1: 20, size_2: 15, size_3: 20, size_4: 15, size_5: 20,
                    color_0: '#0d44f0', color_1: '#197aeb', color_2: '#9e27d8', color_3: '#bc47fd', color_4: '#00ff78', color_5: '#00ff78'
                } : settingsOptional.visualization.points,
                lines: settingsOptional.visualization?.lines === undefined ? {
                    color: '#0d44f0'
                } : settingsOptional.visualization.lines
            },
            controls: {
                insert: settingsOptional.controls?.insert === undefined ? 'Insert' : settingsOptional.controls.insert,
                delete: settingsOptional.controls?.delete === undefined ? 'Delete' : settingsOptional.controls.delete,
                confirm: settingsOptional.controls?.confirm === undefined ? 'Enter' : settingsOptional.controls.confirm,
                cancel: settingsOptional.controls?.cancel === undefined ? 'Escape' : settingsOptional.controls.cancel,
                undo: settingsOptional.controls?.undo === undefined ? 'Control+z' : settingsOptional.controls.undo,
                redo: settingsOptional.controls?.redo === undefined ? 'Control+y' : settingsOptional.controls.redo
            },
            general: {
                autoStart: settingsOptional.general?.autoStart === undefined ? true : settingsOptional.general.autoStart,
                autoUpdate: settingsOptional.general?.autoUpdate === undefined ? false : settingsOptional.general.autoUpdate,
                closeOnUpdate: settingsOptional.general?.closeOnUpdate === undefined ? false : settingsOptional.general.closeOnUpdate,
                displayUnit: settingsOptional.general?.displayUnit === undefined ? '' : settingsOptional.general.displayUnit
            }
        };

        if (settingsOptional.geometry !== undefined) {
            settings.geometry = {
                points: settingsOptional.geometry.points === undefined ? [] : settingsOptional.geometry.points,
                mode: settingsOptional.geometry.mode === 'points' ? 'points' : 'lines',
                minPoints: settingsOptional.geometry.minPoints,
                maxPoints: settingsOptional.geometry.maxPoints,
                strictMinMaxPoints: settingsOptional.geometry.strictMinMaxPoints === undefined ? true : settingsOptional.geometry.strictMinMaxPoints,
                close: settingsOptional.geometry.close === undefined ? true : settingsOptional.geometry.close,
                autoClose: settingsOptional.geometry.autoClose === undefined ? true : settingsOptional.geometry.autoClose
            };
        }

        const min = vec3.fromValues(Infinity, Infinity, Infinity);
        const max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
        for (let i = 0; i < settings.geometry.points.length; i++) {
            const point = settings.geometry.points[i];

            min[0] = Math.min(min[0], point[0]);
            min[1] = Math.min(min[1], point[1]);
            min[2] = Math.min(min[2], point[2]);

            max[0] = Math.max(max[0], point[0]);
            max[1] = Math.max(max[1], point[1]);
            max[2] = Math.max(max[2], point[2]);
        }

        if (settingsOptional.restrictions === undefined || Object.keys(settingsOptional.restrictions).length === 0) {
            settings.restrictions['plane'] = { type: RESTRICTION_TYPE.PLANE };
            settings.restrictions['axis'] = { type: RESTRICTION_TYPE.AXIS };
        } else {
            settings.restrictions = settingsOptional.restrictions as { [key: string]: RestrictionProperties };
        }

        return settings;
    }

    // #endregion Private Methods (1)
}
