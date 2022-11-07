import { vec2, vec3 } from "gl-matrix";
import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { IBox } from "@shapediver/viewer.shared.math";

export interface IAnchorDataImage {
    // #region Properties (6)

    alt: string,
    height: number,
    hidden?: boolean,
    position?: {
        horizontal?: string,
        vertical?: string
    }

    src: string,
    width: number,

    // #endregion Properties (6)
}

export interface IAnchorDataText {
    // #region Properties (5)

    color: string | number | vec3,
    hidden?: boolean,
    position?: {
        horizontal?: string,
        vertical?: string
    },
    text: string,
    textAlign?: string

    // #endregion Properties (5)
}

export interface IHTMLElementAnchorData extends ITreeNodeData {
    // #region Properties (6)

    data: IAnchorDataImage | IAnchorDataText | any;
    format: 'text' | 'image' | 'custom';
    hideable: boolean;
    intersectionTarget: IBox | string | string[] | undefined;
    location: vec3;
    viewports: string[];

    // #endregion Properties (6)

    // #region Public Methods (5)

    clone(): IHTMLElementAnchorData;
    create(properties: { anchor: IHTMLElementAnchorData, parent: HTMLDivElement }): void;
    createViewerHtmlElement(viewer: string): HTMLDivElement | null;
    getViewerHtmlElement(viewer: string): HTMLDivElement | null;
    update(properties: {
        anchor: IHTMLElementAnchorData,
        htmlElement: HTMLDivElement,
        page: vec2,
        container: vec2,
        client: vec2,
        scale: vec2,
        hidden: boolean,
        visible: boolean
    }): void;

    // #endregion Public Methods (5)
}