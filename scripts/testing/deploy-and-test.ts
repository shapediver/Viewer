import axios from "axios";
import * as dotenv from "dotenv";
import {execPromise} from "../utils/utils";

dotenv.config();
const slackToken = process.env.SLACKBOT_OAUTH_TOKEN;

const sendSlackMessage = async (text: string) => {
	const url = "https://slack.com/api/chat.postMessage";
	const res = await axios.post(
		url,
		{
			channel: "#dev-viewer-3",
			text,
		},
		{
			headers: {
				authorization: `Bearer ${slackToken}`,
				"Content-type": "application/json; charset=utf-8",
			},
		},
	);
};

const processError = async (e: unknown) => {
	console.log(e);
	sendSlackMessage("Tests failed.");
};

(async () => {
	try {
		sendSlackMessage("Starting build before testing...");
		console.log(await execPromise("npm run build"));
		console.log(await execPromise("npm run build-tests"));
		sendSlackMessage("Starting deployment of test pages...");
		console.log(await execPromise("npm run deploy-tests"));
		const res = await execPromise("npm run test");
		console.log(res);
		sendSlackMessage(
			res.includes("failed")
				? "Tests failed."
				: "Tests finished successfully!",
		);
	} catch (e) {
		processError(e);
	}
})();
