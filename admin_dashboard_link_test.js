
const fs = require('fs');
const vm = require('vm');

const adminHtml = fs.readFileSync(process.argv[2], 'utf8');
const adminJs = fs.readFileSync(process.argv[3], 'utf8');

class ClassList {
  constructor(el){ this.el = el; this.set = new Set(); }
  add(...xs){ xs.forEach(x=>this.set.add(x)); }
  remove(...xs){ xs.forEach(x=>this.set.delete(x)); }
  contains(x){ return this.set.has(x); }
  toggle(x){ if(this.set.has(x)){this.set.delete(x); return false;} this.set.add(x); return true; }
  toString(){ return Array.from(this.set).join(' '); }
}
class Element {
  constructor(id='', tag='div'){
    this.id=id; this.tagName=tag.toUpperCase(); this.style={}; this.dataset={}; this.classList=new ClassList(this);
    this._innerHTML=''; this.innerText=''; this.textContent=''; this.value=''; this.checked=false; this.disabled=false;
    this.children=[]; this.options=[];
  }
  set innerHTML(v){
    this._innerHTML = String(v ?? '');
    this.textContent = this._innerHTML.replace(/<[^>]+>/g,' ');
    // Parse select options
    const opts = [];
    const re = /<option(?:[^>]*value="([^"]*)")?[^>]*>(.*?)<\/option>/g;
    let m;
    while((m = re.exec(this._innerHTML))){
      opts.push({value: m[1] !== undefined ? m[1] : m[2].replace(/<[^>]+>/g,'')});
    }
    this.options = opts;
    if(this.tagName === 'SELECT' && opts.length && !opts.some(o=>o.value===this.value)){
      this.value = opts[0].value;
    }
  }
  get innerHTML(){ return this._innerHTML; }
  appendChild(child){ this.children.push(child); return child; }
  replaceWith(){ }
  addEventListener(){ }
  removeEventListener(){ }
  focus(){ }
  scrollIntoView(){ }
  getContext(){
    const noop=()=>{};
    return {
      clearRect:noop, beginPath:noop, moveTo:noop, lineTo:noop, stroke:noop, fill:noop, closePath:noop,
      arcTo:noop, fillText:noop, createLinearGradient:()=>({addColorStop:noop}),
      set strokeStyle(v){}, set fillStyle(v){}, set lineWidth(v){}, set font(v){}, set textAlign(v){}
    };
  }
}

