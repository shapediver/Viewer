import { IAnimationData } from "@shapediver/viewer.shared.types";

export interface IAnimationEngine {
    // #region Properties (1)

    animations: {
        [key: string]: IAnimationData
    }

    // #endregion Properties (1)

    // #region Public Methods (2)

    /**
     * Update all animations and progress them according to the specified delta time.
     * 
     * returns true, if at least one animation is running
     * 
     * @param deltaTime 
     */
    update(deltaTime: number): boolean;
    /**
     * Traverse the scene tree and gather all the animation data present in it.
     */
    updateAnimationData(): void;

    // #endregion Public Methods (2)
}