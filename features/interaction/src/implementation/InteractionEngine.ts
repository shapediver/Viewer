import { Box } from '@shapediver/viewer.shared.math';
import {
    EventEngine,
    EVENTTYPE,
    ShapeDiverViewerInteractionError,
    UuidGenerator
    } from '@shapediver/viewer.shared.services';
import { IInteractionEngine, INTERACTION_STATE } from '../interfaces/IInteractionEngine';
import { IInteractionManager } from '../interfaces/IInteractionManager';
import { IIntersectionFilter, IRay } from '@shapediver/viewer.shared.types';
import { IntersectionManager } from './IntersectionManager';
import { ISceneEvent } from '@shapediver/viewer.shared.types';
import { IViewportApi, sceneTree } from '@shapediver/viewer';
import { RaycasterParameters } from '@shapediver/viewer.rendering-engine.intersection-engine';

// #region Interfaces (1)

/* eslint-disable @typescript-eslint/no-unused-vars */
export interface IInteractionEngineProperties {
    // #region Properties (3)

    /**
     * The opacity from which the intersection is considered. (default: 0)
     */
    intersectionOpacity: number;
    /**
     * The percentage of the scene size for the intersection of lines. (default: 0.025 = 2.5%)
     */
    lineIntersectionPercentage: number;
    /**
     * The percentage of the scene size for the intersection of points. (default: 0.025 = 2.5%)
     */
    pointIntersectionPercentage: number;

    // #endregion Properties (3)
}

// #endregion Interfaces (1)

// #region Classes (1)

export class InteractionEngine implements IInteractionEngine {
    // #region Properties (12)

