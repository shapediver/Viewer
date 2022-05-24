import { getDirectories, execPromise, deployToS3 } from './utils';

(async () => {
    try {
        const examples = await getDirectories('examples');
        
        for(let i = 0; i < examples.length; i++) {
            console.log('deploying example ' + (i+1) + '/' + examples.length + '...')
            const example = examples[i];
            console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));
            deployToS3('examples/' + example + '/dist-prod', example, undefined, true)
        }
    } catch (e) {
        console.log(e)
    }
})()