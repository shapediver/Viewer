import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix';

export class InteractionData extends AbstractTreeNodeData {
    // #region Properties (8)

    #interactionTypes: { [key: string]: boolean; } = {};
    #dragOrigin?: vec3;
    #dragAnchors: { position: vec3 }[] = [];
    #interactionStates: { [key: string]: boolean; } = {};

    // #endregion Properties (8)

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

    // #region Public Accessors (9)

    public get interactionTypes(): { [key: string]: boolean } {
        return this.#interactionTypes;
    }

    public set interactionTypes(value: { [key: string]: boolean }) {
        this.#interactionTypes = value;
    }

    public get interactionStates(): { [key: string]: boolean } {
        return this.#interactionStates;
    }

    public set interactionStates(value: { [key: string]: boolean }) {
        this.#interactionStates = value;
    }

    public get dragOrigin(): vec3 | undefined {
        return this.#dragOrigin;
    }

    public set dragOrigin(value: vec3 | undefined) {
        this.#dragOrigin = value;
    }

    public get dragAnchors(): {
        position: vec3
    }[] {
        return this.#dragAnchors;
    }

    public set dragAnchors(value: {
        position: vec3
    }[]) {
        this.#dragAnchors = value;
    }

    // #endregion Public Accessors (9)

    // #region Public Methods (5)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        return new InteractionData(this.#interactionTypes, this.id);
    }

    // #endregion Public Methods (5)
}
