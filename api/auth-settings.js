const { json, readSiteSettings } = require('./_otp-utils');

module.exports = async function handler(req,res){
  if(req.method !== 'GET') return json(res,405,{ok:false,message:'Method not allowed'});
  try{
    const settings = await readSiteSettings();
    return json(res,200,{ok:true,settings});
  }catch(error){
    return json(res,200,{ok:true,settings:{
      emailOtpEnabled:true,emailRegisterOtp:true,emailPasswordResetOtp:true,
      smsOtpEnabled:true,smsRegisterOtp:true,smsPasswordChangeOtp:true,smsAdPhoneOtp:true
    }});
  }
};
