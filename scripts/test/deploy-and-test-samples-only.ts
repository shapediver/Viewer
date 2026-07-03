import {deployToS3Folder, execPromise} from "../utils/utils";

function resolveTestPrefix(): string {
	const target = (process.env.VIEWER_TEST_ENV || "production").trim().toLowerCase();
	switch (target) {
		case "development":
			return "v3/development";
		case "staging":
			return "v3/staging";
		case "production":
		case "latest":
		case "main":
		default:
			return "v3/latest";
	}
}

(async () => {
	try {
		process.env.VIEWER_TEST_ENV = (process.env.VIEWER_TEST_ENV || "production").trim().toLowerCase();
		const prefix = resolveTestPrefix();
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
			deployToS3Folder("examples/" + example + "/dist", example, prefix);
		}

		// only run the tests for animation, api, attributes, camera, interaction and parameters
		const res = await execPromise("npm run test-samples-only");
		console.log(res);
	} catch (e) {
		console.log(e);
	}
})();
