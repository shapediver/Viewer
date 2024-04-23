import { Logger, UuidGenerator, ShapeDiverViewerInteractionError } from '@shapediver/viewer.shared.services';
import { IInteractionEngine, INTERACTION_STATE } from '../interfaces/IInteractionEngine';
import { IIntersectionFilter, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { IInteractionManager } from '../interfaces/IInteractionManager';
import { IViewportApi, RENDERER_TYPE, sceneTree } from '@shapediver/viewer';
import { IntersectionManager } from './IntersectionManager';

export class InteractionEngine implements IInteractionEngine {
    // #region Properties (6)

    readonly #canvasEventListenerToken: string;
    readonly #intersectionEngine: IntersectionManager = IntersectionManager.instance;
    readonly #logger: Logger = Logger.instance;
    readonly #managers: { [key: string]: IInteractionManager } = {};
    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
    readonly #viewport: IViewportApi;

    #intersectionOpacity: number = 0;
    #closed: boolean = false;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(viewport: IViewportApi) {
        this.#viewport = viewport;
        this.#canvasEventListenerToken = this.#viewport.addCanvasEventListener(this);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get intersectionOpacity(): number {
        return this.#intersectionOpacity;
    }

    public set intersectionOpacity(value: number) {
        this.#intersectionOpacity = value;
    }
    
    public get managers(): { [key: string]: IInteractionManager } {
        return this.#managers;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (14)

    public close(): void {
        if(this.#closed) throw new ShapeDiverViewerInteractionError('The InteractionEngine has already been closed.');
        for(const m in this.#managers)
            this.removeInteractionManager(m);
        this.#viewport.removeCanvasEventListener(this.#canvasEventListenerToken);
        this.#closed = true;
    }

    public addInteractionManager(manager: IInteractionManager): string {
        if(this.#closed) throw new ShapeDiverViewerInteractionError('The InteractionEngine has already been closed.');
        const token = this.#uuidGenerator.create();
        this.#managers[token] = manager;
        manager.add(this.#viewport);
        return token;
    }

    public onKeyDown(event: KeyboardEvent): void {        
        if(this.#closed) return;
    }

    public onKeyUp(event: KeyboardEvent): void {        
        if(this.#closed) return;
    }

    public onPointerDown(event: PointerEvent): void {
        if(this.#closed) return;
        const ray = this.#viewport.pointerEventToRay(event);
        this.onDown(event, ray);
    }

    public onPointerEnd(event: PointerEvent): void {
        if(this.#closed) return;
    }

    public onPointerMove(event: PointerEvent): void {
        if(this.#closed) return;
        const ray = this.#viewport.pointerEventToRay(event);
        this.onMove(event, ray);
    }

    public onPointerOut(event: PointerEvent): void {
        if(this.#closed) return;
        const ray = this.#viewport.pointerEventToRay(event);
        this.onEnd(event, ray, INTERACTION_STATE.OUT);
    }

    public onPointerUp(event: PointerEvent): void {
        if(this.#closed) return;
        const ray = this.#viewport.pointerEventToRay(event);
        this.onEnd(event, ray, INTERACTION_STATE.UP);
    }

    public onMouseWheel(event: WheelEvent): void {
        if(this.#closed) return;
    }

    public removeInteractionManager(token: string): boolean {
        if(this.#closed) throw new ShapeDiverViewerInteractionError('The InteractionEngine has already been closed.');
        if(!this.#managers[token]) return false;
        this.#managers[token].remove();
        delete this.#managers[token];
        return true;
    }

    // #endregion Public Methods (14)

    // #region Private Methods (5)

    /**
     * Apply all filters for the intersection of the scene.
     * Call all according interaction managers with the results.
     * 
     * @param ray 
     */
    private onDown(event: PointerEvent, ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for(const m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.DOWN));

        const intersections = this.#intersectionEngine.intersect(ray, filters, {opacity: this.#intersectionOpacity, rendererType: RENDERER_TYPE.ATTRIBUTES}, sceneTree.root, this.#viewport.id) || [];

        for(const m in this.#managers)
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
        for(const m in this.#managers)
            filters.push(this.#managers[m].filter(endState));

        for(const m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.END));
            
        const intersections = this.#intersectionEngine.intersect(ray, filters, {opacity: this.#intersectionOpacity, rendererType: RENDERER_TYPE.ATTRIBUTES}, sceneTree.root, this.#viewport.id) || [];

        for(const m in this.#managers)
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
        for(const m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.MOVE));

        const intersections = this.#intersectionEngine.intersect(ray, filters, {opacity: this.#intersectionOpacity, rendererType: RENDERER_TYPE.ATTRIBUTES}, sceneTree.root, this.#viewport.id) || [];

        for(const m in this.#managers)
            this.#managers[m].onMove(event, ray, intersections);
    }

    // #endregion Private Methods (5)
}