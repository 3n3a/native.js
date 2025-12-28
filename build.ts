await Bun.build({
    outdir: './build',
    format: 'esm',
    target: 'browser',
    splitting: false,
    entrypoints: [ 'src/index.ts' ],
    minify: {
        identifiers: false,
        whitespace: true,
        syntax: false,
        keepNames: true
    }
})