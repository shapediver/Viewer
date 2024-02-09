module.exports = {
    entryPoints: ['./src/index.ts'],
    out: '../../docs/features/drawing-tools',
    exclude: [
        '**/__tests__/**/*',
        '**/tests/**/*'
    ],
    name: 'Viewer - Drawing Tools',
    hideGenerator: true,
    disableSources: true,
    theme: 'default',
    excludeExternals: false,
    excludePrivate: true,
    sort: ['required-first', 'kind', 'alphabetical'],
}