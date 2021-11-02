import { container, singleton } from "tsyringe";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { GeometryData, MaterialData } from "@shapediver/viewer.shared.types";
import { IInteractionFilterOptions, IInteractionManager } from "../interfaces/IInteractionManager";
import { mat4, vec3 } from "gl-matrix";
import { Plane } from "@shapediver/viewer.shared.math";
import { IViewer } from "@shapediver/viewer";

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

@singleton()
class DragConstraints {
    // #region Properties (2)

    private _dragOrigin?: vec3;
    private _dragPlane?: Plane;

    // #endregion Properties (2)

    // #region Public Methods (2)

    public intersect(ray: IRay): mat4 {
        const distance = this._dragPlane?.intersect(ray.origin, ray.direction);
        if (distance && distance > 0) {
            const point = vec3.add(vec3.create(), vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(distance, distance, distance)), ray.origin);
            const dragTranslation = vec3.sub(vec3.create(), point, this._dragOrigin!);
            return mat4.fromTranslation(mat4.create(), dragTranslation);
        }
        return mat4.create();
    }

    public setup(viewer: IViewer, ray: IRay, intersection: IIntersection): mat4 {
        const cameraDirection = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), viewer.camera!.target, viewer.camera!.position));
        this._dragPlane = new Plane().setFromNormalAndCoplanarPoint(cameraDirection, intersection.point);
        this._dragOrigin = intersection.point;
        return mat4.create();
    }

    // #endregion Public Methods (2)
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