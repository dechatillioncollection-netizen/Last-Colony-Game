// v41: the same seeded walled colony with Petal Gates and a Maw Gate in its lines, ants of all three kinds walking out and back through
// the gates, and two powered Healing Pods, run in the v40 build and this build, drawn every other step with painted art on (so the new
// gate and pod drawing runs alongside the simulation, including gateOpen, which keeps the saved b.op), through a wave that hurts and
// breaks walls and gates while the pods mend them, and a save. Then the same with painted art off, in this build and in v40. All
// saves must be byte-identical. The test seeds Math.random for the simulation; drawing gets its own unseeded generator, so how many
// random numbers a look happens to use (the older looks use a few for sparkles) cannot shift the simulation's numbers.
const {chromium}=require(process.env.PW||'playwright');
const OLD=process.env.OLD||'lc2_v40_index.html',NEW=process.env.NEW||'lc2_index.html';
const run=async(br,file,q,art)=>{const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(([q,art])=>{try{localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');if(art==='off')localStorage.setItem('lc_art','0');}catch(e){}},[q,art]);
 await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(800);
 const r=await p.evaluate(async()=>{const NR=Math.random,R0=render;let s=13;const SR=()=>(s=(s*16807)%2147483647)/2147483647;Math.random=SR;rnd=Math.random;
  const draw=()=>{Math.random=NR;try{R0();}finally{Math.random=SR;}};
  startGame('survival');let G=window.__game();G.items=G.items.map(v=>v+5000);G.countdown=1e9;G.webFree=true;
  const X=G.core.x+7,Y=G.core.y-8;
  for(let y=Y-1;y<Y+16;y++)for(let x=X-1;x<X+26;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
  const put=(t,x,y,r)=>tryPlace(t,X+x,Y+y,r||0,true);let ok=0;const Q=(...a)=>{if(put(...a))ok++;};
  // a wall line facing the spawn with two Petal Gates and a Maw Gate, a side line running up and down with a Petal Gate in it,
  // Great Bark and Ironbark, and two Healing Pods on Sunleaves behind
  for(let k=0;k<14;k++)Q(k===3||k===10?'door':k%4===1?'twall':'wall',2+k,1);Q('doorL',16,0);Q('wallL',18,0);for(let k=0;k<4;k++)Q('twall',20+k,1);
  for(let k=0;k<6;k++)Q(k===3?'door':'wall',1,2+k);
  Q('mender',8,6);Q('mender',17,6);for(let k=0;k<6;k++)Q('solar',10+k,8);
  for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();
  // a swarm of each kind, sent out through the gates and back
  const U0=[];for(let k=0;k<4;k++){U0.push(spawnUnit(['mite','tank','htank','mite'][k],X+5+k*3,Y+4.5));}
  cam.z=1.2;centerOn(X+10,Y+5);
  let drops=0,heals=0,seen=new Set();const frames=n=>{for(let k=0;k<n;k++){const hp=new Map();for(const b of G.blocks.values())hp.set(b,b.hp);step(1/30);
    for(const [b,h] of hp){if(b.hp<h-.01)drops++;}for(const f of G.fx)if(f.k==='heal'&&!seen.has(f)){seen.add(f);heals++;}if(k%2===0)draw();}};
  sendAnts(U0,X+12,Y-4);frames(30*12);sendAnts(U0,X+10,Y+5);frames(30*12);
  // a wave reaches the colony: walls and gates are hurt, the pods mend them, ants fight through the gates
  G.countdown=2;for(let k=0;k<8;k++){const e=spawnEnemy(['dagger','dagger','mace'][k%3]);e.x=X+4+k*2.4;e.y=Y-7;}sendAnts(U0,X+12,Y-3);frames(30*70);
  G=window.__game();const S=JSON.stringify(snapGame());
  const kinds={};for(const b of G.blocks.values())kinds[b.t]=(kinds[b.t]||0)+1;
  const hurt=[...G.blocks.values()].filter(b=>(b.t==='door'||b.t==='doorL'||b.t==='mender'||B[b.t].wall)&&b.hp<b.max).length;
  return {ok,len:S.length,items:G.items,kinds,wave:G.wave,hurt,drops,heals,units:G.units.length,S};});
 r.errs=errs;await p.close();return r;};
(async()=>{const br=await chromium.launch();let fails=0;
 for(const q of (process.env.QS||'medium,epic').split(',')){
  const a=await run(br,OLD,q,'on'),b=await run(br,NEW,q,'on'),c=await run(br,NEW,q,'off'),d=await run(br,OLD,q,'off');
  for(const [lab,x] of [['v40 vs v41',a],['v41 art off vs on',c],['v40 art off vs v41 on',d]]){const same=x.S===b.S;if(!same)fails++;
   console.log(q,lab,same?'PASS identical saves':'FAIL saves differ',`placed ${x.ok}/${b.ok}`,'len',x.len,b.len,'blocks',JSON.stringify(b.kinds),'wave',b.wave,'hurt now',b.hurt,'health drops',b.drops,x.drops,'repairs',b.heals,x.heals,'units',b.units,'errors',x.errs.length,b.errs.length,b.errs.slice(0,2));
   if(!same){for(let i=0;i<x.S.length;i++)if(x.S[i]!==b.S[i]){console.log('first diff at',i,x.S.slice(i-80,i+80),'\n',b.S.slice(i-80,i+80));break;}}}}
 console.log(fails?'FAIL':'ALL PASS');await br.close();})();
