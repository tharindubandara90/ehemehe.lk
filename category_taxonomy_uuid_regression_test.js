const assert = require('assert');
const form = require('./public/post-ad-category-fields.js');

const categoryAliases = {
  'Vehicles': 'vehicles',
  'Property': 'property',
  'Electronics': 'electronics',
  'Mobile Phones & Tablets': 'mobile-phones',
  'Home & Garden': 'home-garden',
  'Health & Beauty': 'health-beauty',
  'Sports, Hobbies & Kids': 'sports-hobbies-kids',
  'Education': 'education',
  'Animals & Pets': 'animals-pets',
  'Jobs': 'jobs',
  'Business, Industry & Agriculture': 'business-industry-agriculture',
  'Services': 'services',
  'Fashion': 'fashion'
};
for (const [label, expected] of Object.entries(categoryAliases)) {
  assert.strictEqual(form.normalizeCategoryKey(label), expected, label);
}

const expectations = [
  ['Vehicles', 'Cars', 'vehicle_model'],
  ['Property', 'Land', 'land_size'],
  ['Mobile Phones & Tablets', 'Mobile Phones', 'phone_model'],
  ['Electronics', 'Laptops & Computers', 'processor'],
  ['Home & Garden', 'Furniture', 'furniture_type'],
  ['Health & Beauty', 'Beauty Products', 'product_type'],
  ['Sports, Hobbies & Kids', 'Sports Equipment', 'sport_type'],
  ['Education', 'Courses', 'course_name'],
  ['Animals & Pets', 'Dogs', 'breed'],
  ['Jobs', 'Vacancies', 'job_title'],
  ['Business, Industry & Agriculture', 'Agriculture', 'agriculture_type'],
  ['Services', 'Repair Services', 'service_type'],
  ['Fashion', 'Men’s Clothing', 'clothing_type']
];
for (const [category, subcategory, key] of expectations) {
  const fields = form.fieldsFor(category, subcategory);
  assert(fields.some((field) => field.key === key), `${category} / ${subcategory} missing ${key}`);
}

assert.strictEqual(form.normalizeSubcategoryKey('Vehicle Parts & Accessories', 'Vehicles'), 'vehicle-parts');
assert.strictEqual(form.normalizeSubcategoryKey('Rooms for Rent', 'Property'), 'rooms-rent');
assert.strictEqual(form.normalizeSubcategoryKey('Accessories', 'Mobile Phones & Tablets'), 'phone-accessories');
assert.strictEqual(form.normalizeSubcategoryKey('Books', 'Education'), 'edu-books');
assert.strictEqual(form.normalizeSubcategoryKey('Jewelry & Accessories', 'Fashion'), 'jewelry-accessories');

console.log('CATEGORY_TAXONOMY_UUID_REGRESSION_TEST_PASSED');
