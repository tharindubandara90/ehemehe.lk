let CATEGORIES=[], CITIES=[], currentUser=null;
let AUTH_MODE='login', REGISTER_METHOD='email', PUBLISH_AFTER_AUTH=false, IS_PUBLISHING=false;
let AUTH_SETTINGS={emailOtpEnabled:true,emailRegisterOtp:true,emailPasswordResetOtp:true,smsOtpEnabled:true,smsRegisterOtp:true,smsPasswordChangeOtp:true,smsAdPhoneOtp:true};
const DRAFT_KEY='ehemehe:postAdDraft:v2';
const PHONE_VERIFY_SESSION_KEY='ehemehe:postAdPhoneVerifications:v1';
// USER_FINANCE_RATE_INPUT_REMOVED: users only enter vehicle price; rate is admin-controlled.
let FINANCE_SETTINGS = {downPaymentPercent:40, annualRatePercent:15, months:48, companyPhone:'+94 77 000 0000'};
const el=(id)=>document.getElementById(id); const msg=(m)=>alert(m);
const money=(v)=>{const n=Number(String(v??'').replace(/[^\d.]/g,''));return Number.isFinite(n)?'LKR '+Math.round(n).toLocaleString('en-LK'):'LKR 0'};
const slug=(v)=>String(v||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const localKey=(key)=>'ehemeheSiteSetting:'+key;

const SIMPLE_FIELD_DEFINITIONS={
  vehicles:[['vehicle_brand','Brand / Make'],['vehicle_model','Model'],['year_manufacture','Year of Manufacture'],['year_registered','Year of Registration'],['mileage_km','Mileage (km)'],['fuel_type','Fuel Type'],['transmission','Gear / Transmission'],['engine_capacity','Engine CC'],['ownership','Ownership']],
  property:[['property_type','Property Type'],['listing_type','Listing Type'],['bedrooms','Bedrooms'],['bathrooms','Bathrooms'],['floor_area_sqft','Floor Area'],['land_size','Land Size'],['deed_type','Deed / Title']],
  'mobile-phones':[['phone_brand','Brand'],['phone_model','Model'],['storage','Storage'],['ram','RAM'],['battery_health','Battery Health'],['warranty','Warranty']],
  electronics:[['brand','Brand'],['model','Model'],['warranty','Warranty'],['specifications','Specifications']],
  general:[['brand','Brand'],['model','Model'],['warranty','Warranty'],['extra_details','Extra Details']]
};
let SIMPLE_IMAGES=[];
const MAX_CONTACT_PHONES=5;
let CONTACT_PHONE_ROWS=[];
function simpleFieldGroup(){
  const c=selectedCategory();
  const key=String(c.id||c.slug||c.name||'').toLowerCase();
  const joined=[c.id,c.slug,c.name,c.parent_id].join(' ').toLowerCase();
  if(/vehicle|car|motor|bike|van|truck/.test(joined)) return 'vehicles';
  if(/property|house|land|apartment/.test(joined)) return 'property';
  if(/mobile|phone|tablet/.test(joined)) return 'mobile-phones';
  if(/electronic|laptop|tv|computer/.test(joined)) return 'electronics';
  return SIMPLE_FIELD_DEFINITIONS[key]?key:'general';
}
function renderSimpleDynamicFields(){
  const box=el('simpleDynamicFields'); if(!box) return;
  const group=simpleFieldGroup();
  const fields=SIMPLE_FIELD_DEFINITIONS[group]||SIMPLE_FIELD_DEFINITIONS.general;
  box.classList.remove('hidden');
  box.innerHTML='<h3>Category Details</h3><div class="grid">'+fields.map(([id,label])=>`<div class="field"><label>${label}</label><input class="input" data-simple-field="${id}"></div>`).join('')+'</div>';
}
async function simpleCompressImage(file){
  const bitmap=await createImageBitmap(file);
  const max=1600; let w=bitmap.width,h=bitmap.height; const r=Math.min(1,max/Math.max(w,h)); w=Math.round(w*r); h=Math.round(h*r);
  const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h); ctx.drawImage(bitmap,0,0,w,h);
  return canvas.toDataURL('image/jpeg',0.88);
}
async function handleSimpleImages(event){
  SIMPLE_IMAGES=[];
  const files=Array.from(event.target.files||[]).slice(0,10);
  for(const file of files){ if(file.type.startsWith('image/')) SIMPLE_IMAGES.push(await simpleCompressImage(file)); }
  const preview=el('simpleImagePreview'); if(preview) preview.innerHTML=SIMPLE_IMAGES.map(src=>`<img src="${src}">`).join('');
}
function collectSimpleFields(){
  const out={}; document.querySelectorAll('[data-simple-field]').forEach(n=>{ if(n.value.trim()) out[n.dataset.simpleField]=n.value.trim(); }); return out;
}

