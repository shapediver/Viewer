import { container, singleton } from "tsyringe";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { GeometryData, MaterialData } from "@shapediver/viewer.shared.types";
import { IInteractionFilterOptions, IInteractionManager } from "../interfaces/IInteractionManager";
import { mat4, vec3 } from "gl-matrix";
import { Plane, Sphere } from "@shapediver/viewer.shared.math";
import { IViewer } from "@shapediver/viewer";
import { UuidGenerator } from "@shapediver/viewer.shared.services";

@singleton()
class Effects {
    // #region Public Methods (2)

    public applyEffect(node: TreeNode, material: MaterialData) {
        const applyEffect = (node: TreeNode) => {
            for (let i = 0; i < node.data.length; i++) {
                if (node.data[i] instanceof GeometryData) {
                    const geometryData = <GeometryData>node.data[i];
                    geometryData.primitive.effectMaterials.push(material);
                }
            }

            for (let i = 0; i < node.children.length; i++) {
                applyEffect(node.children[i])
            }
        }
        applyEffect(node);
        node.updateVersion();
    }

    public removeEffect(node: TreeNode, material: MaterialData) {
        const removeEffect = (node: TreeNode) => {
            for (let i = 0; i < node.data.length; i++) {
                if (node.data[i] instanceof GeometryData) {
                    const geometryData = <GeometryData>node.data[i];
                    const index = geometryData.primitive.effectMaterials.findIndex(e => e.id === material.id); 
                    if(index !== -1) geometryData.primitive.effectMaterials.splice(index, 1);
                }
            }

            for (let i = 0; i < node.children.length; i++) {
                removeEffect(node.children[i])
            }
        }
        removeEffect(node);
        node.updateVersion();
    }

    // #endregion Public Methods (2)
}

export interface IDragConstraint {
    // #region Public Methods (2)

    intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined;
    setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined;

    // #endregion Public Methods (2)
}

class DragConstraintPoint implements IDragConstraint {
    // #region Properties (2)

    private _dragOrigin?: vec3;

    // #endregion Properties (2)

    constructor(private readonly _point: vec3, private readonly _radius: number = 0) {}

    // #region Public Methods (2)

    public intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined {
        const pa = vec3.sub(vec3.create(), this._point, ray.origin);
        const dot = vec3.dot(pa, ray.direction);
        const d = vec3.multiply(vec3.create(), vec3.fromValues(dot, dot, dot), ray.direction);

        const closestPoint = vec3.sub(vec3.create(), pa, d);
        
        const distance = vec3.distance(closestPoint, this._point);
        if (distance < this._radius) {
            const point = vec3.add(vec3.create(), vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(distance, distance, distance)), ray.origin);
            const dragTranslation = vec3.sub(vec3.create(), this._point, this._dragOrigin!);
            return { distance, transformation: mat4.fromTranslation(mat4.create(), dragTranslation) };
        }
        return;
    }

    public setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined {       
        this._dragOrigin = intersection.point;
        return { distance: intersection.distance, transformation: mat4.create() };
    }

    // #endregion Public Methods (2)
}

class DragConstraintPlane implements IDragConstraint {
    // #region Properties (2)

    private _dragOrigin?: vec3;
    private _dragPlane?: Plane;

    // #endregion Properties (2)

    constructor(private readonly _normal: vec3, private readonly _coplanarPoint?: vec3) {
    }

    // #region Public Methods (2)

    public intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined {
        const distance = this._dragPlane?.intersect(ray.origin, ray.direction);
        if (distance && distance > 0) {
            const point = vec3.add(vec3.create(), vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(distance, distance, distance)), ray.origin);
            const dragTranslation = vec3.sub(vec3.create(), point, this._dragOrigin!);
            return { distance, transformation: mat4.fromTranslation(mat4.create(), dragTranslation) };
        }
        return;
    }

    public setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined {
        if(this._coplanarPoint) {
            this._dragPlane = new Plane().setFromNormalAndCoplanarPoint(this._normal, this._coplanarPoint);
        } else {
            this._dragPlane = new Plane().setFromNormalAndCoplanarPoint(this._normal, intersection.point);
        }

        return this.intersect(viewer, node, ray);
    }

    // #endregion Public Methods (2)
}

