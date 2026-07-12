const fs = require('fs');
const path = require('path');
const { ROOT, generateInventory, stableStringify } = require('./baseline-common');
const out = path.join(ROOT, 'docs/technical/baseline-inventory.json');
fs.writeFileSync(out, stableStringify(generateInventory()));
console.log(`Wrote ${path.relative(ROOT, out)}`);
