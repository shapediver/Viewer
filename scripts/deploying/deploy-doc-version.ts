import { execPromise, deployToS3 } from '../utils/utils';

(async () => {
    try {
        console.log(await execPromise('cd examples/doc-version && npm run build-prod && cd ../..'));
        deployToS3('examples/doc-version/dist-prod', 'doc-version', undefined, true)
    } catch (e) {
        console.log(e)
    }
})()