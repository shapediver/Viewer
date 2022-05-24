import { execPromise, getDirectories, deployToS3, readAnswerOptions } from './utils';

(async () => {
    try {
        const git_branch: string = <string>await execPromise('git branch --show-current');
        const prefix = 'v3/branch/' + git_branch;

        const examples = await getDirectories('examples');
        let example: string = await readAnswerOptions('Enter the name of the example to be deployed\n', examples)
        
        console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));
        deployToS3('examples/' + example + '/dist-prod', example, prefix)

        console.log(`Deployed to: https://viewer.shapediver.com/${prefix}/${example}/index.html`)
    } catch (e) {
        console.log(e)
    }
})()