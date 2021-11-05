import { container, singleton } from "tsyringe";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";
import { UuidGenerator } from "@shapediver/viewer.shared.services";
import { IDragConstraint } from "../interfaces/IDragConstraint";

@singleton()
export class DragConstraints {
    // #region Properties (2)

    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    #dragConstraints: { [key: string]: IDragConstraint } = {};
    #setupOptions: {
        viewer: IViewer, 
        node: TreeNode, 
        ray: IRay, 
        intersection: IIntersection
    } | null = null;

    // #endregion Properties (2)

    // #region Public Methods (4)

    public addDragConstraint(constraint: IDragConstraint): string {
        const token = this.#uuidGenerator.create();
        this.#dragConstraints[token] = constraint;
        if(this.#setupOptions) constraint.setup(this.#setupOptions.viewer, this.#setupOptions.node, this.#setupOptions.ray, this.#setupOptions.intersection);
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
        this.#setupOptions = { viewer, node, ray, intersection };
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

    public reset() {
        this.#setupOptions = null;
    }

    // #endregion Public Methods (4)
}