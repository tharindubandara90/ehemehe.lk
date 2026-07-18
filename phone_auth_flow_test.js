const {Readable}=require('stream');
process.env.OTP_SECRET='test-secret-long-enough';
process.env.SUPABASE_URL='https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='service-role';
process.env.SUPABASE_ANON_KEY='anon-key';

function req(body){const r=new Readable({read(){}});r.method='POST';process.nextTick(()=>{r.push(JSON.stringify(body));r.push(null)});return r;}
function res(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(v){this.body=v;this.done&&this.done()}}}
async function invoke(handler,body){const rq=req(body),rs=res();const done=new Promise(x=>rs.done=x);handler(rq,rs);await done;return {status:rs.statusCode,body:JSON.parse(rs.body)}}

(async()=>{
  const utils=require('./api/_otp-utils');
  const phone='94772866867', code='123456', nonce='n';
  const challenge=utils.makeToken({kind:'registration_sms_otp',phone,email:'',nonce,codeHash:utils.otpHash(phone,'register_account',code,nonce),expiresAt:Date.now()+60000});
  let users=[]; let createPayload=null; let tokenPayload=null;
  global.fetch=async(url,opt={})=>{
    url=String(url); const method=opt.method||'GET';
    if(url.includes('/auth/v1/admin/users')&&method==='GET') return {ok:true,json:async()=>({users})};
    if(url.endsWith('/auth/v1/admin/users')&&method==='POST'){
      createPayload=JSON.parse(opt.body); const user={id:'u1',email:createPayload.email,user_metadata:createPayload.user_metadata,created_at:new Date().toISOString()}; users=[user]; return {ok:true,json:async()=>user};
    }
    if(url.includes('/auth/v1/token?grant_type=password')){
      tokenPayload=JSON.parse(opt.body); return {ok:true,json:async()=>({access_token:'access',refresh_token:'refresh',expires_in:3600,user:users[0]})};
    }
    throw new Error('Unexpected '+method+' '+url);
  };
  const verify=require('./api/verify-registration-otp');
  const created=await invoke(verify,{challenge,code,name:'Test User',email:'',phone,password:'secret12'});
  if(created.status!==200) throw new Error(JSON.stringify(created));
  if(createPayload.phone) throw new Error('New user still depends on Supabase phone identity.');
  if(createPayload.email!=='phone-94772866867@auth.ehemehe.lk') throw new Error('Internal email identity missing.');
  if(tokenPayload.email!==createPayload.email) throw new Error('Session was not created through email identity.');
  if(!created.body.session?.access_token) throw new Error('Session missing.');

  // Login by phone must find metadata phone and exchange password using email.
  const login=require('./api/login-user');
  const logged=await invoke(login,{identifier:'0772866867',password:'secret12'});
  if(logged.status!==200||!logged.body.session?.refresh_token) throw new Error('Phone login failed '+JSON.stringify(logged));

  // Existing legacy phone-only account is migrated by adding an internal email.
  users=[{id:'legacy',email:'',phone:'+94770000000',user_metadata:{phone:'94770000000'},created_at:new Date().toISOString()}];
  global.fetch=async(url,opt={})=>{
    url=String(url); const method=opt.method||'GET';
    if(url.includes('/auth/v1/admin/users')&&method==='GET') return {ok:true,json:async()=>({users})};
    if(url.includes('/auth/v1/admin/users/legacy')&&method==='PUT'){
      const patch=JSON.parse(opt.body); users[0]={...users[0],...patch,user_metadata:patch.user_metadata}; return {ok:true,json:async()=>users[0]};
    }
    if(url.includes('/auth/v1/token?grant_type=password')) return {ok:true,json:async()=>({access_token:'a2',refresh_token:'r2',user:users[0]})};
    throw new Error('Unexpected legacy '+method+' '+url);
  };
  const legacyLogin=await invoke(login,{identifier:'0770000000',password:'secret12'});
  if(legacyLogin.status!==200||users[0].email!=='phone-94770000000@auth.ehemehe.lk') throw new Error('Legacy migration failed '+JSON.stringify(legacyLogin));
  console.log('PHONE_AUTH_FLOW_TEST_PASSED');
})().catch(e=>{console.error(e);process.exit(1)});
