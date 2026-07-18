const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const node = process.execPath;
const tests = [
  ['admin_dashboard_link_test.js', ['public/admin.html', 'public/admin.js']],
  ['category_taxonomy_uuid_regression_test.js', []],
  ['multi_phone_otp_test.js', []],
  ['otp_security_test.js', []],
  ['password_reset_security_test.js', []],
  ['phone_auth_flow_test.js', []],
  ['post_ad_all_category_fields_test.js', []],
  ['post_ad_canonical_route_test.js', []],
  ['post_ad_category_location_test.js', []],
  ['post_ad_review_publish_state_test.js', []],
  ['post_ad_route_cache_regression_test.js', []],
  ['unified_sms_service_test.js', []],
  ['performance_stability_regression_test.js', []],
  ['performance_lcp_footer_regression_test.js', []],
  ['desktop_home_first_paint_regression_test.js', []],
  ['public_ads_detail_desktop_regression_test.js', []],
  ['public_home_interactions_regression_test.js', []],
  ['supabase_marketplace_schema_regression_test.js', []],
  ['scripts/http-regression-test.js', []]
];

function collectJs(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectJs(full, output);
    else if (entry.isFile() && entry.name.endsWith('.js')) output.push(full);
  }
  return output;
}

console.log('Checking JavaScript syntax...');
for (const file of collectJs(root)) {
  execFileSync(node, ['--check', file], { cwd: root, stdio: 'pipe' });
}
console.log('JavaScript syntax checks passed.');

for (const [file, args] of tests) {
  console.log(`Running ${file}...`);
  execFileSync(node, [file, ...args], { cwd: root, stdio: 'inherit' });
}

console.log(`All ${tests.length} regression tests passed.`);
