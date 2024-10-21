import { CameraPlaneRestriction, CameraPlaneRestrictionProperties } from './restrictions/camera_plane/CameraPlaneRestriction';
import { GeometryMathManager } from './GeometryMathManager';
import { GeometryRestriction, GeometryRestrictionProperties } from './restrictions/geometry/GeometryRestriction';
import { IIntersection, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import {
    IRestriction,
    RayTraceResult,
    RESTRICTION_TYPE,
    RestrictionMetaData,
    RestrictionProperties
} from '../interfaces/IRestriction';
import { IRestrictionManager } from '../interfaces/IRestrictionManager';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { IViewportApi } from '@shapediver/viewer';
import { IVisualizationSettings } from '../interfaces/IVisualizationSettings';
import { LineRestriction, LineRestrictionProperties } from './restrictions/line/LineRestriction';
import { mat4, vec3 } from 'gl-matrix';
import { PlaneRestriction, PlaneRestrictionProperties } from './restrictions/plane/PlaneRestriction';
import { PointRestriction, PointRestrictionProperties } from './restrictions/point/PointRestriction';
import { UuidGenerator } from '@shapediver/viewer.shared.services';

export class RestrictionManager implements IRestrictionManager {
    // #region Properties (7)

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

    #showRestrictionVisualization: boolean = false;

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(
        viewport: IViewportApi,
        parentNode?: ITreeNode,
        restrictions?: { [token: string]: RestrictionProperties },
        settings?: IVisualizationSettings
    ) {
        this.#viewport = viewport;
        this.#parentNode = parentNode || new TreeNode('RestrictionManagerNode');
        if (settings) this.#settings = settings;
        this.#geometryMathManager = new GeometryMathManager(this.#viewport, this.#settings);

        if (restrictions) {
            for (const restrictionToken in restrictions) {
                this.addRestriction(restrictions[restrictionToken], restrictionToken);
            }
        }
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (3)

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

    // #endregion Public Getters And Setters (3)

    // #region Public Methods (6)

    public addRestriction(properties: RestrictionProperties, token?: string): string | undefined {
        token = token || this.#uuidGenerator.create();
        console.log("addRestriction", this.#viewport, properties, token);

        let restriction: IRestriction | undefined;
        if (properties.type === RESTRICTION_TYPE.PLANE) {
            restriction = new PlaneRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#parentNode,
                token,
                this.#settings,
                properties as PlaneRestrictionProperties
            );
        } else if (properties.type === RESTRICTION_TYPE.GEOMETRY) {
            restriction = new GeometryRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#parentNode,
                token,
                this.#settings,
                properties as GeometryRestrictionProperties
            );
        } else if (properties.type === RESTRICTION_TYPE.CAMERA_PLANE) {
            restriction = new CameraPlaneRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#parentNode,
                token,
                this.#settings,
                properties as CameraPlaneRestrictionProperties
            );
        } else if (properties.type === RESTRICTION_TYPE.POINT) {
            restriction = new PointRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#parentNode,
                token,
                this.#settings,
                properties as PointRestrictionProperties
            );
        } else if (properties.type === RESTRICTION_TYPE.LINE) {
            restriction = new LineRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#parentNode,
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
        Object.keys(this.#restrictions).forEach(key => this.removeRestriction(key));
    }

    public getRestriction(token: string): IRestriction | undefined {
        return this.#restrictions[token];
    }

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): RayTraceResult | undefined {
        let rayTracingResult: RayTraceResult | undefined = undefined;

        // create an array of arrays with the restrictions sorted by priority
        const restrictionsSorted = Object.values(this.#restrictions).sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const restriction of restrictionsSorted) {
            if (rayTracingResult && rayTracingResult.restriction.priority > restriction.priority) break;

            const hit = restriction.rayTrace(ray, metaData);

            if (!hit) continue;
            const distance = hit.distance !== undefined ? hit.distance : vec3.squaredDistance(ray.origin, hit.point);
            if (distance < (rayTracingResult ? rayTracingResult.distance! : Infinity)) {
                rayTracingResult = {
                    restriction: restriction,
                    transformation: hit.transformation,
                    dragAnchor: hit.dragAnchor,
                    point: hit.point,
                    distance: distance
                };
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

    public setup(node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4, dragOrigin?: vec3): RayTraceResult | undefined {
        let rayTracingResult: RayTraceResult | undefined = undefined;

        // create an array of arrays with the restrictions sorted by priority
        const restrictionsSorted = Object.values(this.#restrictions).sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const restriction of restrictionsSorted) {
            const hit = restriction.setup(node, ray, intersection, previousDragMatrix, dragOrigin);

            if (!hit) continue;
            const distance = hit.distance !== undefined ? hit.distance : vec3.squaredDistance(ray.origin, hit.point);
            if (distance < (rayTracingResult ? rayTracingResult.distance! : Infinity)) {
                rayTracingResult = {
                    restriction: restriction,
                    transformation: hit.transformation,
                    dragAnchor: hit.dragAnchor,
                    point: hit.point,
                    distance: distance
                };
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
        return rayTracingResult;
    }

    // #endregion Public Methods (6)
}