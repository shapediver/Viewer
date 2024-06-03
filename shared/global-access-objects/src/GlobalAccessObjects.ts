import { ShapeDiverResponseOutputContent } from "@shapediver/sdk.geometry-api-sdk-v2";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { ITag3D } from "@shapediver/viewer.data-engine.shared-types";

export class GlobalAccessObjects {
    // #region Properties (4)

    private static _instance: GlobalAccessObjects;

    #combineTextures?: (red?: HTMLImageElement | ArrayBuffer, green?: HTMLImageElement | ArrayBuffer, blue?: HTMLImageElement | ArrayBuffer) => Promise<{ image: HTMLImageElement | ArrayBuffer, blob: Blob }>;
    #loadContent?: (content: ShapeDiverResponseOutputContent, jwtToken?: string, taskEventId?: string) => Promise<ITreeNode>;
    #loadTag3D?: (tag3dInfo: ITag3D) => ITreeNode | undefined;

    // #endregion Properties (4)

    // #region Public Static Getters And Setters (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Getters And Setters (1)

    // #region Public Getters And Setters (6)

    public get combineTextures() {
        return this.#combineTextures;
    }

    public set combineTextures(value: ((red?: HTMLImageElement | ArrayBuffer, green?: HTMLImageElement | ArrayBuffer, blue?: HTMLImageElement | ArrayBuffer) => Promise<{ image: HTMLImageElement | ArrayBuffer, blob: Blob }>) | undefined) {
        this.#combineTextures = value;
    }

    public get loadContent() {
        return this.#loadContent;
    }

    public set loadContent(value: ((content: ShapeDiverResponseOutputContent, jwtToken?: string, taskEventId?: string) => Promise<ITreeNode>) | undefined) {
        this.#loadContent = value;
    }

    public get loadTag3D() {
        return this.#loadTag3D;
    }

    public set loadTag3D(value: ((tag3dInfo: ITag3D) => ITreeNode | undefined) | undefined) {
        this.#loadTag3D = value;
    }

    // #endregion Public Getters And Setters (6)
}