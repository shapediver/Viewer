import { execPromise, deployToS3 } from '../utils/utils';

(async () => {
    try {
        console.log(await execPromise('cd examples/cdn && npm run build-prod && cd ../..'));
        deployToS3('examples/cdn/dist-prod', 'cdn', undefined, true)
    } catch (e) {
        console.log(e)
    }
})()