const {json,readBody,normalizePhone,isSriLankaMobile,assertVerifiedToken,findAuthUserByPhone,updateAuthUser,readSiteSettings}=require('./_otp-utils');
module.exports=async function(req,res){
  if(req.method!=='POST') return json(res,405,{ok:false,message:'Method not allowed'});
  try{
    const body=await readBody(req); const phone=normalizePhone(body.phone); const password=String(body.password||'');
    if(!isSriLankaMobile(phone)) return json(res,400,{ok:false,message:'Enter a valid Sri Lankan mobile number.'});
    if(password.length<6) return json(res,400,{ok:false,message:'Password must contain at least 6 characters.'});
    const settings=await readSiteSettings();
    if(settings.smsOtpEnabled && settings.smsPasswordChangeOtp) assertVerifiedToken(body.verifiedToken,phone,['password_change','password_reset_phone']);
    const user=await findAuthUserByPhone(phone);
    if(!user) return json(res,404,{ok:false,message:'No account was found for this phone number.'});
    await updateAuthUser(user.id,{password});
    return json(res,200,{ok:true,message:'Password updated successfully.'});
  }catch(error){ return json(res,400,{ok:false,message:error.message||'Could not update password.'}); }
};
