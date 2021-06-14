module.exports = {
    entryPoints: ['./api/api/src/index.ts', './shared/node-tree/src/index.ts'],
    out: 'docs',
    exclude: ['**/node_modules/**'],
    name: 'Viewer',
    excludePrivate: true,
    hideGenerator: true,
    readme: 'documentation/apiReadMe.md',
    disableSources: true,
    theme: 'minimal',
}
//    "doc": "s --theme minimal --name Viewer && cp -r api/api/images docs/images",
