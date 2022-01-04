import AWS from 'aws-sdk';
import * as fs from 'fs';
import pako from 'pako';

const recursiveReadSync = require('recursive-readdir-sync');
const { exec } = require("child_process");
const readline = require('readline');

const execPromise = (cmd: string) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error: any, stdout: any) => {
            console.log(error, stdout)
            if (error) throw new Error(error);
            if (!error && typeof stdout === 'string') resolve(stdout.replace('\n', ''));
        });
    });
}

const s3 = new AWS.S3({ maxRetries: 5 });
const bucketName = 'shapediverviewer';
const prefixLatest = 'v3/latest';


const deployToS3 = (directoryPath: string, name?: string, prefix?: string) => {
    const fileContents = <string[]>recursiveReadSync(directoryPath);
    fileContents.map(function (f, cb) {
        const key = (name ? prefix + '/' + name : prefix) + f.substring(directoryPath.length, f.length).replace(/\\/g, '/');
        s3.putObject({
            Bucket: bucketName,
            Key: key,
            Body: pako.gzip(fs.readFileSync(f)),
            ACL: 'public-read',
            ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.css') ? 'text/css' : f.endsWith('.png') ? 'image/png' : 'text/plain',
            CacheControl: 'max-age=3600',
            ContentEncoding: 'gzip'
        }, (err) => { if (err) console.log(err) });
    });
    fileContents.map(function (f, cb) {
        const key = (name ? prefixLatest + '/' + name : prefixLatest) + f.substring(directoryPath.length, f.length).replace(/\\/g, '/');
        s3.putObject({
            Bucket: bucketName,
            Key: key,
            Body: pako.gzip(fs.readFileSync(f)),
            ACL: 'public-read',
            ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.css') ? 'text/css' : f.endsWith('.png') ? 'image/png' : 'text/plain',
            CacheControl: 'max-age=3600',
            ContentEncoding: 'gzip'
        }, (err) => { if (err) console.log(err) });
    });
};

const getDirectories = async (source: string) =>
    (await fs.promises.readdir(source, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

(async () => {
    try {
        /**
         * How do we increment the version?
         */
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        let version;
        await new Promise<void>((resolve) => {
            rl.question('Which part of the version would you like to increment? (major, minor, patch)\n', (answer: string) => {
                if (answer === 'major' || answer === 'minor' || answer === 'patch') {
                    version = answer;
                } else {
                    throw new Error('Invalid version, has to be major, minor or patch.')
                }
                rl.close();
                resolve();
            });
        });

        const changes = await execPromise(`git status --porcelain`);
        if(changes) {
            throw new Error(`Please stage and commit your files first.\n${changes}`);
        } else {
            console.log(changes);
        }

        console.log('checking versioning...')

        /**
         * Increase the version
         */
        const packageJson = require('../api/api/package.json');
        const versions: string[] = packageJson.version.split('.');
        const newVersion: string =  (+versions[0] + (version === 'major' ? 1 : 0)) + '.' + 
                            (version === 'major' ? 0 : (+versions[1] + (version === 'minor' ? 1 : 0))) + '.' + 
                            (version === 'major' ? 0 : version === 'minor' ? 0 : (+versions[2] + (version === 'patch' ? 1 : 0)));

        const git_commit: string = <string>await execPromise('git rev-parse HEAD');
        const git_branch: string = <string>await execPromise('git branch --show-current');
        if (!git_branch || !git_commit) throw new Error('Could not get git branch or commit for deployment.');
        const timestamp = new Date().toISOString();

        fs.writeFileSync('shared/build-data/src/build_data.ts', 'export const build_data = ' + JSON.stringify({
            build_version: '3.' + newVersion,
            build_date: timestamp,
            build_branch: git_branch,
            build_commit: git_commit
        }, null, 0) + ';');

        const readmeVersion = `\n## Version\n* __Version:__ ${newVersion}\n* __Build date:__ ${timestamp}\n* __Branch:__ ${git_branch}\n* __Commit:__ ${git_commit}\n`
        let readme = fs.readFileSync('./documentation/releaseNotes.md', 'utf8');
        readme = readme.replace(readme.substring(readme.indexOf('<!--- VERSION_START -->') + '<!--- VERSION_START -->'.length, readme.indexOf('<!--- VERSION_END -->')), readmeVersion)
        fs.writeFileSync('./documentation/releaseNotes.md', readme, 'utf8');
        
        console.log('re-building for deployment...')
        console.log(await execPromise('npm run build-current'));
        console.log(await execPromise('npm run build-prod'));

        console.log('creating doc...')
        console.log(await execPromise('npm run doc'));

        console.log('creating automatic pre-publishing commit...')
        console.log(await execPromise('git add .'));
        console.log(await execPromise('git commit -m "automatic pre-publishing commit"'));

        console.log(await execPromise(`lerna version ${version} --yes --no-private --exact --force-publish`));
        console.log(await execPromise('git tag -l "@shapediver*" | xargs -n 1 git push --delete origin'));
        console.log(await execPromise('git tag -l "@shapediver*" | xargs git tag -d'));

        console.log(await execPromise(`npm whoami`));
        console.log('publishing to npm...')
        console.log(await execPromise(`lerna publish from-package --yes --no-private --force-publish --registry https://registry.npmjs.org/`));

        console.log('publishing to github...')
        console.log(await execPromise(`lerna publish from-package --yes --no-private --force-publish --registry https://npm.pkg.github.com/`));
        
        const prefix = 'v3/' + newVersion;
      
        console.log('deploying to s3...')
        
        deployToS3('docs', 'api', prefix)

        const examples = await getDirectories('examples');
        
        for(let i = 0; i < examples.length; i++) {
            console.log('deploying example ' + (i+1) + '/' + examples.length + '...')
            const example = examples[i];
            console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));
            deployToS3('examples/' + example + '/dist-prod', example, prefix)
        }
        deployToS3('examples/cdn/dist-prod', undefined, prefix)

        await execPromise(`git tag -a viewer@${newVersion} -m "deployed viewer version ${newVersion}"`);
        await execPromise(`git push origin viewer@${newVersion}`);

    } catch (e) {
        console.log(e)
    }
})()