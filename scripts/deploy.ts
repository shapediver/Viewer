import AWS from 'aws-sdk';
import * as fs from 'fs';
const recursiveReadSync = require('recursive-readdir-sync');
const { exec } = require("child_process");
const packageJson = require('../api/api/package.json');

const execPromise = (cmd: string) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error: any, stdout:any) => {
            if(!error && typeof stdout === 'string') resolve(stdout.replace('\n', ''));
        });
    });
}

(async () => {
    const git_commit: string = <string>await execPromise('git rev-parse HEAD');
    const git_branch: string = <string>await execPromise('git branch --show-current');
    if(!git_branch || !git_commit) throw new Error('Could not get git branch or commit for deployment.');
    const timestamp = new Date().toISOString();

    fs.writeFileSync('build_data.ts', 'export const build_data = ' + JSON.stringify({
        build_version: '3.' + packageJson.version,
        build_date: timestamp,
        build_branch: git_branch,
        build_commit: git_commit
    }, null, 0) + ';');

    const readmeVersion = `\n## Version\n* __Version:__ ${'3.' + packageJson.version}\n* __Build date:__ ${timestamp}\n* __Branch:__ ${git_branch}\n* __Commit:__ ${git_commit}\n`
    let readme = fs.readFileSync('./api/api/apiReadMe.md', 'utf8');
    readme = readme.replace( readme.substring(readme.indexOf('<!--- VERSION_START -->') + '<!--- VERSION_START -->'.length, readme.indexOf('<!--- VERSION_END -->')), readmeVersion)
    fs.writeFileSync('./api/api/apiReadMe.md', readme, 'utf8');

    await execPromise('npm run doc');
    const bucketName = 'shapediverviewer';
    const prefix = 'v3/' + packageJson.version + '/';
    const s3 = new AWS.S3({ maxRetries: 5 });

    const directoryPathStatic = 'examples/static/dist-prod/';
    const fileContentsStatic = <string[]>recursiveReadSync(directoryPathStatic);
    fileContentsStatic.map(function (f, cb) {
        s3.putObject({
            Bucket: bucketName,
            Key: prefix + 'static/' + f.substring(directoryPathStatic.length, f.length).replace(/\\/g, '/'),
            Body: fs.readFileSync(f),
            ACL: 'public-read',
            ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain'
        }, (err) => { if(err) console.log(err)} );
    });

    const directoryPathApi = 'docs/';
    const fileContentsApi = <string[]>recursiveReadSync(directoryPathApi);
    fileContentsApi.map(function (f, cb) {
        s3.putObject({
            Bucket: bucketName,
            Key: prefix + 'api/' + f.substring(directoryPathApi.length, f.length).replace(/\\/g, '/'),
            Body: fs.readFileSync(f),
            ACL: 'public-read',
            ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.css') ? 'text/css' : f.endsWith('.png') ? 'image/png' : 'text/plain'
        }, (err) => { if(err) console.log(err)} );
    });

    const directoryPathNormal = 'examples/simple/dist-prod/';
    const fileContentsNormal = <string[]>recursiveReadSync(directoryPathNormal);
    fileContentsNormal.map(function (f, cb) {
        s3.putObject({
            Bucket: bucketName,
            Key: prefix + f.substring(directoryPathNormal.length, f.length).replace(/\\/g, '/'),
            Body: fs.readFileSync(f),
            ACL: 'public-read',
            ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain'
        }, (err) => { if(err) console.log(err)} );
    });

})()