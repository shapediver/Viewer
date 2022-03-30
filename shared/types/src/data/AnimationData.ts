import { AbstractTreeNodeData, ITransformation, ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { mat4, quat, vec3, vec4 } from 'gl-matrix';

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
    #reset: boolean = true;

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

    public get reset(): boolean {
        return this.#reset;
    }

    public set reset(value: boolean) {
        this.#reset = value;
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
            const idleTransformation = track.node.transformations.find(t => t.id === 'gltf_matrix');
            if (idleTransformation) {
                track.previousMatrix = {
                    id: idleTransformation.id,
                    matrix: mat4.clone(idleTransformation.matrix)
                }
                idleTransformation.matrix = mat4.create();
                continue;
            } 

            switch(track.path) {
                case 'scale':
                    const idleTransformationScale = track.node.transformations.find(t => t.id === 'gltf_matrix_scale');
                    if (idleTransformationScale) {
                        track.previousMatrix = {
                            id: idleTransformationScale.id,
                            matrix: mat4.clone(idleTransformationScale.matrix)
                        }
                        continue;
                    } 

                    break;
                    
                case 'rotation':
                    const idleTransformationRotation = track.node.transformations.find(t => t.id === 'gltf_matrix_rotation');
                    if (idleTransformationRotation) {
                        track.previousMatrix = {
                            id: idleTransformationRotation.id,
                            matrix: mat4.clone(idleTransformationRotation.matrix)
                        }
                        continue;
                    } 

                    break;
                    
                case 'translation':
                    const idleTransformationTranslation = track.node.transformations.find(t => t.id === 'gltf_matrix_translation');
                    if (idleTransformationTranslation) {
                        track.previousMatrix = {
                            id: idleTransformationTranslation.id,
                            matrix: mat4.clone(idleTransformationTranslation.matrix)
                        }
                        continue;
                    } 
                    break;
            }
        }
    }

    public stopAnimation() {
        if (this.reset) {
            for (let i = 0; i < this.#tracks.length; i++) {
                const track = this.#tracks[i];
                const id = this.id + '_' + i;
                const prevAnimation = track.node.transformations.filter(t => t.id === id);
                track.node.transformations = track.node.transformations.filter((el) => {
                    return !prevAnimation.includes(el);
                });
                if (track.previousMatrix) {
                    if(track.previousMatrix.id === 'gltf_matrix') {
                        const transformation = track.node.transformations.find(t => t.id === 'gltf_matrix')!;
                        transformation.matrix = track.previousMatrix.matrix;
                        const translationTransformation = track.node.transformations.find(t => t.id === 'gltf_matrix_translation')!;
                        translationTransformation.matrix = mat4.create();
                        const rotationTransformation = track.node.transformations.find(t => t.id === 'gltf_matrix_rotation')!;
                        rotationTransformation.matrix = mat4.create();
                        const scaleTransformation = track.node.transformations.find(t => t.id === 'gltf_matrix_scale')!;
                        scaleTransformation.matrix = mat4.create();
                        continue;
                    } else {
                        switch(track.path) {
                            case 'scale':
                                const idleTransformationScale = track.node.transformations.find(t => t.id === 'gltf_matrix_scale')!;
                                idleTransformationScale.matrix = track.previousMatrix.matrix;
                                continue;
                            case 'rotation':
                                const idleTransformationRotation = track.node.transformations.find(t => t.id === 'gltf_matrix_rotation')!;
                                idleTransformationRotation.matrix = track.previousMatrix.matrix;
                                continue;
                            case 'translation':
                                const idleTransformationTranslation = track.node.transformations.find(t => t.id === 'gltf_matrix_translation')!;
                                idleTransformationTranslation.matrix = track.previousMatrix.matrix;
                                continue;
                        }
                    }
                } 
            }
        } else {
            for (let i = 0; i < this.#tracks.length; i++) {
                const track = this.#tracks[i];
                const id = this.id + '_' + i;

                const prevAnimation = track.node.transformations.filter(t => t.id === id);
                track.node.transformations = track.node.transformations.filter((el) => {
                    return !prevAnimation.includes(el);
                });

                const j = track.times.length-1;

                if (track.path === 'rotation') {
                    let quaternion: quat = quat.fromValues(track.values[j * 4 + 0], track.values[j * 4 + 1], track.values[j * 4 + 2], track.values[j * 4 + 3]);
                    track.node.transformations.push({
                        id,
                        matrix: mat4.fromQuat(mat4.create(), quaternion)
                    })
                } else if (track.path === 'translation') {
                    let vector: vec3 = vec3.fromValues(track.values[j * 3 + 0], track.values[j * 3 + 1], track.values[j * 3 + 2]);
                    track.node.transformations.push({
                        id,
                        matrix: mat4.fromTranslation(mat4.create(), vector)
                    })
                } else if (track.path === 'scale') {
                    let vector: vec3 = vec3.fromValues(track.values[j * 3 + 0], track.values[j * 3 + 1], track.values[j * 3 + 2]);
                    track.node.transformations.push({
                        id,
                        matrix: mat4.fromScaling(mat4.create(), vector)
                    })
                }
            }

            
        }
        this.#animationTime = -1;
        this.#started = false;
        this.#animate = false;
    }

    // #endregion Public Methods (5)
}
