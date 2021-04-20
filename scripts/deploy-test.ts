import AWS from 'aws-sdk';
import * as fs from 'fs';

const recursiveReadSync = require('recursive-readdir-sync');

(async () => {
    try {
        const bucketName = 'shapediverviewer';
        const prefixLatest = 'v3/latest/';
        const s3 = new AWS.S3({ maxRetries: 5 });

        const directoryPathEmpty = 'examples/empty/dist-prod/';
        const fileContentsEmpty = <string[]>recursiveReadSync(directoryPathEmpty);
        fileContentsEmpty.map(function (f, cb) {
            s3.putObject({
                Bucket: bucketName,
                Key: prefixLatest + 'test/' + f.substring(directoryPathEmpty.length, f.length).replace(/\\/g, '/'),
                Body: fs.readFileSync(f),
                ACL: 'public-read',
                ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain'
            }, (err) => { if (err) console.log(err) });
        });
    } catch (e) {
        console.log(e)
    }
})()