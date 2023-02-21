import { AnimationFrameCallback, IAnimationFrameEngine } from "../interfaces/IAnimationFrameEngine";
import * as TWEEN from '@tweenjs/tween.js'
import { UuidGenerator } from "@shapediver/viewer.shared.services";
import { AnimationEngine } from "@shapediver/viewer.rendering-engine.animation-engine";

export class AnimationFrameEngine implements IAnimationFrameEngine {
    // #region Properties (5)

    readonly #animationEngine: AnimationEngine = AnimationEngine.instance;
    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

    private static _instance: AnimationFrameEngine;

    private _animationFrameCallbacks: {
        [key: string]: AnimationFrameCallback
    } = {};
    private _lastTime: number = 0;

    // #endregion Properties (5)

    // #region Constructors (1)

    private constructor() {
        this.animate(0);
    }

    // #endregion Constructors (1)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

    // #region Public Methods (2)

    public addAnimationFrameCallback(cb: AnimationFrameCallback): string {
        const token = this.#uuidGenerator.create();
        this._animationFrameCallbacks[token] = cb;

        return token;
    }

    public removeAnimationFrameCallback(token: string): boolean {
        if(!this._animationFrameCallbacks[token]) return false;

        delete this._animationFrameCallbacks[token];
        (<any>this._animationFrameCallbacks[token]) = undefined;

        return true;
    }

    // #endregion Public Methods (2)

    // #region Private Methods (1)

    private animate(time: number): void {
        // animation loop - part 2: requesting and timings
        requestAnimationFrame((time: number) => this.animate(time));
        TWEEN.update(time);

        const deltaTime = time - this._lastTime < 0 ? 0 : time - this._lastTime;
        this._lastTime = time;

        const runningAnimation = this.#animationEngine.update(deltaTime);

        for(let a in this._animationFrameCallbacks)
            this._animationFrameCallbacks[a](time, deltaTime, runningAnimation);
    }

    // #endregion Private Methods (1)
}