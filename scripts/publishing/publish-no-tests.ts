import * as fs from 'fs';
import { execPromise, deployToS3, getDirectories, readAnswerOptions, readAnswer } from '../utils/utils';

(async () => {
    try {
        // /**
        //  * How do we increment the version?
        //  */
        // let version = await readAnswerOptions('Which part of the version would you like to increment? (major, minor, patch)\n', ['major', 'minor', 'patch'])
        
        // let github_publish_answer = await readAnswer('Publish to github?\n');
        // let github_publish = (github_publish_answer === 'yes' || github_publish_answer === 'y');

        // let npm_publish_answer = await readAnswer('Publish to npm?\n');
        // let npm_publish = (npm_publish_answer === 'yes' || npm_publish_answer === 'y');


        // const changes = await execPromise(`git status --porcelain`);
        // if(changes) {
        //     throw new Error(`Please stage and commit your files first.\n${changes}`);
        // } else {
        //     console.log(changes);
        // }

        // console.log('checking versioning...')

        // /**
        //  * Increase the version
        //  */
        // const packageJson = require('../../main/default/package.json');
        // const versions: string[] = packageJson.version.split('.');
        // const newVersion: string =  (+versions[0] + ((version === 'major' || version === 'premajor') ? 1 : 0)) + '.' + 
        //                     ((version === 'major' || version === 'premajor') ? 0 : (+versions[1] + ((version === 'minor' || version === 'preminor') ? 1 : 0))) + '.' + 
        //                     ((version === 'major' || version === 'premajor') ? 0 : (version === 'minor' || version === 'preminor') ? 0 : (+versions[2] + ((version === 'patch' || version === 'prerelease') ? 1 : 0)));

        // const git_commit: string = <string>await execPromise('git rev-parse HEAD');
        // const git_branch: string = <string>await execPromise('git branch --show-current');
        // if (!git_branch || !git_commit) throw new Error('Could not get git branch or commit for deployment.');
        // const timestamp = new Date().toISOString();

        // fs.writeFileSync('shared/build-data/src/build_data.ts', 'export const build_data = ' + JSON.stringify({
        //     build_version: '3.' + newVersion,
        //     build_date: timestamp,
        //     build_branch: git_branch,
        //     build_commit: git_commit
        // }, null, 0) + ';');
        
        // console.log('re-building for deployment...')
        // console.log(await execPromise('npm run build-current'));
        // console.log(await execPromise('npm run build-prod'));

        // console.log('creating doc...')
        // console.log(await execPromise('npm run doc'));

        // console.log('creating automatic pre-publishing commit...')
        // console.log(await execPromise('git add .'));
        // console.log(await execPromise('git commit -m "automatic pre-publishing commit"'));

        // console.log(await execPromise(`lerna version ${version} --yes --no-private --exact --force-publish`));
        // console.log(await execPromise('git tag -l "@shapediver*" | xargs -n 1 git push --delete origin'));
        // console.log(await execPromise('git tag -l "@shapediver*" | xargs git tag -d'));

        // console.log(await execPromise(`npm whoami`));
        const newVersion = "2.0.5";

        if(true) {
            console.log('publishing to npm...')
            console.log(await execPromise(`lerna publish from-package --yes --no-private --force-publish --registry https://registry.npmjs.org/`));
        }

        if(true) {
            console.log('publishing to github...')
            console.log(await execPromise(`lerna publish from-package --yes --no-private --force-publish --registry https://npm.pkg.github.com/`));
        }
        
        const prefix = 'v3/' + newVersion;
      
        if(true) {
            console.log('deploying to s3...')
            deployToS3('docs', 'api', prefix, true)

            const examples = await getDirectories('examples');
            
            for(let i = 0; i < examples.length; i++) {
                console.log('deploying example ' + (i+1) + '/' + examples.length + '...')
                const example = examples[i];
                console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));
                deployToS3('examples/' + example + '/dist-prod', example, prefix, true)
            }
        }
            
        deployToS3('examples/cdn/dist-prod', undefined, prefix, true)

        await execPromise(`git tag -a viewer@${newVersion} -m "deployed viewer version ${newVersion}"`);
        await execPromise(`git push origin viewer@${newVersion}`);

    } catch (e) {
        console.log(e)
    }
})()