const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ENTRY_HTML = 'index.html';
const GENERATOR_VERSION = '1.0.0';
const BASE_COMMIT = 'a2f1e81b61d0fde4fdabc41c597bf44910911c2f';
const CRITICAL_GLOBALS = [
  'startGame','startNewGame','startGameInitialization','gameLoop','startGameLoop','updateGame','renderGame','Enemy','EnemyManager','enemyManager','gameState','player','renderer'
];

function rel(p) { return path.relative(ROOT, p).split(path.sep).join('/'); }
function read(relPath) { return fs.readFileSync(path.join(ROOT, relPath), 'utf8'); }
function exists(relPath) { return fs.existsSync(path.join(ROOT, relPath)); }
function walk(dir = ROOT) {
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (name === '.git' || name === 'node_modules') continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(rel(full));
  }
  return out;
}
function jsFiles() { return walk().filter(f => f.endsWith('.js')).sort(); }
function parseScripts(html = read(ENTRY_HTML)) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m, index = 0;
  while ((m = re.exec(html))) {
    index++;
    const src = /\bsrc=["']([^"']+)["']/i.exec(m[1]);
    out.push(src ? { index, type:'external', src: src[1], localPath: normalizeLocal(src[1]) } : { index, type:'inline', content: m[2] });
  }
  return out;
}
function parseLinks(html = read(ENTRY_HTML)) {
  const out = [];
  const re = /<link\b([^>]*)>/gi;
  let m, index = 0;
  while ((m = re.exec(html))) {
    index++;
    const href = /\bhref=["']([^"']+)["']/i.exec(m[1]);
    if (href) out.push({ index, href: href[1], localPath: normalizeLocal(href[1]) });
  }
  return out;
}
function normalizeLocal(value) {
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('#')) return null;
  return value.split(/[?#]/)[0].replace(/^\//, '');
}
function loadedRepoJs() { return parseScripts().filter(s => s.type==='external' && s.localPath && exists(s.localPath) && s.localPath.endsWith('.js')).map(s => s.localPath); }
function externalScripts() { return parseScripts().filter(s => s.type==='external' && /^(https?:)?\/\//i.test(s.src)); }
function missingFirstPartyReferences() {
  const refs = [];
  for (const s of parseScripts()) if (s.type==='external' && s.localPath && !exists(s.localPath)) refs.push({ source:'index.html', reference:s.src, normalizedPath:s.localPath, kind:'script' });
  for (const l of parseLinks()) if (l.localPath && !exists(l.localPath)) refs.push({ source:'index.html', reference:l.href, normalizedPath:l.localPath, kind:'link' });
  for (const file of jsFiles()) {
    const text = read(file);
    const re = /["'](\/?(?:src|assets|lib)\/[^"']+\.(?:js|css|png|jpg|jpeg|gif|webp|mp3|wav|ogg|json))["']/g;
    let m;
    while ((m = re.exec(text))) {
      const localPath = normalizeLocal(m[1]);
      if (!m[1].includes('${') && localPath && !exists(localPath)) refs.push({ source:file, reference:m[1], normalizedPath:localPath, kind:'string-reference' });
    }
  }
  return refs.sort((a,b)=>(a.source+a.reference).localeCompare(b.source+b.reference));
}

function syntaxCheckSource(code, filename) {
  const tempDir = path.join(ROOT, '.tmp-syntax-check');
  fs.mkdirSync(tempDir, { recursive: true });
  const safeName = filename.replace(/[^A-Za-z0-9_.-]/g, '_') + '.js';
  const tempFile = path.join(tempDir, safeName);
  fs.writeFileSync(tempFile, code);
  try {
    execFileSync(process.execPath, ['--check', tempFile], { stdio: 'pipe' });
    return null;
  } catch (e) {
    const stderr = e.stderr ? String(e.stderr) : (e.message || String(e));
    const lineMatch = /:(\d+)\n/.exec(stderr);
    return { message: stderr.split('\n')[0] || 'syntax check failed', line: lineMatch ? Number(lineMatch[1]) : null };
  } finally {
    try { fs.unlinkSync(tempFile); } catch (_) {}
  }
}

function checkFileSyntax(file) { return syntaxCheckSource(read(file), file); }
function allSyntaxFailures() { return jsFiles().map(file => ({ file, error:checkFileSyntax(file), loaded: loadedRepoJs().includes(file) })).filter(x=>x.error); }
function externalAssets() {
  const files = ['index.html','sprites-manifest.json','audio-manifest.json', ...jsFiles()].filter(exists);
  const by = {};
  const re = /https?:\/\/[^\s"'<>`)]+/g;
  for (const file of files) {
    let m; const text = read(file);
    while ((m = re.exec(text))) {
      const url = m[0].replace(/[.,;]+$/,'');
      const host = url.replace(/^https?:\/\//,'').split('/')[0];
      by[host] ||= { host, sourceFiles: [], urls: [] };
      if (!by[host].sourceFiles.includes(file)) by[host].sourceFiles.push(file);
      if (!by[host].urls.includes(url)) by[host].urls.push(url);
    }
  }
  return Object.values(by).sort((a,b)=>a.host.localeCompare(b.host)).map(h=>({host:h.host, sourceFiles:h.sourceFiles.sort(), urls:h.urls.sort()}));
}
function globalAssignments() {
  const results = [];
  const re = /window\.([A-Za-z_$][\w$]*)\s*=\s*(?!=)/g;
  for (const file of jsFiles()) {
    const text = read(file); let m;
    while ((m = re.exec(text))) {
      if (!CRITICAL_GLOBALS.includes(m[1])) continue;
      const line = text.slice(0, m.index).split('\n').length;
      results.push({ global:`window.${m[1]}`, file, line, loaded: loadedRepoJs().includes(file) });
    }
  }
  return results.sort((a,b)=>(a.global+a.file+a.line).localeCompare(b.global+b.file+b.line));
}
function diagnosticCandidates() {
  return jsFiles().filter(f => /(^test-|^verify-|verification|legacy|backup|removed|patch|broadcast-jammer|rhythm-fixed|main\.js$|boot\.js|game-manager\.js$)/.test(path.basename(f)) || f.includes('main-legacy')).sort();
}
function generateInventory() {
  const loaded = loadedRepoJs();
  const scripts = parseScripts();
  const inlineSyntax = scripts.filter(s=>s.type==='inline').map(s=>({ index:s.index, status: syntaxCheckSource(s.content, `index.html inline script ${s.index}`) ? 'fail' : 'pass' }));
  const failures = allSyntaxFailures();
  return {
    repository:'6-Bit-01/BARCODE-SYSTEM-OVERRIDE', baseCommit:BASE_COMMIT, generationDate:'deterministic-pr001-baseline', generatorVersion:GENERATOR_VERSION, entryHtml:ENTRY_HTML,
    externalScriptOrder: scripts.map(s=>s.type==='external'?s.src:'[inline]'), loadedRepositoryJs:loaded,
    unloadedRepositoryJs: jsFiles().filter(f=>!loaded.includes(f)),
    loadedAndInlineSyntaxStatus:{ loadedFiles: loaded.map(file=>({file,status:checkFileSyntax(file)?'fail':'pass'})), inlineScripts:inlineSyntax },
    inactiveSyntaxFailures: failures.filter(f=>!f.loaded).map(f=>({file:f.file,message:f.error.message,line:f.error.line})),
    missingFirstPartyReferences: missingFirstPartyReferences(), externalHosts: externalAssets().map(({host,sourceFiles})=>({host,sourceFiles})),
    criticalGlobalAssignments: globalAssignments(), candidateDiagnosticLegacyFiles: diagnosticCandidates(),
    filesLoadedAtRuntime: parseLinks().map(l=>l.href).concat(scripts.map(s=>s.type==='external'?s.src:'[inline script]')),
    explicitlyUnverifiedRuntimeClaims:['Browser gameplay was not runtime-tested by Codex.','Makko project import/open was not tested by Codex.','Feature completion, controller support, boss flow, audio behavior, and full-game behavior are not verified by this baseline.']
  };
}
function stableStringify(value) { return JSON.stringify(value, null, 2) + '\n'; }
module.exports = { ROOT, ENTRY_HTML, BASE_COMMIT, loadedRepoJs, jsFiles, parseScripts, missingFirstPartyReferences, syntaxCheckSource, checkFileSyntax, allSyntaxFailures, externalAssets, globalAssignments, generateInventory, stableStringify };
