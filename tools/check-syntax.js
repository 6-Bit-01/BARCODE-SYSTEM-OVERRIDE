const { loadedRepoJs, parseScripts, checkFileSyntax } = require('./baseline-common');
const vm = require('vm');
let failed = false;
console.log('Checking loaded repository JavaScript and inline scripts...');
for (const file of loadedRepoJs()) {
  const err = checkFileSyntax(file);
  console.log(`${err ? 'FAIL' : 'PASS'} ${file}`);
  if (err) { console.log(`  ${err.message}`); failed = true; }
}
for (const script of parseScripts().filter(s => s.type === 'inline')) {
  try { new vm.Script(script.content, { filename: `index.html inline script ${script.index}` }); console.log(`PASS index.html inline script ${script.index}`); }
  catch (err) { console.log(`FAIL index.html inline script ${script.index}`); console.log(`  ${err.message}`); failed = true; }
}
if (failed) process.exit(1);
