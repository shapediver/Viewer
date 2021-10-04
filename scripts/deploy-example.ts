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

        const rl1 = readline.createInterface({ input: process.stdin, output: process.stdout });
        let name;
        await new Promise<void>((resolve) => {
            rl1.question('Enter the name of the page to be deployed\n', (answer: string) => {
                name = answer;
                rl1.close();
                resolve();
            });
        });

        const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
        let example: string = '';
        await new Promise<void>((resolve) => {
            rl2.question('Enter the name of the example to be deployed\n', (answer: string) => {
                if (['ar', 'ar-query', 'attributes', 'compare', 'gltf', 'multiple', 'performance', 'query', 'simple', 'static', 'test'].includes(answer)) {
                    example = answer;
                } else {
                    throw new Error('Invalid version, has to be major, minor or patch.')
                }                
                rl2.close();
                resolve();
            });
        });

        console.log(name, example)

        // console.log(await execPromise('npm run build-current'));
        console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));

        const bucketName = 'shapediverviewer';
        const prefixLatest = 'v3/examples/' + name + '/';
        const s3 = new AWS.S3({ maxRetries: 5 });

        const directoryPathTest = 'examples/' + example + '/dist-prod/';
        const fileContentsTest = <string[]>recursiveReadSync(directoryPathTest);
        fileContentsTest.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefixLatest + example + '/' + f.substring(directoryPathTest.length, f.length).replace(/\\/g, '/'),
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