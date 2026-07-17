const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const port = 34000 + (process.pid % 20000);
const base = `http://127.0.0.1:${port}`;

function request(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${base}${pathname}`, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf8')
      }));
    });
    req.setTimeout(5000, () => req.destroy(new Error(`Timeout: ${pathname}`)));
    req.on('error', reject);
  });
}

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Local server did not start.')), 8000);
    let output = '';
    const onData = (chunk) => {
      output += chunk.toString();
      if (output.includes('local server running')) {
        clearTimeout(timeout);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Local server exited early (${code}): ${output}`));
    });
  });
}

(async () => {
  const child = spawn(process.execPath, ['local-server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await waitForServer(child);

    for (const route of ['/', '/search', '/categories', '/post', '/ad/1', '/dashboard', '/admin']) {
      const response = await request(route);
      assert.strictEqual(response.status, 200, `${route} did not return 200.`);
      assert(/text\/html/i.test(response.headers['content-type'] || ''), `${route} is not HTML.`);
      assert(/no-cache/i.test(response.headers['cache-control'] || ''), `${route} HTML is not revalidated.`);
    }

    const home = await request('/');
    assert(home.body.includes('/post-ad-runtime.js?v='), 'Home shell is missing the Post Ad runtime.');
    assert(home.body.includes('/index-filters.js?v=') || home.body.includes('./index-filters.js?v='), 'Home shell is missing public route helpers.');

    const redirect = await request('/post-ad?returnTo=%2Fpost');
    assert.strictEqual(redirect.status, 308, 'Legacy Post Ad route is not redirected.');
    assert.strictEqual(redirect.headers.location, '/post?returnTo=%2Fpost', 'Legacy redirect did not preserve the query string.');
    assert(/no-store/i.test(redirect.headers['cache-control'] || ''), 'Legacy redirect is cacheable.');

    const missingApi = await request('/api/not-a-real-route');
    assert.strictEqual(missingApi.status, 404, 'Unknown API route should return 404.');
    assert(/application\/json/i.test(missingApi.headers['content-type'] || ''), 'Unknown API route is not JSON.');
    assert(/no-store/i.test(missingApi.headers['cache-control'] || ''), 'API error response is cacheable.');

    const index = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
    const match = index.match(/\/post-ad-runtime\.js\?v=([a-f0-9]{12,64})/i);
    assert(match, 'Content-hashed Post Ad runtime reference was not found.');

    const hashed = await request(`/post-ad-runtime.js?v=${match[1]}`);
    assert.strictEqual(hashed.status, 200, 'Hashed asset did not load.');
    assert(/max-age=31536000/i.test(hashed.headers['cache-control'] || '') && /immutable/i.test(hashed.headers['cache-control'] || ''),
      'Content-hashed asset is not immutable.');

    const unversioned = await request('/post-ad-runtime.js');
    assert.strictEqual(unversioned.status, 200, 'Unversioned asset did not load.');
    assert(/no-cache/i.test(unversioned.headers['cache-control'] || ''), 'Unversioned asset can become stale.');

    console.log('HTTP route and cache regression checks passed.');
  } finally {
    child.kill('SIGTERM');
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