function draftSnapshot(){
  const fields={}; document.querySelectorAll('[data-draft-field]').forEach(n=>fields[n.dataset.draftField]=n.value||'');
  const custom={}; document.querySelectorAll('[data-simple-field]').forEach(n=>custom[n.dataset.simpleField]=n.value||'');
  const contactPhones=CONTACT_PHONE_ROWS.map(row=>row.value||'').filter(Boolean);
  return {fields,custom,contactPhones,categoryGroup:simpleFieldGroup(),savedAt:Date.now()};
}
function saveDraft(){ try{localStorage.setItem(DRAFT_KEY,JSON.stringify(draftSnapshot()));sessionStorage.setItem(PHONE_VERIFY_SESSION_KEY,JSON.stringify(CONTACT_PHONE_ROWS.map(row=>({id:row.id,purpose:row.purpose,value:row.value,verified:row.verified,verifiedToken:row.verifiedToken}))));}catch(e){} }
function restoreDraft(){
  let draft=null; try{draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');}catch(e){}
  if(!draft){setContactPhoneRows(['']);return;}
  Object.entries(draft.fields||{}).forEach(([k,v])=>{const n=document.querySelector(`[data-draft-field="${k}"]`);if(n&&v!==undefined)n.value=v;});
  try{renderSimpleDynamicFields();}catch(e){}
  Object.entries(draft.custom||{}).forEach(([k,v])=>{const n=document.querySelector(`[data-simple-field="${k}"]`);if(n)n.value=v;});
  const legacyPhone=String(draft.fields?.phone||'').trim();
  const phones=Array.isArray(draft.contactPhones)?draft.contactPhones.filter(Boolean):(legacyPhone?[legacyPhone]:['']);
  let verificationRows=[];try{verificationRows=JSON.parse(sessionStorage.getItem(PHONE_VERIFY_SESSION_KEY)||'[]');}catch(_){}
  const verifiedValues=Array.isArray(verificationRows)?verificationRows.map(row=>String(row.value||'')):[];
  const canRestore=phones.length===verifiedValues.length&&phones.every((phone,index)=>EHM_OTP.normalizePhone(phone)===EHM_OTP.normalizePhone(verifiedValues[index]));
  setContactPhoneRows(canRestore?verificationRows:(phones.length?phones:['']));
  updateFinanceBox();
}
function bindDraftSaving(){
  document.addEventListener('input',e=>{if(e.target.matches('[data-draft-field],[data-simple-field]'))saveDraft();});
  document.addEventListener('change',e=>{if(e.target.matches('[data-draft-field],[data-simple-field]'))setTimeout(saveDraft,0);});
  window.addEventListener('beforeunload',saveDraft);
}
function clearDraft(){try{localStorage.removeItem(DRAFT_KEY);sessionStorage.removeItem(PHONE_VERIFY_SESSION_KEY);}catch(e){}}

function localSetting(key){try{return localStorage.getItem(localKey(key));}catch(e){return null;}}
async function loadAuthSettings(){try{const r=await fetch('/api/auth-settings');const d=await r.json();AUTH_SETTINGS={...AUTH_SETTINGS,...(d.settings||{})};}catch(e){} AUTH_SETTINGS.smsOtpEnabled=true; AUTH_SETTINGS.smsAdPhoneOtp=true;}
async function init(){
  const {data}=await supabaseClient.auth.getSession();
  await Promise.all([loadLookups(), loadFinanceSettings(), loadAuthSettings()]);
  currentUser=data.session?.user||null;
  showPost();
  restoreDraft();
  bindDraftSaving();
  updateSignedInState();
  updateFinanceBox();
  supabaseClient.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;updateSignedInState();});
}
async function loadFinanceSettings(){
  const defaults={vehicle_downpayment_percent:40,vehicle_annual_rate_percent:15,vehicle_finance_months:48,vehicle_finance_company_phone:'+94 77 000 0000'};
  const values={...defaults};
  Object.keys(values).forEach(k=>{const local=localSetting(k); if(local!==null&&local!=='') values[k]=local;});
  try{
    const {data,error}=await supabaseClient.from('site_settings').select('key,value').in('key',Object.keys(defaults));
    if(!error && Array.isArray(data)) data.forEach(r=>{ values[r.key]=r.value; });
  }catch(e){}
  FINANCE_SETTINGS={
    downPaymentPercent:Number(values.vehicle_downpayment_percent)||40,
    annualRatePercent:Number(values.vehicle_annual_rate_percent)||15,
    months:Math.max(1,Math.round(Number(values.vehicle_finance_months)||48)),
    companyPhone:String(values.vehicle_finance_company_phone||'+94 77 000 0000')
  };
}
async function loadLookups(){ const [cats,cities]=await Promise.all([supabaseClient.from('categories').select('*').eq('is_active',true).order('name'),supabaseClient.from('cities').select('*').eq('is_active',true).order('name')]); CATEGORIES=cats.data||[]; CITIES=cities.data||[]; el('category').innerHTML=CATEGORIES.map(c=>`<option value="${c.id}">${c.name}</option>`).join(''); el('city').innerHTML=CITIES.map(c=>`<option value="${c.id}">${c.name}</option>`).join(''); }
function showPost(){ el('postPanel')?.classList.remove('hidden'); updateFinanceBox(); }
function openAuthModal(){ saveDraft(); setAuthMode('login'); el('authPanel')?.classList.remove('hidden'); document.body.style.overflow='hidden'; setAuthMessage(''); }
function closeAuthModal(){ el('authPanel')?.classList.add('hidden'); document.body.style.overflow=''; PUBLISH_AFTER_AUTH=false; }
function goToVerifiedSignup(){
  saveDraft();
  location.href='/signup?return=/post-ad';
}
function setAuthMode(mode){
  if(mode==='register'){
    goToVerifiedSignup();
    return;
  }
  AUTH_MODE='login';
  el('loginTab')?.classList.add('active');
  el('registerTab')?.classList.remove('active');
  const pass=el('authPassword'); if(pass) pass.autocomplete='current-password';
  const btn=el('authContinueButton'); if(btn) btn.textContent='Log in & Publish';
  const label=el('authIdentifierLabel');if(label)label.textContent='Email or phone';
  setAuthMessage('');
}
function setAuthMessage(text,type='error'){ const node=el('authMessage'); if(!node)return; node.textContent=text||''; node.className='auth-message'+(type==='success'?' success':''); }
function updateSignedInState(){
  const node=el('signedInState'); if(!node)return;
  if(currentUser){ const meta=currentUser.user_metadata||{}; const identity=meta.contact_email||meta.phone||currentUser.phone||'user'; node.innerHTML=`Signed in as <strong>${identity}</strong> · <button type="button" class="link-button" onclick="logoutUser()">Log out</button>`; }
  else node.textContent='You can fill everything now. Login is required only when publishing.';
}
async function continueAuthentication(){ await loginUser(); }


