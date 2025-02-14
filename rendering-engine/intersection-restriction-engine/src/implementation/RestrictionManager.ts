import { calculateDragMatrix } from './restrictions/RestrictionsHelper';
import { CameraPlaneRestriction, CameraPlaneRestrictionProperties } from './restrictions/camera_plane/CameraPlaneRestriction';
import {
    DraggingRestrictionMetaData,
    DrawingRestrictionMetaData,
    IRestriction,
    isDraggingRestriction,
    RayTraceResult,
    RESTRICTION_TYPE,
    RestrictionProperties
} from '../interfaces/IRestriction';
import { EventManager } from './EventManager';
import { GeometryMathManager } from './GeometryMathManager';
import { GeometryRestriction, GeometryRestrictionProperties } from './restrictions/geometry/GeometryRestriction';
import { IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { IRestrictionManager } from '../interfaces/IRestrictionManager';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { IViewportApi, sceneTree } from '@shapediver/viewer';
import { IVisualizationSettings } from '../interfaces/IVisualizationSettings';
import { LineRestriction, LineRestrictionProperties } from './restrictions/line/LineRestriction';
import { vec3 } from 'gl-matrix';
import { PlaneRestriction, PlaneRestrictionProperties } from './restrictions/plane/PlaneRestriction';
import { PointRestriction, PointRestrictionProperties } from './restrictions/point/PointRestriction';
import { UuidGenerator } from '@shapediver/viewer.shared.services';

export class RestrictionManager implements IRestrictionManager {
    // #region Properties (11)

    readonly #eventManager: EventManager;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #parentNode: ITreeNode;
    readonly #restrictions: { [token: string]: IRestriction } = {};
    readonly #settings: IVisualizationSettings = {
        distanceLabels: true,
        distanceMultiplicationFactor: 2,
        lines: {
            color: '#0d44f0'
        },
        pointLabels: false,
        points: {
            size_0: 15, size_1: 20, size_2: 15, size_3: 20, size_4: 15, size_5: 20,
            color_0: '#0d44f0', color_1: '#197aeb', color_2: '#9e27d8', color_3: '#bc47fd', color_4: '#00ff78', color_5: '#00ff78'
        }
    };
    readonly #uuidGenerator = UuidGenerator.instance;
    readonly #viewport: IViewportApi;

    #closed: boolean = false;
    #keysPressed: { [key: string]: boolean } = {};
    #restrictionManagerNode: ITreeNode;
    #showRestrictionVisualization: boolean = false;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(
        viewport: IViewportApi,
        parentNode: ITreeNode = sceneTree.root,
        restrictions?: RestrictionProperties[],
        settings?: IVisualizationSettings
    ) {
        this.#viewport = viewport;
        this.#parentNode = parentNode;
        this.#restrictionManagerNode = new TreeNode('RestrictionManager');
        this.#parentNode.addChild(this.#restrictionManagerNode);
        this.#parentNode.updateVersion(false, false);

        if (settings) this.#settings = settings;
        this.#geometryMathManager = new GeometryMathManager(this.#viewport, this.#settings);

        this.#eventManager = new EventManager(this.#viewport, {
            onDown: this.onDown.bind(this),
            onUp: this.onUp.bind(this),
            onOut: this.onOut.bind(this),
            onMove: this.onMove.bind(this),
            onKeyDown: this.onKeyDown.bind(this),
            onKeyUp: this.onKeyUp.bind(this)
        });

        if (restrictions) {
            for (const r of restrictions) {
                this.addRestriction(r);
            }
        }
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get closed(): boolean {
        return this.#closed;
    }

    public get restrictions(): { [token: string]: IRestriction } {
        return this.#restrictions;
    }

    public get showRestrictionVisualization(): boolean {
        return this.#showRestrictionVisualization;
    }

    public set showRestrictionVisualization(value: boolean) {
        this.#showRestrictionVisualization = value;
        for (const restriction of Object.values(this.#restrictions)) {
            restriction.showVisualization = value;
            for (const snapRestriction of Object.values(restriction.snapRestrictions)) {
                snapRestriction.showVisualization = value;
            }
        }
    }

    // #endregion Public Getters And Setters (4)

    // #region Public Methods (6)

    public addRestriction(properties: RestrictionProperties): string | undefined {
        const token = properties.id || this.#uuidGenerator.create();

        let restriction: IRestriction | undefined;
        if (properties.type === RESTRICTION_TYPE.PLANE) {
            restriction = new PlaneRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#restrictionManagerNode,
                token,
                this.#settings,
                properties as PlaneRestrictionProperties
            );
        } else if (properties.type === RESTRICTION_TYPE.GEOMETRY) {
            restriction = new GeometryRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#restrictionManagerNode,
                token,
                this.#settings,
                properties as GeometryRestrictionProperties
            );
        } else if (properties.type === RESTRICTION_TYPE.CAMERA_PLANE) {
            restriction = new CameraPlaneRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#restrictionManagerNode,
                token,
                this.#settings,
                properties as CameraPlaneRestrictionProperties
            );
        } else if (properties.type === RESTRICTION_TYPE.POINT) {
            restriction = new PointRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#restrictionManagerNode,
                token,
                this.#settings,
                properties as PointRestrictionProperties
            );
        } else if (properties.type === RESTRICTION_TYPE.LINE) {
            restriction = new LineRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#restrictionManagerNode,
                token,
                this.#settings,
                properties as LineRestrictionProperties
            );
        }

        if (restriction) {
            this.#restrictions[token] = restriction;
            return token;
        }
        return;
    }

    public close(): void {
        this.#closed = true;
        this.#parentNode.removeChild(this.#restrictionManagerNode);
        this.#parentNode.updateVersion(false, false);
        this.#eventManager.close();
        this.#geometryMathManager.close();
        Object.keys(this.#restrictions).forEach(key => this.removeRestriction(key));
    }

    public getPressedKeys(): string[] {
        return Object.keys(this.#keysPressed).filter(key => this.#keysPressed[key] === true);
    }

    public getRestriction(token: string): IRestriction | undefined {
        return this.#restrictions[token];
    }

    public rayTrace(ray: IRay, metaData: DrawingRestrictionMetaData | DraggingRestrictionMetaData): RayTraceResult | undefined {
        const rayTracingResults: RayTraceResult[] = [];

        metaData.pressedKeys = this.getPressedKeys();

        for (const restrictionId in this.#restrictions) {
            const restriction = this.#restrictions[restrictionId];

            const hit = restriction.rayTrace(ray, metaData);
            if (!hit) continue;
            
            const distanceSquared = hit.distance !== undefined ? hit.distance * hit.distance : vec3.squaredDistance(ray.origin, hit.closestPointOnRay || hit.point);
            if (distanceSquared >= Infinity) continue;

            if (isDraggingRestriction(metaData)) {
                const { matrix, dragAnchor } = calculateDragMatrix(hit.point, (hit.restriction as IRestriction).rotation, metaData.dragOrigin, metaData.dragAnchors, hit.closestPointOnRay || hit.point);

                rayTracingResults.push({
                    restriction: restriction,
                    transformation: matrix,
                    dragAnchor: dragAnchor,
                    point: hit.point,
                    closestPointOnRay: hit.closestPointOnRay,
                    distanceSquared: distanceSquared
                });
            } else {
                rayTracingResults.push({
                    restriction: restriction,
                    point: hit.point,
                    closestPointOnRay: hit.closestPointOnRay,
                    distanceSquared: distanceSquared
                });
            }
        }

        if (rayTracingResults.length === 0) return;

        // first, sort the results by distance
        rayTracingResults.sort((a, b) => a.distanceSquared! - b.distanceSquared!);

        /**
         * We iterate over the results and check if the restriction with the higher priority has a radius 
         * and if the hit of the restriction with the higher priority is within the radius of the restriction with the lower priority.
         * 
         * If this is the case, we set the restriction with the higher priority as the hit restriction.
         */
        let rayTracingResult: RayTraceResult = rayTracingResults[0];
        for (const result of rayTracingResults) {
            // if the priority of the restriction is higher than the priority of the restriction that is currently hit
            if (result.restriction.priority > rayTracingResult.restriction.priority) {
                // check if the closest point of the restriction with the higher priority is within the radius of the restriction with the lower priority
                const hitHigherPriority = result.closestPointOnRay || result.point;
                if (rayTracingResult.restriction instanceof PointRestriction || rayTracingResult.restriction instanceof LineRestriction) {
                    if(rayTracingResult.restriction.isWithinRadius(hitHigherPriority)) {
                        rayTracingResult = result;
                    }
                }
            }
        }

        // deactivate the visualization of all restrictions that are not hit
        for (const restriction of Object.values(this.#restrictions)) {
            if (rayTracingResult && restriction !== rayTracingResult.restriction) {
                for (const snapRestriction of Object.values(restriction.snapRestrictions)) {
                    snapRestriction.active = false;
                }
            }
        }

        // calculate the distance of the hit point for the final result
        if(rayTracingResult.distance === undefined && rayTracingResult.distanceSquared !== undefined)
            rayTracingResult.distance = Math.sqrt(rayTracingResult.distanceSquared);

        return rayTracingResult;
    }

    public removeRestriction(token: string): boolean {
        if (this.#restrictions[token]) {
            Object.values(this.#restrictions[token].snapRestrictions).forEach(r => r.removeVisualization());
            this.#restrictions[token].removeVisualization();
            delete this.#restrictions[token];
            return true;
        }
        return false;
    }

    // #endregion Public Methods (6)

    // #region Private Methods (6)

    private onDown(event: PointerEvent, ray: IRay): void {
        if (this.closed) return;
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (this.closed) return;

        this.#keysPressed[event.key] = true;
    }

    private onKeyUp(event: KeyboardEvent): void {
        if (this.closed) return;
        this.#keysPressed[event.key] = false;
    }

    private onMove(event: PointerEvent, ray: IRay): void {
        if (this.closed) return;
    }

    private onOut(): void {
        if (this.closed) return;
    }

    private onUp(): void {
        if (this.closed) return;
    }

    // #endregion Private Methods (6)
}