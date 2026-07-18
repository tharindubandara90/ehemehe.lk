const { Readable } = require('stream');
const crypto = require('crypto');

process.env.TEXTLK_API_TOKEN = 'test_token';
process.env.TEXTLK_SENDER_ID = 'EHEMEHE';
process.env.OTP_SECRET = 'test_secret_that_is_long_enough';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';

function mockReq(body) {
  const req = new Readable({ read() {} });
  req.method = 'POST';
  process.nextTick(() => { req.push(JSON.stringify(body)); req.push(null); });
  return req;
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k,v){ this.headers[k]=v; },
    end(body){ this.body=body; this.resolve?.(); }
  };
}

async function invoke(handler, body) {
  const req = mockReq(body);
  const res = mockRes();
  const done = new Promise(resolve => res.resolve = resolve);
  await handler(req,res);
  await done;
  return { status: res.statusCode, body: JSON.parse(res.body) };
}

(async () => {
  // Text.lk HTTP 200 + status:error must be treated as failure.
  const utils = require('./api/_otp-utils');
  global.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ status:'error', message:'Sender ID is not approved' })
  });
  let rejected = false;
  try { await utils.sendTextLkSms({phone:'94771234567',message:'test'}); }
  catch (e) { rejected = /rejected|approved/i.test(e.message); }
  if (!rejected) throw new Error('Text.lk error response was incorrectly accepted.');

  // Registration request sends OTP but must not create a Supabase user.
  delete require.cache[require.resolve('./api/request-registration-otp')];
  crypto.randomInt = () => 123456;
  const calls = [];
  global.fetch = async (url, options={}) => {
    calls.push({url:String(url),method:options.method||'GET'});
    if (String(url).includes('/auth/v1/admin/users')) {
      return {ok:true,status:200,text:async()=>JSON.stringify({users:[]}),json:async()=>({users:[]})};
    }
    if (String(url).includes('app.text.lk')) {
      return {ok:true,status:200,text:async()=>JSON.stringify({status:'success',message:'sent'})};
    }
    if (String(url).includes('/rest/v1/site_settings')) {
      return {ok:true,status:200,json:async()=>[]};
    }
    throw new Error('Unexpected URL '+url);
  };

  const requestHandler = require('./api/request-registration-otp');
  const requested = await invoke(requestHandler,{phone:'0771234567',email:''});
  if (requested.status !== 200 || !requested.body.challenge) throw new Error('OTP request failed in test.');
  if (calls.some(c => c.method === 'POST' && c.url.includes('/auth/v1/admin/users'))) {
    throw new Error('Account was created during OTP request.');
  }

  // Account may be created only by verify endpoint with the correct code.
  delete require.cache[require.resolve('./api/verify-registration-otp')];
  let createCount = 0;
  global.fetch = async (url, options={}) => {
    if (String(url).includes('/auth/v1/admin/users') && (options.method||'GET') === 'GET') {
      return {ok:true,status:200,text:async()=>JSON.stringify({users:[]}),json:async()=>({users:[]})};
    }
    if (String(url).includes('/auth/v1/admin/users') && options.method === 'POST') {
      createCount++;
      return {ok:true,status:200,json:async()=>({id:'user-1',email:'phone-94771234567@auth.ehemehe.lk',user_metadata:{phone:'94771234567'}})};
    }
    if (String(url).includes('/auth/v1/token?grant_type=password')) {
      return {ok:true,status:200,json:async()=>({access_token:'access',refresh_token:'refresh',expires_in:3600,token_type:'bearer',user:{id:'user-1',email:'phone-94771234567@auth.ehemehe.lk',user_metadata:{phone:'94771234567'}}})};
    }
    throw new Error('Unexpected URL '+url);
  };

  const verifyHandler = require('./api/verify-registration-otp');
  const wrong = await invoke(verifyHandler,{
    challenge:requested.body.challenge,code:'000000',name:'Test User',
    email:'',phone:'94771234567',password:'secret12'
  });
  if (wrong.status === 200 || createCount !== 0) throw new Error('Wrong OTP created an account.');

  const correct = await invoke(verifyHandler,{
    challenge:requested.body.challenge,code:'123456',name:'Test User',
    email:'',phone:'94771234567',password:'secret12'
  });
  if (correct.status !== 200 || createCount !== 1) throw new Error('Correct OTP did not create exactly one account.');

  console.log('OTP_SECURITY_TEST_PASSED');
})().catch(error => { console.error(error); process.exit(1); });
