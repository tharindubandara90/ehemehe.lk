const {Readable}=require('stream');
process.env.OTP_SECRET='multi_phone_test_secret_long_enough';
const utils=require('./api/_otp-utils');
const handler=require('./api/validate-ad-phones');

function req(body){const r=new Readable({read(){}});r.method='POST';process.nextTick(()=>{r.push(JSON.stringify(body));r.push(null)});return r;}
function res(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=body;this.done?.()}}}
async function invoke(body){const r=req(body),s=res();const done=new Promise(ok=>s.done=ok);await handler(r,s);await done;return {status:s.statusCode,body:JSON.parse(s.body)}}
function verified(phone,purpose){return utils.makeToken({phone,purpose,verified:true,verifiedAt:Date.now(),expiresAt:Date.now()+3600000});}
(async()=>{
 const p1='94771234567',p2='94761234567';
 const purpose1='post_ad_contact_alpha1',purpose2='post_ad_contact_beta22';
 const ok=await invoke({phones:[{phone:p1,purpose:purpose1,verifiedToken:verified(p1,purpose1)},{phone:p2,purpose:purpose2,verifiedToken:verified(p2,purpose2)}]});
 if(ok.status!==200||ok.body.phones.length!==2||!ok.body.proof)throw new Error('Two verified phones were not accepted.');
 const wrong=await invoke({phones:[{phone:p1,purpose:purpose1,verifiedToken:verified(p2,purpose1)}]});
 if(wrong.status===200)throw new Error('Mismatched phone token was accepted.');
 const dup=await invoke({phones:[{phone:p1,purpose:purpose1,verifiedToken:verified(p1,purpose1)},{phone:p1,purpose:purpose2,verifiedToken:verified(p1,purpose2)}]});
 if(dup.status===200)throw new Error('Duplicate phone numbers were accepted.');
 const none=await invoke({phones:[]});if(none.status===200)throw new Error('Empty phone list was accepted.');
 console.log('MULTI_PHONE_OTP_TEST_PASSED');
})().catch(e=>{console.error(e);process.exit(1)});
