const { Readable } = require('stream');

process.env.OTP_SECRET = 'password-reset-test-secret';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';

function req(body) {
  const stream = new Readable({ read() {} });
  stream.method = 'POST';
  process.nextTick(() => {
    stream.push(JSON.stringify(body));
    stream.push(null);
  });
  return stream;
}

function res() {
  return {
    statusCode: 200,
    setHeader() {},
    end(body) { this.body = body; this.done(); }
  };
}

async function invoke(handler, body) {
  const request = req(body);
  const response = res();
  const finished = new Promise(resolve => response.done = resolve);
  await handler(request, response);
  await finished;
  return { status: response.statusCode, body: JSON.parse(response.body) };
}

(async () => {
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error('No external request should run before OTP validation.');
  };

  const handler = require('./api/reset-phone-password');
  const result = await invoke(handler, {
    phone: '0771234567',
    password: 'newpassword123',
    verifiedToken: ''
  });

  if (result.status === 200) throw new Error('Reset succeeded without OTP.');
  if (fetchCalled) throw new Error('Account lookup/update ran before OTP validation.');
  if (!/verification/i.test(result.body.message || '')) {
    throw new Error('Missing OTP did not return a verification error.');
  }

  console.log('PASSWORD_RESET_OTP_GATE_TEST_PASSED');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
