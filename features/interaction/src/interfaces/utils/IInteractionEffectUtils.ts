import {IOutlineEffectDefinition, IViewportApi} from "@shapediver/viewer";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {IMaterialAbstractData} from "@shapediver/viewer.shared.types";

export type IInteractionEffect =
	| IMaterialAbstractData
	| IOutlineEffectDefinition;

export const isMaterialData = (
	effect: IInteractionEffect,
): effect is IMaterialAbstractData => {
	return (effect as IMaterialAbstractData).materialOutput !== undefined;
};
export interface IInteractionEffectUtils {
	// #region Public Methods (2)

	viewport?: IViewportApi;

	/**
	 * Apply an effect material all geometry in the current node.
	 * The material provided will be used for this effect.
	 * The returned token can be used to removed the effect.
	 *
	 * @param node
	 * @param material
	 * @returns
	 */
	applyInteractionEffect(node: ITreeNode, effect: IInteractionEffect): string;
	/**
	 * Remove an effect material with the token provided wen adding it.
	 *
	 * @param node
	 * @param token
	 */
	removeInteractionEffect(node: ITreeNode, token: string): void;

	// #endregion Public Methods (2)
}
