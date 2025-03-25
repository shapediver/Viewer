import {AbstractTreeNodeData} from "@shapediver/viewer.shared.node-tree";
import {vec3} from "gl-matrix";
import {
	IInteractionData,
	IInteractionTypes,
} from "../interfaces/IInteractionData";

// #region Interfaces (1)

export interface IDragAnchor {
	// #region Properties (2)

	/** The id of the anchor */
	id?: string;
	position: vec3;
	rotation?: {
		axis: vec3;
		angle: number;
	};

	// #endregion Properties (2)
}

// #endregion Interfaces (1)

// #region Classes (1)

export class InteractionData
	extends AbstractTreeNodeData
	implements IInteractionData
{
	// #region Properties (6)

	#dragAnchors: IDragAnchor[] = [];
	#dragOrigin?: vec3;
	#groupId?: string;
	#interactionStates: IInteractionTypes = {};
	#interactionTypes: IInteractionTypes = {};
	#restrictedManagers: string[] = [];

	// #endregion Properties (6)

	// #region Constructors (1)

	/**
	 * Creates an interaction data item.
	 *
	 * @param interactionTypes the data as key-value pairs
	 * @param groupId the group id to be able to interact with multiple nodes at once
	 * @param id the id that is used internally (leave empty if in doubt)
	 * @param version the version that is used internally (leave empty if in doubt)
	 */
	constructor(
		interactionTypes: IInteractionTypes,
		groupId?: string,
		restrictedManagers?: string[],
		id?: string,
		version?: string,
	) {
		super(id, version);
		this.#interactionTypes = interactionTypes;
		this.#groupId = groupId;
		if (restrictedManagers !== undefined)
			this.#restrictedManagers = restrictedManagers;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (12)

	public get dragAnchors(): IDragAnchor[] {
		return this.#dragAnchors;
	}

	public set dragAnchors(value: IDragAnchor[]) {
		this.#dragAnchors = value;
	}

	public get dragOrigin(): vec3 | undefined {
		return this.#dragOrigin;
	}

	public set dragOrigin(value: vec3 | undefined) {
		this.#dragOrigin = value;
	}

	public get groupId(): string | undefined {
		return this.#groupId;
	}

	public set groupId(value: string | undefined) {
		this.#groupId = value;
	}

	public get interactionStates(): IInteractionTypes {
		return this.#interactionStates;
	}

	public set interactionStates(value: IInteractionTypes) {
		this.#interactionStates = value;
	}

	public get interactionTypes(): IInteractionTypes {
		return this.#interactionTypes;
	}

	public set interactionTypes(value: IInteractionTypes) {
		this.#interactionTypes = value;
	}

	public get restrictedManagers(): string[] {
		return this.#restrictedManagers;
	}

	public set restrictedManagers(value: string[]) {
		this.#restrictedManagers = value;
	}

	// #endregion Public Getters And Setters (12)

	// #region Public Methods (1)

	/**
	 * Clones the scene graph data.
	 */
	public clone(): IInteractionData {
		return new InteractionData(
			this.#interactionTypes,
			this.#groupId,
			this.#restrictedManagers,
			this.id,
			this.version,
		);
	}

	// #endregion Public Methods (1)
}

// #endregion Classes (1)
