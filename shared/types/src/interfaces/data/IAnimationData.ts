import { ITransformation, ITreeNode, ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";

export interface IAnimationTrack {
    // #region Properties (6)

    interpolation: 'linear' | 'step';
    node: ITreeNode,
    path: 'scale' | 'translation' | 'rotation';
    previousMatrix?: ITransformation;
    pivot?: vec3;
    times: Float32Array | Uint8Array | Uint16Array | Int8Array | Int16Array | Uint32Array | number[];
    values: Float32Array | Uint8Array | Uint16Array | Int8Array | Int16Array | Uint32Array | number[];

    // #endregion Properties (6)
}

export interface IAnimationData extends ITreeNodeData {
    // #region Properties (8)

    readonly animate: boolean;
    readonly duration: number;
    readonly name: string;
    readonly start: number;

    animationTime: number;
    repeat: boolean;
    reset: boolean;
    tracks: IAnimationTrack[];

    // #endregion Properties (8)

    // #region Public Methods (5)

    clone(): IAnimationData;
    continueAnimation(): void;
    pauseAnimation(): void;
    startAnimation(): void;
    stopAnimation(): void;

    // #endregion Public Methods (5)
}