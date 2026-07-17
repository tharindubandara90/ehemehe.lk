const fs = require('fs');
const path = require('path');

const root = __dirname;
const profile = fs.readFileSync(path.join(root, 'public/dashboard-profile.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public/brand-theme.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const bridge = fs.readFileSync(path.join(root, 'public/auth-session-bridge.js'), 'utf8');
const dispatcher = fs.readFileSync(path.join(root, 'lib/api-dispatcher.js'), 'utf8');
const handler = fs.readFileSync(path.join(root, 'api-handlers/upload-profile-photo.js'), 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(index.includes('/dashboard-profile.js'), 'Dashboard profile script is not loaded by index.html.');
expect(profile.includes("fetch('/api/upload-profile-photo'"), 'Profile photo is not uploaded through the protected API.');
expect(handler.includes('saveAvatarMetadata'), 'Profile photo URL is not saved to Supabase auth metadata on the server.');
expect(profile.includes('compressAvatar(file)'), 'Profile photo compression is missing.');
expect(handler.includes('avatar_url: avatarUrl'), 'Uploaded avatar URL is not saved in user metadata.');
expect(!profile.includes('avatar_url: imageData'), 'Base64 image data must not be stored in the auth token.');
expect(profile.includes("'Change photo' : 'Add photo'"), 'Add/change profile photo UI state is missing.');
expect(profile.includes("node.querySelectorAll('.ehm-header-profile-image').forEach((image) => image.remove())"), 'Header Account button can still be replaced by the uploaded profile photo.');
expect(css.includes('body.ehm-route-dashboard [data-yw="c3JjL2NvbXBvbmVudHMvSGVhZGVyLnRzeEA1ODoxNA"]'), 'Dashboard-only district control hide rule is missing.');
expect(css.includes('body.ehm-route-dashboard .ehm-desktop-post-button span'), 'Dashboard Post an Ad text balance rule is missing.');
expect(css.includes('white-space: nowrap !important'), 'Dashboard Post an Ad text can still wrap.');
expect(bridge.includes('avatarUrl: metadata.avatar_url'), 'Auth session bridge does not expose avatar metadata.');
expect(dispatcher.includes("'/api/upload-profile-photo'"), 'Single-function API dispatcher does not include profile photo upload.');
expect(handler.includes("const BUCKET = 'profile-images'"), 'Profile images are not stored in the dedicated Storage bucket.');
expect(handler.includes("'x-upsert': 'true'"), 'Changing a profile photo will not overwrite the previous object.');
expect(handler.includes('/storage/v1/object/public/'), 'Profile photo handler does not return a public Storage URL.');

console.log('DASHBOARD_PROFILE_PICTURE_REGRESSION_TEST_PASSED');