function phoneRowId(){
  try{return crypto.randomUUID().replace(/-/g,'').slice(0,12);}catch(_){return Math.random().toString(36).slice(2,14);}
}
function makeContactPhoneRow(value=''){
  const source=value&&typeof value==='object'?value:{value};
  const id=String(source.id||phoneRowId()).replace(/[^a-z0-9]/gi,'').slice(0,20)||phoneRowId();
  const purpose=String(source.purpose||`post_ad_contact_${id}`);
  const verified=!!(source.verified&&source.verifiedToken);
  return {id,purpose,value:String(source.value||''),otpSent:verified||!!source.otpSent,verified,verifiedToken:String(source.verifiedToken||''),status:verified?'Phone number verified successfully.':'Verify this number before publishing.',statusType:verified?'success':'pending'};
}
function setContactPhoneRows(values){
  CONTACT_PHONE_ROWS=(Array.isArray(values)?values:['']).slice(0,MAX_CONTACT_PHONES).map(value=>makeContactPhoneRow(value));
  if(!CONTACT_PHONE_ROWS.length)CONTACT_PHONE_ROWS=[makeContactPhoneRow('')];
  CONTACT_PHONE_ROWS.forEach(row=>{if(row.verified&&row.verifiedToken&&window.EHM_OTP?.restore)EHM_OTP.restore(row.value,row.purpose,row.verifiedToken);});
  renderContactPhoneRows();
}
function contactPhoneRow(id){return CONTACT_PHONE_ROWS.find(row=>row.id===id);}
function escapedAttr(value){return String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function renderContactPhoneRows(){
  const list=el('contactPhoneList'); if(!list)return;
  list.innerHTML=CONTACT_PHONE_ROWS.map((row,index)=>`<div class="contact-phone-card ${row.verified?'verified':''} ${row.statusType==='error'?'error':''}" data-contact-phone-row="${row.id}">
    <div class="contact-phone-main">
      <div class="contact-phone-index">${index+1}</div>
      <input class="input phone-number-input" type="tel" inputmode="tel" autocomplete="tel" placeholder="0771234567" value="${escapedAttr(row.value)}" oninput="updateContactPhone('${row.id}',this.value)">
      <button class="phone-verify-button ${row.verified?'verified':''}" type="button" ${row.verified?'disabled':''} onclick="sendContactPhoneOtp('${row.id}')">${row.verified?'✓ Verified':'Verify'}</button>
      <button class="phone-remove-button" type="button" aria-label="Remove phone number" ${CONTACT_PHONE_ROWS.length===1?'disabled':''} onclick="removeContactPhone('${row.id}')">×</button>
    </div>
    <div class="phone-otp-panel ${row.otpSent&&!row.verified?'':'hidden'}">
      <input id="contactPhoneOtp_${row.id}" class="input phone-otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Enter 6-digit OTP">
      <button class="phone-otp-button" type="button" onclick="verifyContactPhoneOtp('${row.id}')">Confirm OTP</button>
      <button class="phone-resend-button" type="button" onclick="sendContactPhoneOtp('${row.id}',true)">Resend</button>
    </div>
    <div class="phone-row-status ${row.statusType}">${escapedAttr(row.status)}</div>
  </div>`).join('');
  const add=el('addContactPhoneButton'); if(add)add.disabled=CONTACT_PHONE_ROWS.length>=MAX_CONTACT_PHONES;
  updateContactPhoneSummary();
}
function updateContactPhoneSummary(type=''){
  const node=el('contactPhoneSummary');if(!node)return;
  const entered=CONTACT_PHONE_ROWS.filter(row=>String(row.value||'').trim());
  const verified=entered.filter(row=>row.verified);
  if(!entered.length){node.textContent='Add at least one contact phone number.';node.className='contact-phone-summary error';return;}
  if(verified.length===entered.length){node.textContent=`${verified.length} verified contact number${verified.length===1?'':'s'} ready.`;node.className='contact-phone-summary success';return;}
  node.textContent=`${verified.length} of ${entered.length} contact numbers verified.`;node.className='contact-phone-summary '+(type||'');
}
function addContactPhone(){
  if(CONTACT_PHONE_ROWS.length>=MAX_CONTACT_PHONES)return;
  CONTACT_PHONE_ROWS.push(makeContactPhoneRow(''));
  renderContactPhoneRows();saveDraft();
  setTimeout(()=>document.querySelector(`[data-contact-phone-row="${CONTACT_PHONE_ROWS.at(-1).id}"] input`)?.focus(),0);
}
function removeContactPhone(id){
  if(CONTACT_PHONE_ROWS.length===1)return;
  const row=contactPhoneRow(id);if(row&&window.EHM_OTP)EHM_OTP.reset(row.purpose);
  CONTACT_PHONE_ROWS=CONTACT_PHONE_ROWS.filter(row=>row.id!==id);
  renderContactPhoneRows();saveDraft();
}
function updateContactPhone(id,value){
  const row=contactPhoneRow(id);if(!row)return;
  const normalizedBefore=window.EHM_OTP?EHM_OTP.normalizePhone(row.value):row.value;
  const normalizedAfter=window.EHM_OTP?EHM_OTP.normalizePhone(value):value;
  row.value=value;
  if(row.verified||row.otpSent||normalizedBefore!==normalizedAfter){
    if(window.EHM_OTP)EHM_OTP.reset(row.purpose);
    row.otpSent=false;row.verified=false;row.verifiedToken='';row.status='Verify this number before publishing.';row.statusType='pending';
    const card=document.querySelector(`[data-contact-phone-row="${id}"]`);card?.classList.remove('verified','error');
    const button=card?.querySelector('.phone-verify-button');if(button){button.disabled=false;button.classList.remove('verified');button.textContent='Verify';}
    card?.querySelector('.phone-otp-panel')?.classList.add('hidden');
    const status=card?.querySelector('.phone-row-status');if(status){status.textContent=row.status;status.className='phone-row-status pending';}
  }
  updateContactPhoneSummary();saveDraft();
}
function setContactPhoneStatus(row,text,type='pending'){
  row.status=text;row.statusType=type;
  const card=document.querySelector(`[data-contact-phone-row="${row.id}"]`);
  card?.classList.toggle('error',type==='error');
  const node=card?.querySelector('.phone-row-status');if(node){node.textContent=text;node.className=`phone-row-status ${type}`;}
  updateContactPhoneSummary(type==='error'?'error':'');
}
async function sendContactPhoneOtp(id,isResend=false){
  const row=contactPhoneRow(id);if(!row||row.verified)return;
  try{
    const normalized=EHM_OTP.normalizePhone(row.value);
    if(!EHM_OTP.validPhone(normalized))throw new Error('Enter a valid Sri Lankan mobile number.');
    const duplicate=CONTACT_PHONE_ROWS.some(other=>other.id!==row.id&&EHM_OTP.normalizePhone(other.value)===normalized);
    if(duplicate)throw new Error('This number is already added.');
    setContactPhoneStatus(row,isResend?'Resending OTP...':'Sending OTP...','pending');
    EHM_OTP.reset(row.purpose);
    await EHM_OTP.request(normalized,row.purpose);
    row.value=normalized;row.otpSent=true;row.verified=false;row.verifiedToken='';
    renderContactPhoneRows();
    setContactPhoneStatus(row,'OTP sent. Enter the 6-digit code.','pending');
    setTimeout(()=>el(`contactPhoneOtp_${row.id}`)?.focus(),0);
  }catch(error){setContactPhoneStatus(row,error.message||'Could not send OTP.','error');}
}
async function verifyContactPhoneOtp(id){
  const row=contactPhoneRow(id);if(!row)return;
  try{
    const otp=String(el(`contactPhoneOtp_${row.id}`)?.value||'').trim();
    if(!/^\d{6}$/.test(otp))throw new Error('Enter the 6-digit OTP code.');
    setContactPhoneStatus(row,'Verifying OTP...','pending');
    const result=await EHM_OTP.verify(row.value,row.purpose,otp);
    row.value=EHM_OTP.normalizePhone(row.value);row.verified=true;row.verifiedToken=result.verifiedToken||EHM_OTP.getVerifiedToken(row.purpose);row.otpSent=true;
    row.status='Phone number verified successfully.';row.statusType='success';
    renderContactPhoneRows();saveDraft();
  }catch(error){setContactPhoneStatus(row,error.message||'OTP verification failed.','error');}
}
function collectVerifiedContactPhones(){
  const entered=CONTACT_PHONE_ROWS.filter(row=>String(row.value||'').trim());
  if(!entered.length)throw new Error('Add at least one contact phone number.');
  const normalized=entered.map(row=>({...row,phone:EHM_OTP.normalizePhone(row.value)}));
  const invalid=normalized.find(row=>!EHM_OTP.validPhone(row.phone));if(invalid)throw new Error('Enter a valid phone number in every contact row.');
  if(new Set(normalized.map(row=>row.phone)).size!==normalized.length)throw new Error('Remove duplicate contact phone numbers.');
  const unverified=normalized.find(row=>!row.verified||!row.verifiedToken||!EHM_OTP.isVerified(row.phone,row.purpose));
  if(unverified){setContactPhoneStatus(unverified,'Verify this number before publishing.','error');document.querySelector(`[data-contact-phone-row="${unverified.id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});throw new Error('Verify every contact phone number before publishing.');}
  return normalized.map(row=>({phone:row.phone,purpose:row.purpose,verifiedToken:row.verifiedToken}));
}
async function validateContactPhonesForAd(phones){
  const response=await fetch('/api/validate-ad-phones',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({phones})});
  const text=await response.text();let result={};try{result=text?JSON.parse(text):{};}catch(_){result={ok:false,message:`Server returned an invalid response (HTTP ${response.status}).`};}
  if(!response.ok||result.ok===false)throw new Error(result.message||'Phone verification validation failed.');
  return result;
}

async function loginUser(){
  saveDraft();
  const identifier=el('authEmail').value.trim(),password=el('authPassword').value;
  if(!identifier||!password){setAuthMessage('Enter your email/phone and password.');return;}
  try{
    setAuthMessage('Logging in...','success');
    const response=await fetch('/api/login-user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier,password})});
    const text=await response.text();
    let result={}; try{result=text?JSON.parse(text):{};}catch(_){result={ok:false,message:`Server returned an invalid response (HTTP ${response.status}).`};}
    if(!response.ok||result.ok===false) throw new Error(result.message||'Login failed.');
    const sessionResult=await supabaseClient.auth.setSession({access_token:result.session.access_token,refresh_token:result.session.refresh_token});
    if(sessionResult.error) throw sessionResult.error;
    currentUser=sessionResult.data.user;
    const shouldPublish=PUBLISH_AFTER_AUTH;
    closeAuthModal();updateSignedInState();
    if(shouldPublish)await submitAd();
  }catch(error){setAuthMessage(error.message||'Login failed.');}
}
async function registerUser(){ goToVerifiedSignup(); }
async function logoutUser(){ saveDraft(); await supabaseClient.auth.signOut(); currentUser=null; updateSignedInState(); }

function selectedCategory(){ return CATEGORIES.find(c=>String(c.id)===String(el('category')?.value)) || {}; }
function isVehicleCategory(){
  const c=selectedCategory();
  const keys=[c.id,c.slug,c.name,c.parent_id,c.parent_slug,el('category')?.value].map(slug);
  const vehicleKeys=['vehicles','vehicle','cars','car','motorbikes','motorbike','bikes','vans','trucks','buses','three-wheelers','three-wheeler'];
  return keys.some(k=>vehicleKeys.includes(k));
}
function calcFinance(price){
  const amount=Number(String(price??'').replace(/[^\d.]/g,''));
  if(!Number.isFinite(amount)||amount<=0) return null;
  const downPayment=Math.round(amount*FINANCE_SETTINGS.downPaymentPercent/100);
  const principal=Math.max(0,amount-downPayment);
  const r=FINANCE_SETTINGS.annualRatePercent/100/12;
  const months=FINANCE_SETTINGS.months;
  const monthly=r<=0?principal/months:(principal*r*Math.pow(1+r,months))/(Math.pow(1+r,months)-1);
  return {downPayment, financeAmount:Math.round(principal), monthlyPayment:Math.round(monthly), ...FINANCE_SETTINGS};
}
function updateFinanceBox(){ try{renderSimpleDynamicFields();}catch(e){}
  const box=el('vehicleFinanceBox'); if(!box) return;
  if(!isVehicleCategory()){ box.classList.add('hidden'); box.innerHTML=''; return; }
  const f=calcFinance(el('price').value);
  box.classList.remove('hidden');
  box.innerHTML = f ? `<h3>Vehicle Finance Estimate</h3><div class="finance-grid"><div class="finance-item"><span>Down Payment</span><strong>${money(f.downPayment)}</strong></div><div class="finance-item"><span>Monthly Payment</span><strong>${money(f.monthlyPayment)}</strong></div><div class="finance-item"><span>Finance Contact</span><strong>${FINANCE_SETTINGS.companyPhone}</strong></div></div><div class="finance-note">Finance is calculated automatically from admin settings. Final approval depends on the finance company.</div>` : `<h3>Vehicle Finance Estimate</h3><div class="finance-note">Enter the vehicle price to calculate down payment and monthly payment. Finance contact: ${FINANCE_SETTINGS.companyPhone}</div>`;
}
async function submitAd(){
  if(IS_PUBLISHING)return;
  saveDraft();
  if(!el('title').value.trim()){msg('Title required');el('title').focus();return;}
  if(!el('category').value){msg('Select a category');return;}
  if(!currentUser){PUBLISH_AFTER_AUTH=true;openAuthModal();return;}
  IS_PUBLISHING=true; const publishButton=el('publishAdButton'); if(publishButton){publishButton.disabled=true;publishButton.textContent='Publishing...';}


  let verifiedContacts=[];let phoneValidation=null;
  try{
    verifiedContacts=collectVerifiedContactPhones();
    phoneValidation=await validateContactPhonesForAd(verifiedContacts);
  }catch(error){
    IS_PUBLISHING=false;if(publishButton){publishButton.disabled=false;publishButton.textContent='Publish Ad';}
    msg(error.message||'Verify every contact phone number.');return;
  }
  const verifiedPhone=verifiedContacts[0].phone;
  const verifiedPhoneNumbers=verifiedContacts.map(item=>item.phone);
  const finance=isVehicleCategory()?calcFinance(el('price').value):null;
  const baseDescription=el('description').value.trim();
  const financeText=finance?`\n\nFinance Estimate:\nDown Payment: ${money(finance.downPayment)}\nMonthly Payment: ${money(finance.monthlyPayment)}\nFinance Company: ${FINANCE_SETTINGS.companyPhone}`:'';
  const customFields={...collectSimpleFields(),contact_phones:verifiedPhoneNumbers,verified_contact_phones:verifiedPhoneNumbers,contact_phone_verification_proof:phoneValidation.proof||''};
  const payload={user_id:currentUser.id,title:el('title').value.trim(),price:el('price').value||null,category_id:el('category').value||null,city_id:el('city').value||null,phone:verifiedPhone,phone_verified:true,phone_verified_at:new Date().toISOString(),image_url:SIMPLE_IMAGES[0]||'',images:SIMPLE_IMAGES,custom_fields:customFields,description:(baseDescription+financeText).trim(),status:'pending'};
  if(finance){ Object.assign(payload,{finance_enabled:true,finance_downpayment:finance.downPayment,finance_monthly_payment:finance.monthlyPayment,finance_downpayment_percent:finance.downPaymentPercent,finance_annual_rate_percent:finance.annualRatePercent,finance_months:finance.months,finance_company_phone:FINANCE_SETTINGS.companyPhone}); }
  if(!payload.title){msg('Title required');return;}
  let {error}=await supabaseClient.from('ads').insert(payload);
  if(error && String(error.message||'').includes('finance_')){
    const fallback={...payload};
    ['finance_enabled','finance_downpayment','finance_monthly_payment','finance_downpayment_percent','finance_annual_rate_percent','finance_months','finance_company_phone','phone_verified','phone_verified_at'].forEach(k=>delete fallback[k]);
    const retry=await supabaseClient.from('ads').insert(fallback); error=retry.error;
  }
  if(error){IS_PUBLISHING=false;if(publishButton){publishButton.disabled=false;publishButton.textContent='Publish Ad';}msg(error.message);return;}
  clearDraft();
  msg('Ad submitted for admin approval'); ['title','price','description'].forEach(id=>el(id).value=''); setContactPhoneRows(['']); SIMPLE_IMAGES=[]; if(el('simpleImagePreview'))el('simpleImagePreview').innerHTML=''; document.querySelectorAll('[data-simple-field]').forEach(n=>n.value=''); IS_PUBLISHING=false;if(publishButton){publishButton.disabled=false;publishButton.textContent='Publish Ad';} updateFinanceBox();
}
function patchSiteNavigation(){
  document.querySelectorAll('a[href="/post"],a[href="/post/"]').forEach(a=>a.setAttribute('href','/post-ad'));
  if(innerWidth<=767 && location.pathname.replace(/\/$/,'')==='/categories') location.replace('/');
}
patchSiteNavigation();
init();
