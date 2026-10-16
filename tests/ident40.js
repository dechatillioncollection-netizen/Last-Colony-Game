// v40: the same seeded colony of Bark Walls, Great Bark and Ironbark (lines, a block, a gate) with a powered Healing Pod, in the v38 build and this build, drawn every other step
// with painted art on (so the new wall drawing runs alongside the simulation), through a wave that hurts and breaks walls while the pod mends
// them, and a save. The saves must be byte-identical.
const {chromium}=require(process.env.PW||'playwright');
const OLD=process.env.OLD||'previous/index.html',NEW=process.env.NEW||'index.html';
const run=async(br,file,q)=>{const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(q=>{try{localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');}catch(e){}},q);
 await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(800);
 const r=await p.evaluate(async()=>{let s=11;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;
  startGame('survival');let G=window.__game();G.items=G.items.map(v=>v+5000);G.countdown=1e9;G.webFree=true;
  const X=G.core.x+7,Y=G.core.y-8;
  for(let y=Y-1;y<Y+16;y++)for(let x=X-1;x<X+26;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
  const put=(t,x,y,r)=>tryPlace(t,X+x,Y+y,r||0,true);let ok=0;const Q=(...a)=>{if(put(...a))ok++;};
  // a wall line facing the spawn with a Petal Gate in it, a Great Bark pair, an Ironbark run, a two-deep block, and a Healing Pod
  // powered by Sunleaves behind them
  for(let k=0;k<10;k++)Q(k===5?'door':'wall',2+k,1);Q('wallL',13,0);Q('wallL',15,0);for(let k=0;k<6;k++)Q('twall',17+k,1);
  for(let k=0;k<4;k++){Q('wall',2+k,4);Q('twall',2+k,5);}Q('wallL',7,4);
  Q('mender',10,6);for(let k=0;k<4;k++)Q('solar',12+k,6);
  for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();
  cam.z=1.2;centerOn(X+10,Y+6);
  const frames=n=>{for(let k=0;k<n;k++){step(1/30);if(k%2===0)render();}};
  frames(30*20);
  // a wave reaches the colony: walls are hurt (drawn flinching, bleeding sap and splitting), mended by the pod, and some are lost
  G.countdown=2;frames(30*80);
  G=window.__game();const S=JSON.stringify(snapGame());let h=0;for(let i=0;i<S.length;i++)h=(h*31+S.charCodeAt(i))|0;
  const DWJ0={wall:1,wallL:1,twall:1};const kinds={};for(const b of G.blocks.values())kinds[b.t]=(kinds[b.t]||0)+1;
  const hurt=[...G.blocks.values()].filter(b=>DWJ0[b.t]&&b.hp<b.max).length;
  return {ok,h,len:S.length,items:G.items,kinds,wave:G.wave,hurt,S};});
 r.errs=errs;await p.close();return r;};
(async()=>{const br=await chromium.launch();let fails=0;
 for(const q of (process.env.QS||'medium,epic').split(',')){
  const a=await run(br,OLD,q),b=await run(br,NEW,q);
  const same=a.S===b.S;if(!same)fails++;
  console.log(q,same?'PASS identical saves':'FAIL saves differ',`placed ${a.ok}/${b.ok}`,'len',a.len,b.len,'items',JSON.stringify(b.items),'blocks',JSON.stringify(b.kinds),'wave',b.wave,'walls hurt',b.hurt,'errors',a.errs.length,b.errs.length,b.errs.slice(0,2));
  if(!same){for(let i=0;i<a.S.length;i++)if(a.S[i]!==b.S[i]){console.log('first diff at',i,a.S.slice(i-80,i+80),'\n',b.S.slice(i-80,i+80));break;}}}
 console.log(fails?'FAIL':'ALL PASS');await br.close();})();
