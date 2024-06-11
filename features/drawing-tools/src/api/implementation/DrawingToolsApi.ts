import { Callbacks, DefaultTextures, DrawingToolsManager, PointsData, SettingsOptional } from '../../business/implementation/DrawingToolsManager';
import { IDrawingToolsApi } from '../interfaces/IDrawingToolsApi';
import { IViewportApi } from '@shapediver/viewer';
import { IRestrictionApi } from '../interfaces/IRestrictionApi';
import { vec3 } from 'gl-matrix';
import { PlaneRestriction } from '../../business/implementation/managers/interaction/restrictions/plane/PlaneRestriction';
import { PlaneRestrictionApi } from './restrictions/plane/PlaneRestrictionApi';
import { RestrictionProperties } from '../../business/interfaces/IRestriction';
import { GeometryRestriction } from '../../business/implementation/managers/interaction/restrictions/geometry/GeometryRestriction';
import { GeometryRestrictionApi } from './restrictions/geometry/GeometryRestrictionApi';
export class DrawingToolsApi implements IDrawingToolsApi {
    // #region Properties (2)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #restrictions: { [key: string]: IRestrictionApi; } = {};

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, callbacks: Callbacks, settings: SettingsOptional, defaultTextures?: DefaultTextures) {
        this.#drawingToolsManager = new DrawingToolsManager(viewport, callbacks, settings, defaultTextures);

        for(const token in this.#drawingToolsManager.restrictionManager.restrictions) {
            if(this.#drawingToolsManager.restrictionManager.restrictions[token] instanceof PlaneRestriction)
                this.#restrictions[token] = new PlaneRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as PlaneRestriction);
            if(this.#drawingToolsManager.restrictionManager.restrictions[token] instanceof GeometryRestriction)
                this.#restrictions[token] = new GeometryRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as GeometryRestriction);
        }
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (7)

    public get closed(): boolean {
        return this.#drawingToolsManager.closed;
    }

    public get pointsData(): PointsData {
        return this.#drawingToolsManager.geometryState.getPointsData();
    }

    public get restrictions(): { [key: string]: IRestrictionApi; } {
        return this.#restrictions;
    }

    public get showDistanceLabels(): boolean {
        return this.#drawingToolsManager.textVisualizationManager.showDistanceLabels;
    }

    public set showDistanceLabels(value: boolean) {
        this.#drawingToolsManager.textVisualizationManager.showDistanceLabels = value;
    }

    public get showPointLabels(): boolean {
        return this.#drawingToolsManager.textVisualizationManager.showPointLabels;
    }

    public set showPointLabels(value: boolean) {
        this.#drawingToolsManager.textVisualizationManager.showPointLabels = value;
    }

    // #endregion Public Getters And Setters (7)

    // #region Public Methods (12)

    public addPoint(index: number, position?: vec3 | undefined): void {
        this.#drawingToolsManager.addPoint(index, position);
    }

    public addRestriction(properties: RestrictionProperties, incomingToken?: string): IRestrictionApi | undefined {
        const token = this.#drawingToolsManager.addRestriction(properties, incomingToken);
        if(!token) return;

        if(this.#drawingToolsManager.restrictionManager.restrictions[token] instanceof PlaneRestriction)
            this.#restrictions[token] = new PlaneRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as PlaneRestriction);
        if(this.#drawingToolsManager.restrictionManager.restrictions[token] instanceof GeometryRestriction)
            this.#restrictions[token] = new GeometryRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as GeometryRestriction);

        return this.#restrictions[token];
    }

    public canRedo(): boolean {
        return this.#drawingToolsManager.historyManager.canRedo();
    }

    public canUndo(): boolean {
        return this.#drawingToolsManager.historyManager.canUndo();
    }

    public cancel(): void {
        this.#drawingToolsManager.cancel();
    }

    public close(): void {
        this.#drawingToolsManager.close();
    }

    public redo(): void {
        this.#drawingToolsManager.historyManager.redo();
    }

    public removePoint(index: number): void {
        this.#drawingToolsManager.removePoint(index);
    }

    public removeRestriction(token: string): void {
        this.#drawingToolsManager.removeRestriction(token);
        delete this.#restrictions[token];
    }

    public undo(): void {
        this.#drawingToolsManager.historyManager.undo();
    }

    public update(): PointsData | undefined {
        return this.#drawingToolsManager.update();
    }

    // #endregion Public Methods (12)
}