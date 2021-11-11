import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix';
import { IInteractionData } from '../interfaces/IInteractionData';

export class InteractionData extends AbstractTreeNodeData implements IInteractionData  {
    // #region Properties (4)

    #dragAnchors: { 
        position: vec3,
        rotation?: {
            axis: vec3,
            angle: number
        }
    }[] = [];
    #dragOrigin?: vec3;
    #interactionStates: { [key: string]: boolean; } = {};
    #interactionTypes: { [key: string]: boolean; } = {};

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * Creates a custom data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        interactionTypes: {
            [key: string]: boolean
        },
        id?: string
    ) {
        super(id);
        this.#interactionTypes = interactionTypes;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    public get dragAnchors(): { 
        position: vec3,
        rotation?: {
            axis: vec3,
            angle: number
        }
    }[] {
        return this.#dragAnchors;
    }

    public set dragAnchors(value: { 
        position: vec3,
        rotation?: {
            axis: vec3,
            angle: number
        }
    }[]) {
        this.#dragAnchors = value;
    }

    public get dragOrigin(): vec3 | undefined {
        return this.#dragOrigin;
    }

    public set dragOrigin(value: vec3 | undefined) {
        this.#dragOrigin = value;
    }

    public get interactionStates(): { [key: string]: boolean } {
        return this.#interactionStates;
    }

    public set interactionStates(value: { [key: string]: boolean }) {
        this.#interactionStates = value;
    }

    public get interactionTypes(): { [key: string]: boolean } {
        return this.#interactionTypes;
    }

    public set interactionTypes(value: { [key: string]: boolean }) {
        this.#interactionTypes = value;
    }

    // #endregion Public Accessors (8)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        return new InteractionData(this.#interactionTypes, this.id);
    }

    // #endregion Public Methods (1)
}
