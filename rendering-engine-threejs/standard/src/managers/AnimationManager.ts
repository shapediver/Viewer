import { SystemInfo } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { RenderingEngine } from '../RenderingEngine'
import { IManager } from '../interfaces/IManager.js'
import { mat4, quat, vec3, vec4 } from 'gl-matrix'

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

                for (let j = 1; j < track.times.length; j++) {
                    if (currentAnimationDeltaTime < track.times[j] && currentAnimationDeltaTime > track.times[j - 1]) {

                        const prevAnimation = track.node.transformations.filter(t => t.id === id);
                        track.node.transformations = track.node.transformations.filter((el) => {
                            return !prevAnimation.includes(el);
                        });

                        const factor = (currentAnimationDeltaTime - track.times[j - 1]) / (track.times[j] - track.times[j - 1]);

                        if (track.path === 'rotation') {
                            let quaternion: quat;
                            if(track.interpolation === 'step') {
                                quaternion = quat.fromValues(track.values[(j - 1) * 4 + 0], track.values[(j - 1) * 4 + 1], track.values[(j - 1) * 4 + 2], track.values[(j - 1) * 4 + 3]);
                            } else {
                                quaternion = quat.slerp(
                                    vec4.create(),
                                    vec4.fromValues(track.values[(j - 1) * 4 + 0], track.values[(j - 1) * 4 + 1], track.values[(j - 1) * 4 + 2], track.values[(j - 1) * 4 + 3]),
                                    vec4.fromValues(track.values[(j) * 4 + 0], track.values[(j) * 4 + 1], track.values[(j) * 4 + 2], track.values[(j) * 4 + 3]),
                                    factor)
                            }
                            track.node.transformations.push({
                                id,
                                matrix: mat4.fromQuat(mat4.create(), quaternion)
                            })
                        } else if (track.path === 'translation') {
                            let vector: vec3;
                            if(track.interpolation === 'step') {
                                vector = vec3.fromValues(track.values[(j - 1) * 3 + 0], track.values[(j - 1) * 3 + 1], track.values[(j - 1) * 3 + 2]);
                            } else {
                                vector = vec3.lerp(
                                    vec3.create(),
                                    vec3.fromValues(track.values[(j - 1) * 3 + 0], track.values[(j - 1) * 3 + 1], track.values[(j - 1) * 3 + 2]),
                                    vec3.fromValues(track.values[(j) * 3 + 0], track.values[(j) * 3 + 1], track.values[(j) * 3 + 2]),
                                    factor)
                            }
                            track.node.transformations.push({
                                id,
                                matrix: mat4.fromTranslation(mat4.create(), vector)
                            })
                        } else if (track.path === 'scale') {
                            let vector: vec3;
                            if(track.interpolation === 'step') {
                                vector = vec3.fromValues(track.values[(j - 1) * 3 + 0], track.values[(j - 1) * 3 + 1], track.values[(j - 1) * 3 + 2]);
                            } else {
                                vector = vec3.lerp(
                                    vec3.create(),
                                    vec3.fromValues(track.values[(j - 1) * 3 + 0], track.values[(j - 1) * 3 + 1], track.values[(j - 1) * 3 + 2]),
                                    vec3.fromValues(track.values[(j) * 3 + 0], track.values[(j) * 3 + 1], track.values[(j) * 3 + 2]),
                                    factor)
                            }
                            track.node.transformations.push({
                                id,
                                matrix: mat4.fromScaling(mat4.create(), vector)
                            })
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