import {ResOutput, ResOutputContent} from "@shapediver/sdk.geometry-api-sdk-v2";
import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";

export class GlobalAccessObjects {
	// #region Properties (3)

	private static _instance: GlobalAccessObjects;

	#assignMaterialFromDatabase?: (node: ITreeNode) => Promise<void>;
	#combineTextures?: (
		red?: HTMLImageElement | ArrayBuffer,
		green?: HTMLImageElement | ArrayBuffer,
		blue?: HTMLImageElement | ArrayBuffer,
	) => Promise<{image: HTMLImageElement | ArrayBuffer; blob: Blob}>;
	#loadContent?: (
		content: ResOutputContent,
		outputInfo?: Pick<
			Partial<ResOutput>,
			"id" | "name" | "displayname" | "version"
		>,
		jwtToken?: string,
		taskEventId?: string,
	) => Promise<ITreeNode>;

	// #endregion Properties (3)

	// #region Public Static Getters And Setters (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Getters And Setters (1)

	// #region Public Getters And Setters (4)

	public get assignMaterialFromDatabase() {
		return this.#assignMaterialFromDatabase;
	}

	public set assignMaterialFromDatabase(
		value: ((node: ITreeNode) => Promise<void>) | undefined,
	) {
		this.#assignMaterialFromDatabase = value;
	}

	public get combineTextures() {
		return this.#combineTextures;
	}

	public set combineTextures(
		value:
			| ((
					red?: HTMLImageElement | ArrayBuffer,
					green?: HTMLImageElement | ArrayBuffer,
					blue?: HTMLImageElement | ArrayBuffer,
			  ) => Promise<{image: HTMLImageElement | ArrayBuffer; blob: Blob}>)
			| undefined,
	) {
		this.#combineTextures = value;
	}

	public get loadContent() {
		return this.#loadContent;
	}

	public set loadContent(
		value:
			| ((
					content: ResOutputContent,
					outputInfo?: Pick<
						Partial<ResOutput>,
						"id" | "name" | "displayname" | "version"
					>,
					jwtToken?: string,
					taskEventId?: string,
			  ) => Promise<ITreeNode>)
			| undefined,
	) {
		this.#loadContent = value;
	}

	// #endregion Public Getters And Setters (4)
}
