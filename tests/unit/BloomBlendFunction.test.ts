import {expect, test} from "@playwright/test";
import {BlendFunction, BloomEffect} from "postprocessing";
import {resolveBloomBlendFunction} from "../../rendering-engine/rendering-engine-threejs/src/managers/PostProcessingManager";

test("an explicit blend function wins in both buffer types", () => {
	expect(resolveBloomBlendFunction(BlendFunction.MULTIPLY, true)).toBe(
		BlendFunction.MULTIPLY,
	);
	expect(resolveBloomBlendFunction(BlendFunction.MULTIPLY, false)).toBe(
		BlendFunction.MULTIPLY,
	);
});

test("an unset blend function adds the bloom in a half-float composer", () => {
	expect(resolveBloomBlendFunction(undefined, true)).toBe(BlendFunction.ADD);
});

test("an unset blend function stays unset in 8-bit buffers", () => {
	expect(resolveBloomBlendFunction(undefined, false)).toBeUndefined();
});

test("the library default of a bloom without blend function is SCREEN", () => {
	const effect = new BloomEffect({blendFunction: undefined});
	expect(effect.blendMode.blendFunction).toBe(BlendFunction.SCREEN);
	effect.dispose();
});
