import { execPromise } from '../utils/utils';
import * as fs from 'fs';

(async () => {
    await execPromise('lerna run doc');

    // in the docs folder and all its sub folders, search for all index.html files and add a script tag to the head

    const adaptHTMLFilesFromFolder = (dir: string) => {
        fs.readdirSync(dir).forEach(file => {
            file = dir + '/' + file;
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                adaptHTMLFilesFromFolder(file);
            } else {
                if (file.endsWith('.html')) {
                    const data = fs.readFileSync(file, 'utf8');
                    const result = data.replace(/<head>/, '<head><script defer data-domain="viewer.shapediver.com" src="https://viewer.shapediver.com/js/script.outbound-links.tagged-events.js"></script>');
                    fs.writeFileSync(file, result, 'utf8');
                }
            }
        });
    };

    adaptHTMLFilesFromFolder('docs');
})();