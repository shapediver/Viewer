import { AbstractTreeNodeData, ITransformation, ITreeNode, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { mat4, quat, vec3, vec4 } from 'gl-matrix';
import { IAnimationData, IAnimationTrack } from '../../interfaces/data/IAnimationData';
import { GeometryData } from './GeometryData';


export class AnimationData extends AbstractTreeNodeData implements IAnimationData {
    // #region Properties (8)

    #animate: boolean = false;
    #animationTime: number = 0;
    #duration: number;
    #name: string;
    #repeat: boolean = false;
    #start: number;
    #started: boolean = false;
    #tracks: IAnimationTrack[];
    #reset: boolean = true;
    #nodeIds: string[] = [];

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
        tracks: IAnimationTrack[],
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

    public get tracks(): IAnimationTrack[] {
        return this.#tracks;
    }

    public set tracks(value: IAnimationTrack[]) {
        this.#tracks = value;
    }

    // #endregion Public Accessors (9)

    // #region Public Methods (5)

    /**
     * Clones the scene graph data.
     */
    public clone(): IAnimationData {
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
        this.#nodeIds = [];

        for (let i = 0; i < this.#tracks.length; i++) {
            const track = this.#tracks[i];
            if(this.#nodeIds.includes(track.node.id)) continue;
            this.#nodeIds.push(track.node.id)
            const idleTransformation = track.node.transformations.find(t => t.id === 'gltf_matrix');
            if (idleTransformation) {
                track.previousMatrix = {
                    id: idleTransformation.id,
                    matrix: mat4.clone(idleTransformation.matrix)
                }
                idleTransformation.matrix = mat4.create();
                continue;
            }

            switch (track.path) {
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
                    if (track.previousMatrix.id === 'gltf_matrix') {
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
                        switch (track.path) {
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
                } else if(!this.#nodeIds.includes(track.node.id)) {
                    const idleTransformation = track.node.transformations.find(t => t.id === 'gltf_matrix');
                    if (idleTransformation) {
                        idleTransformation.matrix = mat4.create();
                    } else {
                        const idleTransformationScale = track.node.transformations.find(t => t.id === 'gltf_matrix_scale');
                        if (idleTransformationScale) idleTransformationScale.matrix = mat4.create();

                        const idleTransformationRotation = track.node.transformations.find(t => t.id === 'gltf_matrix_rotation');
                        if (idleTransformationRotation) idleTransformationRotation.matrix = mat4.create();

                        const idleTransformationTranslation = track.node.transformations.find(t => t.id === 'gltf_matrix_translation');
                        if (idleTransformationTranslation) idleTransformationTranslation.matrix = mat4.create();
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

                const j = track.times.length - 1;

                let translationTransformation = track.node.transformations.find(t => t.id === 'gltf_matrix_translation');
                if(!translationTransformation) {
                    translationTransformation = {
                        id: 'gltf_matrix_translation',
                        matrix: mat4.create()
                    }
                    track.node.transformations.push(translationTransformation)
                }
                
                let rotationTransformation = track.node.transformations.find(t => t.id === 'gltf_matrix_rotation');
                if(!rotationTransformation) {
                    rotationTransformation = {
                        id: 'gltf_matrix_rotation',
                        matrix: mat4.create()
                    }
                    track.node.transformations.push(rotationTransformation)
                }

                let scaleTransformation = track.node.transformations.find(t => t.id === 'gltf_matrix_scale');
                if(!scaleTransformation) {
                    scaleTransformation = {
                        id: 'gltf_matrix_scale',
                        matrix: mat4.create()
                    }
                    track.node.transformations.push(scaleTransformation)
                }

                if (track.path === 'rotation') {
                    let pivotMatrix: mat4 | undefined, pivotMatrixInverse: mat4 | undefined;
                    if(track.pivot) {
                        pivotMatrix = mat4.fromTranslation(mat4.create(), vec3.fromValues(track.pivot[0], track.pivot[1], track.pivot[2]));
                        pivotMatrixInverse = mat4.fromTranslation(mat4.create(), vec3.fromValues(-track.pivot[0], -track.pivot[1], -track.pivot[2]));
                    }

                    let quaternion: quat = quat.fromValues(track.values[j * 4 + 0], track.values[j * 4 + 1], track.values[j * 4 + 2], track.values[j * 4 + 3]);
                    const rotationMatrix = mat4.fromQuat(mat4.create(), quaternion);
                    if(pivotMatrix && pivotMatrixInverse) {
                        rotationTransformation.matrix = mat4.multiply(mat4.create(), mat4.multiply(mat4.create(), pivotMatrix, rotationMatrix), pivotMatrixInverse);
                    } else {
                        rotationTransformation.matrix = rotationMatrix;
                    }
                } else if (track.path === 'translation') {
                    let vector: vec3 = vec3.fromValues(track.values[j * 3 + 0], track.values[j * 3 + 1], track.values[j * 3 + 2]);
                    translationTransformation.matrix = mat4.fromTranslation(mat4.create(), vector);
                } else if (track.path === 'scale') {
                    let vector: vec3 = vec3.fromValues(track.values[j * 3 + 0], track.values[j * 3 + 1], track.values[j * 3 + 2]);
                    scaleTransformation.matrix = mat4.fromScaling(mat4.create(), vector);
                } else if (track.path === 'weights') {
                    let weights: number[] = [];
                    const weightCount = track.values.length / track.times.length;

                    for(let l = 0; l < weightCount; l++)
                        weights.push(track.values[j * weightCount + l])
                    
                    const applyWeights = (node: ITreeNode) => {
                        for(let l = 0; l < node.data.length; l++)
                            if(node.data[l] instanceof GeometryData && (<GeometryData>node.data[l]).morphWeights.length === weightCount)
                                (<GeometryData>node.data[l]).morphWeights = weights;

                        for (let l = 0; l < node.children.length; l++)
                            applyWeights(node.children[l])
                    }
                    applyWeights(track.node);
                }
            }
        }
        this.#animationTime = -1;
        this.#started = false;
        this.#animate = false;
    }

    // #endregion Public Methods (5)
}
