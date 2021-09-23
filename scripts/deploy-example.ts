import AWS from 'aws-sdk';
import * as fs from 'fs';
import pako from 'pako';

const recursiveReadSync = require('recursive-readdir-sync');
const { exec } = require("child_process");

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
        // console.log(await execPromise('npm run build-current'));
        console.log(await execPromise('cd examples/simple && npm run build-prod && cd ../..'));

        const bucketName = 'shapediverviewer';
        const prefixLatest = 'v3/signify/';
        const s3 = new AWS.S3({ maxRetries: 5 });

        const directoryPathTest = 'examples/simple/dist-prod/';
        const fileContentsTest = <string[]>recursiveReadSync(directoryPathTest);
        fileContentsTest.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefixLatest + 'simple/' + f.substring(directoryPathTest.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });
    } catch (e) {
        console.log(e)
    }
})()