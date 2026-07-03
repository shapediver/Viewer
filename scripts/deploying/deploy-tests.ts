import {deployToS3Folder, execPromise, getDirectories} from "../utils/utils";

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
		const prefix = resolveTestPrefix();
		console.log(`Deploying test examples to prefix: ${prefix}`);
		const examples = (await getDirectories("examples")).filter((v) =>
			v.startsWith("test-"),
		);

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
			console.log(
				`Deployed to: https://viewer.shapediver.com/${prefix}/${example}/index.html`,
			);
		}
	} catch (e) {
		console.log(e);
	}
})();
