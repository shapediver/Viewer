import * as fs from "fs";
import * as path from "path";

const gltfSampleModelsBaseUrl = (
	process.env.GLTF_SAMPLE_MODELS_BASE_URL ??
	"https://viewer.shapediver.com/v3/glTF-Sample-Models/2.0"
).replace(/\/$/, "");

export default async function globalSetup() {
	try {
		const response = await fetch(`${gltfSampleModelsBaseUrl}/model-index.json`);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch model-index.json: ${response.status} ${response.statusText}`,
			);
		}
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
