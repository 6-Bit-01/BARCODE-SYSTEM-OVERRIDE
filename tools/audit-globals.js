const { globalAssignments } = require('./baseline-common');
console.log('Critical window.* assignments:');
for (const g of globalAssignments()) console.log(`- ${g.global} ${g.file}:${g.line} ${g.loaded ? 'loaded' : 'inactive'}`);
