const { missingFirstPartyReferences } = require('./baseline-common');
const refs = missingFirstPartyReferences();
console.log('Missing first-party references:');
for (const r of refs) console.log(`- ${r.source}: ${r.reference} -> ${r.normalizedPath} (${r.kind})`);
if (!refs.length) console.log('- none');
