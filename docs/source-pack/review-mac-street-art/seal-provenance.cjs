/* Reads image headers and hashes only. Does not alter image pixels. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const source = path.resolve(__dirname, '../../..');
const manifestPath = path.join(__dirname, 'generation-provenance.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const relocated = new Map([
  ['assets/mac-street-review/mac-poses-v1.png', 'docs/source-pack/review-mac-street-art/candidates/mac-poses-v1.png'],
  ['assets/mac-street-review/mac-poses-v2.png', 'docs/source-pack/review-mac-street-art/candidates/mac-poses-v2.png'],
  ['assets/mac-street-review/cache-walk-to-car-v3.png', 'docs/source-pack/review-mac-street-art/candidates/cache-walk-to-car-v3.png'],
]);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function imageDimensions(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), format: 'PNG', bitDepth: bytes[24], colorType: bytes[25]};
  }
  if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset < bytes.length) {
      if (bytes[offset++] !== 255) continue;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = bytes.readUInt16BE(offset);
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return {width: bytes.readUInt16BE(offset+5), height: bytes.readUInt16BE(offset+3), format: 'JPEG'};
      }
      offset += length;
    }
  }
  if (bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') {
    const kind = bytes.toString('ascii',12,16);
    if (kind === 'VP8X') return {width: bytes.readUIntLE(24,3)+1, height: bytes.readUIntLE(27,3)+1, format: 'WebP'};
    if (kind === 'VP8 ') return {width: bytes.readUInt16LE(26)&0x3fff, height: bytes.readUInt16LE(28)&0x3fff, format: 'WebP'};
    if (kind === 'VP8L') {
      const packed = bytes.readUInt32LE(21);
      return {width: (packed&0x3fff)+1, height: ((packed>>>14)&0x3fff)+1, format: 'WebP'};
    }
  }
  throw new Error('Unrecognized image header');
}
function inspect(relativeOrAbsolute, image = true) {
  const absolute = path.isAbsolute(relativeOrAbsolute) ? relativeOrAbsolute : path.join(source, relativeOrAbsolute);
  const bytes = fs.readFileSync(absolute);
  return {sha256: sha(bytes), bytes: bytes.length, ...(image ? {dimensions: imageDimensions(bytes)} : {})};
}
let referenceCount = 0;
for (const asset of manifest.assets) {
  const newPath = relocated.get(asset.path);
  if (newPath) {
    asset.originalProjectPathAtGeneration = asset.path;
    asset.path = newPath;
    asset.relocation = 'Moved unchanged out of runtime assets after rejection or supersession; original generated PNG remains preserved.';
  }
  const result = inspect(asset.path);
  const original = inspect(asset.originalGeneratedPath);
  assert.equal(result.sha256, original.sha256, `${asset.id}: project copy differs from generated original`);
  Object.assign(asset, result);
  asset.originalGeneratedSha256 = original.sha256;
  asset.originalGeneratedBytes = original.bytes;
  asset.originalCopyVerified = true;
  assert.equal(asset.prompt, asset.toolArguments.prompt, `${asset.id}: prompt differs`);
  for (let index = 0; index < asset.references.length; index++) {
    const ref = asset.references[index];
    const currentPath = relocated.get(ref.path);
    if (currentPath) { ref.originalPathAtGeneration = ref.path; ref.path = currentPath; }
    const actual = inspect(ref.path);
    Object.assign(ref, actual);
    const historical = asset.toolArguments.referenced_image_paths[index].replaceAll('\\','/');
    const expected = path.join(source, ref.originalPathAtGeneration || ref.path).replaceAll('\\','/');
    assert.equal(historical.toLowerCase(), expected.toLowerCase(), `${asset.id}: reference order/path changed`);
    referenceCount++;
  }
}
manifest.rendererMetadataSha256 = inspect(manifest.rendererMetadata, false).sha256;
const metadataRuntimePath = 'assets/mac-street-review/mac-poses-v3-frames.json';
assert.equal(inspect(metadataRuntimePath, false).sha256, manifest.rendererMetadataSha256, 'Runtime metadata differs');
const reusedHeroPath = 'assets/mac-street-review/mac-hero-v2.png';
const reusedHeroSource = 'docs/source-pack/review-level3-story/mac-hero-concept-v2.png';
const hero = inspect(reusedHeroPath);
assert.equal(hero.sha256, inspect(reusedHeroSource).sha256, 'Reused approved Mac hero differs');
manifest.reusedApprovedArt = [{path: reusedHeroPath, source: reusedHeroSource, ...hero, status: 'Existing Mac hero v2; owner approval relayed by root. No new generation or alteration.'}];
manifest.runtimeAssetInventory = fs.readdirSync(path.join(source, 'assets/mac-street-review')).sort();
manifest.runtimeInventoryContainsRejectedCandidates = false;
for (const oldPath of relocated.keys()) assert.equal(fs.existsSync(path.join(source,oldPath)), false, `${oldPath} still in runtime`);
manifest.sealedAtUtc = new Date().toISOString();
manifest.verification = {
  generatedImages: manifest.assets.length,
  exactGeneratedCopyHashesMatch: true,
  referenceHashRecords: referenceCount,
  toolArgumentsPreserved: true,
  pixelsModified: false,
  rendererMetadataCopyMatches: true,
  rejectedCandidatesOnlyUnderDocumentation: true,
  scope: 'Asset and provenance validation only; runtime registration, performance and owner acceptance are separate root-owned checks.'
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2)+'\n');
const finalHash = inspect(manifestPath,false).sha256;
console.log(JSON.stringify({manifestPath, sha256:finalHash, assetCount:manifest.assets.length, referenceCount, runtimeInventory:manifest.runtimeAssetInventory, assets:manifest.assets.map(({id,path,sha256,bytes,dimensions})=>({id,path,sha256,bytes,dimensions}))},null,2));
