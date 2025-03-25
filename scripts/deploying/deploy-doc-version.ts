import {deployToS3Latest, execPromise} from "../utils/utils";

(async () => {
	try {
		console.log(
			await execPromise(
				"cd examples/doc-version && npm run build && cd ../..",
			),
		);
		deployToS3Latest("examples/doc-version/dist", "doc-version");
	} catch (e) {
		console.log(e);
	}
})();
