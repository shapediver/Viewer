import AWS from 'aws-sdk';
import * as fs from 'fs';
var recursiveReadSync = require('recursive-readdir-sync');

const bucketName = 'shapediverviewer';
const directoryPath = 'examples/static/dist-prod/';
const fileContents = <string[]>recursiveReadSync(directoryPath);
const prefix = 'v3/0.1.0/static/';

const s3 = new AWS.S3({ maxRetries: 5 });

fileContents.map(function (f, cb) {
    s3.putObject({
        Bucket: bucketName,
        Key: prefix + f.substring(directoryPath.length, f.length).replace(/\\/g, '/'),
        Body: fs.readFileSync(f),
        ACL: 'public-read',
        ContentType: f.endsWith('.js') || f.endsWith('.js.map') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'text/plain'
    }, (err) => { if(err) console.log(err)} );
});