// v35 Rootweb supply cost. Part 1: how long the supply flood fill and the per-tick fade take on the 144x144 Base Siege map with a
// large Rootweb. Part 2: real frame times (requestAnimationFrame) while a big patch fades, v34 and v35 doing the same thing,
// on the painted 2D Rootweb and the GPU one. Writes perf35_result.json.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const setup=()=>{let s=3;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('siege');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
  const cx=G.core.x,cy=G.core.y;for(let k=0;k<30*240;k++)step(1/30);
  // a ring of nodes around the edge of the Bloom's Rootweb, then a chain out to a far patch joined by one node (the one we cut)
  const nodes=[];for(let a=0;a<16;a++){const x=Math.round(cx+30*Math.cos(a*.39)),y=Math.round(cy+30*Math.sin(a*.39));if(tryPlace('node',x,y,0,true)){const b=blockAt(x,y);b.built=1;nodes.push(b);}}
  for(let k=0;k<30*120;k++)step(1/30);
  for(const b of G.blocks.values())b.built=1;G.dirty=true;return {web:G.webCount,nodes:nodes.length,MW};};
(async()=>{const br=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const out={};
 // part 1 (this build only)
 {const p=await br.newPage({viewport:{width:1280,height:800}});await p.addInitScript(()=>{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_hd','1');localStorage.setItem('lc_art','1');localStorage.setItem('lc_gl','0');});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(1200);
  out.supply=await p.evaluate(setup=>{const info=eval('('+setup+')')();const G=window.__game();
   const T=(f,n)=>{const t=performance.now();for(let k=0;k<n;k++)f();return +((performance.now()-t)/n).toFixed(3);};
   const flood=T(()=>{webSupply();},40);
   WSUP.fading=false;const idle=T(()=>webSupTick(.1),400);
   // cut: remove every ring node, so their patches go dormant, then time the tick while they fade
   const ring=[...G.blocks.values()].filter(b=>b.t==='node');for(const b of ring)destroyBlock(b);for(let k=0;k<30*30;k++)step(1/30);
   const cut=WSUP.iso;let fade=0,n=0;for(let k=0;k<100;k++){WSUP.fading=true;const t=performance.now();webSupTick(.1);fade+=performance.now()-t;n++;}
   const st=T(()=>step(1/30),300);
   return {...info,web:G.webCount,cutTiles:cut,floodMs:flood,tickIdleMs:idle,tickFadingMs:+(fade/n).toFixed(3),stepMs:st};},setup.toString());
  console.log('supply',JSON.stringify(out.supply));await p.close();}
 // part 2: frame times while patches fade
 for(const [file,tag] of [[(process.env.OLD||'previous/index.html'),'v34'],['index.html','v35']])for(const gl of ['0','2']){
  const p=await br.newPage({viewport:{width:1280,height:800}});await p.addInitScript(g=>{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_hd','1');localStorage.setItem('lc_art','1');localStorage.setItem('lc_gl',g);},gl);
  await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(1200);
  const r=await p.evaluate(async setup=>{const info=eval('('+setup+')')();const G=window.__game();repaintAllWeb();
   const ring=[...G.blocks.values()].filter(b=>b.t==='node');cam.z=1;centerOn(ring[0].x-6,ring[0].y);G.speed=1;G.paused=false;
   await new Promise(r=>setTimeout(r,2500));
   for(const b of ring)destroyBlock(b);
   const iv=[];let last=performance.now(),run=true;const tick=t=>{iv.push(t-last);last=t;if(run)requestAnimationFrame(tick);};requestAnimationFrame(tick);
   await new Promise(r=>setTimeout(r,25000));run=false;iv.sort((a,b)=>a-b);const pc=q=>+iv[Math.floor(iv.length*q)].toFixed(1);
   return {frames:iv.length,fps:+(iv.length/25).toFixed(1),p50:pc(.5),p95:pc(.95),p99:pc(.99),long:iv.filter(x=>x>50).length,gpu:webGPU,iso:typeof WSUP!=='undefined'?WSUP.iso:null};},setup.toString());
  out[tag+'_gl'+gl]=r;console.log(tag,gl,JSON.stringify(r));await p.close();}
 fs.writeFileSync('perf35_result.json',JSON.stringify(out,null,1));await br.close();})();
