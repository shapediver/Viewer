import { execPromise, getDirectories, deployToS3, readAnswer } from '../utils/utils';

(async () => {
    try {
        const directories = await getDirectories('examples');
        const directoryName = await readAnswer('What example should be released?\n');

        if(!directories.includes(directoryName))
            throw new Error('Example directory not found');

        const exampleName = await readAnswer('What example should be the name of the example?\n');

        console.log(await execPromise('cd examples/' + directoryName + ' && npm run build-prod && cd ../..'));
        deployToS3('examples/' + directoryName + '/dist-prod', exampleName, 'v3/examples', true);
        console.log(`Deployed to: https://viewer.shapediver.com/v3/examples/${exampleName}/index.html`);
    } catch (e) {
        console.log(e);
    }
})();