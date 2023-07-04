import * as fs from 'fs';
import { execPromise, deployToS3, getDirectories, readAnswerOptions, readAnswer } from '../utils/utils';

(async () => {
    try {

        /**
         * Check if we want to do a public release or release a release candidate.
         */
        const publicReleasePublishAnswer = await readAnswer('Is this a public release?\n');
        const publicRelease = (publicReleasePublishAnswer === 'yes' || publicReleasePublishAnswer === 'y');

        /**
         * Read out the components of the version to see if we already have a release-candidate.
         */
        const packageJson = require('../../main/default/package.json');
        const versionComponents: string[] = packageJson.version.split('-');

        // if this was already a release-candidate (versionComponents.length > 1) we don't need to ask for the version, as it was already updated.
        let versionInput = "";
        if(versionComponents.length === 1) {
            /**
             * How do we increment the version?
             */
            versionInput = await readAnswerOptions('Which part of the version would you like to increment? (major, minor, patch)\n', ['major', 'minor', 'patch'])
        }



        /**
         * Check for changes that have not been committed.
         */
        const changes = await execPromise(`git status --porcelain`);
        if(changes) {
            throw new Error(`Please stage and commit your files first.\n${changes}`);
        } else {
            console.log(changes);
        }
        console.log('checking versioning...')



        /**
         * Deploy and run tests
         */
        console.log('deploying tests...')
        await execPromise(`npm run deploy-tests`)
        console.log('starting tests...')
        await execPromise(`npm run test`)



        /**
         * update of the version depending on the input for
         * release-candidate and version
         */
        let newVersion: string;
        if(versionComponents.length === 1) {
            // in both cases below we increase the version, in the release candidate (non-publicRelease) case we add a suffix

            const versions: string[] = packageJson.version.split('.');
                newVersion = (+versions[0] + (versionInput === 'major' ? 1 : 0)) + '.' +
                    (versionInput === 'major' ? 0 : (+versions[1] + (versionInput === 'minor' ? 1 : 0))) + '.' +
                    (versionInput === 'major' ? 0 : versionInput === 'minor' ? 0 : (+versions[2] + (versionInput === 'patch' ? 1 : 0)));

            if(publicRelease) {
                //  default case, public release before, public release now
            } else {
                // public release before, release candidate now
                // we increased the version according to the type of release candidate (patch, minor, major)
                // and add the release candidate suffix
                newVersion += "-rc.0";
            }
        } else {
            if(publicRelease) {
                // in this case we had a release candidate and now do a public release
                // therefore we just remove the release candidate part, as the version has already been updated
                // the type of upgrade is ignored here, but the initial update is used
                newVersion = versionComponents[0];
            } else {
                // in this case, we had a release candidate and have another one
                // therefore we increase the number and disregard the type of upgrade
                const releaseCandidateVersion: string[] = versionComponents[1].split('.');
                newVersion = versionComponents[0] + "-rc." + (+releaseCandidateVersion[1] + 1);
            }
        }



        /**
         * Update the build-data file
         */
        const gitCommit: string = <string>await execPromise('git rev-parse HEAD');
        const gitBranch: string = <string>await execPromise('git branch --show-current');
        if (!gitBranch || !gitCommit) throw new Error('Could not get git branch or commit for deployment.');
        const timestamp = new Date().toISOString();

        fs.writeFileSync('shared/build-data/src/build_data.ts', 'export const build_data = ' + JSON.stringify({
            build_version: '3.' + newVersion,
            build_date: timestamp,
            build_branch: gitBranch,
            build_commit: gitCommit
        }, null, 0) + ';');



        /**
         * re-build the whole project and all examples
         */
        console.log('re-building for deployment...')
        console.log(await execPromise('npm run build-current'));
        console.log(await execPromise('npm run build-prod'));


        /**
         * build the doc
         */
        console.log('creating doc...')
        console.log(await execPromise('npm run doc'));



        /**
         * as we have made file changes now, commit them so that lerna version doesn't fail
         */
        console.log('creating automatic pre-publishing commit...')
        console.log(await execPromise('git add .'));
        console.log(await execPromise('git commit -m "automatic pre-publishing commit"'));



        /**
         * update the package versions and delete the created tags
         */
        console.log(await execPromise(`lerna version ${newVersion} --yes --no-private --exact --force-publish`));
        console.log(await execPromise('git tag -l "@shapediver*" | xargs -n 1 git push --delete origin'));
        console.log(await execPromise('git tag -l "@shapediver*" | xargs git tag -d'));

        console.log(await execPromise(`npm whoami`));



        /**
         * deploy to s3
         * depending on if it is a public release or not, also deploy to the "latest" folder
         */
        const prefix = 'v3/' + newVersion;

        console.log('deploying to s3...')
        deployToS3('docs', 'api', prefix, publicRelease)

        const examples = await getDirectories('examples');

        for (let i = 0; i < examples.length; i++) {
            console.log('deploying example ' + (i + 1) + '/' + examples.length + '...')
            const example = examples[i];
            if (example === "main-pages") continue;
            console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));
            deployToS3('examples/' + example + '/dist-prod', example, prefix, publicRelease)
        }
            
        deployToS3('examples/cdn/dist-prod', undefined, prefix, publicRelease)
        deployToS3('examples/main-pages', undefined, prefix, publicRelease)




        /**
         * create a tag for this version and push it
         */
        await execPromise(`git tag -a viewer@${newVersion} -m "deployed viewer version ${newVersion}"`);
        await execPromise(`git push origin viewer@${newVersion}`);



        /**
         * Package releases to npm and github
         */
        if(publicRelease) {
            console.log('publishing to npm...')
            console.log(await execPromise(`npm run lerna-publish-npm`));
        }

        console.log('publishing to github...')
        console.log(await execPromise(`npm run lerna-publish-github`));

    } catch (e) {
        console.log(e)
    }
})()