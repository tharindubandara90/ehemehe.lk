const assert = require('assert');
const form = require('./public/post-ad-category-fields.js');

assert.strictEqual(Object.keys(form.DISTRICT_CITIES).length, 25);
assert(form.DISTRICT_CITIES.Badulla.includes('Mahiyanganaya'));
assert(form.DISTRICT_CITIES.Colombo.includes('Maharagama'));

const land = form.fieldsFor('property', 'land');
assert(land.some(field => field.key === 'land_size'));
assert(land.some(field => field.key === 'land_unit'));
assert(!land.some(field => field.key === 'bedrooms'));
assert(!land.some(field => field.key === 'body_type'));

const car = form.fieldsFor('vehicles', 'cars');
const carBody = car.find(field => field.key === 'body_type');
assert(carBody.options.includes('Sedan / Saloon'));
assert(!carBody.options.includes('Scooter'));

const bike = form.fieldsFor('vehicles', 'motorbikes');
const bikeBody = bike.find(field => field.key === 'body_type');
assert(bikeBody.options.includes('Scooter'));
assert(!bikeBody.options.includes('Sedan / Saloon'));

const pets = form.fieldsFor('animals-pets', 'dogs');
assert(pets.some(field => field.key === 'breed'));
assert(!pets.some(field => field.key === 'property_type'));

assert.strictEqual(form.conditionApplies('property', 'land'), false);
assert.strictEqual(form.conditionApplies('animals-pets', 'dogs'), false);
assert.strictEqual(form.conditionApplies('animals-pets', 'pet-accessories'), true);
assert.strictEqual(form.conditionApplies('education', 'courses'), false);
assert.strictEqual(form.conditionApplies('education', 'edu-books'), true);
assert.strictEqual(form.conditionApplies('services', 'repair'), false);
assert.strictEqual(form.conditionApplies('vehicles', 'cars'), true);
assert.strictEqual(form.conditionApplies('health-beauty', 'beauty-products'), false);
assert.strictEqual(form.conditionApplies('health-beauty', 'fitness-equipment'), true);
assert.strictEqual(form.conditionApplies('business-industry-agriculture', 'agriculture'), false);
assert.strictEqual(form.conditionApplies('business-industry-agriculture', 'industrial-machinery'), true);

assert.strictEqual(form.priceLabelFor('property', 'rooms-rent'), 'Monthly Rent (LKR) *');
assert.strictEqual(form.priceLabelFor('jobs', 'vacancies'), 'Salary / Pay (LKR) *');

console.log('POST_AD_CATEGORY_LOCATION_TEST_PASSED');
