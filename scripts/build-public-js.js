const fs = require('fs');
const path = require('path');
const terser = require('terser');

const root = path.resolve(__dirname, '..');
const inputFile = path.join(root, 'public', 'index-filters.js');
const outputFile = path.join(root, 'public', 'index-filters.min.js');

(async () => {
  const source = fs.readFileSync(inputFile, 'utf8');
  const result = await terser.minify(source, {
    compress: {
      passes: 2,
      drop_console: false,
      keep_fargs: true
    },
    mangle: true,
    format: {
      comments: false,
      ascii_only: true
    }
  });
  if (!result.code) throw new Error('Terser returned no output.');
  fs.writeFileSync(outputFile, result.code, 'utf8');
  console.log(`Built ${path.relative(root, outputFile)} (${Buffer.byteLength(result.code)} bytes).`);
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
