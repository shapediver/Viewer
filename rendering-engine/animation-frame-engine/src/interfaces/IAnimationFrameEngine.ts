export type AnimationFrameCallback = (time: number, deltaTime: number, runningAnimation: boolean) => void;

export interface IAnimationFrameEngine {
    /**
     * Add a callback that is called whenever the requestAnimationFrame is triggered.
     * The callback is supplied with the current time (passthrough from requestAnimationFrame), the deltaTime (delta from last call) and if an animation is currently running.
     * A token is returned to be able to remove this callback again {@link removeAnimationFrameCallback}.
     * 
     * @param cb 
     */
    addAnimationFrameCallback(cb: AnimationFrameCallback): string;
    
    /**
     * Remove a callback that has been registered with {@link addAnimationFrameCallback} via the returned token.
     * 
     * @param token 
     */
    removeAnimationFrameCallback(token: string): boolean;
}