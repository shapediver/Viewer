import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine'
import { ITreeNode, Tree } from '@shapediver/viewer.shared.node-tree'
import { mat4, vec3 } from 'gl-matrix'
import { EventEngine, EVENTTYPE, ShapeDiverViewerInteractionError, UuidGenerator } from '@shapediver/viewer.shared.services'
import { FLAG_TYPE, GeometryData, IGeometryData, IViewportApi } from '@shapediver/viewer'

import { IDragConstraint } from '../../interfaces/utils/IDragConstraint'
import { INTERACTION_STATE } from '../../interfaces/IInteractionEngine'
import { IInteractionFilterOptions } from '../../interfaces/IInteractionManager'
import { AbstractInteractionManager } from '../AbstractInteractionManager'
import { IDragAnchor, InteractionData } from '../InteractionData'
import { ITransformation, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { IDragEvent } from '../../interfaces/events/IDragEvent'

export class DragManager extends AbstractInteractionManager {
    // #region Properties (11)

    readonly #eventEngine: EventEngine = EventEngine.instance;
    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
    readonly #tree: Tree = Tree.instance;

    #dragConstraints: { [key: string]: IDragConstraint } = {};
    #effectMaterialToken?: string;
    #filter: IInteractionFilterOptions = (interactionState: INTERACTION_STATE): IIntersectionFilter => {
        if(interactionState === INTERACTION_STATE.DOWN) {
            return (node: ITreeNode) => {
                for(let i = 0; i < node.data.length; i++) {
                    if(node.data[i] instanceof InteractionData) {
                        if((<InteractionData>node.data[i]).interactionTypes.drag)
                            return true;
                    }
                }
                return false;
            };
        }

        return (node: ITreeNode) => false;
    };

    #intersection: IIntersection | null = null;
    #node: ITreeNode | null = null;
    #setupOptions: {
        viewport: IViewportApi, 
        node: ITreeNode, 
        ray: IRay, 
        intersection: IIntersection
    } | null = null;
    #tokenCameraFreeze!: string;
    #tokenContinuousRendering!: string;
    #tokenContinuousShadowMapUpdate!: string;
    #nodeWorldMatrix: mat4 = mat4.create();
    #nodeWorldMatrixInverse: mat4 = mat4.create();
    #previousDragMatrix: mat4 = mat4.create();
    
    #groupedNodes?: ITreeNode[];
    #groupEffectMaterialToken?: string[];

    // #endregion Properties (11)

    // #region Public Accessors (1)

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (7)

    public add(viewport: IViewportApi): void {
        this.viewport = viewport;
    }

    public remove(): void {
        this.removeNode();
        this.viewport = undefined;
    }

    /**
     * Add a new drag constraint.
     * Returns a token that is used for removing the drag constraint via {@link removeDragConstraint}.
     * 
     * @param constraint 
     * @returns 
     */
    public addDragConstraint(constraint: IDragConstraint): string {
        const token = this.#uuidGenerator.create();
        this.#dragConstraints[token] = constraint;
        if(this.#setupOptions) constraint.setup(this.#setupOptions.viewport, this.#setupOptions.node, this.#setupOptions.ray, this.#setupOptions.intersection, this.#previousDragMatrix);
        return token;
    }

    public onDown(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        const intersections = intersection.filter( i => this.filter(INTERACTION_STATE.DOWN)(i.node))
        if(intersections.length > 0) 
            this.setNode(intersections[0].node, intersection[0].geometryData, intersections[0].distance, intersections[0].point, event, ray);
    }

    public onEnd(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        if(!this.#node) return;

        let transformation = this.dragConstraintUtils.intersect(this.#dragConstraints, this.viewport, this.#node!, ray);
        let transformationMatrix = mat4.multiply(mat4.create(), mat4.multiply(mat4.create(), this.#nodeWorldMatrixInverse, transformation.matrix), this.#nodeWorldMatrix)
        
        // apply the transformation for the main node
        this.applyTransformation(this.#node, transformationMatrix);
        this.viewport.updateNodeTransformation(this.#node!);
        
        // and apply it for all grouped nodes
        if (this.#groupedNodes) {
            this.#groupedNodes.forEach(n => {
                this.applyTransformation(n, transformationMatrix!);
                this.viewport!.updateNodeTransformation(n);
            })
        }

        this.removeNode(event, ray);
    }

    public onMove(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void {        
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        if(!this.#node) return;

        let transformation = this.dragConstraintUtils.intersect(this.#dragConstraints, this.viewport, this.#node!, ray);
        let transformationMatrix = mat4.multiply(mat4.create(), mat4.multiply(mat4.create(), this.#nodeWorldMatrixInverse, transformation.matrix), this.#nodeWorldMatrix)
        
        // apply the transformation for the main node
        this.applyTransformation(this.#node, transformationMatrix);
        this.viewport.updateNodeTransformation(this.#node!);
        
        // and apply it for all grouped nodes
        if (this.#groupedNodes) {
            this.#groupedNodes.forEach(n => {
                this.applyTransformation(n, transformationMatrix!);
                this.viewport!.updateNodeTransformation(n);
            })
        }

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.DRAG_MOVE,
            {
                viewportId: this.viewport.id,
                node: this.#node,
                matrix: transformationMatrix,
                ray,
                event,
                dragConstraint: transformation.dragConstraint,
                dragAnchor: transformation.dragAnchor,
                manager: this,
                groupedNodes: this.#groupedNodes
            } as IDragEvent
        );
    }

    /**
     * Remove the drag constraint that was added via {@link removeDragConstraint}.
     * 
     * @param token 
     * @returns 
     */
    public removeDragConstraint(token: string): boolean {
        if(!this.#dragConstraints[token]) return false;
        delete this.#dragConstraints[token];
        return true;
    }

    /**
     * Remove the node as the currently used drag node.
     * 
     * @returns 
     */
    public removeNode(event?: MouseEvent | TouchEvent, ray?: IRay) {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        if(!this.#node) return;

        let transformationMatrix: mat4 | undefined,
            transformation: {
                dragConstraint?: IDragConstraint;
                matrix: mat4;
                dragAnchor?: IDragAnchor;
            } | undefined;

        // if we have everything we need (the ray) than we try one last time to calculate the transformation
        if(ray) {
            transformation = this.dragConstraintUtils.intersect(this.#dragConstraints, this.viewport, this.#node!, ray);
            transformationMatrix = mat4.multiply(mat4.create(), mat4.multiply(mat4.create(), this.#nodeWorldMatrixInverse, transformation.matrix), this.#nodeWorldMatrix)
            
            // apply the transformation for the main node
            this.applyTransformation(this.#node, transformationMatrix);
            this.viewport.updateNodeTransformation(this.#node!);

            // and apply it for all grouped nodes
            if(this.#groupedNodes) {
                this.#groupedNodes.forEach(n => {
                    this.applyTransformation(n, transformationMatrix!);
                    this.viewport!.updateNodeTransformation(n);
                })
            }
        } else {
            transformationMatrix = this.#node.transformations.find((t: ITransformation) => t.id === 'SD_drag_matrix')?.matrix;
        }

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.DRAG_END, {
            viewportId: this.viewport.id,
            node: this.#node,
            matrix: transformationMatrix,
            event,
            ray,
            dragConstraint: transformation?.dragConstraint,
            dragAnchor: transformation?.dragAnchor,
            manager: this,
            groupedNodes: this.#groupedNodes
        } as IDragEvent);
        this.#setupOptions = null;

        // optional removal
        // this.removeTransformation(this.#node!);
        this.viewport.updateNode(this.#node!);

        // and update all grouped nodes
        if (this.#groupedNodes) 
            this.#groupedNodes.forEach(n => this.viewport!.updateNode(n))

        this.deactivateNode();
        
        this.viewport.removeFlag(this.#tokenCameraFreeze);
        this.viewport.removeFlag(this.#tokenContinuousRendering);
        this.viewport.removeFlag(this.#tokenContinuousShadowMapUpdate);
    }

    /**
     * Set the current dragged node.
     * This will serve as the start of the drag event.
     * This function is also called internally at onDown events.
     * 
     * @param node 
     * @param distance 
     * @param intersectionPoint 
     * @param ray 
     */
    public setNode(node: ITreeNode, geometryData: IGeometryData, distance: number = 0, intersectionPoint: vec3 = vec3.create(), event?: MouseEvent | TouchEvent, ray: IRay = {origin: vec3.create(), direction: vec3.create()}) {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');

        this.activateNode({node, distance, point: intersectionPoint, geometryData: geometryData});
        this.#setupOptions = { viewport: this.viewport, node: this.#node!, ray, intersection: this.#intersection! };
        
        let transformation = this.dragConstraintUtils.setup(this.#dragConstraints, this.viewport, this.#node!, ray, this.#intersection!, this.#previousDragMatrix);
        let transformationMatrix = mat4.multiply(mat4.create(), mat4.multiply(mat4.create(), this.#nodeWorldMatrixInverse, transformation.matrix), this.#nodeWorldMatrix)
        
        // apply the transformation for the main node
        this.applyTransformation(this.#node!, transformationMatrix);
        this.viewport.updateNode(this.#node!);

        // and apply it for all grouped nodes
        if(this.#groupedNodes) {
            this.#groupedNodes.forEach(n => {
                this.applyTransformation(n, transformationMatrix);
                this.viewport!.updateNode(n);
            })
        }

        this.#tokenCameraFreeze = this.viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);
        this.#tokenContinuousRendering = this.viewport.addFlag(FLAG_TYPE.CONTINUOUS_RENDERING);
        this.#tokenContinuousShadowMapUpdate = this.viewport.addFlag(FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE);
        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.DRAG_START, { 
            viewportId: this.viewport.id,
            node: this.#node, 
            matrix: transformationMatrix,
            intersectionPoint,
            ray,
            event,
            dragConstraint: transformation.dragConstraint,
            dragAnchor: transformation.dragAnchor,
            manager: this,
            groupedNodes: this.#groupedNodes
        } as IDragEvent);
    }

    // #endregion Public Methods (7)

    // #region Private Methods (4)

    /**
     * Utility function to make the node the current active node.
     * Set the according values, apply the effect and emit the event.
     * 
     * @param intersection 
     */
    private activateNode(intersection: IIntersection) {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        this.#intersection = intersection;
        this.#node = this.#intersection.node;
        this.#groupedNodes = undefined;
        this.#groupEffectMaterialToken = undefined;

        // find the interaction data
        const data = <InteractionData>this.#node!.data.find((d: ITreeNodeData) => d instanceof InteractionData);
        if(data) data.interactionStates.drag = true;

        // find and store all nodes that are within the group
        if(data.groupId) {
            this.#groupedNodes = this.gatheredGroupedNodes[data.groupId] || [];
            this.#groupEffectMaterialToken = [];
        }

        // remove the previous transformation of the dragged node (and all grouped within)
        this.#previousDragMatrix = this.removeTransformation(this.#node)
        if(this.#groupedNodes) this.#groupedNodes!.forEach(n => this.removeTransformation(n));

        // store the initial world matrix and its inverse
        this.#nodeWorldMatrix = this.#node.worldMatrix;
        this.#nodeWorldMatrixInverse = mat4.invert(mat4.create(), this.#nodeWorldMatrix);
        
        // apply the effect material if there is something to apply
        if (this.effectMaterial) {
            this.#effectMaterialToken = this.interactionEffectUtils.applyEffectMaterial(this.#node, this.effectMaterial)
            if(this.#groupedNodes) this.#groupedNodes!.forEach(n => this.#groupEffectMaterialToken!.push(this.interactionEffectUtils.applyEffectMaterial(n, this.effectMaterial!)))
        } else {
            this.#effectMaterialToken = undefined;
        }

        // update the node
        this.viewport.updateNode(this.#node);
        if(this.#groupedNodes) this.#groupedNodes!.forEach(n => this.viewport!.updateNode(n));

        this.viewport.render();
    }

    /**
     * Utility function to apply the transformation to the current node.
     * 
     * @param node 
     * @param matrix 
     */
    private applyTransformation(node: ITreeNode, matrix: mat4) {
        const index = node.transformations.findIndex((t: ITransformation) => t.id === 'SD_drag_matrix');
        if(index !== -1) { 
            node.transformations[index].matrix = matrix;
        } else {
            node.addTransformation({ id: 'SD_drag_matrix', matrix })
        }
    }

    /**
     * Utility function to make the node inactive.
     * Set the according values, remove the effect and emit the event.
     * 
     * @param intersection 
     */
    private deactivateNode() {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');

        // find the interaction data
        const data = <InteractionData>this.#node!.data.find((d: ITreeNodeData) => d instanceof InteractionData);
        if(data) data.interactionStates.drag = false;


        if(this.#effectMaterialToken) {
            this.interactionEffectUtils.removeEffectMaterial(this.#node!, this.#effectMaterialToken);
            this.#effectMaterialToken = undefined;

            if(this.#groupedNodes) this.#groupedNodes!.forEach((n, i) => this.interactionEffectUtils.removeEffectMaterial(n, this.#groupEffectMaterialToken![i]));
            this.#groupEffectMaterialToken = undefined;
        }

        this.viewport.updateNode(this.#node!);
        if(this.#groupedNodes) this.#groupedNodes!.forEach(n => this.viewport!.updateNode(n));
        
        this.viewport.render();

        this.#intersection = null;
        this.#node = null;
        
        this.#groupedNodes = undefined;
        this.#groupEffectMaterialToken = undefined;
    }

    private removeTransformation(node: ITreeNode): mat4 {
        const index = node.transformations.findIndex((t: ITransformation) => t.id === 'SD_drag_matrix');
        if(index !== -1) {
            const matrix = mat4.clone(node.transformations[index].matrix);
            node.removeTransformation(node.transformations[index]);
            return matrix;
        } 
        return mat4.create();
    }

    // #endregion Private Methods (4)
}