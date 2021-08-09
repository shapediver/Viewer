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
        console.log(await execPromise('npm run build-current'));
        console.log(await execPromise('cd examples/test && npm run build-prod && cd ../..'));
        console.log(await execPromise('cd examples/gltf && npm run build-prod && cd ../..'));
        console.log(await execPromise('cd examples/multiple && npm run build-prod && cd ../..'));
        console.log(await execPromise('cd examples/performance && npm run build-prod && cd ../..'));

        const bucketName = 'shapediverviewer';
        const prefixLatest = 'v3/latest/';
        const s3 = new AWS.S3({ maxRetries: 5 });

        const directoryPathTest = 'examples/test/dist-prod/';
        const fileContentsTest = <string[]>recursiveReadSync(directoryPathTest);
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

        const directoryPathGltf = 'examples/gltf/dist-prod/';
        const fileContentsGltf = <string[]>recursiveReadSync(directoryPathGltf);
        fileContentsGltf.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefixLatest + 'gltf/' + f.substring(directoryPathGltf.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });

        const directoryPathMultiple = 'examples/multiple/dist-prod/';
        const fileContentsMultiple = <string[]>recursiveReadSync(directoryPathMultiple);
        fileContentsMultiple.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefixLatest + 'multiple/' + f.substring(directoryPathMultiple.length, f.length).replace(/\\/g, '/'),
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain',
                CacheControl: 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err) });
        });

        const directoryPathPerformance = 'examples/performance/dist-prod/';
        const fileContentsPerformance = <string[]>recursiveReadSync(directoryPathPerformance);
        fileContentsPerformance.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefixLatest + 'performance/' + f.substring(directoryPathPerformance.length, f.length).replace(/\\/g, '/'),
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