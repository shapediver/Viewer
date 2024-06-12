import {
    Callbacks,
    DefaultTextures,
    IDrawingToolsManager,
    PointsData,
    SettingsOptional
} from '../../business/interfaces/IDrawingToolsManager';
import { DrawingToolsManager } from '../../business/implementation/DrawingToolsManager';
import { GeometryRestriction } from '../../business/implementation/managers/interaction/restrictions/geometry/GeometryRestriction';
import { GeometryRestrictionApi } from './restrictions/geometry/GeometryRestrictionApi';
import { IDrawingToolsApi } from '../interfaces/IDrawingToolsApi';
import { IRestrictionApi } from '../interfaces/IRestrictionApi';
import { IViewportApi } from '@shapediver/viewer';
import { PlaneRestriction } from '../../business/implementation/managers/interaction/restrictions/plane/PlaneRestriction';
import { PlaneRestrictionApi } from './restrictions/plane/PlaneRestrictionApi';
import { RestrictionProperties } from '../../business/interfaces/IRestriction';
import { vec3 } from 'gl-matrix';
export class DrawingToolsApi implements IDrawingToolsApi {
    // #region Properties (2)

    readonly #drawingToolsManager: IDrawingToolsManager;
    readonly #restrictions: { [key: string]: IRestrictionApi; } = {};

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, callbacks: Callbacks, settings: SettingsOptional, defaultTextures?: DefaultTextures) {
        this.#drawingToolsManager = new DrawingToolsManager(viewport, callbacks, settings, defaultTextures);

        for (const token in this.#drawingToolsManager.restrictions) {
            if (this.#drawingToolsManager.restrictions[token] instanceof PlaneRestriction)
                this.#restrictions[token] = new PlaneRestrictionApi(this.#drawingToolsManager.restrictions[token] as PlaneRestriction);
            if (this.#drawingToolsManager.restrictions[token] instanceof GeometryRestriction)
                this.#restrictions[token] = new GeometryRestrictionApi(this.#drawingToolsManager.restrictions[token] as GeometryRestriction);
        }
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (7)

    public get closed(): boolean {
        return this.#drawingToolsManager.closed;
    }

    public get pointsData(): PointsData {
        return this.#drawingToolsManager.getPointsData();
    }

    public get restrictions(): { [key: string]: IRestrictionApi; } {
        return this.#restrictions;
    }

    public get showDistanceLabels(): boolean {
        return this.#drawingToolsManager.showDistanceLabels;
    }

    public set showDistanceLabels(value: boolean) {
        this.#drawingToolsManager.showDistanceLabels = value;
    }

    public get showPointLabels(): boolean {
        return this.#drawingToolsManager.showPointLabels;
    }

    public set showPointLabels(value: boolean) {
        this.#drawingToolsManager.showPointLabels = value;
    }

    // #endregion Public Getters And Setters (7)

    // #region Public Methods (11)

    public addPoint(index: number, position?: vec3 | undefined): void {
        this.#drawingToolsManager.addPoint(index, position);
    }

    public addRestriction(properties: RestrictionProperties, incomingToken?: string): IRestrictionApi | undefined {
        const token = this.#drawingToolsManager.addRestriction(properties, incomingToken);
        if (!token) return;

        if (this.#drawingToolsManager.restrictions[token] instanceof PlaneRestriction)
            this.#restrictions[token] = new PlaneRestrictionApi(this.#drawingToolsManager.restrictions[token] as PlaneRestriction);
        if (this.#drawingToolsManager.restrictions[token] instanceof GeometryRestriction)
            this.#restrictions[token] = new GeometryRestrictionApi(this.#drawingToolsManager.restrictions[token] as GeometryRestriction);

        return this.#restrictions[token];
    }

    public canRedo(): boolean {
        return this.#drawingToolsManager.canRedo();
    }

    public canUndo(): boolean {
        return this.#drawingToolsManager.canUndo();
    }

    public cancel(): void {
        this.#drawingToolsManager.cancel();
    }

    public close(): void {
        this.#drawingToolsManager.close();
    }

    public redo(): void {
        this.#drawingToolsManager.redo();
    }

    public removePoint(index: number): void {
        this.#drawingToolsManager.removePoint(index);
    }

    public removeRestriction(token: string): void {
        this.#drawingToolsManager.removeRestriction(token);
        delete this.#restrictions[token];
    }

    public undo(): void {
        this.#drawingToolsManager.undo();
    }

    public update(): PointsData | undefined {
        return this.#drawingToolsManager.update();
    }

    // #endregion Public Methods (11)
}