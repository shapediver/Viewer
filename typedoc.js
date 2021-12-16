module.exports = {
    entryPoints: ['./api/api/src/index.ts', './shared/node-tree/src/index.ts'],
    out: 'docs',
    exclude: [
        '**/node_modules/**/*',
        '**/__tests__/**/*',
        '**/tests/**/*'
    ],
    name: 'Viewer',
    hideGenerator: true,
    disableSources: true,
    theme: 'minimal',
    excludeExternals: true,
    excludePrivate: true,
}
//    "doc": "s --theme minimal --name Viewer && cp -r api/api/images docs/images",