const ids = new Set([...adminHtml.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
const selectIds = new Set([...adminHtml.matchAll(/<select[^>]+id="([^"]+)"/g)].map(m=>m[1]));
const inputIds = new Set([...adminHtml.matchAll(/<(input|textarea)[^>]+id="([^"]+)"/g)].map(m=>m[2]));
const elements = {};
function getEl(id){
  if(!elements[id]){
    const tag = id === 'revenueCanvas' ? 'canvas' : (selectIds.has(id) ? 'select' : (inputIds.has(id) ? 'input' : 'div'));
    elements[id] = new Element(id, tag);
    if(id.startsWith('section-')) elements[id].classList.add('section');
    if(id.startsWith('tab-')) elements[id].classList.add('tab-button');
  }
  return elements[id];
}
ids.forEach(id => getEl(id));

// default hidden state roughly
getEl('dashboard').classList.add('hidden');
['section-ads','section-categories','section-promotions','section-reports','section-users','section-shops','section-verification','section-finance','section-pricing','section-invoices','section-locations','section-fields','section-roles','section-seo','section-api','section-banners'].forEach(id=>getEl(id).classList.add('hidden'));

// Extract initial option values from HTML for selects
for(const id of selectIds){
  const tagRe = new RegExp(`<select[^>]+id="${id}"[^>]*>([\\s\\S]*?)<\\/select>`);
  const m = adminHtml.match(tagRe);
  if(m) getEl(id).innerHTML = m[1];
}

const document = {
  getElementById: getEl,
  querySelectorAll(sel){
    if(sel === '.section') return Object.values(elements).filter(e => e.classList.contains('section'));
    if(sel === '.nav button') return Object.values(elements).filter(e => e.id.startsWith('tab-'));
    return [];
  },
  createElement(tag){ return new Element('', tag); }
};

function todayMinus(n){
  const d = new Date('2026-07-04T12:00:00Z');
  d.setDate(d.getDate()-n);
  return d.toISOString();
}
const db = {
  staff_permissions: [{id:'staff1', email:'ehemehe.lk@gmail.com', role:'super_admin', is_active:true, can_view_users:true, can_approve_users:true, can_view_ads:true, can_approve_ads:true, can_edit_ads:true, can_delete_ads:true, can_manage_categories:true, can_manage_cities:true, can_manage_moderators:true, created_at:todayMinus(10)}],
  profiles: Array.from({length:4}).map((_,i)=>({id:'u'+(i+1), email:`user${i+1}@mail.com`, full_name:`User ${i+1}`, phone:'077000000'+i, status:i===3?'pending':'active', role:i===2?'business':'user', created_at:todayMinus(i)})),
  categories: [
    {id:'vehicles', name:'Vehicles', slug:'vehicles', created_at:todayMinus(10), is_active:true},
    {id:'cars', name:'Cars', slug:'cars', parent_id:'vehicles', created_at:todayMinus(9), is_active:true},
    {id:'electronics', name:'Electronics', slug:'electronics', created_at:todayMinus(8), is_active:true},
    {id:'property', name:'Property', slug:'property', created_at:todayMinus(8), is_active:true}
  ],
  districts: [{id:'colombo', name:'Colombo'}, {id:'kandy', name:'Kandy'}, {id:'gampaha', name:'Gampaha'}],
  cities: [{id:'colombo-city', name:'Colombo City', district_id:'colombo'}, {id:'peradeniya', name:'Peradeniya', district_id:'kandy'}, {id:'gampaha-city', name:'Gampaha City', district_id:'gampaha'}],
  ads: [],
  ad_reports: [{id:'r1', ad_id:'ad1', reporter_email:'report@mail.com', reason:'spam', status:'pending', created_at:todayMinus(0)}],
  shops: [{id:'s1', name:'Kamal Motors', phone:'0771111111', category:'Cars', status:'active', created_at:todayMinus(1)}],
  verifications: [{id:'v1', user_email:'user1@mail.com', type:'kyc', document_type:'NIC', status:'pending', created_at:todayMinus(1)}],
  payments: [{id:'p1', reference:'PAY001', user_email:'user1@mail.com', gateway:'payhere', amount:1500, status:'success', created_at:todayMinus(1)}],
  pricing_plans: [{id:'plan1', name:'Top Ad', type:'promotion', price:1500, duration_days:7, created_at:todayMinus(1)}],
  invoices: [{id:'inv1', invoice_no:'INV001', user_email:'user1@mail.com', amount:1500, status:'paid', created_at:todayMinus(1)}],
  custom_fields: [{id:'f1', category_id:'cars', label:'Mileage', type:'number', options:null, created_at:todayMinus(1)}],
  site_settings: [{key:'seo_title', value:'ehemehe.lk'}, {key:'sms_provider', value:'Notify'}],
  banner_ads: [{id:'b1', title:'Home Banner', image_url:'', target_url:'/', placement:'home_top', status:'active', created_at:todayMinus(1)}]
};
for(let i=1;i<=12;i++){
  db.ads.push({
    id:'ad'+i,
    title: i<=10 ? `Live Car Ad ${i}` : `Pending Ad ${i}`,
    price: i*100000,
    status: i<=10 ? 'approved' : 'pending',
    category_id: i%2 ? 'cars' : 'electronics',
    city_id: i%3===0 ? 'peradeniya' : (i%2===0 ? 'gampaha-city' : 'colombo-city'),
    phone:'0772222222',
    image_url:'',
    description:`Description for ad ${i}`,
    is_promoted: i===1 || i===2,
    promotion_type: i===1 ? 'top' : (i===2 ? 'urgent' : ''),
    created_at:todayMinus(i),
    categories:{id:i%2?'cars':'electronics', name:i%2?'Cars':'Electronics'},
    cities:{id:i%3===0?'peradeniya':(i%2===0?'gampaha-city':'colombo-city'), name:i%3===0?'Peradeniya':(i%2===0?'Gampaha City':'Colombo City'), district_id:i%3===0?'kandy':(i%2===0?'gampaha':'colombo')}
  });
}

class Query {
  constructor(table){ this.table=table; this.filters=[]; this.orderBy=null; this.asc=false; this.rangeFrom=null; this.rangeTo=null; this.mode='select'; this.payload=null; }
  select(){ this.mode='select'; return this; }
  eq(k,v){ this.filters.push([k,v]); return this; }
  order(k,opt){ this.orderBy=k; this.asc=!!(opt&&opt.ascending); return this; }
  range(f,t){ this.rangeFrom=f; this.rangeTo=t; return this; }
  insert(payload){ this.mode='insert'; this.payload=payload; return this; }
  update(payload){ this.mode='update'; this.payload=payload; return this; }
  delete(){ this.mode='delete'; return this; }
  single(){ return this.then(r=>({data:(r.data||[])[0]||null,error:r.error})); }
  maybeSingle(){ return this.then(r=>({data:(r.data||[])[0]||null,error:r.error})); }
  then(resolve,reject){
    try{
      let rows = db[this.table] || [];
      if(this.mode==='insert'){
        const row = Object.assign({id:'new_'+Math.random().toString(36).slice(2), created_at:todayMinus(0)}, this.payload);
        db[this.table] = rows.concat(row);
        return Promise.resolve({data:[row], error:null}).then(resolve,reject);
      }
      if(this.mode==='update'){
        let updated=[];
        db[this.table] = rows.map(r => {
          const ok = this.filters.every(([k,v]) => String(r[k])===String(v));
          if(ok){ const nr=Object.assign({}, r, this.payload); updated.push(nr); return nr; }
          return r;
        });
        return Promise.resolve({data:updated, error:null}).then(resolve,reject);
      }
      if(this.mode==='delete'){
        db[this.table] = rows.filter(r => !this.filters.every(([k,v]) => String(r[k])===String(v)));
        return Promise.resolve({data:[], error:null}).then(resolve,reject);
      }
      rows = rows.filter(r => this.filters.every(([k,v]) => String(r[k])===String(v)));
      if(this.orderBy){
        rows = rows.slice().sort((a,b)=>{
          const av=a[this.orderBy]||'', bv=b[this.orderBy]||'';
          return this.asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
        });
      }
      if(this.rangeFrom !== null) rows = rows.slice(this.rangeFrom, this.rangeTo+1);
      return Promise.resolve({data:rows, error:null}).then(resolve,reject);
    }catch(e){
      return Promise.resolve({data:null, error:e}).then(resolve,reject);
    }
  }
}

const context = {
  console, document, window:{}, alert:(m)=>{context.__alerts.push(m);}, confirm:()=>true, prompt:()=> 'test reason',
  __alerts:[],
  setTimeout, clearTimeout,
  supabaseClient: {
    auth: {
      getSession: async () => ({data:{session:null}}),
      signInWithPassword: async () => ({data:{user:{email:'ehemehe.lk@gmail.com'}}, error:null}),
      signOut: async () => ({})
    },
    from: (table) => new Query(table),
    rpc: async () => ({data:'ok', error:null})
  }
};
context.window = context;
context.location = { reload:()=>{}, href:'' };
context.history = { replaceState:()=>{} };

vm.createContext(context);
vm.runInContext(adminJs, context, {filename:'admin.js'});

(async () => {
  await context.openDashboard({email:'ehemehe.lk@gmail.com'});
  const results = {};
  results.liveAdsStat = getEl('statLiveAds').innerText;
  results.pendingAdsStat = getEl('statPendingAds').innerText;
  results.usersStat = getEl('statUsers').innerText;
  results.revenueStat = getEl('statRevenue').innerText;
  results.dashboardVisible = !getEl('dashboard').classList.contains('hidden');

  const tabs = ['overview','ads','categories','promotions','reports','users','shops','verification','finance','pricing','invoices','locations','fields','roles','seo','api','banners'];
  results.tabs = {};
  for(const t of tabs){
    context.showTab(t);
    results.tabs[t] = {
      title: getEl('pageTitle').innerText,
      visible: !getEl('section-'+t).classList.contains('hidden'),
      htmlLength: (getEl(sectionToListId(t))?.innerHTML || getEl('section-'+t).innerHTML || '').length
    };
  }

  // ads count tests
  context.showTab('ads');
  getEl('adStatus').value = 'all';
  context.renderAds();
  results.adsAllCards = (getEl('adsList').innerHTML.match(/listing-card/g)||[]).length;
  getEl('adStatus').value = 'approved';
  context.renderAds();
  results.adsApprovedCards = (getEl('adsList').innerHTML.match(/listing-card/g)||[]).length;
  getEl('adCategory').value = 'cars';
  context.renderAds();
  results.adsApprovedCars = (getEl('adsList').innerHTML.match(/listing-card/g)||[]).length;
  results.categorySelectPreserved = getEl('adCategory').value;

  // action tests
  await context.rejectAd('ad1');
  results.rejectUpdated = db.ads.find(a=>a.id==='ad1').status;
  await context.approveAd('ad11');
  results.approveUpdated = db.ads.find(a=>a.id==='ad11').status;
  const beforeDelete = db.ads.length;
  await context.deleteAd('ad12');
  results.deleteWorked = db.ads.length === beforeDelete - 1;

  function sectionToListId(tab){
    return ({
      ads:'adsList', categories:'categoriesList', promotions:'promotionsList', reports:'reportsList',
      users:'usersList', shops:'shopsList', verification:'verificationList', finance:'paymentsList',
      pricing:'pricingList', invoices:'invoicesList', locations:'districtsList', fields:'fieldsList',
      roles:'staffList', banners:'bannersList'
    })[tab] || 'opsSnapshot';
  }

  console.log(JSON.stringify(results, null, 2));
})().catch(e => { console.error(e.stack || e); process.exit(1); });
