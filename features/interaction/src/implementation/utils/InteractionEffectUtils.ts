import {IViewportApi} from "@shapediver/viewer";
import {GeometryData, ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {UuidGenerator} from "@shapediver/viewer.shared.services";

import {
	IInteractionEffect,
	IInteractionEffectUtils,
	isMaterialData,
} from "../../interfaces/utils/IInteractionEffectUtils";

export class InteractionEffectUtils implements IInteractionEffectUtils {
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

	#viewport?: IViewportApi;

	public get viewport(): IViewportApi | undefined {
		return this.#viewport;
	}

	public set viewport(value: IViewportApi | undefined) {
		this.#viewport = value;
	}

	/**
	 * Apply the effect material to the node and all descendants.
	 *
	 * @param node
	 * @param material
	 * @returns
	 */
	public applyInteractionEffect(
		node: ITreeNode,
		effect: IInteractionEffect,
	): string {
		const token = this.#uuidGenerator.create();
		if (!effect) return token;

		if (isMaterialData(effect)) {
			const applyEffect = (node: ITreeNode) => {
				for (let i = 0; i < node.data.length; i++) {
					if (node.data[i] instanceof GeometryData) {
						const geometryData = <GeometryData>node.data[i];
						geometryData.effectMaterials.push({
							material: effect,
							token,
						});
						this.#viewport?.updateGeometryData(geometryData);
					}
				}

				for (let i = 0; i < node.children.length; i++) {
					applyEffect(node.children[i]);
				}
			};
			applyEffect(node);
		} else {
			if (!this.#viewport) return token;
			const stringified = JSON.stringify(effect);
			const postProcessingEffect =
				this.#viewport.postProcessing.outlineEffects[stringified];
			if (!postProcessingEffect) {
				console.debug(
					`[InteractionEffectUtils] applyInteractionEffect: ADDING new outline effect to postProcessing, token=${stringified.substring(0, 60)}…, node="${node.name}"`,
				);
				this.#viewport.postProcessing.addEffect(effect, stringified);
			} else {
				console.debug(
					`[InteractionEffectUtils] applyInteractionEffect: reusing existing outline effect, token=${stringified.substring(0, 60)}…, node="${node.name}"`,
				);
			}

			this.#viewport.postProcessing.outlineEffects[
				stringified
			].addSelection(node);

			return stringified;
		}

		return token;
	}

	/**
	 * Remove the effect material with the specified token from the node and all descendants.
	 *
	 * @param node
	 * @param token
	 */
	public removeInteractionEffect(node: ITreeNode, token: string) {
		const removeEffect = (node: ITreeNode) => {
			for (let i = 0; i < node.data.length; i++) {
				if (node.data[i] instanceof GeometryData) {
					const geometryData = <GeometryData>node.data[i];
					const index = geometryData.effectMaterials.findIndex(
						(e) => e.token === token,
					);
					if (index !== -1) {
						geometryData.effectMaterials.splice(index, 1);
						this.#viewport?.updateGeometryData(geometryData);
					}
				}
			}

			for (let i = 0; i < node.children.length; i++) {
				removeEffect(node.children[i]);
			}
		};
		removeEffect(node);

		if (!this.#viewport) return;
		const postProcessingEffect = this.#viewport.postProcessing
			.outlineEffects[token] as any;

		if (postProcessingEffect) {
			const removed = postProcessingEffect.removeSelection(node);
			const remaining = postProcessingEffect.selectedNodes().length;
			console.debug(
				`[InteractionEffectUtils] removeInteractionEffect: removeSelection(node="${node.name}") removed=${removed}, remaining nodes in OutlineManager=${remaining}, token=${token.substring(0, 60)}…`,
			);
			if (remaining === 0) {
				console.debug(
					`[InteractionEffectUtils] removeInteractionEffect: OutlineManager is now EMPTY — effect definition still alive in getEffectTokens() (no auto-cleanup in SDK). token=${token.substring(0, 60)}…`,
				);
			}
		} else {
			console.debug(
				`[InteractionEffectUtils] removeInteractionEffect: no outline effect found for token=${token.substring(0, 60)}…, viewport=${!!this.#viewport}`,
			);
		}
	}
}
