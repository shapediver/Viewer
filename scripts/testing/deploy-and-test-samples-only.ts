import {deployToS3Latest, execPromise} from "../utils/utils";

(async () => {
	try {
		console.log(await execPromise("npm run build"));
		console.log(await execPromise("npm run build-tests"));

		// deploy only the cdn and attribute visualization tests to save time
		const examples = [
			"test-cdn",
			"test-attribute-visualization",
			"test-interaction",
		];

		for (let i = 0; i < examples.length; i++) {
			console.log(
				"deploying example " + (i + 1) + "/" + examples.length + "...",
			);
			const example = examples[i];
			if (example === "main-pages" || example === "scripts") continue;
			console.log(
				await execPromise(
					"cd examples/" + example + " && npm run build && cd ../..",
				),
			);
			deployToS3Latest("examples/" + example + "/dist", example);
		}

		// only run the tests for animation, api, attributes, camera, interaction and parameters
		const res = await execPromise("npm run test-samples-only");
		console.log(res);
	} catch (e) {
		console.log(e);
	}
})();
