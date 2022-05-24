import { execPromise, getDirectories, deployToS3, readAnswerOptions } from "./utils";

(async () => {
    try {
        const examples = await getDirectories('examples');
        let example: string = await readAnswerOptions('Enter the name of the test to be deployed\n', examples);

        console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));
        deployToS3('examples/' + example + '/dist-prod', example, undefined, true)
    } catch (e) {
        console.log(e)
    }
})()