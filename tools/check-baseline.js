const fs = require('fs');
const path = require('path');
const { ROOT, generateInventory, stableStringify } = require('./baseline-common');
const file = path.join(ROOT, 'docs/technical/baseline-inventory.json');
const expected = stableStringify(generateInventory());
const actual = fs.readFileSync(file, 'utf8');
if (actual !== expected) {
  console.error('baseline-inventory.json is not current. Run npm run baseline:generate.');
  process.exit(1);
}
console.log('baseline-inventory.json matches generated output.');
