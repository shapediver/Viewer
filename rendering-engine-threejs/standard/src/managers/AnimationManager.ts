import { SystemInfo } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { RenderingEngine } from '../RenderingEngine'
import { IManager } from '../interfaces/IManager.js'
import { mat4, quat, vec3, vec4 } from 'gl-matrix'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
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
        const animations = this._renderingEngine.animations;
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

                for (let k = 1; k < track.times.length; k++) {
                    if (currentAnimationDeltaTime < track.times[k] && currentAnimationDeltaTime > track.times[k - 1]) {

                        const prevAnimation = track.node.transformations.filter(t => t.id === id);
                        track.node.transformations = track.node.transformations.filter((el) => {
                            return !prevAnimation.includes(el);
                        });

                        const factor = (currentAnimationDeltaTime - track.times[k - 1]) / (track.times[k] - track.times[k - 1]);

                        if (track.path === 'rotation') {
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
                            track.node.transformations.push({
                                id,
                                matrix: mat4.fromQuat(mat4.create(), quaternion)
                            })
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
                            track.node.transformations.push({
                                id,
                                matrix: mat4.fromTranslation(mat4.create(), vector)
                            })
                        } else if (track.path === 'scale') {
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
                            track.node.transformations.push({
                                id,
                                matrix: mat4.fromScaling(mat4.create(), vector)
                            })
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
                            
                            const applyWeights = (node: TreeNode) => {
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