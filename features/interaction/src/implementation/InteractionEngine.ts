import { vec3 } from "gl-matrix";
import { Logger, LOGGING_TOPIC, UuidGenerator, ShapeDiverViewerGeneralError } from "@shapediver/viewer.shared.services";
import { IInteractionEngine, INTERACTION_STATE } from "../interfaces/IInteractionEngine";
import { container } from "tsyringe";
import { IIntersectionFilter, IntersectionEngine, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IInteractionManager } from "../interfaces/IInteractionManager";
import { IViewportApi, sceneTree } from "@shapediver/viewer";

export class InteractionEngine implements IInteractionEngine {
    // #region Properties (5)

    readonly #intersectionEngine: IntersectionEngine = <IntersectionEngine>container.resolve(IntersectionEngine);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #managers: { [key: string]: IInteractionManager } = {};
    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    readonly #viewport: IViewportApi;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(viewport: IViewportApi) {
        this.#viewport = viewport;
        this.#viewport.addCanvasEventListener(this);
    }

    // #endregion Constructors (1)

    // #region Public Methods (10)

    public addInteractionManager(manager: IInteractionManager): string {
        const token = this.#uuidGenerator.create();
        this.#managers[token] = manager;
        manager.viewport = this.#viewport;
        manager.add();
        return token;
    }

    public onKeyDown(event: KeyboardEvent): void {}

    public onMouseDown(event: MouseEvent): void {
        const ray = this.mouseEventToRay(event);
        this.onDown(ray);
    }

    public onMouseMove(event: MouseEvent): void {
        const ray = this.mouseEventToRay(event);
        this.onMove(ray);
    }

    public onMouseEnd(event: MouseEvent): void {}
    
    public onMouseUp(event: WheelEvent): void {
        const ray = this.mouseEventToRay(event);
        this.onEnd(ray, INTERACTION_STATE.UP);
    }
    
    public onMouseOut(event: WheelEvent): void {
        const ray = this.mouseEventToRay(event);
        this.onEnd(ray, INTERACTION_STATE.OUT);
    }

    public onMouseWheel(event: WheelEvent): void {}

    public onTouchEnd(event: TouchEvent): void {}

    public onTouchMove(event: TouchEvent): void {
        if ( event.touches.length > 1 ) return;
        const touch = event.changedTouches[ 0 ];

        const ray = this.touchToRay(touch);
        this.onMove(ray);
    }

    public onTouchStart(event: TouchEvent): void {
        if ( event.touches.length > 1 ) return;
        const touch = event.changedTouches[ 0 ];

        const ray = this.touchToRay(touch);
        this.onDown(ray);
    }

    public onTouchCancel(event: TouchEvent): void {
        if ( event.touches.length > 1 ) return;
        const touch = event.changedTouches[ 0 ];

        const ray = this.touchToRay(touch);
        this.onEnd(ray, INTERACTION_STATE.OUT);
    }

    public onTouchUp(event: TouchEvent): void {
        if ( event.touches.length > 1 ) return;
        const touch = event.changedTouches[ 0 ];

        const ray = this.touchToRay(touch);
        this.onEnd(ray, INTERACTION_STATE.UP);
    }

    public removeInteractionManager(token: string): boolean {
        if(!this.#managers[token]) return false;
        this.#managers[token].remove();
        delete this.#managers[token];
        return true;
    }

    // #endregion Public Methods (10)

    // #region Private Methods (5)

    /**
     * Calculate the ray that is created by the mouse event and the camera.
     * 
     * @param event 
     * @returns 
     */
    private mouseEventToRay(event: MouseEvent): {
        origin: vec3,
        direction: vec3
    } {
        const rect = this.#viewport.canvas.getBoundingClientRect();
        const camera = this.#viewport.camera;
        if (!camera) {
            const error = new ShapeDiverViewerGeneralError('InteractionEngine.mouseEventToRay: No camera is defined for this viewer.');
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWPORT, `InteractionEngine.mouseEventToRay`, error);
        }

        let _mouse_x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        let _mouse_y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

        let origin = vec3.clone(camera.position);
        let direction = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), camera.unproject(vec3.fromValues(_mouse_x, _mouse_y, 0.5)), origin));

        return { origin, direction };
    }

    /**
     * Apply all filters for the intersection of the scene.
     * Call all according interaction managers with the results.
     * 
     * @param ray 
     */
    private onDown(ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for(let m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.DOWN));

        const intersection = this.#intersectionEngine.intersect(ray, filters, sceneTree.root, this.#viewport.id) || [];

        for(let m in this.#managers)
            this.#managers[m].onDown(ray, intersection);
    }

    /**
     * Apply all filters for the intersection of the scene.
     * Call all according interaction managers with the results.
     * 
     * @param ray 
     */
    private onEnd(ray: IRay, endState: INTERACTION_STATE): void {
        const filters: IIntersectionFilter[] = [];
        for(let m in this.#managers)
            filters.push(this.#managers[m].filter(endState));

        for(let m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.END));
            
        const intersection = this.#intersectionEngine.intersect(ray, filters, sceneTree.root, this.#viewport.id) || [];

        for(let m in this.#managers)
            this.#managers[m].onEnd(ray, intersection, endState);
    }

    /**
     * Apply all filters for the intersection of the scene.
     * Call all according interaction managers with the results.
     * 
     * @param ray 
     */
    private onMove(ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for(let m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.MOVE));

        const intersection = this.#intersectionEngine.intersect(ray, filters, sceneTree.root, this.#viewport.id) || [];

        for(let m in this.#managers)
            this.#managers[m].onMove(ray, intersection);
    }

    /**
     * Create the ray that is created by the touch event and the camera.
     * 
     * @param event 
     * @returns 
     */
    private touchToRay(event: Touch): {
        origin: vec3,
        direction: vec3
    } {
        const rect = this.#viewport.canvas.getBoundingClientRect();
        const camera = this.#viewport.camera;
        if (!camera) {
            const error = new ShapeDiverViewerGeneralError('InteractionEngine.touchToRay: No camera is defined for this viewer.');
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWPORT, `InteractionEngine.touchToRay`, error);
        }

        let _mouse_x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        let _mouse_y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

        let origin = vec3.clone(camera.position);
        let direction = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), camera.unproject(vec3.fromValues(_mouse_x, _mouse_y, 0.5)), origin));

        return { origin, direction };
    }

    // #endregion Private Methods (5)
}