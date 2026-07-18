const {
  json, readBody, normalizePhone, isSriLankaMobile, assertVerifiedToken,
  createAuthUser, internalAuthEmail, signInAuthUserWithPassword, publicUserProfile
}=require('./_otp-utils');

module.exports=async function(req,res){
  if(req.method!=='POST') return json(res,405,{ok:false,message:'Method not allowed'});
  try{
    const body=await readBody(req);
    const phone=normalizePhone(body.phone);
    const password=String(body.password||'');
    if(!isSriLankaMobile(phone)) return json(res,400,{ok:false,message:'Enter a valid Sri Lankan mobile number.'});
    if(password.length<6) return json(res,400,{ok:false,message:'Password must contain at least 6 characters.'});
    assertVerifiedToken(body.verifiedToken,phone,['register','register_phone','register_account']);
    const authEmail=internalAuthEmail(phone);
    const user=await createAuthUser({
      email:authEmail,password,email_confirm:true,
      user_metadata:{phone,phone_verified:true,auth_email:authEmail,registration_method:'phone',verification_method:'sms'}
    });
    const signedIn=await signInAuthUserWithPassword(user,password);
    return json(res,200,{ok:true,session:{access_token:signedIn.data.access_token,refresh_token:signedIn.data.refresh_token},user:publicUserProfile(signedIn.account)});
  }catch(error){ return json(res,400,{ok:false,message:error.message||'Could not create phone account.'}); }
};
