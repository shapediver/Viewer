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

const s3 = new AWS.S3({ maxRetries: 5 });
const bucketName = 'shapediverviewer';
const prefixLatest = 'v3/latest';

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
        console.log('deploying to s3...')
        const examples = ['ar', 'ar-query', 'attributes', 'cdn', 'compare', 'gltf', 'multiple', 'performance', 'query', 'simple', 'static', 'test'];
        for(let i = 0; i < examples.length; i++) {
            console.log('deploying example ' + (i+1) + '/' + examples.length + '...')
            const example = examples[i];
            console.log(await execPromise('cd examples/' + example + ' && npm run build-prod && cd ../..'));
            deployToS3('examples/' + example + '/dist-prod', example)
        }
    } catch (e) {
        console.log(e)
    }
})()