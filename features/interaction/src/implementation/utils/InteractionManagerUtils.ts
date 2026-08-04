import {type IViewportApi} from "@shapediver/viewer";
import {RestrictionManager} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {Logger} from "@shapediver/viewer.shared.services";
import {type IIntersectionFilter} from "@shapediver/viewer.shared.types";

import {type IInteractionTypes} from "../../interfaces/IInteractionData";
import {INTERACTION_STATE} from "../../interfaces/IInteractionEngine";
import {type IInteractionFilterOptions} from "../../interfaces/IInteractionManager";
import {
	type IInteractionEffect,
	type IInteractionEffectUtils,
} from "../../interfaces/utils/IInteractionEffectUtils";
import {InteractionData} from "../InteractionData";

export class InteractionManagerUtils {
	/**
	 * Apply interaction effects to node and grouped nodes
	 */
	public static applyInteractionEffects(
		node: ITreeNode,
		groupedNodes: ITreeNode[] | undefined,
		interactionEffect: IInteractionEffect | undefined,
		interactionEffectUtils: IInteractionEffectUtils,
	): {token?: string; groupTokens: string[]} {
		const groupTokens: string[] = [];
		let token: string | undefined;

		if (interactionEffect) {
			token = interactionEffectUtils.applyInteractionEffect(
				node,
				interactionEffect,
			);
			if (groupedNodes) {
				groupedNodes.forEach((n) =>
					groupTokens.push(
						interactionEffectUtils.applyInteractionEffect(
							n,
							interactionEffect,
						),
					),
				);
			}
		}

		return {token, groupTokens};
	}

	/**
	 * Common filter implementation
	 */
	public static createInteractionFilter(
		interactionType: keyof IInteractionTypes,
		managerId: string,
		targetStates: INTERACTION_STATE[],
	): IInteractionFilterOptions {
		return (interactionState: INTERACTION_STATE): IIntersectionFilter => {
			if (targetStates.includes(interactionState)) {
				return (node: ITreeNode) => {
					return !!this.getInteractionData(
						node,
						false,
						managerId,
						interactionType,
					);
				};
			}
			return (node: ITreeNode) => false;
		};
	}

	/**
	 * Common getInteractionData implementation
	 */
	public static getInteractionData(
		node: ITreeNode,
		restrictions: boolean,
		managerId: string,
		interactionType: keyof IInteractionTypes,
	): InteractionData | undefined {
		for (let i = 0; i < node.data.length; i++) {
			if (node.data[i] instanceof InteractionData) {
				const data = node.data[i] as InteractionData;
				if (data.interactionTypes[interactionType] !== true) continue;

				if (restrictions) {
					if (
						data.restrictedManagers.length === 0 ||
						data.restrictedManagers.includes(managerId)
					)
						return data;
				} else {
					return data;
				}
			}
		}
	}

	/**
	 * Remove interaction effects from node and grouped nodes
	 */
	public static removeInteractionEffects(
		node: ITreeNode,
		groupedNodes: ITreeNode[] | undefined,
		token: string | undefined,
		groupTokens: string[],
		interactionEffectUtils: IInteractionEffectUtils,
	): void {
		if (token) {
			interactionEffectUtils.removeInteractionEffect(node, token);
			if (groupedNodes) {
				groupedNodes.forEach((n, i) =>
					interactionEffectUtils.removeInteractionEffect(
						n,
						groupTokens[i],
					),
				);
			}
		}
	}

	/**
	 * Update viewport for node and grouped nodes
	 */
	public static updateViewport(
		viewport: IViewportApi,
		node: ITreeNode,
		groupedNodes?: ITreeNode[],
		updateNodes: boolean = true,
	): void {
		if (updateNodes) viewport.updateNode(node);
		if (updateNodes && groupedNodes) {
			groupedNodes.forEach((n) => viewport.updateNode(n));
		}
		viewport.render();
	}

	/**
	 * Validates restriction manager and logs warning if not set
	 */
	public static validateRestrictionManager(
		restrictionManager: RestrictionManager | undefined,
		logger: Logger,
	): restrictionManager is RestrictionManager {
		if (!restrictionManager) {
			logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return false;
		}
		return true;
	}

	/**
	 * Validates viewport and logs warning if not set
	 */
	public static validateViewport(
		viewport: IViewportApi | undefined,
		logger: Logger,
	): viewport is IViewportApi {
		if (!viewport) {
			logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return false;
		}
		return true;
	}
}
