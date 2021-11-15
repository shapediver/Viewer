import { AbstractTreeNodeData, ITransformation, ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { mat4 } from 'gl-matrix';

export type AnimationTrack = {
    node: TreeNode,
    times: Float32Array | Uint8Array | Uint16Array | Int8Array | Int16Array | Uint32Array | number[];
    values: Float32Array | Uint8Array | Uint16Array | Int8Array | Int16Array | Uint32Array | number[];
    path: 'scale' | 'translation' | 'rotation';
    interpolation: 'linear' | 'step';
    previousMatrix?: ITransformation;
}

export class AnimationData extends AbstractTreeNodeData {
    // #region Properties (8)

    #animate: boolean = false;
    #animationTime: number = 0;
    #duration: number;
    #name: string;
    #repeat: boolean = false;
    #start: number;
    #started: boolean = false;
    #tracks: AnimationTrack[];

    // #endregion Properties (8)

    // #region Constructors (1)

    /**
     * Creates a custom data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        name: string,
        tracks: AnimationTrack[],
        start: number,
        duration: number,
        id?: string
    ) {
        super(id);
        this.#name = name;
        this.#tracks = tracks;
        this.#start = start;
        this.#duration = duration;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    public get animate(): boolean {
        return this.#animate;
    }

    public get animationTime(): number {
        return this.#animationTime;
    }

    public set animationTime(value: number) {
        this.#animationTime = value;
    }

    public get duration(): number {
        return this.#duration;
    }

    public get name(): string {
        return this.#name;
    }

    public get repeat(): boolean {
        return this.#repeat;
    }

    public set repeat(value: boolean) {
        this.#repeat = value;
    }

    public get start(): number {
        return this.#start;
    }

    public get tracks(): AnimationTrack[] {
        return this.#tracks;
    }

    // #endregion Public Accessors (9)

    // #region Public Methods (5)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        return new AnimationData(this.name, this.#tracks, this.start, this.duration, this.id);
    }

    public continueAnimation() {
        if (this.#started) this.#animate = true;
    }

    public pauseAnimation() {
        if (this.#started) this.#animate = false;
    }

    public startAnimation() {
        this.#animationTime = 0;
        this.#animate = true;
        this.#started = true;

        for (let i = 0; i < this.#tracks.length; i++) {
            const track = this.#tracks[i];
            const idleTransformation = track.node.transformations.filter(t => t.id === 'gltf_matrix');
            if(idleTransformation) {
                track.previousMatrix = idleTransformation[0];
                track.node.transformations = track.node.transformations.filter((el) => {
                    return !idleTransformation.includes(el);
                });
            }
        }
    }

    public stopAnimation() {
        for (let i = 0; i < this.#tracks.length; i++) {
            const track = this.#tracks[i];
            const id = this.id + '_' + i;
            const prevAnimation = track.node.transformations.filter(t => t.id === id);
            track.node.transformations = track.node.transformations.filter((el) => {
                return !prevAnimation.includes(el);
            });
            if (track.previousMatrix) track.node.transformations.push(track.previousMatrix);
        }
        this.#animationTime = -1;
        this.#started = false;
        this.#animate = false;
    }

    // #endregion Public Methods (5)
}
