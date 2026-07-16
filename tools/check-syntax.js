const { loadedRepoJs, parseScripts, checkFileSyntax, syntaxCheckSource } = require('./baseline-common');
let failed = false;
console.log('Checking loaded repository JavaScript and inline scripts...');
for (const file of loadedRepoJs()) {
  const err = checkFileSyntax(file);
  console.log(`${err ? 'FAIL' : 'PASS'} ${file}`);
  if (err) { console.log(`  ${err.message}`); failed = true; }
}
for (const script of parseScripts().filter(s => s.type === 'inline')) {
  const err = syntaxCheckSource(script.content, `index.html inline script ${script.index}`);
  console.log(`${err ? 'FAIL' : 'PASS'} index.html inline script ${script.index}`);
  if (err) { console.log(`  ${err.message}`); failed = true; }
}
if (failed) process.exit(1);
