import * as fs from "fs";
import * as path from "path";

export default async function globalSetup() {
	try {
		const response = await fetch(
			"https://raw.githubusercontent.com/shapediver/glTF-Sample-Models/master/2.0/model-index.json",
		);
		const models = await response.json();
		fs.writeFileSync(
			path.join(__dirname, "gltf", "models.json"),
			JSON.stringify(models, null, 2),
		);
	} catch (e) {
		console.warn(
			"globalSetup: failed to refresh models.json, using existing file.",
			e,
		);
	}
}
