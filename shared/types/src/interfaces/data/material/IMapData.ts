import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { vec2 } from "gl-matrix";
import { Color } from "../../../types";

export enum TEXTURE_WRAPPING {
    REPEAT = 10497,
    CLAMP_TO_EDGE = 33071,
    MIRRORED_REPEAT = 33648
}

export enum TEXTURE_FILTERING {
    NONE = 0,
    NEAREST = 9728,
    LINEAR = 9729,
    NEAREST_MIPMAP_NEAREST = 9984,
    LINEAR_MIPMAP_NEAREST = 9985,
    NEAREST_MIPMAP_LINEAR = 9986,
    LINEAR_MIPMAP_LINEAR = 9987,
}

export interface IMapData extends ITreeNodeData {
    // #region Properties (11)

    center: vec2;
    color?: Color;
    flipY: boolean;
    image: HTMLImageElement;
    magFilter: TEXTURE_FILTERING;
    minFilter: TEXTURE_FILTERING;
    offset: vec2;
    repeat: vec2;
    rotation: number;
    wrapS: TEXTURE_WRAPPING;
    wrapT: TEXTURE_WRAPPING;

    // #endregion Properties (11)

    // #region Public Methods (1)

    clone(): IMapData;

    // #endregion Public Methods (1)
}