// World-addressed roadside layout for the playable Cache Road camera. The
// Six fitted districts share one terrain, street graph, and parcel contract.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/cache-road-landscape.js', exports: ['BARCODE.CacheRoadLandscape'], dependencies: [] });
(function(B) {
  'use strict';
  const ART = Object.freeze({
    '-1': Object.freeze({
      rear: ['cacheWorkshopLRear',1774,887,1700,430,250,887,773,{footU:.86}],
      middle: ['cacheWorkshopLMiddle',1774,887,1800,250,200,887,686,{footU:.77}],
      open: ['cacheWorkshopLFrontGap',1902,827,1850,250,190,827,540,
        {footU:.68,socketU:.70}],
      closed: ['cacheWorkshopLFrontFill',1902,827,1850,250,190,827,627,{footU:.86}]
    }),
    '1': Object.freeze({
      rear: ['cacheWorkshopRRear',1774,887,1700,430,250,887,693,{footU:.14}],
      middle: ['cacheWorkshopRMiddle',1902,827,1800,250,200,827,729,{footU:.23}],
      open: ['cacheWorkshopRFrontGap',1899,828,1850,250,190,828,663,
        {footU:.38,socketU:.28}],
      closed: ['cacheWorkshopRFrontFill',1899,828,1850,250,190,828,560,{footU:.14}]
    })
  });
  // Market source contacts and road-facing alpha sockets are fitted to the
  // production painter. See CACHE_ROAD_MARKET_FIRST_FAMILY.md for the gate.
  const MARKET_ART = Object.freeze({
    '-1': Object.freeze({
      rear: ['cacheMarketLRear',1942,809,1700,430,250,809,571,
        {footU:.86}],
      middle: ['cacheMarketLMiddle',1944,809,1800,250,200,809,633,
        {footU:.77}],
      // The art ends at u=.72; project that edge onto the actual street
      // socket instead of centering its transparent quarter over the road.
      open: ['cacheMarketLFrontGap',1944,809,1850,250,190,809,615,
        {footU:.68,socketU:.72}],
      closed: ['cacheMarketLFrontFill',1944,809,1850,250,190,809,655,
        {footU:.86}],
      middleDense: ['cacheMarketLFrontFill',1944,809,1850,250,190,809,655,
        {footU:.86}]
    }),
    '1': Object.freeze({
      rear: ['cacheMarketRRear',1942,809,1700,430,250,809,586,
        {footU:.14}],
      middle: ['cacheMarketRMiddle',1945,809,1800,250,200,809,673,
        {footU:.23}],
      open: ['cacheMarketRFrontGap',1942,809,1850,250,190,809,559,
        {footU:.32,socketU:.28}],
      closed: ['cacheMarketRFrontFill',1942,809,1850,250,190,809,570,
        {footU:.14}],
      middleDense: ['cacheMarketRFrontFill',1942,809,1850,250,190,809,570,
        {footU:.14}]
    })
  });
  // The first warm residential run is fitted to the same 225/180 coverage,
  // 38-unit graph mouth and terrain contact as the market. The facing and
  // source foot coordinates are independent on the two banks.
  const HOMES_ART = Object.freeze({
    '-1': Object.freeze({
      rear: ['cacheHomesLRear',1942,809,1700,430,250,809,612,
        {footU:.86}],
      middle: ['cacheHomesLMiddle',1944,809,1800,250,200,809,647,
        {footU:.77}],
      open: ['cacheHomesLFrontGap',1944,809,1850,250,190,809,675,
        {footU:.68,socketU:.70}],
      closed: ['cacheHomesLFrontFill',1944,809,1850,250,190,809,695,
        {footU:.86}],
      middleDense: ['cacheHomesLFrontFill',1944,809,1850,250,190,809,695,
        {footU:.86}]
    }),
    '1': Object.freeze({
      rear: ['cacheHomesRRear',1944,809,1700,430,250,809,579,
        {footU:.14}],
      middle: ['cacheHomesRMiddle',1942,809,1800,250,200,809,632,
        {footU:.23}],
      open: ['cacheHomesRFrontGap',1944,809,1850,250,190,809,617,
        {footU:.32,socketU:.28}],
      closed: ['cacheHomesRFrontFill',1942,809,1850,250,190,809,662,
        {footU:.14}],
      middleDense: ['cacheHomesRFrontFill',1942,809,1850,250,190,809,662,
        {footU:.14}]
    })
  });
  // Each contact is the measured lower alpha at its roadward foot. The
  // outer foundation extends farther down and is buried by a nearer strip.
  const GREENHOUSE_ART = Object.freeze({
    '-1': Object.freeze({
      rear: ['cacheGreenhouseLRear',1942,809,1700,430,250,809,582,{footU:.86}],
      middle: ['cacheGreenhouseLMiddle',1942,809,1800,250,200,809,744,{footU:.77}],
      open: ['cacheGreenhouseLFrontGap',1942,809,1850,250,190,809,703,
        {footU:.68,socketU:.70}],
      closed: ['cacheGreenhouseLFrontFill',1942,809,1850,250,190,809,702,{footU:.86}]
    }),
    '1': Object.freeze({
      rear: ['cacheGreenhouseRRear',1942,809,1700,430,250,809,515,{footU:.14}],
      middle: ['cacheGreenhouseRMiddle',1942,809,1800,250,200,809,694,{footU:.23}],
      open: ['cacheGreenhouseRFrontGap',1942,809,1850,250,190,809,668,
        {footU:.32,socketU:.28}],
      closed: ['cacheGreenhouseRFrontFill',1942,809,1850,250,190,809,666,{footU:.14}]
    })
  });
  const DATA_ART = Object.freeze({
    '-1': Object.freeze({
      rear: ['cacheDataLRear',1942,809,1700,430,250,809,633,{footU:.86}],
      middle: ['cacheDataLMiddle',1942,809,1800,250,200,809,557,{footU:.77}],
      open: ['cacheDataLFrontGap',1942,809,1850,250,190,809,627,
        {footU:.68,socketU:.71}],
      closed: ['cacheDataLFrontFill',1945,808,1850,250,190,808,603,{footU:.86}]
    }),
    '1': Object.freeze({
      rear: ['cacheDataRRear',1944,809,1700,430,250,809,531,{footU:.14}],
      middle: ['cacheDataRMiddle',1942,809,1800,250,200,809,673,{footU:.23}],
      open: ['cacheDataRFrontGap',1942,809,1850,250,190,809,699,
        {footU:.32,socketU:.28}],
      closed: ['cacheDataRFrontFill',1942,809,1850,250,190,809,591,{footU:.14}]
    })
  });
  const TRANSIT_ART = Object.freeze({
    '-1': Object.freeze({
      rear: ['cacheTransitLRear',1942,809,1700,430,250,809,699,{footU:.86}],
      middle: ['cacheTransitLMiddle',1942,809,1800,250,200,809,591,{footU:.77}],
      open: ['cacheTransitLFrontGap',1944,809,1850,250,190,809,691,
        {footU:.68,socketU:.70}],
      closed: ['cacheTransitLFrontFill',1942,809,1850,250,190,809,660,{footU:.86}]
    }),
    '1': Object.freeze({
      rear: ['cacheTransitRRear',1942,809,1700,430,250,809,412,{footU:.14}],
      middle: ['cacheTransitRMiddle',1942,809,1800,250,200,809,663,{footU:.23}],
      open: ['cacheTransitRFrontGap',1942,809,1850,250,190,809,707,
        {footU:.32,socketU:.28}],
      closed: ['cacheTransitRFrontFill',1942,809,1850,250,190,809,689,{footU:.14}]
    })
  });
  const FAMILIES=Object.freeze(['market','homes','workshop','greenhouse','data','transit']);
  const FAMILY_ART=Object.freeze({market:MARKET_ART,homes:HOMES_ART,
    workshop:ART,greenhouse:GREENHOUSE_ART,data:DATA_ART,transit:TRANSIT_ART});
  const ACCENT_ART=Object.freeze([
    ['cacheTransitNook',1602,982,1650,260,210,982],
    ['cacheOutskirtsHomes',2022,778,1750,260,210,778],
    ['cacheUtilityCorner',1585,992,1650,260,210,992],
    ['cacheGreenhouseWorkshop',1536,1024,1650,260,210,1024],
    ['cacheOutskirtsWorkshops',2022,778,1750,260,210,778],
    ['cacheRepairShop',1389,1132,1650,260,210,1132]
  ]);
  const random = n => {
    let x = Math.imul(n ^ n >>> 16,0x7feb352d);
    x = Math.imul(x ^ x >>> 15,0x846ca68b);
    return ((x ^ x >>> 16) >>> 0)/4294967296;
  };
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const smooth=n=>{const t=clamp(n,0,1);return t*t*(3-2*t);};
  const PITCH=180,SPAN=225;
  // In world coordinates the roadward edge is radial 220. Every material,
  // street vertex, parcel foot and card contact samples this same height.
  // The lateral term lets a rise roll around a block instead of lifting an
  // entire flat row together. The arterial sidewalk remains at height 24.
  function height(seed,side,at,radial) {
    const outward=smooth((radial-220)/950);
    const broad=12*Math.sin(at/240+side*.8+seed*.00013);
    const local=7*Math.sin(at/97+radial/355+side*1.3+seed*.00031);
    const cross=6*Math.sin(at/175-radial/270+side*.4);
    return 24+outward*(16+broad+local+cross);
  }
  function create(seed=0x6b4d,end=9840,protectedSites=[]) {
    if(!Number.isSafeInteger(seed)||!Number.isFinite(end)||end<0)
      throw Error('Invalid Cache Road landscape seed or length');
    const chunks=[],plates=[],streets=[],parcels=[];
    const familyOffset=seed===0x6b4d?0:
      Math.floor(random(seed+0x1357)*FAMILIES.length);
    const graph={nodes:[],edges:[]};
    const node=(side,at,radial,type)=>{
      const id=graph.nodes.length;
      graph.nodes.push({id,side,at,radial,type});return id;
    };
    const edge=(a,b,kind)=>graph.edges.push({a,b,kind});
    for(const side of [-1,1]) {
      const phase=side<0?110:166;
      const sites=protectedSites.filter(s=>s.side===side)
        .sort((a,b)=>a.at-b.at);
      const mouths=[];
      if(sites.length>1) {
        let previous=-Infinity;
        for(let j=1;j<sites.length;j++) {
          const gap=sites[j].at-sites[j-1].at;
          const at=Math.round((sites[j].at+sites[j-1].at)/2);
          if(gap>=280&&at-previous>=410 &&
            random(seed+j*179+(side<0?61:139))>.13) {
            mouths.push(at);previous=at;
          }
        }
      }
      // The featured sites are sparse. Streets also occupy the open blocks
      // between them, provided a full frontage and site clearance remain.
      for(let at=phase+PITCH+42;at<end+400;at+=PITCH*3) {
        const address=at+(side<0?0:90);
        if(sites.some(site=>Math.abs(site.at-address)<190+(site.size||1)*18) ||
          mouths.some(mouth=>Math.abs(mouth-address)<430) ||
          random(seed+at*13+side*431)<.17)continue;
        mouths.push(address);
      }
      let previousOuter=null,previousArterial=null;
      for(let i=0,startAt=phase-PITCH;startAt<end+580;i++,startAt+=PITCH) {
        const endAt=startAt+SPAN;
        const centerAt=startAt+42;
        const chosenMouth=mouths.find(at=>Math.abs(at-centerAt)<=90);
        const frontAt=chosenMouth??centerAt;
        const route=(seed+i*7+(side<0?0:2))%3;
        const offsets=[[65,135,230,310],[45,105,65,215],
          [75,150,225,190]][route];
        const courtAt=frontAt+offsets[1];
        const middleAt=startAt+119,rearAt=startAt+193;
        const site=protectedSites.find(s=>s.side===side &&
          Math.abs(s.at-frontAt)<105+(s.size||1)*18);
        // The side phases and this choice keep openings from becoming a
        // paired gate. Sites reserve their full near frontage first.
        const open=chosenMouth!==undefined&&!site&&!protectedSites.some(s=>
          s.side===side&&Math.abs(s.at-frontAt)<150);
        // Coherent runs, never a one-card checkerboard. Each bank cycles all
        // six families; seed and side stagger the boundaries independently.
        const run=Math.floor((i+1)/10);
        const family=FAMILIES[(run+familyOffset)%FAMILIES.length];
        const chunk={id:`${side}:${i}`,side,startAt,endAt,span:SPAN,
          pitch:PITCH,frontAt,middleAt,rearAt,open,
          seed:(seed^Math.imul(i+17,side<0?0x5bd1e995:0x27d4eb2d))>>>0,
          family};
        const familyArt=FAMILY_ART[family][String(side)];
        const accent=!open&&i%5===2&&
          !protectedSites.some(s=>s.side===side&&
            Math.abs(s.at-middleAt)<110);
        chunk.accentIndex=open||accent ?
          (Math.floor(i/5)+(side>0?3:0)+seed%6)%ACCENT_ART.length : null;
        chunks.push(chunk);
        if(!site) {
          const key=open?'open':'closed';
          const art=familyArt[key];
          plates.push({at:frontAt,side,chunkId:chunk.id,family:chunk.family,
            tier:'front',key,art,span:SPAN,radialBand:art[4],
            contact:[{at:frontAt-75,radial:270},{at:frontAt+75,radial:270}],
            socket:open?{at:frontAt,radial:250,halfWidth:19}:null});
          parcels.push({id:`${chunk.id}:front`,chunkId:chunk.id,side,
            tier:'front',startAt,endAt,radial:[255,435],
            entrance:{at:frontAt,radial:255},access:'arterial-sidewalk'});
        }
        // Leave the art behind a real street corridor. Until middle/rear
        // gap variants are painted, placing a closed facade here would
        // punch a lane through it.
        if(!open) {
          for(const [tier,at] of [['middle',middleAt],['rear',rearAt]]) {
            const isAccent=tier==='middle'&&chunk.accentIndex!==null;
            const art=isAccent?ACCENT_ART[chunk.accentIndex]:familyArt[tier];
            plates.push({at,side,chunkId:chunk.id,family:chunk.family,tier,
              key:isAccent?'accent':tier,art,span:SPAN,
              radialBand:art[4],flip:isAccent&&side>0,
              contact:[{at:at-75,radial:art[4]},{at:at+75,radial:art[4]}],
              socket:null});
            parcels.push({id:`${chunk.id}:${tier}`,chunkId:chunk.id,side,
              tier,startAt,endAt,radial:[art[4],art[4]+170],
              entrance:{at,radial:art[4]},access:'sidewalk-path'});
          }
        } else {
          // An occupied court beyond the turn gives the visible local street
          // a destination without painting a closed facade through it.
          const donor=ACCENT_ART[chunk.accentIndex];
          const art=[donor[0],donor[1],donor[2],1550,700,230,donor[6]];
          const at=courtAt+40;
          plates.push({at,side,chunkId:chunk.id,family:chunk.family,
            tier:'rear',key:'accent',art,span:SPAN,radialBand:700,
            flip:side>0,
            contact:[{at:at-60,radial:700},{at:at+60,radial:700}],
            socket:null});
          parcels.push({id:`${chunk.id}:court`,chunkId:chunk.id,side,
            tier:'rear',startAt:courtAt-65,endAt:courtAt+75,
            radial:[650,870],entrance:{at:courtAt,radial:615},
            access:'local-street'});
        }
        const arterial=node(side,frontAt,220,'arterial-sidewalk');
        if(previousArterial!==null)
          edge(previousArterial,arterial,'arterial-sidewalk');
        previousArterial=arterial;
        const foot=node(side,middleAt,500,'walkway-junction');
        edge(arterial,foot,'sidewalk-path');
        // Every recorded parcel has an entrance node and a route to a
        // sidewalk or a loading court. Art selection never creates roads.
        const owned=parcels.filter(parcel=>parcel.chunkId===chunk.id);
        if(open) {
          const corner=node(side,frontAt+offsets[0],395,'street-corner');
          const court=node(side,courtAt,615,'loading-court');
          const turn=node(side,frontAt+offsets[2],690,'local-turn');
          const outer=node(side,frontAt+offsets[3],1020,'outer-junction');
          edge(arterial,corner,'local-street');
          edge(corner,court,'local-street');
          // The court is the painted destination. The outer connection is
          // a walkable offscreen network until sided corner art exists.
          edge(court,turn,'sidewalk-path');
          edge(turn,outer,'sidewalk-path');
          edge(corner,foot,'sidewalk-path');
          for(const parcel of owned) {
            const entrance=node(side,parcel.entrance.at,
              parcel.entrance.radial,'parcel-entrance');
            edge(entrance,parcel.access==='local-street'?court:arterial,
              'parcel-access');
            parcel.entrance.node=entrance;
          }
          if(previousOuter!==null)edge(previousOuter,outer,'outer-link');
          previousOuter=outer;
          const nodes=[graph.nodes[arterial],graph.nodes[corner],
            graph.nodes[court],graph.nodes[turn],graph.nodes[outer]];
          streets.push({side,at:frontAt,family:chunk.family,halfWidth:19,nodes,
            edges:[[0,1],[1,2]],end:'loading-court',
            chunkId:chunk.id});
        } else for(const parcel of owned) {
          const entrance=node(side,parcel.entrance.at,
            parcel.entrance.radial,'parcel-entrance');
          edge(entrance,parcel.access==='arterial-sidewalk'?arterial:foot,
            'parcel-access');
          parcel.entrance.node=entrance;
        }
      }
    }
    const streetParts=[];
    for(const street of streets)for(const [edgeIndex,[ai,bi]] of street.edges.entries()) {
      const a=street.nodes[ai],b=street.nodes[bi];
      const count=Math.max(1,Math.ceil(Math.abs(b.at-a.at)/24));
      for(let j=0;j<count;j++) {
        const point=f=>({at:a.at+(b.at-a.at)*f,
          radial:a.radial+(b.radial-a.radial)*f});
        const near=point(j/count),far=point((j+1)/count);
        streetParts.push({side:street.side,streetAt:street.at,
          family:street.family,
          halfWidth:street.halfWidth,at:(near.at+far.at)/2,
          a:near,b:far,edgeIndex,segment:j,segments:count});
      }
    }
    streetParts.sort((a,b)=>b.at-a.at);
    // The workshop pavement belongs to connected courts, not a giant
    // repeating blanket. The established rolling grit fills the bank.
    const districts=[];
    plates.sort((a,b)=>b.at-a.at);
    streets.sort((a,b)=>b.at-a.at);
    return Object.freeze({seed,chunks,plates,streets,streetParts,districts,
      parcels,graph,pitch:PITCH,span:SPAN,
      height:(side,at,radial)=>height(seed,side,at,radial),
      owns(side,at,margin=0) {
        return chunks.some(chunk=>chunk.side===side &&
          at>=chunk.startAt-margin&&at<chunk.endAt+margin);
      }});
  }
  B.CacheRoadLandscape=Object.freeze({create,ART,FAMILY_ART,FAMILIES});
})(window.BARCODE=window.BARCODE||{});
