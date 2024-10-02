import { execPromise, getDirectories, deployToS3Latest } from '../utils/utils';

(async () => {
    try {
        const examples = (await getDirectories('examples')).filter(v => v.startsWith('test-'));
        
        for(let i = 0; i < examples.length; i++) {
            console.log('deploying example ' + (i+1) + '/' + examples.length + '...');
            const example = examples[i];
            if(example === 'main-pages' || example === 'scripts') continue;
            console.log(await execPromise('cd examples/' + example + ' && npm run build && cd ../..'));
            deployToS3Latest('examples/' + example + '/dist', example);
        }
    } catch (e) {
        console.log(e);
    }
})();