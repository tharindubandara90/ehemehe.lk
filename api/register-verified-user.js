const {
  json, readBody, normalizePhone, isSriLankaMobile, normalizeEmail, isValidEmail,
  assertVerifiedToken, createAuthUser, internalAuthEmail,
  signInAuthUserWithPassword, publicUserProfile
}=require('./_otp-utils');

module.exports=async function(req,res){
  if(req.method!=='POST') return json(res,405,{ok:false,message:'Method not allowed'});
  try{
    const body=await readBody(req);
    const name=String(body.name||'').trim();
    const contactEmail=normalizeEmail(body.email);
    const phone=normalizePhone(body.phone);
    const password=String(body.password||'');
    if(name.length<2) return json(res,400,{ok:false,message:'Enter your full name.'});
    if(contactEmail && !isValidEmail(contactEmail)) return json(res,400,{ok:false,message:'Enter a valid email address or leave it blank.'});
    if(!isSriLankaMobile(phone)) return json(res,400,{ok:false,message:'Enter a valid Sri Lankan mobile number.'});
    if(password.length<6) return json(res,400,{ok:false,message:'Password must contain at least 6 characters.'});
    assertVerifiedToken(body.verifiedToken,phone,['register_account']);
    const authEmail=internalAuthEmail(phone);
    const user=await createAuthUser({
      email:authEmail,password,email_confirm:true,
      user_metadata:{name,phone,contact_email:contactEmail,auth_email:authEmail,phone_verified:true,registration_method:'phone',verification_method:'sms'}
    });
    const signedIn=await signInAuthUserWithPassword(user,password);
    return json(res,200,{ok:true,session:{access_token:signedIn.data.access_token,refresh_token:signedIn.data.refresh_token},user:publicUserProfile(signedIn.account)});
  }catch(error){ return json(res,400,{ok:false,message:error.message||'Could not create the verified account.'}); }
};
