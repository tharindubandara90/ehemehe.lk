const fs = require('fs');
const vm = require('vm');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, 'public/js/index-BsKly-Vj.js'), 'utf8');
const start = source.indexOf('const EhmDistrictCities=');
const end = source.indexOf('function np(){', start);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source.slice(start, end) + '\nthis.getCities=EhmCitiesForDistrict;', sandbox);
const options = sandbox.getCities('Kandy District').concat(['Other / Not listed']);
for (const required of ['Kandy','Peradeniya','Gampola','Katugastota','Other / Not listed']) {
  if (!options.includes(required)) throw new Error('Missing native select option: ' + required);
}
if (options.length < 10) throw new Error('Kandy native select list is unexpectedly short');
console.log('CITY_NATIVE_SELECT_REGRESSION_TEST_PASSED', options.length);
