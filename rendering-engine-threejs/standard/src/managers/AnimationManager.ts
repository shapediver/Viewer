import { SystemInfo } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { RenderingEngine } from '../RenderingEngine'
import { IManager } from '../interfaces/IManager.js'
import { mat4, quat, vec3, vec4 } from 'gl-matrix'
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { GeometryData } from '@shapediver/viewer.shared.types'

export class AnimationManager implements IManager {
    // #region Properties (12)

    private readonly _systemInfo: SystemInfo = <SystemInfo>container.resolve(SystemInfo);

    // #endregion Properties (12)

    // #region Constructors (1)

    constructor(
        private readonly _renderingEngine: RenderingEngine
    ) {}

    // #endregion Constructors (1)

    public init(): void {}

    public update(deltaTime: number): boolean {
        const animations = Object.values(this._renderingEngine.animations);
        let running = false;

        for (let i = 0; i < animations.length; i++) {
            const animation = animations[i];
            if(animation.animationTime === -1) {
                // if we just stopped we need to render one more time
                running = true;
                animation.animationTime = 0;
            }
            if(!animation.animate) continue;
            running = true;

            animation.animationTime += deltaTime;
            if(animation.animationTime / 1000.0 > animation.duration) {
                if(animation.repeat) {
                    animation.startAnimation();
                } else {
                    animation.stopAnimation();
                }
            }

            const animationDuration = animation.duration!;
            const currentAnimationDeltaTime = (animation.animationTime / 1000.0) % animationDuration;

            for (let j = 0; j < animation.tracks.length; j++) {
                const track = animation.tracks[j];
                const id = animation.id + '_' + j;
                if (currentAnimationDeltaTime < track.times[0] || currentAnimationDeltaTime > track.times[track.times.length - 1]) continue;

                for (let k = 1; k < track.times.length; k++) {
                    if (currentAnimationDeltaTime < track.times[k] && currentAnimationDeltaTime > track.times[k - 1]) {

                        const prevAnimation = track.node.transformations.filter(t => t.id === id);
                        track.node.transformations = track.node.transformations.filter((el) => {
                            return !prevAnimation.includes(el);
                        });

                        const factor = (currentAnimationDeltaTime - track.times[k - 1]) / (track.times[k] - track.times[k - 1]);

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

                            let quaternion: quat;
                            if(track.interpolation === 'step') {
                                quaternion = quat.fromValues(track.values[(k - 1) * 4 + 0], track.values[(k - 1) * 4 + 1], track.values[(k - 1) * 4 + 2], track.values[(k - 1) * 4 + 3]);
                            } else {
                                quaternion = quat.slerp(
                                    vec4.create(),
                                    vec4.fromValues(track.values[(k - 1) * 4 + 0], track.values[(k - 1) * 4 + 1], track.values[(k - 1) * 4 + 2], track.values[(k - 1) * 4 + 3]),
                                    vec4.fromValues(track.values[(k) * 4 + 0], track.values[(k) * 4 + 1], track.values[(k) * 4 + 2], track.values[(k) * 4 + 3]),
                                    factor)
                            }

                            const rotationMatrix = mat4.fromQuat(mat4.create(), quaternion);
                            if(pivotMatrix && pivotMatrixInverse) {
                                rotationTransformation.matrix = mat4.multiply(mat4.create(), mat4.multiply(mat4.create(), pivotMatrix, rotationMatrix), pivotMatrixInverse);
                            } else {
                                rotationTransformation.matrix = rotationMatrix;
                            }
                        } else if (track.path === 'translation') {
                            let vector: vec3;
                            if(track.interpolation === 'step') {
                                vector = vec3.fromValues(track.values[(k - 1) * 3 + 0], track.values[(k - 1) * 3 + 1], track.values[(k - 1) * 3 + 2]);
                            } else {
                                vector = vec3.lerp(
                                    vec3.create(),
                                    vec3.fromValues(track.values[(k - 1) * 3 + 0], track.values[(k - 1) * 3 + 1], track.values[(k - 1) * 3 + 2]),
                                    vec3.fromValues(track.values[(k) * 3 + 0], track.values[(k) * 3 + 1], track.values[(k) * 3 + 2]),
                                    factor)
                            }
                            translationTransformation.matrix = mat4.fromTranslation(mat4.create(), vector);
                        } else if (track.path === 'scale') {
                            let pivotMatrix: mat4 | undefined, pivotMatrixInverse: mat4 | undefined;
                            if(track.pivot) {
                                pivotMatrix = mat4.fromTranslation(mat4.create(), vec3.fromValues(track.pivot[0], track.pivot[1], track.pivot[2]));
                                pivotMatrixInverse = mat4.fromTranslation(mat4.create(), vec3.fromValues(-track.pivot[0], -track.pivot[1], -track.pivot[2]));
                            }

                            let vector: vec3;
                            if(track.interpolation === 'step') {
                                vector = vec3.fromValues(track.values[(k - 1) * 3 + 0], track.values[(k - 1) * 3 + 1], track.values[(k - 1) * 3 + 2]);
                            } else {
                                vector = vec3.lerp(
                                    vec3.create(),
                                    vec3.fromValues(track.values[(k - 1) * 3 + 0], track.values[(k - 1) * 3 + 1], track.values[(k - 1) * 3 + 2]),
                                    vec3.fromValues(track.values[(k) * 3 + 0], track.values[(k) * 3 + 1], track.values[(k) * 3 + 2]),
                                    factor)
                            }
                            
                            const scalingMatrix = mat4.fromScaling(mat4.create(), vector);
                            if(pivotMatrix && pivotMatrixInverse) {
                                scaleTransformation.matrix = mat4.multiply(mat4.create(), mat4.multiply(mat4.create(), pivotMatrix, scalingMatrix), pivotMatrixInverse);
                            } else {
                                scaleTransformation.matrix = scalingMatrix;
                            }
                        } else if (track.path === 'weights') {
                            let weights: number[] = [];
                            const weightCount = track.values.length / track.times.length;

                            if(track.interpolation === 'step') {
                                for(let l = 0; l < weightCount; l++)
                                    weights.push(track.values[(k - 1) * weightCount + l])
                            } else {
                                for(let l = 0; l < weightCount; l++)
                                    weights.push(track.values[(k - 1) * weightCount + l] * (1.0 - factor) + (factor) * track.values[(k - 1) * weightCount + l]);
                            }
                            
                            const applyWeights = (node: ITreeNode) => {
                                for(let l = 0; l < node.data.length; l++)
                                    if(node.data[l] instanceof GeometryData && (<GeometryData>node.data[l]).morphWeights.length === weightCount)
                                        (<GeometryData>node.data[l]).morphWeights = weights;

                                for (let l = 0; l < node.children.length; l++)
                                    applyWeights(node.children[l])
                            }
                            applyWeights(track.node);
                        }
                        break;
                    }
                }
            }
        }
        return running;
    }

    // #endregion Private Methods (1)
}