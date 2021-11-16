import AWS from 'aws-sdk';
import * as fs from 'fs';
import pako from 'pako';

const { exec } = require("child_process");

const styleToHide = 
`<style>
    .tsd-page-toolbar {
        display: none;
    }
    .tsd-index-group {
        display: none;
    }
    footer {
        display: none;
    }
</style>`;

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
        await execPromise(`rm -rf ./docs`)
        await execPromise(`npm run doc-releaseNotes`);
        await execPromise(`cp -r docs/index.html documentation/releaseNotes.html`);
        // load html and add style
        let releaseNotes = fs.readFileSync('./documentation/releaseNotes.html', 'utf8');
        const indexReleaseNotesHeadEnd = releaseNotes.indexOf('</head>')
        releaseNotes = releaseNotes.substr(0, indexReleaseNotesHeadEnd) + styleToHide + releaseNotes.substr(indexReleaseNotesHeadEnd);
        fs.writeFileSync('./documentation/releaseNotes.html', releaseNotes, 'utf8');
        
        await execPromise(`npm run doc-breakingChangesGuide`);
        await execPromise(`cp -r docs/index.html documentation/breakingChangesGuide.html`);
        // load html and add style
        let breakingChangesGuide = fs.readFileSync('./documentation/breakingChangesGuide.html', 'utf8');
        const indexBreakingChangesGuideHeadEnd = breakingChangesGuide.indexOf('</head>')
        breakingChangesGuide = breakingChangesGuide.substr(0, indexBreakingChangesGuideHeadEnd) + styleToHide + breakingChangesGuide.substr(indexBreakingChangesGuideHeadEnd);
        fs.writeFileSync('./documentation/breakingChangesGuide.html', breakingChangesGuide, 'utf8');

        await execPromise(`npm run doc-main`);
        await execPromise(`cp -r documentation/releaseNotes.html docs/releaseNotes.html`);
        await execPromise(`cp -r documentation/breakingChangesGuide.html docs/breakingChangesGuide.html`);
        await execPromise(`cp -r documentation/images docs/images`);

    } catch (e) {
        console.log(e)
    }
})()