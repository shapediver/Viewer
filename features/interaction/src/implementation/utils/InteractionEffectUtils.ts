import {type IViewportApi} from "@shapediver/viewer";
import {GeometryData, type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {UuidGenerator} from "@shapediver/viewer.shared.services";

import {
	type IInteractionEffect,
	type IInteractionEffectUtils,
	isMaterialData} from "../../interfaces/utils/IInteractionEffectUtils";

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
			if (!postProcessingEffect)
				this.#viewport.postProcessing.addEffect(effect, stringified);

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
					let removed = false;
					for (
						let index = geometryData.effectMaterials.length - 1;
						index >= 0;
						index--
					) {
						if (geometryData.effectMaterials[index].token !== token)
							continue;
						geometryData.effectMaterials.splice(index, 1);
						removed = true;
					}
					if (removed) {
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
		const postProcessingEffect =
			this.#viewport.postProcessing.outlineEffects[token];

		if (postProcessingEffect) {
			postProcessingEffect.removeSelection(node);
			if (postProcessingEffect.selectedNodes().length === 0) {
				this.#viewport.postProcessing.removeEffect(token);
			}
		}
	}
}
