// v37 extraction scene: Root Taps on copper, lead, coal and sand, Deep Roots on titanium and copper, a Root Tap backed up (idle),
// Chitin Vats working, starved of sand, and without vigor; vines and Swift Vines out of each. Same layout in each build.
// Writes shots37/scene_<tag>_z<zoom>.png and shots37/scene_<tag>.json (what each structure made).
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const BUILDS=(process.env.BUILDS||'previous/index.html:before,index.html:after').split(',').map(s=>s.split(':'));
const ZOOMS=(process.env.ZOOMS||'0.6,1,2.5').split(',').map(Number);
const SECS=+(process.env.SECS||20);
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots37',{recursive:true});
 for(const [u,tag] of BUILDS){const p=await br.newPage({viewport:{width:1500,height:900},deviceScaleFactor:+(process.env.DSF||1)});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(1500);
  if(process.env.QUALITY)await p.evaluate(q=>applyQuality(q),process.env.QUALITY);
  if(process.env.ART==='off')await p.evaluate(()=>{SET.art=false;});
  const r=await p.evaluate(SECS=>{let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   const X=G.core.x+7,Y=G.core.y-9,W=30,H=22;
   for(let y=Y-1;y<Y+H;y++)for(let x=X-1;x<X+W;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   const ore=(x,y,it)=>{for(let yy=Y+y;yy<Y+y+2;yy++)for(let xx=X+x;xx<X+x+2;xx++){const i=yy*MW+xx;if(it===SAND)G.terrain[i]=SANDF;else G.ore[i]=it;}};
   const L={};const put=(t,x,y,r,label)=>{tryPlace(t,X+x,Y+y,r||0,true);const b=blockAt(X+x,Y+y);if(b&&b.t===t){b.built=1;if(label)L[label]=b;}return b;};
   const sinks=[];const line=(t,x,y,r,n,label)=>{let b;for(let k=0;k<n;k++){b=put(t,x+D4X[r]*k,y+D4Y[r]*k,r);}sinks.push(b);if(label)L[label]=b;};
   // row 1: Root Taps on copper, lead, coal and sand, each shipping into a vine
   [[CU,'tap copper'],[PB,'tap lead'],[COAL,'tap coal'],[SAND,'tap sand']].forEach(([it,l],k)=>{const x=1+k*7;ore(x,1,it);put('drill',x,1,0,l);line(k%2?'tconveyor':'conveyor',x+2,2,0,3);});
   // row 2: Deep Roots on titanium and copper; a Root Tap whose only vine runs into a wall (fills up and rests)
   ore(1,7,TI);put('pdrill',1,7,0,'deep titanium');line('tconveyor',3,8,0,3);
   ore(8,7,CU);put('pdrill',8,7,0,'deep copper');line('conveyor',8,9,1,3);
   ore(15,7,PB);put('drill',15,7,0,'tap full');put('conveyor',17,8,0);put('wall',18,8);
   // a Root Tap boxed in next to a Resin Gland and a Splitter Bulb (rendering beside other structures)
   ore(22,7,CU);put('drill',22,7,0,'tap neighbours');put('router',24,7);put('conveyor',25,7,0);put('press',22,9);put('conveyor',24,10,0);
   // row 3: Chitin Vats: working (coal and sand fed in), short of sand, and with no vigor
   put('smelter',1,14,0,'vat working');put('conveyor',0,14,0,'vat coal in');put('conveyor',1,13,1,'vat sand in');line('conveyor',3,15,0,3);
   put('smelter',9,14,0,'vat no sand');line('conveyor',11,15,0,3);
   put('smelter',16,14,0,'vat idle');line('tconveyor',18,14,0,3);
   for(let k=0;k<2;k++)put('combustion',24+k,14,0,'burner'+k);
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
   const made={};const last={};for(const [l,b] of Object.entries(L)){made[l]=0;last[l]=b.out||0;}
   const before=G.items.slice();
   for(let k=0;k<SECS*30;k++){
     for(const b of [L['burner0'],L['burner1']])if(b)b.inv[COAL]=5;
     const v=L['vat working'];if(v){if(v.inv[COAL]<2)v.inv[COAL]=(v.inv[COAL]||0)+1;if(v.inv[SAND]<4)v.inv[SAND]=(v.inv[SAND]||0)+2;}
     const n=L['vat no sand'];if(n&&n.inv[COAL]<3)n.inv[COAL]=3;if(n)n.inv[SAND]=1;
     const i=L['vat idle'];if(i){i.inv[COAL]=0;i.inv[SAND]=0;}
     step(1/30);
     for(const b of sinks)if(b&&b.belt&&b.belt.length){for(const it of b.belt)if(it.p>.9){made[b.id]=(made[b.id]||0)+1;}b.belt=b.belt.filter(it=>it.p<=.9);}}
   G.paused=true;
   const state={};for(const [l,b] of Object.entries(L))state[l]={t:b.t,ore:b.oreItem,prog:+(b.prog||0).toFixed(4),out:b.out,inv:b.inv?b.inv.slice():null,wants:b.wants};
   window.__scene=[X,Y];msgEl.style.display='none';return {at:[X,Y],state,powSat:G.powSat,shipped:made};},SECS);
  for(const z of ZOOMS){await p.evaluate(z=>{const [X,Y]=window.__scene;cam.z=z;centerOn(z>2?X+6:X+14,z>2?Y+4:Y+10);},z);
   if(z>2){for(const [nm,cx,cy] of [['taps',6,3],['deep',8,9],['vats',8,15],['next',23,9]]){await p.evaluate(([cx,cy])=>{const [X,Y]=window.__scene;centerOn(X+cx,Y+cy);},[cx,cy]);await p.waitForTimeout(400);await p.screenshot({path:`shots37/scene_${tag}_z${z}_${nm}.png`});}}
   else{await p.waitForTimeout(800);await p.screenshot({path:`shots37/scene_${tag}_z${z}.png`});}}
  fs.writeFileSync('shots37/scene_'+tag+'.json',JSON.stringify(r,null,1));console.log(tag,JSON.stringify(r.shipped),'powSat',r.powSat,'errors',errs);await p.close();}
 await br.close();})();
