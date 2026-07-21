const assert = require('assert');
const { EventEmitter } = require('events');

function responseRecorder() {
  let resolve;
  const done = new Promise((r) => { resolve = r; });
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writableEnded: false,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(value = '') { this.body += String(value || ''); this.writableEnded = true; resolve(this); },
    done
  };
}

function request(method, body = {}, token = 'token-1') {
  const req = new EventEmitter();
  req.method = method;
  req.body = body;
  req.headers = token ? { authorization: `Bearer ${token}` } : {};
  req.url = '/';
  return req;
}

function jsonResponse(ok, payload, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  };
}

(async () => {
  const oldEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  const oldFetch = global.fetch;
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

  // Profile Save Changes and +94 normalization.
  {
    const calls = [];
    global.fetch = async (url, options = {}) => {
      calls.push({ url, options });
      if (url.endsWith('/auth/v1/user')) {
        return jsonResponse(true, { id: 'user-1', email: 'user@example.com', user_metadata: { avatar_url: '/avatar.png' } });
      }
      if (url.endsWith('/auth/v1/admin/users/user-1')) {
        const body = JSON.parse(options.body);
        assert.strictEqual(body.user_metadata.phone, '+94771234567');
        assert.strictEqual(body.user_metadata.name, 'Test User');
        return jsonResponse(true, { id: 'user-1' });
      }
      throw new Error(`Unexpected profile URL ${url}`);
    };
    const handler = require('./api-handlers/update-profile');
    const res = responseRecorder();
    await handler(request('PATCH', { name: 'Test User', email: 'test@example.com', phone: '0771234567' }), res);
    await res.done;
    assert.strictEqual(res.statusCode, 200);
    const payload = JSON.parse(res.body);
    assert.strictEqual(payload.user.phone, '+94771234567');
    assert(calls.some((call) => call.url.includes('/auth/v1/admin/users/user-1')));
  }

  // New account My Ads must return only owned rows, never bundled sample ads.
  {
    global.fetch = async (url) => {
      if (url.endsWith('/auth/v1/user')) return jsonResponse(true, { id: 'new-user' });
      if (url.includes('/rest/v1/ads?')) {
        return jsonResponse(true, [
          { id: 'owned', user_id: 'shared-import-owner', custom_fields: { owner_user_id: 'new-user', submitted_at: '2026-07-19T00:00:00Z' }, title: 'Owned ad', view_count: 12 },
          { id: 'other', user_id: 'another-user', title: 'Other ad', view_count: 900 },
          { id: 'legacy', custom_fields: { owner_user_id: 'another-user' }, title: 'Legacy sample' }
        ]);
      }
      throw new Error(`Unexpected My Ads URL ${url}`);
    };
    const handler = require('./api-handlers/my-ads');
    const res = responseRecorder();
    await handler(request('GET'), res);
    await res.done;
    assert.strictEqual(res.statusCode, 200);
    const payload = JSON.parse(res.body);
    assert.deepStrictEqual(payload.ads.map((ad) => ad.id), ['owned']);
  }

  // Delete My Ad requires ownership and deletes only the requested owned row.
  {
    const deleted = [];
    global.fetch = async (url, options = {}) => {
      if (url.endsWith('/auth/v1/user')) return jsonResponse(true, { id: 'user-1' });
      if (url.includes('/rest/v1/ads?id=eq.ad-1') && options.method !== 'DELETE') {
        return jsonResponse(true, [{ id: 'ad-1', user_id: 'user-1' }]);
      }
      if (url.includes('/rest/v1/ads?id=eq.ad-1') && options.method === 'DELETE') {
        deleted.push('ad-1');
        return jsonResponse(true, []);
      }
      throw new Error(`Unexpected delete-ad URL ${url}`);
    };
    const handler = require('./api-handlers/delete-my-ad');
    const res = responseRecorder();
    await handler(request('DELETE', { id: 'ad-1' }), res);
    await res.done;
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(deleted, ['ad-1']);
  }

  // Permanent account deletion removes owned ads but preserves other users' ads.
  {
    const deletes = [];
    global.fetch = async (url, options = {}) => {
      if (url.endsWith('/auth/v1/user')) return jsonResponse(true, { id: 'user-1' });
      if (url.includes('/rest/v1/ads?select=')) {
        return jsonResponse(true, [
          { id: 'mine-1', user_id: 'user-1' },
          { id: 'mine-2', custom_fields: { owner_user_id: 'user-1' } },
          { id: 'other-1', user_id: 'user-2' }
        ]);
      }
      if (options.method === 'DELETE') {
        deletes.push(url);
        return jsonResponse(true, {});
      }
      throw new Error(`Unexpected delete-account URL ${url}`);
    };
    const handler = require('./api-handlers/delete-account');
    const res = responseRecorder();
    await handler(request('DELETE', { confirmation: 'DELETE' }), res);
    await res.done;
    assert.strictEqual(res.statusCode, 200);
    assert(deletes.some((url) => url.includes('/rest/v1/ads?id=eq.mine-1')));
    assert(deletes.some((url) => url.includes('/rest/v1/ads?id=eq.mine-2')));
    assert(!deletes.some((url) => url.includes('other-1')));
    assert(deletes.some((url) => url.endsWith('/auth/v1/admin/users/user-1')));
  }

  global.fetch = oldFetch;
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  console.log('ACCOUNT_SETTINGS_AND_OWNERSHIP_API_REGRESSION_TEST_PASSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
