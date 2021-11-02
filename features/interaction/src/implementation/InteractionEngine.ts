import { IViewer } from "@shapediver/viewer";
import { vec3 } from "gl-matrix";
import { Logger, LOGGINGTOPIC, SDError, UuidGenerator } from "@shapediver/viewer.shared.services";
import { IInteractionEngine, INTERACTION_STATE } from "../interfaces/IInteractionEngine";
import { container } from "tsyringe";
import { IIntersectionFilter, IntersectionEngine, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IInteractionManager } from "../interfaces/IInteractionManager";

export class InteractionEngine implements IInteractionEngine {
    // #region Properties (4)

    private readonly _intersectionEngine: IntersectionEngine = <IntersectionEngine>container.resolve(IntersectionEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _managers: { [key: string]: IInteractionManager } = {};
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(private readonly _viewer: IViewer) {
        this._viewer.addCanvasEventListener(this);
    }

    // #endregion Constructors (1)

    // #region Public Methods (11)

    public addInteractionManager(manager: IInteractionManager): string {
        const token = this._uuidGenerator.create();
        this._managers[token] = manager;
        return token;
    }

    public mouseEventToRay(event: MouseEvent): {
        origin: vec3,
        direction: vec3
    } {
        const rect = this._viewer.canvas.getBoundingClientRect();
        const camera = this._viewer.camera;
        if (!camera) {
            const error = new SDError('RenderingEngine: No camera is defined for this viewer.');
            this._logger.warn(LOGGINGTOPIC.VIEWER, error.message);
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
        if(!this._managers[token]) return false;
        delete this._managers[token];
        return true;
    }

    // #endregion Public Methods (11)

    // #region Private Methods (3)

    private onDown(ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for(let m in this._managers)
            filters.push(this._managers[m].filter(INTERACTION_STATE.DOWN));

        const intersection = this._intersectionEngine.intersect(ray, filters) || [];

        for(let m in this._managers)
            this._managers[m].onDown(ray, intersection);
    }

    private onEnd(ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for(let m in this._managers)
            filters.push(this._managers[m].filter(INTERACTION_STATE.END));

        const intersection = this._intersectionEngine.intersect(ray, filters) || [];

        for(let m in this._managers)
            this._managers[m].onEnd(ray, intersection);
    }

    private onMove(ray: IRay): void {
        const filters: IIntersectionFilter[] = [];
        for(let m in this._managers)
            filters.push(this._managers[m].filter(INTERACTION_STATE.MOVE));

        const intersection = this._intersectionEngine.intersect(ray, filters) || [];

        for(let m in this._managers)
            this._managers[m].onMove(ray, intersection);
    }

    // #endregion Private Methods (3)
}