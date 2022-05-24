import { deployToS3, execPromise, getDirectories, readAnswer, readAnswerOptions } from './utils';

(async () => {
    try {
        let name = await readAnswer('Enter the name of the demo to be deployed\n');

        const examples = await getDirectories('examples');
        let example = await readAnswerOptions('Enter the name of the example to be deployed\n', examples);

        console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));

        const prefix = 'v3/demos/';
        const directoryPathTest = 'examples/' + example + '/dist-prod/';

        deployToS3(directoryPathTest, name + '/' + example, prefix)

        console.log(`Deployed to: https://viewer.shapediver.com/${prefix}${example}/index.html`)
    } catch (e) {
        console.log(e)
    }
})()