// v37: the same seeded colony of Root Taps, Deep Roots and Chitin Vats in the v36 build and this build, drawn every other step
// with painted art on (so the new drawing code runs alongside the simulation), through mining, chitin production, a wave
// that damages and destroys some of them, and a save. The saves must be byte-identical.
const {chromium}=require(process.env.PW||'playwright');
const OLD=process.env.OLD||'previous/index.html',NEW=process.env.NEW||'index.html';
const run=async(br,file,q)=>{const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(q=>{try{localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');}catch(e){}},q);
 await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(800);
 const r=await p.evaluate(async()=>{let s=11;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;
  startGame('survival');let G=window.__game();G.items=G.items.map(v=>v+5000);G.countdown=1e9;G.webFree=true;
  const X=G.core.x+7,Y=G.core.y-8;
  for(let y=Y-1;y<Y+16;y++)for(let x=X-1;x<X+26;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
  const ore=(x,y,it)=>{for(let yy=Y+y;yy<Y+y+2;yy++)for(let xx=X+x;xx<X+x+2;xx++){const i=yy*MW+xx;if(it===SAND)G.terrain[i]=SANDF;else G.ore[i]=it;}};
  const put=(t,x,y,r)=>tryPlace(t,X+x,Y+y,r||0,true);let ok=0;const Q=(...a)=>{if(put(...a))ok++;};
  // copper, lead, titanium to the Bloom; coal and sand into two Chitin Vats; a backed-up tap; a Deep Root on copper into a Resin Gland
  ore(1,1,CU);Q('drill',1,1);for(let x=X+2;x>=G.core.x+3;x--)Q('conveyor',x-X,3,2);
  ore(4,1,PB);Q('drill',4,1);
  ore(8,1,TI);Q('pdrill',8,1);Q('tconveyor',8,3,2);for(let k=0;k<2;k++)Q('tconveyor',7,3+k,1);
  ore(1,6,COAL);Q('drill',1,6);Q('conveyor',3,7,0);Q('conveyor',4,7,0);
  ore(7,8,SAND);Q('drill',7,8);Q('conveyor',6,8,2);
  Q('smelter',5,6);Q('conveyor',7,6,0);Q('conveyor',8,6,0);Q('router',9,6);Q('conveyor',9,5,3);
  ore(12,6,COAL);Q('drill',12,6);ore(16,6,SAND);Q('drill',16,6);Q('smelter',14,6);
  ore(12,10,PB);Q('drill',12,10);Q('wall',14,10);Q('conveyor',14,11,0);Q('wall',15,11);
  ore(18,1,CU);Q('pdrill',18,1);Q('press',20,1);
  Q('combustion',10,10);Q('combustion',10,11);Q('solar',9,10);
  for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();
  cam.z=1.2;centerOn(X+10,Y+6);
  const frames=n=>{for(let k=0;k<n;k++){step(1/30);if(k%2===0)render();}};
  frames(30*80);
  // a wave reaches the colony: growths are hurt (drawn sagging and flashing) and some are lost
  G.countdown=2;frames(30*70);
  G=window.__game();const S=JSON.stringify(snapGame());let h=0;for(let i=0;i<S.length;i++)h=(h*31+S.charCodeAt(i))|0;
  const kinds={};for(const b of G.blocks.values())kinds[b.t]=(kinds[b.t]||0)+1;
  return {ok,h,len:S.length,items:G.items,kinds,wave:G.wave,S};});
 r.errs=errs;await p.close();return r;};
(async()=>{const br=await chromium.launch();let fails=0;
 for(const q of (process.env.QS||'medium,epic').split(',')){
  const a=await run(br,OLD,q),b=await run(br,NEW,q);
  const same=a.S===b.S;if(!same)fails++;
  console.log(q,same?'PASS identical saves':'FAIL saves differ',`placed ${a.ok}/${b.ok}`,'len',a.len,b.len,'items',JSON.stringify(b.items),'blocks',JSON.stringify(b.kinds),'wave',b.wave,'errors',a.errs.length,b.errs.length,b.errs.slice(0,2));
  if(!same){for(let i=0;i<a.S.length;i++)if(a.S[i]!==b.S[i]){console.log('first diff at',i,a.S.slice(i-80,i+80),'\n',b.S.slice(i-80,i+80));break;}}}
 console.log(fails?'FAIL':'ALL PASS');await br.close();})();
