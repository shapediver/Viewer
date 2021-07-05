import AWS from 'aws-sdk';
import * as fs from 'fs';
import pako from 'pako';

const recursiveReadSync = require('recursive-readdir-sync');
const { exec } = require("child_process");
 const readline = require('readline');

const execPromise = (cmd: string) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error: any, stdout: any) => {
            if (error) throw new Error(error);
            if (!error && typeof stdout === 'string') resolve(stdout.replace('\n', ''));
        });
    });
}

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
        
        await execPromise(`npm run deploy-tests`)
        await execPromise(`npm run test`)

        const changes = await execPromise(`git status --porcelain`);
        if(changes) {
            throw new Error(`Please stage and commit your files first.\n${changes}`);
        } else {
            console.log(changes);
        }

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
            build_version: newVersion,
            build_date: timestamp,
            build_branch: git_branch,
            build_commit: git_commit
        }, null, 0) + ';');

        const readmeVersion = `\n## Version\n* __Version:__ ${newVersion}\n* __Build date:__ ${timestamp}\n* __Branch:__ ${git_branch}\n* __Commit:__ ${git_commit}\n`
        let readme = fs.readFileSync('./documentation/apiReadMe.md', 'utf8');
        readme = readme.replace(readme.substring(readme.indexOf('<!--- VERSION_START -->') + '<!--- VERSION_START -->'.length, readme.indexOf('<!--- VERSION_END -->')), readmeVersion)
        fs.writeFileSync('./documentation/apiReadMe.md', readme, 'utf8');
        
        console.log(await execPromise('npm run build-current'));
        console.log(await execPromise('npm run doc'));

        console.log(await execPromise('git add .'));
        console.log(await execPromise('git commit -m "automatic pre-publishing commit"'));

        console.log(await execPromise(`lerna publish ${version} --yes --no-private --force-publish --registry https://npm.pkg.github.com/`));

        console.log(await execPromise('npm run build-prod'));

        const bucketName = 'shapediverviewer';
        const prefix = 'v3/' + newVersion + '/';
        const prefixLatest = 'v3/latest/';
        const s3 = new AWS.S3({ maxRetries: 5 });

        const directoryPathStatic = 'examples/static/dist-prod/';
        const fileContentsStatic = <string[]>recursiveReadSync(directoryPathStatic);
        fileContentsStatic.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefix + 'static/' + f.substring(directoryPathStatic.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });
        fileContentsStatic.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefixLatest + 'static/' + f.substring(directoryPathStatic.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });

        const directoryPathTest = 'examples/test/dist-prod/';
        const fileContentsTest = <string[]>recursiveReadSync(directoryPathTest);
        fileContentsTest.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefix + 'test/' + f.substring(directoryPathTest.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });
        fileContentsTest.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefixLatest + 'test/' + f.substring(directoryPathTest.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });

        const directoryPathApi = 'docs/';
        const fileContentsApi = <string[]>recursiveReadSync(directoryPathApi);
        fileContentsApi.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefix + 'api/' + f.substring(directoryPathApi.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.css') ? 'text/css' : f.endsWith('.png') ? 'image/png' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });
        fileContentsApi.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefixLatest + 'api/' + f.substring(directoryPathApi.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.css') ? 'text/css' : f.endsWith('.png') ? 'image/png' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });

        const directoryPathNormal = 'examples/test/dist-prod/';
        const fileContentsNormal = <string[]>recursiveReadSync(directoryPathNormal);
        fileContentsNormal.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefix + f.substring(directoryPathNormal.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });
        fileContentsNormal.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefixLatest + f.substring(directoryPathNormal.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });

        await execPromise(`git tag -a v${'3.' + newVersion} -m "deployed viewer version ${'3.' + newVersion}"`);
        await execPromise(`git push origin v${'3.' + newVersion}`);

    } catch (e) {
        console.log(e)
    }
})()