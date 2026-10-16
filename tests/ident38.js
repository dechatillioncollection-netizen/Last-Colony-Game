// v38: the same seeded colony of Sap Burners, Sunleaves and Spore Bellows (with the taps that feed them) in the v37 build and this build, drawn every other step
// with painted art on (so the new drawing code runs alongside the simulation), through burning coal, Rootweb boosted by the Bellows, a wave
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
  // coal taps feeding Sap Burners (one by vine, three round a Splitter Bulb), a burner left without coal, a row of Sunleaves,
  // a Spore Bellows beside a Rootweb Node on bare ground, a second Bellows further out, and copper to the Bloom
  for(let y=Y+8;y<Y+15;y++)for(let x=X+8;x<X+25;x++)setWeb(y*MW+x,0);
  ore(1,1,COAL);Q('drill',1,1);Q('conveyor',3,2,0);Q('combustion',4,2);Q('combustion',6,2);
  ore(9,1,COAL);Q('drill',9,1);Q('conveyor',11,2,0);Q('router',12,2);Q('combustion',13,2);Q('combustion',12,1);Q('combustion',12,3);
  for(let k=0;k<8;k++)Q('solar',15+k,2);
  ore(1,6,CU);Q('drill',1,6);for(let x=X;x>=G.core.x+3;x--)Q('conveyor',x-X,7,2);
  Q('bellows',8,9);setWeb((Y+11)*MW+X+13,1);Q('node',13,11);Q('bellows',22,5);
  Q('solar',5,10);Q('solar',5,11);Q('combustion',5,12);
  for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();
  cam.z=1.2;centerOn(X+10,Y+6);
  const frames=n=>{for(let k=0;k<n;k++){step(1/30);if(k%2===0)render();}};
  frames(30*40);
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
