import { execPromise } from '../utils/utils';
import axios from 'axios';
import * as fs from 'fs';

const npmrcContents = fs.readFileSync("./.npmrc", {encoding:'utf8', flag:'r'});
const slackToken = npmrcContents
                    .split("\n")
                    .filter(s => s.startsWith("slackbot_oauth_token"))[0]
                    .replace("slackbot_oauth_token=", "");

const sendSlackMessage = async (text: string) => {
    const url = 'https://slack.com/api/chat.postMessage';
    const res = await axios.post(url, {
        channel: '#dev-viewer-3',
        text
    }, { headers: { authorization: `Bearer ${slackToken}` } });
    console.log('Done', res.data);
}

const processError = async (e: unknown) => {
    console.log(e)
    if(e instanceof Error && e.message) {
        sendSlackMessage("Tests failed with error: " + e.message)
    } else {
        sendSlackMessage("Tests failed.")
    }
}

(async () => {
    try {
        console.log(await execPromise(`npm run build-current`))
        console.log(await execPromise(`npm run deploy-tests`));
        const res = await execPromise(`npm run test`);
        console.log(res);
        sendSlackMessage("Tests finished!")
    } catch (e) {
        processError(e)
    }
})()
