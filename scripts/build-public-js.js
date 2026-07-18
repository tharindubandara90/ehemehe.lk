const fs = require('fs');
const path = require('path');
const terser = require('terser');

const root = path.resolve(__dirname, '..');
const builds = [
  ['public/index-filters.js', 'public/index-filters.min.js'],
  ['public/desktop-home-exact.js', 'public/desktop-home-exact.min.js']
];

(async () => {
  for (const [inputRelative, outputRelative] of builds) {
    const inputFile = path.join(root, inputRelative);
    const outputFile = path.join(root, outputRelative);
    const source = fs.readFileSync(inputFile, 'utf8');
    const result = await terser.minify(source, {
      compress: { passes: 2, drop_console: false, keep_fargs: true },
      mangle: true,
      format: { comments: false, ascii_only: true }
    });
    if (!result.code) throw new Error(`Terser returned no output for ${inputRelative}.`);
    fs.writeFileSync(outputFile, result.code, 'utf8');
    console.log(`Built ${outputRelative} (${Buffer.byteLength(result.code)} bytes).`);
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
