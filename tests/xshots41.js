// v41 screenshots: the same layout in v40 (TAG=before) and v41 (TAG=after). A defensive line of Bark Wall and Ironbark with two Petal
// Gates, a Maw Gate between two Great Barks, and three Healing Pods behind it on Sunleaves. Close-ups at full, half and low health;
// the line at three zooms; a Healing Pod mending the hurt line frame by frame; a mixed crowd; the quality presets; the missing-PNG
// fallback. Every picture is the game's own canvas (render()), cropped.
const {chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/lc2_index.html',TAG=process.env.TAG||'after',D='shots41/';
(async()=>{const br=await chromium.launch();fs.mkdirSync(D,{recursive:true});const errs=[];
 async function page(q,route){const p=await br.newPage({viewport:{width:1400,height:900}});p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(q=>{try{localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');}catch(e){}},q||'epic');
  if(route)await route(p);await p.goto(URL);await p.waitForTimeout(1500);
  // the page's own loop is stopped so each picture is exactly the steps and draws made here
  await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.waitForTimeout(200);await p.evaluate(q=>{applyQuality(q);
  window.__L=(o)=>{let s=9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   const X=G.core.x+3,Y=G.core.y-12;for(let y=Y-4;y<Y+16;y++)for(let x=X-4;x<X+32;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   const put=(t,x,y)=>{tryPlace(t,X+x,Y+y,0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};
   for(let x=0;x<28;x++){if(x>=10&&x<=15)continue;put(x===5||x===21?'door':x%3===2?'twall':'wall',x,6);}
   put('wallL',10,6);put('doorL',12,6);put('wallL',14,6);
   put('mender',7,9);put('mender',17,9);put('mender',24,9);for(let k=0;k<14;k++)put('solar',2+k*2,13);
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();window.__X=[X,Y];
   if(o.hp)for(const b of G.blocks.values())if(b.y===Y+6||b.t==='wallL'||b.t==='doorL'||b.t==='mender')b.hp=b.max*o.hp;
   cam.z=o.z||2;centerOn(X+o.cx,Y+o.cy);return {X,Y};};},q||'epic');return p;}
 const clip=(p,cx,cy,w,h)=>p.evaluate(([cx,cy,w,h])=>{const z=cam.z;return {x:Math.round((( __X[0]+cx)*T-cam.x)*z-w/2),y:Math.round(((__X[1]+cy)*T-cam.y)*z-h/2),width:w,height:h};},[cx,cy,w,h]);
 const settle=(p,n,hold)=>p.evaluate(([n,hold])=>{for(let k=0;k<n;k++){if(window.__hold)for(const [u,x,y] of __hold){u.x=x;u.y=y;}step(1/30);render();}},[n,hold]);
 let p=await page('epic');
 // close-ups at full, half and low health: Petal Gate, Maw Gate, Healing Pod
 for(const hp of [1,.5,.2]){await p.evaluate(hp=>{__L({hp,z:4,cx:13,cy:8});window.__hold=null;},hp);await settle(p,20);
  for(const [n,cx,cy,w,h] of [['petal',5.5,6.5,384,240],['maw',13,7,480,336],['pod',7.5,9.5,288,288]]){await p.evaluate(([cx,cy])=>{centerOn(__X[0]+cx,__X[1]+cy);render();},[cx,cy]);await p.screenshot({path:`${D}close_${n}_${Math.round(hp*100)}_${TAG}.png`,clip:await clip(p,cx,cy,w,h)});}}
 // the line: an ant held inside the left Petal Gate, a Bulwark Ant in the Maw Gate, some sections hurt; three zooms
 for(const z of [2,1,.6]){await p.evaluate(z=>{const {X,Y}=__L({z,cx:14,cy:8});const G=window.__game();
   for(const b of G.blocks.values())if(b.y===Y+6&&(b.x-X)%4===1)b.hp=b.max*.35;
   const m=spawnUnit('mite',X+5.5,Y+6.5),h=spawnUnit('htank',X+13,Y+7);window.__hold=[[m,X+5.5,Y+6.5],[h,X+13,Y+7]];},z);await settle(p,40);
  await p.screenshot({path:`${D}line_z${z}_${TAG}.png`,clip:await clip(p,14,7.5,Math.min(1400,Math.round(31*24*z)),Math.min(900,Math.round(8*24*z)))});}
 // a Healing Pod mending: the line hurt around the middle pod, frames from the repair the game makes
 await p.evaluate(()=>{const {X,Y}=__L({z:3,cx:16,cy:8});const G=window.__game();window.__hold=null;for(const b of G.blocks.values())if(b.t!=='core'&&b.t!=='solar'&&b.t!=='mender'&&Math.hypot(b.x-X-17,b.y-Y-9)<7)b.hp=b.max*.4;
   const pod=blockAt(X+17,Y+9);pod.prog=1.5;window.__pod=pod;});
 {const c=await clip(p,16.5,7.6,720,400);let shot=0,go=-1;for(let k=0;k<200&&shot<16;k++){const h=await p.evaluate(()=>{step(1/30);render();return window.__game().fx.some(f=>f.k==='heal'&&f.max-f.life<.04);});
   if(h&&go<0)go=k-2;if(go>=0&&(k-go)%3===0){await p.screenshot({path:`${D}podmend_${TAG}_${String(shot).padStart(2,'0')}.png`,clip:c});shot++;}}}
 // crowd: 200 of the three, mixed, zoom 0.9
 await p.evaluate(()=>{let s=3;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   const X=G.core.x+5,Y=G.core.y-16;for(let y=Y-1;y<Y+34;y++)for(let x=X-1;x<X+44;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   let x=0,y=0,n=0;const k=['door','doorL','mender'];while(n<200&&y<32){const t=k[n%3],w=t==='doorL'?2:1;if(x+w>40){x=0;y+=3;continue;}if(tryPlace(t,X+x,Y+y,0,true))n++;x+=w;}
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();cam.z=.9;centerOn(X+20,Y+12);window.__hold=null;});
 await settle(p,20);await p.screenshot({path:`${D}crowd_${TAG}.png`});
 await p.close();
 if(TAG==='after'){
  for(const q of ['low','medium','high','epic']){const pq=await page(q);await pq.evaluate(()=>{const {X,Y}=__L({z:2.5,cx:13,cy:8});const m=spawnUnit('mite',X+5.5,Y+6.5);window.__hold=[[m,X+5.5,Y+6.5]];});await settle(pq,30);
   await pq.screenshot({path:`${D}preset_${q}.png`,clip:await clip(pq,13,7.5,1000,420)});await pq.close();}
  const pf=await page('epic',async q=>{await q.route(/(petal-gate|maw-gate|healing-pod)\/[a-z0-9]+\.png/,r=>r.abort());});
  await pf.evaluate(()=>{__L({z:2.5,cx:13,cy:8});});await settle(pf,20);await pf.screenshot({path:`${D}fallback.png`,clip:await clip(pf,13,7.5,1000,420)});await pf.close();}
 console.log(TAG,'done, page errors:',errs.length?errs:'none');await br.close();})();
