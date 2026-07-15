const fs = require('fs');
const vm = require('vm');
const path = require('path');
const bundle = path.join(__dirname, 'public/js/index-BsKly-Vj.js');
const source = fs.readFileSync(bundle, 'utf8');
const start = source.indexOf('const EhmDistrictCities=');
const end = source.indexOf('function np(){', start);
if (start < 0 || end < 0) throw new Error('Embedded city module missing');
const code = source.slice(start, end) + '\nthis.result={map:EhmDistrictCities,get:EhmCitiesForDistrict};';
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const { map, get } = sandbox.result;
if (Object.keys(map).length !== 25) throw new Error('Expected 25 districts');
for (const [district, cities] of Object.entries(map)) {
  if (!Array.isArray(cities) || cities.length < 5) throw new Error('Missing cities: ' + district);
}
if (!get('Kandy District').includes('Peradeniya')) throw new Error('Kandy lookup failed');
if (!get('Matale').includes('Laggala')) throw new Error('Matale lookup failed');
console.log('CITY_DATA_REGRESSION_TEST_PASSED');
