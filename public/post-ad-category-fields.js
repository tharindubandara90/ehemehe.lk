(() => {
  'use strict';

  const FIELD_DEFINITIONS = {
    vehicles: [
      { key:'vehicle_brand', label:'Brand / Make', type:'select', required:true, options:['Toyota','Honda','Nissan','Suzuki','Mitsubishi','Mazda','Mercedes-Benz','BMW','Audi','Hyundai','Kia','Bajaj','TVS','Yamaha','Other'] },
      { key:'vehicle_model', label:'Model', type:'text', required:true, placeholder:'Axio, Premio, Vitz, Alto...' },
      { key:'year_manufacture', label:'Year of Manufacture', type:'number', placeholder:'2015' },
      { key:'year_registered', label:'Year of Registration', type:'number', placeholder:'2016' },
      { key:'mileage_km', label:'Mileage (km)', type:'number', required:true, placeholder:'85000' },
      { key:'fuel_type', label:'Fuel Type', type:'select', required:true, options:['Petrol','Diesel','Hybrid','Electric','CNG','Other'] },
      { key:'transmission', label:'Gear / Transmission', type:'select', required:true, options:['Automatic','Manual','Tiptronic','CVT','Other'] },
      { key:'engine_capacity', label:'Engine Capacity / CC', type:'number', placeholder:'1500' },
      { key:'body_type', label:'Body Type', type:'select', options:['Sedan / Saloon','Hatchback','Station Wagon','Coupe / Sports','Convertible','MPV / Minivan','Crossover','Other'] },
      { key:'ownership', label:'Ownership', type:'select', options:['1st owner','2nd owner','3rd owner','4th owner or more','Unregistered'] },
      { key:'condition_notes', label:'Vehicle Condition Notes', type:'textarea', placeholder:'Accident-free, original paint, service records, tyre condition...' }
    ],
    property: [
      { key:'property_type', label:'Property Type', type:'select', required:true, options:['House','Apartment','Land','Commercial Property','Room / Annex','Villa','Other'] },
      { key:'listing_type', label:'Listing Type', type:'select', required:true, options:['For Sale','For Rent','Lease'] },
      { key:'bedrooms', label:'Bedrooms', type:'number' },
      { key:'bathrooms', label:'Bathrooms', type:'number' },
      { key:'floor_area_sqft', label:'Floor Area (sq.ft)', type:'number' },
      { key:'land_size', label:'Land Size', type:'text', placeholder:'10 perches / 1 acre' },
      { key:'parking', label:'Parking', type:'select', options:['No parking','1 vehicle','2 vehicles','3+ vehicles'] },
      { key:'furnished', label:'Furnished', type:'select', options:['Unfurnished','Semi furnished','Fully furnished'] },
      { key:'deed_type', label:'Deed / Title', type:'select', options:['Clear deed','Permit','Lease agreement','Other'] },
      { key:'utilities', label:'Utilities', type:'textarea', placeholder:'Water, electricity, road access, boundary wall...' }
    ],
    'mobile-phones': [
      { key:'phone_brand', label:'Brand', type:'select', required:true, options:['Apple','Samsung','Xiaomi','Huawei','Oppo','Vivo','Nokia','Google','OnePlus','Realme','Other'] },
      { key:'phone_model', label:'Model', type:'text', required:true, placeholder:'iPhone 15 Pro Max, Galaxy S23...' },
      { key:'storage', label:'Storage', type:'select', options:['16GB','32GB','64GB','128GB','256GB','512GB','1TB'] },
      { key:'ram', label:'RAM', type:'select', options:['2GB','3GB','4GB','6GB','8GB','12GB','16GB+'] },
      { key:'battery_health', label:'Battery Health (%)', type:'number', placeholder:'88' },
      { key:'warranty', label:'Warranty', type:'select', options:['No warranty','Shop warranty','Company warranty','Apple care / official warranty'] },
      { key:'box_accessories', label:'Box / Accessories', type:'textarea', placeholder:'Box, charger, cable, bill, cover...' }
    ],
    electronics: [
      { key:'electronics_brand', label:'Brand', type:'text', placeholder:'Samsung, LG, Sony...' },
      { key:'electronics_model', label:'Model', type:'text' },
      { key:'warranty', label:'Warranty', type:'select', options:['No warranty','Shop warranty','Company warranty'] },
      { key:'screen_size', label:'Screen Size', type:'text', placeholder:'65 inch / 15.6 inch' },
      { key:'specifications', label:'Specifications', type:'textarea', placeholder:'Processor, RAM, storage, resolution, accessories...' }
    ],
    jobs: [
      { key:'job_type', label:'Job Type', type:'select', required:true, options:['Full-time','Part-time','Contract','Internship','Freelance'] },
      { key:'company_name', label:'Company Name', type:'text' },
      { key:'salary', label:'Salary / Pay', type:'text', placeholder:'LKR 80,000 / Negotiable' },
      { key:'work_location', label:'Work Location', type:'select', options:['On-site','Remote','Hybrid'] },
      { key:'experience', label:'Experience Required', type:'text' },
      { key:'education', label:'Education / Qualification', type:'text' }
    ],
    services: [
      { key:'service_type', label:'Service Type', type:'text' },
      { key:'service_area', label:'Service Area', type:'text', placeholder:'Colombo, Kandy, islandwide...' },
      { key:'experience_years', label:'Experience', type:'text' },
      { key:'availability', label:'Availability', type:'text', placeholder:'Weekdays / 24 hours / appointment only' }
    ],
    'animals-pets': [
      { key:'breed', label:'Breed', type:'text' },
      { key:'age', label:'Age', type:'text' },
      { key:'gender', label:'Gender', type:'select', options:['Male','Female','Pair','Not sure'] },
      { key:'vaccinated', label:'Vaccinated', type:'select', options:['Yes','No','Partially'] },
      { key:'pet_notes', label:'Pet Details', type:'textarea', placeholder:'Health, parents, food, delivery...' }
    ],
    'home-garden': [
      { key:'item_type', label:'Item Type', type:'text' },
      { key:'brand', label:'Brand', type:'text' },
      { key:'material', label:'Material', type:'text' },
      { key:'dimensions', label:'Dimensions / Size', type:'text' },
      { key:'warranty', label:'Warranty', type:'text' }
    ],
    'business-industry': [
      { key:'equipment_type', label:'Equipment / Business Type', type:'text' },
      { key:'brand', label:'Brand', type:'text' },
      { key:'capacity', label:'Capacity / Size', type:'text' },
      { key:'power_type', label:'Power / Fuel Type', type:'text' },
      { key:'service_history', label:'Service History', type:'textarea' }
    ],
    education: [
      { key:'subject', label:'Subject / Course', type:'text' },
      { key:'grade_level', label:'Grade / Level', type:'text' },
      { key:'medium', label:'Medium', type:'select', options:['Sinhala','English','Tamil','Other'] },
      { key:'class_type', label:'Class Type', type:'select', options:['Online','Physical','Home visit','Group class','Individual'] },
      { key:'fee', label:'Fee', type:'text' }
    ],
    fashion: [
      { key:'brand', label:'Brand', type:'text' },
      { key:'size', label:'Size', type:'text' },
      { key:'gender', label:'Gender', type:'select', options:['Men','Women','Kids','Unisex'] },
      { key:'material', label:'Material', type:'text' },
      { key:'originality', label:'Originality', type:'select', options:['Original','Replica','Not sure'] }
    ],
    general: [
      { key:'brand', label:'Brand', type:'text' },
      { key:'model', label:'Model', type:'text' },
      { key:'warranty', label:'Warranty', type:'text' },
      { key:'extra_details', label:'Extra Details', type:'textarea' }
    ]
  };

  const SUBCATEGORY_OVERRIDES = {
    cars: 'vehicles', car: 'vehicles', suvs: 'vehicles', suv: 'vehicles', 'suv-jeep': 'vehicles', jeeps: 'vehicles',
    motorcycles: 'vehicles', motorcycle: 'vehicles', motorbikes: 'vehicles', motorbike: 'vehicles', scooters: 'vehicles',
    'three-wheelers': 'vehicles', 'three-wheeler': 'vehicles', threewheelers: 'vehicles', 'tuk-tuks': 'vehicles',
    vans: 'vehicles', van: 'vehicles', trucks: 'vehicles', truck: 'vehicles', lorries: 'vehicles', lorry: 'vehicles',
    buses: 'vehicles', bus: 'vehicles', pickups: 'vehicles', pickup: 'vehicles', 'double-cabs': 'vehicles', 'crew-cabs': 'vehicles',
    tractors: 'vehicles', tractor: 'vehicles', 'heavy-duty': 'vehicles', 'heavy-vehicles': 'vehicles',
    land: 'property', lands: 'property', houses: 'property', apartments: 'property', 'apartment-rentals': 'property', 'property-rentals': 'property',
    phones: 'mobile-phones', mobiles: 'mobile-phones', tablets: 'mobile-phones', laptops: 'electronics', tvs: 'electronics',
    dogs: 'animals-pets', cats: 'animals-pets'
  };

  const state = { category:'', subcategory:'', fields:{}, lastInjectedKey:'' };

  const VEHICLE_BODY_TYPE_CONFIG = {
    cars: {
      label: 'Car Body Type',
      aliases: ['car','cars','automobile','saloon-car'],
      options: ['Sedan / Saloon','Hatchback','Station Wagon','Coupe / Sports','Convertible','MPV / Minivan','Crossover','Other']
    },
    suvs: {
      label: 'SUV / Jeep Type',
      aliases: ['suv','suvs','suv-jeep','suv-jeeps','jeep','jeeps','4x4'],
      options: ['Compact SUV','Mid-size SUV','Full-size SUV','Crossover SUV','4x4 / Off-road','Other']
    },
    motorcycles: {
      label: 'Motorcycle Type',
      aliases: ['motorcycle','motorcycles','motorbike','motorbikes','bike','bikes'],
      options: ['Scooter','Standard / Commuter','Sports Bike','Naked Bike','Cruiser','Touring','Adventure / Dual Sport','Off-road / Dirt Bike','Moped','Electric Motorcycle','Other']
    },
    'three-wheelers': {
      label: 'Three Wheeler Type',
      aliases: ['three-wheeler','three-wheelers','threewheeler','threewheelers','tuk-tuk','tuk-tuks'],
      options: ['Passenger Three Wheeler','Cargo Three Wheeler','Electric Three Wheeler','Other']
    },
    vans: {
      label: 'Van Type',
      aliases: ['van','vans'],
      options: ['Mini Van','Passenger Van','Cargo / Panel Van','High-roof Van','Camper Van','Other']
    },
    pickups: {
      label: 'Pickup / Cab Type',
      aliases: ['pickup','pickups','single-cab','double-cab','double-cabs','crew-cab','crew-cabs'],
      options: ['Single Cab Pickup','Double Cab / Crew Cab','Extended Cab Pickup','Utility Pickup','Other']
    },
    trucks: {
      label: 'Lorry / Truck Type',
      aliases: ['truck','trucks','lorry','lorries'],
      options: ['Light Truck','Medium Truck','Heavy Truck','Tipper / Dump Truck','Box Truck','Flatbed Truck','Refrigerated Truck','Tanker','Tractor Head / Prime Mover','Other']
    },
    buses: {
      label: 'Bus Type',
      aliases: ['bus','buses'],
      options: ['Mini Bus','School Bus','Staff / Office Bus','City Bus','Coach / Luxury Bus','Double-decker Bus','Other']
    },
    tractors: {
      label: 'Tractor Type',
      aliases: ['tractor','tractors'],
      options: ['Two-wheel Tractor','Four-wheel Tractor','Agricultural Tractor','Orchard Tractor','Other']
    },
    'heavy-duty': {
      label: 'Heavy Vehicle Type',
      aliases: ['heavy-duty','heavy-vehicle','heavy-vehicles','construction-vehicle','construction-vehicles'],
      options: ['Excavator','Backhoe Loader','Wheel Loader','Bulldozer','Road Roller','Crane','Forklift','Motor Grader','Other']
    }
  };

  function slug(v) {
    return String(v || '').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  }

  function detectVehicleSubtypeFromDom() {
    const selections = Array.from(document.querySelectorAll('select'))
      .flatMap((select) => [select.value, select.options[select.selectedIndex]?.textContent || ''])
      .map(slug)
      .filter(Boolean);

    // Prefer exact aliases, then safe phrase matches. This prevents Fuel Type,
    // Condition, or Ownership selections from being mistaken for vehicle type.
    for (const [type, config] of Object.entries(VEHICLE_BODY_TYPE_CONFIG)) {
      if (config.aliases.some((alias) => selections.includes(alias))) return type;
    }

    const joined = selections.join(' ');
    if (/three-wheel|threewheeler|tuk-tuk/.test(joined)) return 'three-wheelers';
    if (/double-cab|crew-cab|pickup/.test(joined)) return 'pickups';
    if (/motorcycle|motorbike|scooter/.test(joined)) return 'motorcycles';
    if (/suv|jeep|4x4/.test(joined)) return 'suvs';
    if (/(^|-)van(s)?($|-)/.test(joined)) return 'vans';
    if (/lorry|truck/.test(joined)) return 'trucks';
    if (/(^|-)bus(es)?($|-)/.test(joined)) return 'buses';
    if (/tractor/.test(joined)) return 'tractors';
    if (/heavy-duty|heavy-vehicle|construction-vehicle/.test(joined)) return 'heavy-duty';
    if (/(^|-)car(s)?($|-)/.test(joined)) return 'cars';
    return '';
  }

  function vehicleFieldsForSubtype() {
    const subtype = detectVehicleSubtypeFromDom() || state.subcategory || 'cars';
    const config = VEHICLE_BODY_TYPE_CONFIG[subtype] || VEHICLE_BODY_TYPE_CONFIG.cars;
    return FIELD_DEFINITIONS.vehicles.map((field) => {
      if (field.key !== 'body_type') return { ...field };
      return { ...field, label: config.label, options: [...config.options] };
    });
  }

  function detectCategoryFromDom() {
    const selects = Array.from(document.querySelectorAll('select.input-field, select'));
    const selectedTexts = selects.map(s => (s.options[s.selectedIndex]?.textContent || '').trim()).filter(Boolean);
    const selectedValues = selects.map(s => s.value).filter(Boolean);
    const all = [...selectedValues, ...selectedTexts].map(slug);
    const keys = Object.keys(FIELD_DEFINITIONS);

    for (const v of all) {
      if (keys.includes(v)) return v;
      if (SUBCATEGORY_OVERRIDES[v]) return SUBCATEGORY_OVERRIDES[v];
    }

    const joined = all.join(' ');
    if (/vehicle|car|motor|bike|three|van|truck|bus|suv|jeep/.test(joined)) return 'vehicles';
    if (/property|house|apartment|land|room|annex|rent/.test(joined)) return 'property';
    if (/mobile|phone|tablet/.test(joined)) return 'mobile-phones';
    if (/electronic|laptop|computer|tv|camera|audio/.test(joined)) return 'electronics';
    if (/job|career|vacancy/.test(joined)) return 'jobs';
    if (/service|repair/.test(joined)) return 'services';
    if (/animal|pet|dog|cat/.test(joined)) return 'animals-pets';
    if (/home|garden|furniture/.test(joined)) return 'home-garden';
    if (/business|industry|agriculture|equipment/.test(joined)) return 'business-industry';
    if (/education|tuition|class/.test(joined)) return 'education';
    if (/fashion|clothing|shoe|watch/.test(joined)) return 'fashion';
    return state.category || 'general';
  }

  function rememberSelects() {
    const selects = Array.from(document.querySelectorAll('select.input-field, select'));
    const values = selects.map(s => ({ value: s.value, text: (s.options[s.selectedIndex]?.textContent || '').trim() }));
    const category = detectCategoryFromDom();
    state.category = category;
    const vehicleSubtype = category === 'vehicles' ? detectVehicleSubtypeFromDom() : '';
    const candidate = vehicleSubtype || values.map(x => slug(x.text || x.value)).find(x => x && x !== category && x !== 'select-a-category' && x !== 'select-a-subcategory');
    if (candidate) state.subcategory = candidate;
  }

  function fieldKeyPrefix() {
    return `${state.category || 'general'}:${state.subcategory || 'all'}`;
  }

  function getFields() {
    const category = detectCategoryFromDom();
    state.category = category;
    if (category === 'vehicles') {
      const subtype = detectVehicleSubtypeFromDom();
      if (subtype) state.subcategory = subtype;
      return vehicleFieldsForSubtype();
    }
    return FIELD_DEFINITIONS[category] || FIELD_DEFINITIONS.general;
  }

  function inputHtml(field, value) {
    const attrs = `data-ehm-field="${field.key}" ${field.required ? 'required' : ''} class="ehm-extra-input input-field"`;
    if (field.type === 'select') {
      return `<select ${attrs}><option value="">Select ${field.label}</option>${(field.options || []).map(o => `<option value="${escapeHtml(o)}" ${value === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}</select>`;
    }
    if (field.type === 'textarea') {
      return `<textarea ${attrs} rows="3" placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(value || '')}</textarea>`;
    }
    return `<input ${attrs} type="${field.type || 'text'}" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(field.placeholder || '')}">`;
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function readCurrentValues() {
    document.querySelectorAll('[data-ehm-field]').forEach(input => {
      state.fields[input.dataset.ehmField] = input.value;
    });
    try { localStorage.setItem('ehemehePostAdExtraFields', JSON.stringify({category:state.category, subcategory:state.subcategory, fields:state.fields})); } catch(e) {}
  }

  function injectDetailsFields() {
    const h2 = Array.from(document.querySelectorAll('h2')).find(n => (n.textContent || '').trim() === 'Ad Details');
    if (!h2) return;
    rememberSelects();
    const container = h2.parentElement;
    if (!container) return;

    const key = fieldKeyPrefix();
    let existing = container.querySelector('#ehm-category-fields-panel');
    if (existing && existing.dataset.key === key) return;
    if (existing) existing.remove();

    const after = Array.from(container.querySelectorAll('.grid')).pop() || container.lastElementChild;
    const fields = getFields();
    const panel = document.createElement('div');
    panel.id = 'ehm-category-fields-panel';
    panel.dataset.key = key;
    panel.className = 'ehm-extra-fields mt-6 p-5 rounded-2xl border border-surface-200 bg-surface-50';
    panel.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-surface-900 text-base">Category Details</h3>
          <p class="text-xs text-surface-500">Fill the details buyers usually check before contacting you.</p>
        </div>
        <span class="text-xs px-3 py-1 rounded-full bg-primary-100 text-primary-700 font-semibold">${escapeHtml(state.category.replace(/-/g,' '))}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${fields.map(field => `
          <div class="${field.type === 'textarea' ? 'sm:col-span-2' : ''}">
            <label class="block text-sm font-medium text-surface-700 mb-2">${escapeHtml(field.label)}${field.required ? ' *' : ''}</label>
            ${inputHtml(field, state.fields[field.key] || '')}
          </div>
        `).join('')}
      </div>
    `;
    if (after && after.parentElement) after.insertAdjacentElement('afterend', panel);
    else container.appendChild(panel);

    panel.addEventListener('input', readCurrentValues);
    panel.addEventListener('change', readCurrentValues);
  }

  function injectReviewSummary() {
    const h2 = Array.from(document.querySelectorAll('h2')).find(n => (n.textContent || '').trim() === 'Review Your Ad');
    if (!h2) return;
    readCurrentValues();
    const container = h2.parentElement;
    if (!container || container.querySelector('#ehm-review-fields-panel')) return;
    const rows = Object.entries(state.fields).filter(([,v]) => String(v || '').trim());
    if (!rows.length) return;

    const labels = {};
    Object.values(FIELD_DEFINITIONS).flat().forEach(f => labels[f.key] = f.label);
    const panel = document.createElement('div');
    panel.id = 'ehm-review-fields-panel';
    panel.className = 'bg-surface-50 rounded-xl p-4';
    panel.innerHTML = `
      <div class="text-xs text-surface-400 uppercase tracking-wider mb-2">Category Details</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        ${rows.map(([k,v]) => `<div><span class="text-surface-500">${escapeHtml(labels[k] || k)}:</span> <span class="font-medium text-surface-900">${escapeHtml(v)}</span></div>`).join('')}
      </div>
    `;
    const list = container.querySelector('.space-y-4') || container;
    list.appendChild(panel);
  }

  function hookNavigationButtons() {
    document.querySelectorAll('button').forEach(btn => {
      const text = (btn.textContent || '').trim();
      if ((text === 'Continue' || text === 'Post Ad') && !btn.dataset.ehmFieldsHooked) {
        btn.dataset.ehmFieldsHooked = '1';
        btn.addEventListener('click', () => {
          readCurrentValues();
          setTimeout(() => {
            rememberSelects();
            injectDetailsFields();
            injectReviewSummary();
          }, 80);
        }, true);
      }
    });
  }

  async function compressImage(file, maxSize = 1600, quality = 0.88) {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const ratio = Math.min(1, maxSize / Math.max(width, height));
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', quality);
  }

  window.ehmPostAdImagePicker = async function(existingImages, setImages) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async () => {
      try {
        const current = Array.isArray(existingImages) ? existingImages : [];
        const files = Array.from(input.files || []).slice(0, Math.max(0, 10 - current.length));
        const processed = [];
        for (const file of files) {
          if (!file.type.startsWith('image/')) continue;
          processed.push(await compressImage(file));
        }
        setImages([...current, ...processed].slice(0, 10));
      } catch (e) {
        alert(e.message || 'Image upload failed.');
      } finally {
        input.remove();
      }
    };

    input.click();
  };

  function tick() {
    rememberSelects();
    injectDetailsFields();
    injectReviewSummary();
    hookNavigationButtons();
  }

  document.addEventListener('change', e => {
    if (e.target && e.target.matches('select')) {
      rememberSelects();
      setTimeout(injectDetailsFields, 50);
    }
  }, true);

  const observer = new MutationObserver(() => tick());
  observer.observe(document.documentElement, { childList:true, subtree:true });
  document.addEventListener('DOMContentLoaded', tick);
  setInterval(tick, 1000);
})();
