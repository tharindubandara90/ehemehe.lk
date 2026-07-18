const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

const root = path.resolve(__dirname, '..');
const sources = [
  path.join(root, 'public/css/index-DcB2eYwd.css'),
  path.join(root, 'public/css/site-enhancements.css'),
  path.join(root, 'public/css/desktop-home-exact.css')
];
const output = path.join(root, 'public/css/ehemehe-app.min.css');
const input = sources.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const result = new CleanCSS({ level: 1, rebase: false }).minify(input);
if (result.errors.length) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}
fs.writeFileSync(output, result.styles, 'utf8');
console.log(`Built ${path.relative(root, output)} (${Buffer.byteLength(result.styles)} bytes).`);