class DragConstraintCameraPlane implements IDragConstraint {
    // #region Properties (2)

    private _dragOrigin?: vec3;
    private _dragPlane?: Plane;

    // #endregion Properties (2)

    // #region Public Methods (2)

    public intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined {
        const distance = this._dragPlane?.intersect(ray.origin, ray.direction);
        if (distance && distance > 0) {
            const point = vec3.add(vec3.create(), vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(distance, distance, distance)), ray.origin);
            const dragTranslation = vec3.sub(vec3.create(), point, this._dragOrigin!);
            return { distance, transformation: mat4.fromTranslation(mat4.create(), dragTranslation) };
        }
        return;
    }

    public setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined {
        const cameraDirection = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), viewer.camera!.target, viewer.camera!.position));
        this._dragPlane = new Plane().setFromNormalAndCoplanarPoint(cameraDirection, intersection.point);
        this._dragOrigin = intersection.point;
        return { distance: intersection.distance, transformation: mat4.create() };
    }

    // #endregion Public Methods (2)
}

@singleton()
class DragConstraints {
    // #region Properties (2)

    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    #dragConstraints: { [key: string]: IDragConstraint } = {};

    constructor() {
        this.addDragConstraint(new DragConstraintCameraPlane());
        // this.addDragConstraint(new DragConstraintPlane(vec3.fromValues(1,0,0)));
        // this.addDragConstraint(new DragConstraintPlane(vec3.fromValues(1,0,0), vec3.fromValues(0,0,0)));
        this.addDragConstraint(new DragConstraintPoint(vec3.fromValues(0,0,0), 25));
    }

    // #endregion Properties (2)

    // #region Public Methods (4)

    public addDragConstraint(constraint: IDragConstraint): string {
        const token = this.#uuidGenerator.create();
        this.#dragConstraints[token] = constraint;
        return token;
    }

    public intersect(viewer: IViewer, node: TreeNode, ray: IRay): mat4 {
        const dragConstraintResults: { distance: number, transformation: mat4 }[] = [];
        for(let d in this.#dragConstraints) {
            const res = this.#dragConstraints[d].intersect(viewer, node, ray);
            if(res) dragConstraintResults.push(res);
        }

        if(dragConstraintResults.length > 0) {
            dragConstraintResults.sort((a, b) => a.distance - b.distance);
            return dragConstraintResults[0].transformation;        
        } else {
            return mat4.create();
        }
    }

    public removeDragConstraint(token: string): boolean {
        if(!this.#dragConstraints[token]) return false;
        delete this.#dragConstraints[token];
        return true;
    }

    public setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): mat4 {
        const dragConstraintResults: { distance: number, transformation: mat4 }[] = [];
        for(let d in this.#dragConstraints) {
            const res = this.#dragConstraints[d].setup(viewer, node, ray, intersection);
            if(res) dragConstraintResults.push(res);
        }

        if(dragConstraintResults.length > 0) {
            dragConstraintResults.sort((a, b) => a.distance - b.distance);
            return dragConstraintResults[0].transformation;        
        } else {
            return mat4.create();
        }
    }

    // #endregion Public Methods (4)
}

export abstract class AbstractInteractionManager implements IInteractionManager {
    // #region Properties (4)

    protected readonly _dragConstraints: DragConstraints = <DragConstraints>container.resolve(DragConstraints);
    protected readonly _effects: Effects = <Effects>container.resolve(Effects);
    protected readonly _viewer: IViewer;

    abstract filter: IInteractionFilterOptions;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(viewer: IViewer) {
        this._viewer = viewer;
    }

    // #endregion Constructors (1)

    // #region Public Abstract Methods (3)

    abstract onDown(ray: IRay, intersection: IIntersection[]): void;
    abstract onEnd(ray: IRay, intersection: IIntersection[]): void;
    abstract onMove(ray: IRay, intersection: IIntersection[]): void;

    // #endregion Public Abstract Methods (3)
}