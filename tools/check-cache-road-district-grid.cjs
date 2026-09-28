// Structural checks for the review-only two-dimensional district generator.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync('src/game/cache-road-districts.js','utf8'),context);
const generator=context.window.BARCODE.CacheRoadDistricts;
const extent=1800;
let parcels=0,junctions=0;

for(let seed=0;seed<64;seed++) {
  const district=generator.create(seed,extent,'grid');
  if(seed===17||seed===53)
    assert.equal(JSON.stringify(district),
      JSON.stringify(generator.create(seed,extent,'grid')));
  for(const side of [-1,1]) {
    const edges=district.edges.filter(edge=>edge.side===side);
    const vertices=district.vertices.filter(vertex=>vertex.side===side);
    const visited=new Set([edges[0].from]),pending=[edges[0].from];
    while(pending.length) {
      const vertex=district.vertices[pending.shift()];
      for(const id of vertex.edges) {
        const edge=district.edges[id];
        const other=edge.from===vertex.id?edge.to:edge.from;
        if(!visited.has(other)) {visited.add(other);pending.push(other)}
      }
    }
    assert.equal(visited.size,vertices.length,
      `Disconnected bank at seed ${seed}, side ${side}`);
    assert(edges.some(edge=>edge.kind==='cross'));
    assert(edges.some(edge=>edge.kind==='loop'));
    junctions+=vertices.filter(vertex=>vertex.edges.length>=3).length;
    for(const edge of edges)
      assert.equal(edge.busRoute,side<0&&edge.kind==='service');
  }
  for(const node of district.nodes) {
    parcels++;
    assert(node.lot.end-node.lot.start>=50,
      `Cramped parcel at seed ${seed}, ${node.at}`);
    assert.equal(new Set(node.group.map(person=>person.id)).size,
      node.group.length,`Repeated walker at seed ${seed}, ${node.at}`);
  }
  // Reserve the full ribbon width plus a small curb margin, then sample
  // the actual graph against the chosen asset lots. This catches an edge
  // cutting through a building's ground, not just a centerline crossing.
  for(const edge of district.edges) {
    const margin=edge.width/2+8;
    for(let k=0;k<edge.points.length-1;k++) {
      const start=edge.points[k],end=edge.points[k+1];
      const steps=Math.ceil(Math.hypot(end.at-start.at,
        end.radial-start.radial)/12);
      for(let step=0;step<=steps;step++) {
        const t=step/steps,at=start.at+(end.at-start.at)*t;
        const radial=start.radial+(end.radial-start.radial)*t;
        for(const node of district.nodes) {
          if(node.side!==edge.side||at<=node.lot.start-margin||
              at>=node.lot.end+margin)continue;
          const offset=generator.spine(seed,edge.side,at)-node.radial;
          assert(radial<=node.lot.inner+offset-margin||
            radial>=node.lot.outer+offset+margin,
          `Road ${edge.kind} intersects lot at seed ${seed}, ${node.at}`);
        }
      }
    }
  }
}
assert(junctions>0&&parcels>0);
console.log(`64 seeds: ${parcels} asset lots clear of roads; `+
  `${junctions} routed junctions; both banks connected.`);
