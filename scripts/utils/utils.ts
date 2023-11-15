/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';
import { S3 } from '@aws-sdk/client-s3';
import pako from 'pako';

const { exec } = require('child_process');
const recursiveReadSync = require('recursive-readdir-sync');
const s3 = new S3({ maxAttempts: 5, region: 'us-east-1' });
const readline = require('readline');
const bucketName = 'shapediverviewer';
const prefixLatest = 'v3/latest';

export const execPromise = (cmd: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const process = exec(cmd, (error: any, stdout: any) => {
            if (error) reject(error);
            if (!error && typeof stdout === 'string') resolve(stdout.replace('\n', ''));
        });

        process.stdout.on('data', (data: any) =>  {
            console.log(data); 
        });
    });
};

export const getDirectories = async (source: string) =>
    (await fs.promises.readdir(source, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

export const deployToS3 = (directoryPath: string, name?: string, prefix?: string, latest = false) => {
    const fileContents = <string[]>recursiveReadSync(directoryPath);
    
    // deploy under specified prefix
    if(prefix) {
        fileContents.map(function (f, cb) {
            const key = (name ? prefix + '/' + name : prefix) + f.substring(directoryPath.length, f.length).replace(/\\/g, '/');
            s3.putObject({
                Bucket: bucketName,
                Key: key,
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.css') ? 'text/css' : f.endsWith('.png') ? 'image/png' : 'text/plain',
                CacheControl: name && name.startsWith('test') ? 'max-age=0' : 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err); });
        });
    }

    // deploy under latest prefix
    if(latest) {
        fileContents.map(function (f, cb) {
            const key = (name ? prefixLatest + '/' + name : prefixLatest) + f.substring(directoryPath.length, f.length).replace(/\\/g, '/');
            s3.putObject({
                Bucket: bucketName,
                Key: key,
                Body: pako.gzip(fs.readFileSync(f)),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.css') ? 'text/css' : f.endsWith('.png') ? 'image/png' : 'text/plain',
                CacheControl: name && name.startsWith('test') ? 'max-age=0' : 'max-age=3600',
                ContentEncoding: 'gzip'
            }, (err) => { if (err) console.log(err); });
        });
    }
};

export const readAnswer = async (question: string): Promise<string> => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return await new Promise<string>((resolve) => {
        rl.question(question, (answer: string) => {
            rl.close();
            resolve(answer);
        });
    });
}; 

export const readAnswerOptions = async (question: string, options: string[]): Promise<string> => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return await new Promise<string>((resolve, reject) => {
        rl.question(question, (answer: string) => {
            rl.close();
            if (options.includes(answer)) {
                resolve(answer);
            } else {
                reject('Not a valid example.');
            }    
        });
    });
}; 