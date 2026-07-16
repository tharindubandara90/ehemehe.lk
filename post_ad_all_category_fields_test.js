const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const bundle = fs.readFileSync('public/js/index-BsKly-Vj.js', 'utf8');
const helperSource = fs.readFileSync('public/post-ad-category-fields.js', 'utf8');
const runtimeSource = fs.readFileSync('public/post-ad-runtime.js', 'utf8');
const form = require('./public/post-ad-category-fields.js');

const start = bundle.indexOf('const gr=') + 'const gr='.length;
const end = bundle.indexOf(',Ei=[', start);
assert(start > 'const gr='.length && end > start, 'Could not find the React category matrix.');
const categories = vm.runInNewContext(`(${bundle.slice(start, end)})`);

assert.strictEqual(categories.length, 13, 'Unexpected main category count.');
let subcategoryCount = 0;
for (const category of categories) {
  assert(category.subcategories.length > 0, `${category.id} has no subcategories.`);
  for (const subcategory of category.subcategories) {
    subcategoryCount += 1;
    const fields = form.fieldsFor(category.id, subcategory.id);
    assert(fields.length >= 5, `${category.id}/${subcategory.id} has too few detail fields.`);
    const keys = fields.map((field) => field.key);
    assert.strictEqual(new Set(keys).size, keys.length, `${category.id}/${subcategory.id} has duplicate keys.`);
    assert(fields.some((field) => field.required), `${category.id}/${subcategory.id} has no identifying required field.`);
  }
}
assert.strictEqual(subcategoryCount, 62, 'Unexpected subcategory count.');

assert.strictEqual(form.normalizeCategoryKey('Mobile Phones & Tablets'), 'mobile-phones');
assert.strictEqual(form.normalizeCategoryKey('Business, Industry & Agriculture'), 'business-industry-agriculture');
assert.strictEqual(form.normalizeSubcategoryKey('Vehicle Parts & Accessories', 'Vehicles'), 'vehicle-parts');
assert.strictEqual(form.normalizeSubcategoryKey('Books', 'Education'), 'edu-books');

function keys(category, subcategory) {
  return form.fieldsFor(category, subcategory).map((field) => field.key);
}

assert(keys('vehicles', 'cars').includes('vehicle_model'));
assert(keys('vehicles', 'cars').includes('mileage_km'));
assert(keys('vehicles', 'cars').includes('body_type'));
assert(keys('property', 'land').includes('land_size'));
assert(!keys('property', 'land').includes('bedrooms'));
assert(keys('property', 'property-rent').includes('advance_payment'));
assert(keys('mobile-phones', 'phones').includes('battery_health'));
assert(keys('electronics', 'computers-tablets').includes('processor'));
assert(keys('electronics', 'cameras').includes('shutter_count'));
assert(keys('home-garden', 'garden-tools').includes('power_source'));
assert(keys('sports-hobbies-kids', 'books').includes('isbn'));
assert(keys('animals-pets', 'fish').includes('water_type'));
assert(!keys('animals-pets', 'fish').includes('vaccinated'));
assert(keys('jobs', 'job-wanted').includes('desired_position'));
assert(!keys('jobs', 'job-wanted').includes('company_name'));
assert(keys('services', 'it-services').includes('technologies'));
assert(keys('fashion', 'watches').includes('case_size'));
assert(keys('fashion', 'jewelry-accessories').includes('certificate'));

assert.strictEqual(form.conditionApplies('property', 'land'), false);
assert.strictEqual(form.conditionApplies('animals-pets', 'dogs'), false);
assert.strictEqual(form.conditionApplies('services', 'repair'), false);
assert.strictEqual(form.conditionApplies('vehicles', 'cars'), true);
assert.strictEqual(form.conditionApplies('fashion', 'watches'), true);

assert(bundle.includes('data-ehm-category-select'));
assert(bundle.includes('data-ehm-subcategory-select'));
assert(bundle.includes('data-ehm-post-step":"details'));
assert(bundle.includes('id:"ehm-category-fields-host"'));
assert(helperSource.includes('function captureChangedCategoryControl(select)'));
assert(helperSource.includes('function categoryKeyFromSelect(select)'));
assert(helperSource.includes('function subcategoryKeyFromSelect(select, category)'));
assert(helperSource.includes('function scheduleStepTransitionTicks()'));
assert(helperSource.includes('const SELECTION_KEY ='));
assert(helperSource.includes("if (heading('Select Category')) rememberCategorySelection();"));
assert(!helperSource.includes('setInterval(scheduleTick'));
assert(runtimeSource.includes('customFields: collectCustomFields()'));
assert(runtimeSource.includes("localStorage.getItem('ehemehe:postAdForm:v4')"));

console.log(`POST_AD_ALL_CATEGORY_FIELDS_TEST_PASSED (${categories.length} categories, ${subcategoryCount} subcategories)`);
