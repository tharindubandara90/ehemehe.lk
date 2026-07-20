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
  ['login_auto_identifier_ui_regression_test.js', []],
  ['dashboard_profile_picture_regression_test.js', []],
  ['profile_bucket_creation_regression_test.js', []],
  ['post_ad_all_category_fields_test.js', []],
  ['post_ad_canonical_route_test.js', []],
  ['post_ad_category_location_test.js', []],
  ['post_ad_review_publish_state_test.js', []],
  ['post_ad_route_cache_regression_test.js', []],
  ['unified_sms_service_test.js', []],
  ['performance_stability_regression_test.js', []],
  ['desktop_home_first_paint_regression_test.js', []],
  ['desktop_live_first_paint_regression_test.js', []],
  ['post_auth_return_and_fast_home_regression_test.js', []],
  ['desktop_account_hero_balance_regression_test.js', []],
  ['desktop_olx_home_layout_regression_test.js', []],
  ['desktop_keyword_location_search_regression_test.js', []],
  ['desktop_fresh_recommendations_priority_regression_test.js', []],
  ['mobile_filter_button_responsive_regression_test.js', []],
  ['promotion_featured_admin_regression_test.js', []],
  ['public_ads_detail_desktop_regression_test.js', []],
  ['public_home_interactions_regression_test.js', []],
  ['supabase_marketplace_schema_regression_test.js', []],
  ['user_ad_edit_regression_test.js', []],
  ['dashboard_edit_mobile_home_navigation_regression_test.js', []],
  ['bug_report_full_regression_test.js', []],
  ['home_banner_recommendations_regression_test.js', []],
  ['mobile_favorites_and_recommendations_regression_test.js', []],
  ['dashboard_favorites_my_ads_speed_regression_test.js', []],
  ['dashboard_quick_favorites_my_ads_immediate_regression_test.js', []],
  ['my_ads_visible_render_regression_test.js', []],
  ['my_ads_owner_fallback_regression_test.js', []],
  ['my_ads_schema_cache_fallback_regression_test.js', []],
  ['account_settings_and_ownership_api_regression_test.js', []],
  ['vercel_function_startup_regression_test.js', []],
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
