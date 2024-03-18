import { Callbacks, CustomizationPropertiesOptional, DefaultTextures, DrawingToolsManager, SetupPropertiesOptional } from '../../business/implementation/DrawingToolsManager';
import { IDrawingToolsApi } from '../interfaces/IDrawingToolsApi';
import { IGeometryData, IViewportApi } from '@shapediver/viewer';
import { IRestrictionApi } from '../interfaces/IRestrictionApi';
import { vec3 } from 'gl-matrix';
import { PlaneRestriction } from '../../business/implementation/restrictions/plane/PlaneRestriction';
import { PlaneRestrictionApi } from './restrictions/plane/PlaneRestrictionApi';
import { RestrictionProperties } from '../../business/interfaces/IRestriction';
export class DrawingToolsApi implements IDrawingToolsApi {
    // #region Properties (2)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #restrictions: { [key: string]: IRestrictionApi; } = {};

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, callbacks: Callbacks, customizationProperties: CustomizationPropertiesOptional, setupProperties?: SetupPropertiesOptional, defaultTextures?: DefaultTextures) {
        this.#drawingToolsManager = new DrawingToolsManager(viewport, callbacks, customizationProperties, setupProperties, defaultTextures);

        for(const token in this.#drawingToolsManager.restrictionManager.restrictions) {
            if(this.#drawingToolsManager.restrictionManager.restrictions[token] instanceof PlaneRestriction)
                this.#restrictions[token] = new PlaneRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as PlaneRestriction);
        }
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (3)

    public get closed(): boolean {
        return this.#drawingToolsManager.closed;
    }

    public get geometryData(): IGeometryData {
        return this.#drawingToolsManager.geometryManager.geometryData;
    }

    public get restrictions(): { [key: string]: IRestrictionApi; } {
        return this.#restrictions;
    }

    public get showPointLabels(): boolean {
        return this.#drawingToolsManager.textVisualizationManager.showPointLabels;
    }

    public set showPointLabels(value: boolean) {
        this.#drawingToolsManager.textVisualizationManager.showPointLabels = value;
    }

    public get showDistanceLabels(): boolean {
        return this.#drawingToolsManager.textVisualizationManager.showDistanceLabels;
    }

    public set showDistanceLabels(value: boolean) {
        this.#drawingToolsManager.textVisualizationManager.showDistanceLabels = value;
    }

    // #endregion Public Getters And Setters (3)

    // #region Public Methods (7)

    public addRestriction(properties: RestrictionProperties): IRestrictionApi | undefined {
        const token = this.#drawingToolsManager.addRestriction(properties);
        if(!token) return;

        if(this.#drawingToolsManager.restrictionManager.restrictions[token] instanceof PlaneRestriction)
            this.#restrictions[token] = new PlaneRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as PlaneRestriction);
        return this.#restrictions[token];
    }

    public addPoint(index: number, position?: vec3 | undefined): void {
        this.#drawingToolsManager.addPoint(index, position);
    }

    public cancel(): void {
        this.#drawingToolsManager.cancel();
    }

    public close(): void {
        this.#drawingToolsManager.close();
    }

    public finish(): IGeometryData | undefined {
        return this.#drawingToolsManager.finish();
    }

    public removePoint(index: number): void {
        this.#drawingToolsManager.removePoint(index);
    }

    public removeRestriction(token: string): void {
        this.#drawingToolsManager.removeRestriction(token);
        delete this.#restrictions[token];
    }

    // #endregion Public Methods (7)
}