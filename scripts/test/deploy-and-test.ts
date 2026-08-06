import * as dotenv from "dotenv";
import {execPromise} from "../utils/utils";

function resolveViewerTestEnv(): string {
	return (process.env.VIEWER_TEST_ENV || "production").trim().toLowerCase();
}

dotenv.config();
const slackToken = process.env.SLACKBOT_OAUTH_TOKEN;

const sendSlackMessage = async (text: string) => {
	const url = "https://slack.com/api/chat.postMessage";
	await fetch(url, {
		method: "POST",
		headers: {
			authorization: `Bearer ${slackToken}`,
			"Content-type": "application/json; charset=utf-8",
		},
		body: JSON.stringify({
			channel: "#dev-viewer-3",
			text,
		}),
	});
};

const processError = async (e: unknown) => {
	console.log(e);
	sendSlackMessage("Tests failed.");
};

(async () => {
	try {
		const viewerTestEnv = resolveViewerTestEnv();
		process.env.VIEWER_TEST_ENV = viewerTestEnv;
		sendSlackMessage(`Starting build before testing (${viewerTestEnv})...`);
		console.log(await execPromise("npm run build"));
		console.log(await execPromise("npm run build-tests"));
		sendSlackMessage(
			`Starting deployment of test pages (${viewerTestEnv})...`,
		);
		console.log(await execPromise("npm run deploy-tests"));
		const res = await execPromise("npm run test");
		console.log(res);
		sendSlackMessage(
			res.includes("failed")
				? `Tests failed (${viewerTestEnv}).`
				: `Tests finished successfully (${viewerTestEnv})!`,
		);
	} catch (e) {
		processError(e);
	}
})();
