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

const s3 = new AWS.S3({ maxRetries: 5 });
const bucketName = 'shapediverviewer';
const prefixLatest = 'v3/latest';

const getDirectories = async (source: string) =>
    (await fs.promises.readdir(source, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

const deployToS3 = (directoryPath: string, name?: string, prefix?: string) => {
    const fileContents = <string[]>recursiveReadSync(directoryPath);
    if(prefix) {
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
    }
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
}

(async () => {
    try {

        const git_branch: string = <string>await execPromise('git branch --show-current');
        const prefix = 'v3/branch/' + git_branch;

        const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
        const examples = await getDirectories('examples');
        let example: string = '';
        await new Promise<void>((resolve) => {
            rl2.question('Enter the name of the test to be deployed\n', (answer: string) => {
                if (examples.includes(answer)) {
                    example = answer;
                } else {
                    throw new Error('Not a valid test.')
                }                
                rl2.close();
                resolve();
            });
        });

        console.log('deploying to s3...')
        console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));
        deployToS3('examples/' + example + '/dist-prod', example)
    } catch (e) {
        console.log(e)
    }
})()