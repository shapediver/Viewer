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

const getDirectories = async (source: string) =>
    (await fs.promises.readdir(source, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

(async () => {
    try {

        const rl1 = readline.createInterface({ input: process.stdin, output: process.stdout });
        let name;
        await new Promise<void>((resolve) => {
            rl1.question('Enter the name of the demo to be deployed\n', (answer: string) => {
                name = answer;
                rl1.close();
                resolve();
            });
        });

        const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
        const examples = await getDirectories('examples');
        let example: string = '';
        await new Promise<void>((resolve) => {
            rl2.question('Enter the name of the example to be deployed\n', (answer: string) => {
                if (examples.includes(answer)) {
                    example = answer;
                } else {
                    throw new Error('Not a valid example.')
                }                
                rl2.close();
                resolve();
            });
        });

        console.log(name, example)

        console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));

        const bucketName = 'shapediverviewer';
        const prefix = 'v3/demos/' + name + '/';
        const s3 = new AWS.S3({ maxRetries: 5 });

        const directoryPathTest = 'examples/' + example + '/dist-prod/';
        const fileContentsTest = <string[]>recursiveReadSync(directoryPathTest);
        fileContentsTest.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefix + example + '/' + f.substring(directoryPathTest.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });

        console.log(`Deployed to: https://viewer.shapediver.com/${prefix}${example}/index.html`)
    } catch (e) {
        console.log(e)
    }
})()