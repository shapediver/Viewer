import AWS from 'aws-sdk';
import * as fs from 'fs';
var recursiveReadSync = require('recursive-readdir-sync');

const bucketName = 'shapediverviewer';
const prefix = 'v3/0.1.0/';
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

const directoryPathApi = 'api/api/docs/';
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