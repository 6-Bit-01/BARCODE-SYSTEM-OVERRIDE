// Small vector cutouts whose geometry fits the shared 38-unit street socket.
// The street, sidewalk, terrain and parapet still come from the world graph.
const fs=require('node:fs');
const path=require('node:path');
const out=path.resolve(__dirname,'../assets/cache-road/world/joins');
fs.mkdirSync(out,{recursive:true});
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n${body}\n</svg>\n`;
for(const side of ['L','R']) {
  const warm=side==='L'?'#d8ae78':'#d5bd86';
  const cold=side==='L'?'#62b1ad':'#74aa9d';
  const id=side.toLowerCase();
  const turn=svg(256,256,`  <defs>
    <linearGradient id="stone-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#52616c"/><stop offset=".4" stop-color="#718087"/><stop offset="1" stop-color="#344753"/></linearGradient>
  </defs>
  <!-- Only the two sidewalk corners have alpha. The center stays open. -->
  <path d="M0 0H39Q51 0 52 15Q54 24 49 33L43 244Q42 256 32 256H0Z M217 0H256V256H224Q214 256 213 244L207 33Q202 24 204 15Q205 0 217 0Z" fill="url(#stone-${id})"/>
  <path d="M8 0L6 256M25 0L24 256M232 0L231 256M248 0L247 256" stroke="#243a45" stroke-width="2" opacity=".45"/>
  <path d="M0 57L47 57M0 125L45 125M0 198L44 198M211 57L256 57M212 125L256 125M213 198L256 198" stroke="#1a323d" stroke-width="4" opacity=".7"/>
  <path d="M0 61L47 61M0 129L45 129M0 202L44 202M211 61L256 61M212 129L256 129M213 202L256 202" stroke="#9aadaa" stroke-width="2" opacity=".4"/>
  <path d="M14 31q12-8 22-4M9 169q8-4 22-2M220 95q10-5 24-2M221 228q11-6 23-3" fill="none" stroke="${cold}" stroke-width="3" opacity=".17"/>
  <path d="M48 33Q42 83 42 244M208 33Q214 83 214 244" fill="none" stroke="#aabbb6" stroke-width="2" opacity=".58"/>`);
  const curb=svg(256,256,`  <defs>
    <linearGradient id="curb-${id}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#132731"/><stop offset=".48" stop-color="#5d7175"/><stop offset="1" stop-color="#203540"/></linearGradient>
  </defs>
  <!-- Two bevels bend around the near and far junction corners. -->
  <path d="M46 15Q52 27 48 39L44 221Q43 236 36 252L49 256Q58 240 59 222L61 46Q65 28 59 16Z M210 15Q204 27 208 39L212 221Q213 236 220 252L207 256Q198 240 197 222L195 46Q191 28 197 16Z" fill="url(#curb-${id})" opacity=".96"/>
  <path d="M51 23Q55 36 53 53L50 222Q49 238 44 248M205 23Q201 36 203 53L206 222Q207 238 212 248" fill="none" stroke="#aebcb6" stroke-width="3" opacity=".78"/>
  <path d="M56 50L53 86M53 122L51 145M50 182L48 209M200 50L203 86M203 122L205 145M206 182L208 209" fill="none" stroke="${warm}" stroke-width="3" opacity=".7"/>
  <path d="M60 94l7 3m-9 69 8-3m-7 61 7-2M196 94l-7 3m9 69-8-3m7 61-7-2" stroke="${cold}" stroke-width="2" opacity=".55"/>`);
  const wall=svg(80,160,`  <defs>
    <linearGradient id="wall-${id}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#0b1b27"/><stop offset=".32" stop-color="#304656"/><stop offset=".71" stop-color="#1c3543"/><stop offset="1" stop-color="#102633"/></linearGradient>
  </defs>
  <path d="M8 18L57 7L75 19L74 135L61 156L10 153L5 136Z" fill="#101f2d" stroke="#465e6b" stroke-width="3"/>
  <path d="M8 18L57 7L75 19L27 31Z" fill="#526674"/>
  <path d="M27 31L75 19L74 135L61 156L24 148Z" fill="url(#wall-${id})"/>
  <path d="M8 18L27 31L24 148L10 153Z" fill="#152734"/>
  <path d="M31 36L68 26M30 48L67 38M29 60L67 50M27 137L62 145" stroke="#9eafb0" stroke-width="2" opacity=".42"/>
  <path d="M44 61L56 58L55 114L41 117Z" fill="${warm}" opacity=".26"/>
  <path d="M43 66L51 64L50 102L42 103Z" fill="${cold}" opacity=".35"/>
  <path d="M12 52v65M17 45v85M61 42v60" stroke="#061824" stroke-width="4" opacity=".62"/>
  <path d="M38 30v7m26-14v8M11 135l12-5m29 9 16-7" stroke="#cbbf9f" stroke-width="3" opacity=".54"/>`);
  const cap=svg(96,192,`  <defs>
    <linearGradient id="cap-${id}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#12252d"/><stop offset=".36" stop-color="#596b67"/><stop offset=".7" stop-color="#263940"/><stop offset="1" stop-color="#0a1d2a"/></linearGradient>
  </defs>
  <!-- A weathered service-column return on the painted facade edge. -->
  <path d="M17 31L57 17L82 30L83 166L63 188L19 181Z" fill="url(#cap-${id})" stroke="#0b1822" stroke-width="5"/>
  <path d="M17 31L57 17L82 30L42 45Z" fill="#a18060" stroke="#39484d" stroke-width="3"/>
  <path d="M19 36L42 45L42 176L20 180Z" fill="#273942"/>
  <path d="M42 45L82 30L83 166L63 188L42 176Z" fill="#1b313a" opacity=".58"/>
  <path d="M29 3L63 0L73 20L58 26L23 24Z" fill="#263e45" stroke="#0e222a" stroke-width="3"/>
  <path d="M27 14L66 10M22 50L39 55M22 124L40 127M46 52L78 40M46 169L78 155" stroke="#a5b6ae" stroke-width="2" opacity=".46"/>
  <path d="M53 43v104M63 41v109" stroke="#081c26" stroke-width="6"/>
  <path d="M57 53v56" stroke="${cold}" stroke-width="4" opacity=".84"/>
  <path d="M28 75v31M70 67v20" stroke="${warm}" stroke-width="4" opacity=".87"/>
  <path d="M11 173L58 185L75 175L89 179L69 190L23 190Z" fill="#162934"/>`);
  for(const [name,source] of Object.entries({
    'sidewalk-turn':turn,'curb-return':curb,
    'street-mouth-sidewall':wall,'wall-roof-endcap':cap
  }))fs.writeFileSync(path.join(out,`${name}-${side}.svg`),source);
}
