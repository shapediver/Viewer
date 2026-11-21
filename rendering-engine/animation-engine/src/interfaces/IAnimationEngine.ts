import {
	type IAnimationData,
	type ISceneChanges,
} from "@shapediver/viewer.shared.types";

export interface IAnimationEngine {
	// #region Properties (1)

	animations: {
		[key: string]: IAnimationData;
	};

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
	 * Gather all the animation data present in the scene tree. With the
	 * nodes a scene update went through, only those are looked at; without
	 * them the whole tree is.
	 */
	updateAnimationData(changes?: ISceneChanges): void;

	// #endregion Public Methods (2)
}
