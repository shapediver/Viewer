
import { S3 } from '@aws-sdk/client-s3';

const s3 = new S3({ maxAttempts: 5, region: 'us-east-1' });
const bucketName = 'shapediverviewer';
const prefix = 'v2/';
let counter = 0;

const defaultDivReplacement = `<div style="
text-align: center;
font-size: x-large;
background: lightcoral;
padding: 1rem;
">
<p>You are reading the documentation for the version 2 of the ShapeDiver viewer API. Free support for this viewer version will be discontinued on June 1st, 2024.</p>
<p>Please refer to the version 3 documentation <a href="https://viewer.shapediver.com/v3/latest/api/index.html">here</a>. See also the migration guide from version 2 to version 3 <a href="https://help.shapediver.com/doc/migration-guide">here</a>.
</p>
</div>`;
const snapModuleDivReplacement = `<div style="text-align: center;font-size: x-large;background: lightcoral;padding: 1rem;top: 3rem;position: relative;z-index: 9999;">
<p>You are reading the documentation for the version 2 of the ShapeDiver viewer API. Free support for this viewer version will be discontinued on June 1st, 2024.</p>
<p>Please refer to the version 3 documentation <a href="https://viewer.shapediver.com/v3/latest/api/index.html">here</a>. See also the migration guide from version 2 to version 3 <a href="https://help.shapediver.com/doc/migration-guide">here</a>.
</p>
</div>`;
const oldDivReplacement = `<div style="text-align: center;font-size: x-large;background: lightcoral;padding: 1rem;top: 5rem;position: relative;z-index: 9999;">
<p>You are reading the documentation for the version 2 of the ShapeDiver viewer API. Free support for this viewer version will be discontinued on June 1st, 2024.</p>
<p>Please refer to the version 3 documentation <a href="https://viewer.shapediver.com/v3/latest/api/index.html">here</a>. See also the migration guide from version 2 to version 3 <a href="https://help.shapediver.com/doc/migration-guide">here</a>.
</p>
</div>`;


export const getSubFolders = async (prefix: string) => {
    const files = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: prefix,
        Delimiter: '/'
    });
    return files.CommonPrefixes!.map(f => f.Prefix!)!;
};

export const getHtmlFiles = async (prefix: string) => {
    const files = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: prefix
    });
    return files.Contents!.filter(f => f.Key && f.Key.endsWith('.html')).map(f => f.Key!)!;
};


(async () => {
    try {
        const subFolders = await getSubFolders(prefix);
        console.log(subFolders);
        for (const folder of subFolders) {
            if(!folder.startsWith("v2/2")) {
                console.log("skipping", folder);
                continue;
            }

            const versionsWithDocs = ["2.0.0",  "2.0.1", "2.0.2", "2.0.3", "2.0.4", "2.0.5", "2.0.9"];
            const version = folder.split("/")[1];
            if(versionsWithDocs.includes(version)) {
                console.log("skipping", folder);
                continue;
            }

            console.log("updating", folder);
            const files = await getHtmlFiles(folder + "doc");
            // get files from s3
            for (const fileName of files) {
                const file = await s3.getObject({
                    Bucket: bucketName,
                    Key: fileName
                });
                const content = await file.Body!.transformToString();
                if (content) {
    
                    let replacement = defaultDivReplacement;
                    if(fileName.includes("doc/snapModule")) replacement = snapModuleDivReplacement;
                    if(fileName.includes("v2/2.0")) replacement = oldDivReplacement;
    
                    const newContent = content.indexOf('<body>') > -1 ? content.replace('<body>', replacement) : content;
                    
                    if(content.indexOf('<body>') === -1)
                        console.log("no body tag", fileName);
    
                    await s3.putObject({
                        Bucket: bucketName,
                        Key: fileName,
                        Body: newContent,
                        ACL: 'public-read',
                        ContentType: 'text/html',
                        CacheControl: 'max-age=3600'
                    });

                    counter++;
                    console.log("number of files updated", counter);
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
})();