import { IViewer } from "@shapediver/viewer";
import { vec3 } from "gl-matrix";
import { Logger, LOGGINGTOPIC, SDError, UuidGenerator } from "@shapediver/viewer.shared.services";
import { IInteractionEngine, INTERACTION_STATE } from "../interfaces/IInteractionEngine";
import { container } from "tsyringe";
import { IIntersectionFilter, IntersectionEngine, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IInteractionManager } from "../interfaces/IInteractionManager";

export class InteractionEngine implements IInteractionEngine {
    // #region Properties (4)

    readonly #intersectionEngine: IntersectionEngine = <IntersectionEngine>container.resolve(IntersectionEngine);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #managers: { [key: string]: IInteractionManager } = {};
    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    readonly #viewer: IViewer;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(viewer: IViewer) {
        this.#viewer = viewer;
        this.#viewer.addCanvasEventListener(this);
    }

    // #endregion Constructors (1)

    // #region Public Methods (11)

    public addInteractionManager(manager: IInteractionManager): string {
        const token = this.#uuidGenerator.create();
        this.#managers[token] = manager;
        manager.viewer = this.#viewer;
        return token;
    }

    public mouseEventToRay(event: MouseEvent): {
        origin: vec3,
        direction: vec3
    } {
        const rect = this.#viewer.canvas.getBoundingClientRect();
        const camera = this.#viewer.camera;
        if (!camera) {
            const error = new SDError('RenderingEngine: No camera is defined for this viewer.');
            this.#logger.warn(LOGGINGTOPIC.VIEWER, error.message);
            throw error;
        }

        let _mouse_x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        let _mouse_y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

        let origin = vec3.clone(camera.position);
        let direction = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), camera.unproject(vec3.fromValues(_mouse_x, _mouse_y, 0.5)), origin));

        return { origin, direction };
    }

    public onKeyDown(event: KeyboardEvent): void {
        throw new Error("Method not implemented.");
    }

    public onMouseDown(event: MouseEvent): void {
        const ray = this.mouseEventToRay(event);
        this.onDown(ray);
    }

    public onMouseMove(event: MouseEvent): void {
        const ray = this.mouseEventToRay(event);
        this.onMove(ray);
    }

    public onMouseUp(event: MouseEvent): void {
        const ray = this.mouseEventToRay(event);
        this.onEnd(ray);
    }

    public onMouseWheel(event: WheelEvent): void {
        throw new Error("Method not implemented.");
    }

    public onTouchEnd(event: TouchEvent): void {
        throw new Error("Method not implemented.");
    }

    public onTouchMove(event: TouchEvent): void {
        throw new Error("Method not implemented.");
    }

    public onTouchStart(event: TouchEvent): void {
        throw new Error("Method not implemented.");
    }

    public removeInteractionManager(token: string): boolean {
        if(!this.#managers[token]) return false;
        delete this.#managers[token];
        return true;
    }

    // #endregion Public Methods (11)

    // #region Private Methods (3)

    private onDown(ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for(let m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.DOWN));

        const intersection = this.#intersectionEngine.intersect(ray, filters) || [];

        for(let m in this.#managers)
            this.#managers[m].onDown(ray, intersection);
    }

    private onEnd(ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for(let m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.END));

        const intersection = this.#intersectionEngine.intersect(ray, filters) || [];

        for(let m in this.#managers)
            this.#managers[m].onEnd(ray, intersection);
    }

    private onMove(ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for(let m in this.#managers)
            filters.push(this.#managers[m].filter(INTERACTION_STATE.MOVE));

        const intersection = this.#intersectionEngine.intersect(ray, filters) || [];

        for(let m in this.#managers)
            this.#managers[m].onMove(ray, intersection);
    }

    // #endregion Private Methods (3)
}