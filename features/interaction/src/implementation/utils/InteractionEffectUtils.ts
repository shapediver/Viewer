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
			// Use getEffectTokens() (reflects _effectDefinitions) rather than
			// outlineEffects[] (reflects _outlineManagers, which removeEffect never
			// cleans up). This ensures addEffect is re-called when an effect was
			// previously removed via postProcessing.removeEffect on empty OutlineManager.
			const effectTokens = this.#viewport.postProcessing.getEffectTokens();
			const alreadyRegistered = Object.prototype.hasOwnProperty.call(
				effectTokens,
				stringified,
			);
			if (!alreadyRegistered) {
				this.#viewport.postProcessing.addEffect(effect, stringified);
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
			if (remaining === 0) {
				// The OutlineManager is empty. The SDK does not auto-remove the
				// effect from _effectDefinitions, so getEffectTokens() would keep
				// reporting it (and changeEffectPass rebuilds a no-op OutlineEffect
				// on every frame). Explicitly remove it so the effect pipeline is
				// truly clean. applyInteractionEffect checks getEffectTokens() so
				// it will re-call addEffect next time.
				this.#viewport.postProcessing.removeEffect(token);
			}
		}
	}
}
