// v35 Rootweb supply cost. Part 1: how long the supply flood fill and the per-tick fade take on the 144x144 The Last Colony map with
// twelve chains of Rootweb Nodes. Part 2: real frame times (requestAnimationFrame) while a big patch fades, v34 and v35 doing the same thing,
// on the painted 2D Rootweb and the GPU one. Writes perf35_result.json.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const setup=()=>{let s=3;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startMission('last');try{skipDlg();skipDlg();}catch(e){}
  const G=window.__game();if(G.story){G.story.s='main';G.story.hold=false;G.story.cease=false;}G.countdown=1e9;G.items=G.items.map(v=>v+99999);
  const cx=G.core.x+1,cy=G.core.y+1;for(let k=0;k<30*120;k++)step(1/30);
  // twelve chains of Rootweb Nodes out from the Bloom's edge (17, 24 and 31 tiles out); the middle ring is the one that gets cut
  const put=(x,y)=>{const o=G.webFree;G.webFree=true;for(let r=0;r<3;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(tryPlace('node',x+dx,y+dy,0,true)){G.webFree=o;const b=blockAt(x+dx,y+dy);b.built=1;return b;}G.webFree=o;return null;};
  const mid=[];for(const R of [17,24,31])for(let a=0;a<12;a++){const b=put(Math.round(cx+R*Math.cos(a*.5236)),Math.round(cy+R*Math.sin(a*.5236)));if(b&&R===24)mid.push(b.id);}
  for(let k=0;k<30*90;k++)step(1/30);G.dirty=true;window.__mid=mid;return {web:G.webCount,nodes:[...G.blocks.values()].filter(b=>b.t==='node').length,mid:mid.length,MW};};
(async()=>{const br=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const out={};
 // part 1 (this build only)
 {const p=await br.newPage({viewport:{width:1280,height:800}});await p.addInitScript(()=>{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_hd','1');localStorage.setItem('lc_art','1');localStorage.setItem('lc_gl','0');});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(1200);
  out.supply=await p.evaluate(setup=>{const info=eval('('+setup+')')();const G=window.__game();
   const T=(f,n)=>{const t=performance.now();for(let k=0;k<n;k++)f();return +((performance.now()-t)/n).toFixed(3);};
   const flood=T(()=>{webSupply();},40);
   WSUP.fading=false;const idle=T(()=>webSupTick(.1),400);
   // cut: remove every ring node, so their patches go dormant, then time the tick while they fade
   for(const id of __mid){const b=G.blocks.get(id);if(b)destroyBlock(b);}for(let k=0;k<30*40;k++)step(1/30);
   const cut=WSUP.iso;let fade=0,n=0;for(let k=0;k<100;k++){WSUP.fading=true;const t=performance.now();webSupTick(.1);fade+=performance.now()-t;n++;}
   const st=T(()=>step(1/30),300);
   return {...info,web:G.webCount,cutTiles:cut,floodMs:flood,tickIdleMs:idle,tickFadingMs:+(fade/n).toFixed(3),stepMs:st};},setup.toString());
  console.log('supply',JSON.stringify(out.supply));await p.close();}
 // part 2: frame times while patches fade
 for(const rep of [1,2])for(const [file,tag] of [[(process.env.OLD||'previous/index.html'),'v34'],['index.html','v35']])for(const gl of ['0','2']){
  const p=await br.newPage({viewport:{width:1280,height:800}});await p.addInitScript(g=>{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_hd','1');localStorage.setItem('lc_art','1');localStorage.setItem('lc_gl',g);},gl);
  await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(1200);
  const r=await p.evaluate(async setup=>{const info=eval('('+setup+')')();const G=window.__game();repaintAllWeb();
   const ring=__mid.map(id=>G.blocks.get(id)).filter(Boolean);cam.z=1;centerOn(ring[0].x,ring[0].y);G.speed=1;G.paused=false;
   await new Promise(r=>setTimeout(r,2500));
   for(const b of ring)destroyBlock(b);
   const W={};const wrap=n=>{const f=window[n];if(typeof f!=='function')return;W[n]={ms:0,n:0};window[n]=function(){const t=performance.now();try{return f.apply(this,arguments);}finally{W[n].ms+=performance.now()-t;W[n].n++;}};};
   for(const n of ['step','render','webArtTick','webArtFx','paintWeb','webSupply','webSupTick','glUpload','glDraw'])wrap(n);
   const iv=[];let last=performance.now(),run=true;const tick=t=>{iv.push(t-last);last=t;if(run)requestAnimationFrame(tick);};requestAnimationFrame(tick);
   await new Promise(r=>setTimeout(r,35000));run=false;iv.sort((a,b)=>a-b);const pc=q=>+iv[Math.floor(iv.length*q)].toFixed(1);
   return {frames:iv.length,fps:+(iv.length/35).toFixed(1),p50:pc(.5),p95:pc(.95),p99:pc(.99),long:iv.filter(x=>x>50).length,gpu:webGPU,iso:typeof WSUP!=='undefined'?WSUP.iso:null,maxDorm:typeof WSUP!=='undefined'?Math.max(...WSUP.dorm):null,perFrame:Object.fromEntries(Object.entries(W).map(([k,v])=>[k,+(v.ms/iv.length).toFixed(2)])),calls:Object.fromEntries(Object.entries(W).map(([k,v])=>[k,v.n]))};},setup.toString());
  out[tag+'_gl'+gl+'_'+rep]=r;console.log(tag,gl,JSON.stringify(r));await p.close();}
 fs.writeFileSync('perf35_result.json',JSON.stringify(out,null,1));await br.close();})();
