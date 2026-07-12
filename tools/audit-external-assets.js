const { externalAssets } = require('./baseline-common');
console.log('External HTTP/HTTPS hosts:');
for (const h of externalAssets()) console.log(`- ${h.host}: ${h.sourceFiles.join(', ')}`);
