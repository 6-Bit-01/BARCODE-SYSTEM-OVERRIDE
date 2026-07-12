const { jsFiles, loadedRepoJs, checkFileSyntax } = require('./baseline-common');
const mode = process.argv.includes('--check') ? 'check' : 'audit';
const loaded = new Set(loadedRepoJs());
let failures = 0;
console.log(`Auditing syntax for all repository JavaScript (${mode} mode)...`);
for (const file of jsFiles()) {
  const err = checkFileSyntax(file);
  if (err) { failures++; console.log(`FAIL ${loaded.has(file) ? 'loaded' : 'inactive'} ${file}: ${err.message}`); }
}
console.log(`Syntax failures: ${failures}`);
if (mode === 'check' && failures) process.exit(1);