    readonly #canvasEventListenerToken: string;
    readonly #eventEngine: EventEngine = EventEngine.instance;
    readonly #intersectionManager: IntersectionManager = IntersectionManager.instance;
    readonly #managers: { [key: string]: IInteractionManager } = {};
    readonly #rayCasterParams: RaycasterParameters = {
        Line: { threshold: 1 },
        Line2: { threshold: 1 },
        Points: { threshold: 1 },
        Mesh: {},
        LOD: {},
        Sprite: {}
    };
    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
    readonly #viewport: IViewportApi;

    #closed: boolean = false;
    #intersectionOpacity: number = 0;
    #lineIntersectionPercentage: number = 0.025;
    #pointIntersectionPercentage: number = 0.025;
    #sceneBoundingSphereRadius: number = 0;

    // #endregion Properties (12)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, props?: Partial<IInteractionEngineProperties>) {
        this.#viewport = viewport;
        this.#canvasEventListenerToken = this.#viewport.addCanvasEventListener(this);
        if (props) {
            if (props.intersectionOpacity !== undefined) this.#intersectionOpacity = props.intersectionOpacity;
            if (props.lineIntersectionPercentage !== undefined) this.#lineIntersectionPercentage = props.lineIntersectionPercentage;
            if (props.pointIntersectionPercentage !== undefined) this.#pointIntersectionPercentage = props.pointIntersectionPercentage;
        }

        /**
         * When the scene bounding box changes, the intersection thresholds need to be updated.
         * We do this by listening to the scene bounding box change event.
         * In the beginning, we set the scene bounding sphere radius to the root bounding box.
         * This is the initial value and will be updated when the scene bounding box changes.
         * The intersection thresholds are then updated accordingly.
         */
        this.#sceneBoundingSphereRadius = sceneTree.root.boundingBox.boundingSphere.radius;
        this.updateIntersectionThresholds();
        this.#eventEngine.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (e) => {
            const event = e as ISceneEvent;
            if (event.viewportId === this.#viewport.id) {
                const boundingBox = new Box(event.boundingBox!.min, event.boundingBox!.max);
                this.#sceneBoundingSphereRadius = boundingBox.boundingSphere.radius;
                this.updateIntersectionThresholds();
            }
        });
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (7)

    public get closed(): boolean {
        return this.#closed;
    }

    public get intersectionOpacity(): number {
        return this.#intersectionOpacity;
    }

    public set intersectionOpacity(value: number) {
        this.#intersectionOpacity = value;
    }

    public get lineIntersectionPercentage(): number {
        return this.#lineIntersectionPercentage;
    }

    public set lineIntersectionPercentage(value: number) {
        this.#lineIntersectionPercentage = value;
        this.updateIntersectionThresholds();
    }

    public get managers(): { [key: string]: IInteractionManager } {
        return this.#managers;
    }

    public get pointIntersectionPercentage(): number {
        return this.#pointIntersectionPercentage;
    }

    public set pointIntersectionPercentage(value: number) {
        this.#pointIntersectionPercentage = value;
        this.updateIntersectionThresholds();
    }

    // #endregion Public Getters And Setters (7)

    // #region Public Methods (11)

    public addInteractionManager(manager: IInteractionManager): string {
        if (this.#closed) throw new ShapeDiverViewerInteractionError('The InteractionEngine has already been closed.');
        const token = this.#uuidGenerator.create();
        this.#managers[token] = manager;
        manager.add(this.#viewport);
        return token;
    }

    public close(): void {
        if (this.#closed) throw new ShapeDiverViewerInteractionError('The InteractionEngine has already been closed.');
        for (const m in this.#managers)
            this.removeInteractionManager(m);
        this.#viewport.removeCanvasEventListener(this.#canvasEventListenerToken);
        this.#closed = true;
    }

    public onKeyDown(event: KeyboardEvent): void {
        if (this.#closed) return;
    }

    public onKeyUp(event: KeyboardEvent): void {
        if (this.#closed) return;
    }

    public onMouseWheel(event: WheelEvent): void {
        if (this.#closed) return;
    }

    public onPointerDown(event: PointerEvent): void {
        if (this.#closed) return;
        const ray = this.#viewport.pointerEventToRay(event);
        this.onDown(event, ray);
    }

    public onPointerEnd(event: PointerEvent): void {
        if (this.#closed) return;
    }

    public onPointerMove(event: PointerEvent): void {
        if (this.#closed) return;
        const ray = this.#viewport.pointerEventToRay(event);
        this.onMove(event, ray);
    }

    public onPointerOut(event: PointerEvent): void {
        if (this.#closed) return;
        const ray = this.#viewport.pointerEventToRay(event);
        this.onEnd(event, ray, INTERACTION_STATE.OUT);
    }

    public onPointerUp(event: PointerEvent): void {
        if (this.#closed) return;
        const ray = this.#viewport.pointerEventToRay(event);
        this.onEnd(event, ray, INTERACTION_STATE.UP);
    }

    public removeInteractionManager(token: string): boolean {
        if (this.#closed) throw new ShapeDiverViewerInteractionError('The InteractionEngine has already been closed.');
        if (!this.#managers[token]) return false;
        this.#managers[token].remove();
        delete this.#managers[token];
        return true;
    }

    // #endregion Public Methods (11)

    // #region Private Methods (4)

    /**
     * Apply all filters for the intersection of the scene.
     * Call all according interaction managers with the results.
     * 
     * @param ray 
     */
    private onDown(event: PointerEvent, ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for (const m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.DOWN));

        const intersections = this.#intersectionManager.intersect(ray, this.#viewport.id, filters, this.#rayCasterParams) || [];

        for (const m in this.#managers)
            this.#managers[m].onDown(event, ray, intersections);
    }

    /**
     * Apply all filters for the intersection of the scene.
     * Call all according interaction managers with the results.
     * 
     * @param ray 
     */
    private onEnd(event: PointerEvent, ray: IRay, endState: INTERACTION_STATE): void {
        const filters: IIntersectionFilter[] = [];
        for (const m in this.#managers)
            filters.push(this.#managers[m].filter(endState));

        for (const m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.END));

        const intersections = this.#intersectionManager.intersect(ray, this.#viewport.id, filters, this.#rayCasterParams) || [];

        for (const m in this.#managers)
            this.#managers[m].onEnd(event, ray, intersections, endState);
    }

    /**
     * Apply all filters for the intersection of the scene.
     * Call all according interaction managers with the results.
     * 
     * @param ray 
     */
    private onMove(event: PointerEvent, ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for (const m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.MOVE));

        const intersections = this.#intersectionManager.intersect(ray, this.#viewport.id, filters, this.#rayCasterParams) || [];

        for (const m in this.#managers)
            this.#managers[m].onMove(event, ray, intersections);
    }

    private updateIntersectionThresholds(): void {
        this.#rayCasterParams.Points.threshold = this.#sceneBoundingSphereRadius * this.#pointIntersectionPercentage;
        this.#rayCasterParams.Line.threshold = this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
        this.#rayCasterParams.Line2!.threshold = this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
    }

    // #endregion Private Methods (4)
}

// #endregion Classes (1)
