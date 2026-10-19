// v42 screenshots, every picture the game's own canvas (render()), cropped. TAG=before (v41) or after (v42): close-ups of the Spore
// Flak, Seed Mortar, Sunlance and Brood Chamber at full, half and low health, and the four at three zooms. After only: a colony with
// all 26 hive structures; the Bulwark route through a wall of three Petal Gates and one Maw Gate (with each ant's track drawn over the
// canvas); the quality presets; the missing-PNG fallback; crowds of 100.
const {chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/lc2_index.html',TAG=process.env.TAG||'after',D='shots42/';
(async()=>{const br=await chromium.launch();fs.mkdirSync(D,{recursive:true});const errs=[];
 async function page(q,route){const p=await br.newPage({viewport:{width:1400,height:900}});p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(q=>{try{localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');}catch(e){}},q||'epic');
  if(route)await route(p);await p.goto(URL);await p.waitForTimeout(1500);
  await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.waitForTimeout(200);await p.evaluate(q=>{applyQuality(q);
  window.__F=(w,h,ox,oy)=>{let s=9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   ['factory','htank','scatter','hail','lancer','door','doorL','nest','bellows','pdrill','smelter','sorter','tconveyor'].forEach(k=>G.unlocked.add(k));
   const X=G.core.x+(ox??3),Y=G.core.y-(oy??(h+4));for(let y=Y-4;y<Y+h;y++)for(let x=X-4;x<X+w;x++){if(!inMap(x,y))continue;const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   window.__X=[X,Y];return {G,X,Y,put:(t,x,y,r)=>{tryPlace(t,X+x,Y+y,r||0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;}};};
  window.__four=(o)=>{const {G,X,Y,put}=__F(30,18);put('scatter',2,3);put('hail',7,3.5|0);put('lancer',10,3);put('factory',15,2);for(let k=0;k<10;k++)put('solar',2+k,10);
   for(const b of G.blocks.values()){b.built=1;if(b.ammo)for(const k in B[b.t].tur.ammo)b.ammo[k]=50;if(b.t==='factory'){b.unit='tank';}}
   G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();if(o.hp)for(const b of G.blocks.values())if(TS4[b.t])b.hp=b.max*o.hp;
   for(const b of G.blocks.values())b.ang=-.6;cam.z=o.z||2;centerOn(X+o.cx,Y+o.cy);return {X,Y};};window.TS4={scatter:1,hail:1,lancer:1,factory:1};},q||'epic');return p;}
 const clip=(p,cx,cy,w,h)=>p.evaluate(([cx,cy,w,h])=>{const z=cam.z;return {x:Math.round(((__X[0]+cx)*T-cam.x)*z-w/2),y:Math.round(((__X[1]+cy)*T-cam.y)*z-h/2),width:w,height:h};},[cx,cy,w,h]);
 const settle=(p,n)=>p.evaluate(n=>{for(let k=0;k<n;k++){step(1/30);render();}},n);
 let p=await page('epic');
 for(const hp of [1,.5,.2]){await p.evaluate(hp=>{__four({hp,z:4,cx:9,cy:5});},hp);await settle(p,10);
  for(const [n,cx,cy,w,h] of [['flak',3,4,300,300],['mortar',7.5,3.5,200,200],['sun',11,4,300,300],['brood',16.5,3.5,400,400]]){await p.evaluate(([cx,cy])=>{centerOn(__X[0]+cx,__X[1]+cy);render();},[cx,cy]);await p.screenshot({path:`${D}close_${n}_${Math.round(hp*100)}_${TAG}.png`,clip:await clip(p,cx,cy,w,h)});}}
 for(const z of [2,1,.6]){await p.evaluate(z=>__four({z,cx:10,cy:4.5}),z);await settle(p,10);await p.screenshot({path:`${D}four_z${z}_${TAG}.png`,clip:await clip(p,10,4.5,Math.round(21*24*z),Math.round(7*24*z))});}
 if(TAG==='after'){
  // a colony with every hive structure: one of each of the 26, laid out as a small working base
  const placed=await p.evaluate(()=>{const {G,X,Y,put}=__F(36,12,-15,12);const L=[['conveyor',1,1,0],['conveyor',2,1,0],['tconveyor',3,1,0],['tconveyor',4,1,0],['junction',5,1],['router',6,1],['sorter',7,1],['conveyor',8,1,0],
     ['drill',1,3],['pdrill',5,3],['press',9,3],['smelter',13,3],['combustion',17,3],['solar',18,3],['solar',19,3],['bellows',20,3],['node',24,3],
     ['wall',1,8],['wall',2,8],['twall',3,8],['door',4,8],['wall',5,8],['wallL',6,8],['doorL',8,8],['wallL',10,8],['twall',12,8],['wall',13,8],
     ['mender',15,8],['duo',17,8],['scatter',19,8],['hail',22,8],['lancer',24,8],['nest',27,8],['factory',29,7]];
   for(const [x0,y0] of [[1,3],[5,3]])for(let y=y0;y<y0+3;y++)for(let x=x0;x<x0+3;x++)G.ore[(Y+y)*MW+X+x]=CU;
   const got={};for(const [t,x,y,r] of L){const b=put(t,x,y,r);if(b&&b.t===t)got[t]=1;}
   for(const b of G.blocks.values()){b.built=1;if(b.ammo)for(const k in B[b.t].tur.ammo)b.ammo[k]=50;if(b.t==='factory'){b.unit='tank';for(const [i,n] of U.tank.cost)b.inv[i]=n*2;b.prog=.6;}}
   G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();cam.z=1.6;centerOn(X+16.5,Y+8);const kinds=Object.keys(B);return {got:Object.keys(got).concat(['core']),all:kinds.length,missing:kinds.filter(k=>!got[k]&&k!=='core')};});
  console.log('colony: placed',placed.got.length,'of',placed.all,'missing',placed.missing);
  await settle(p,30);await p.evaluate(()=>{document.querySelectorAll('body *').forEach(e=>e.style.visibility='hidden');cv.style.visibility='visible';render();});
  await p.screenshot({path:`${D}colony26.png`,clip:await clip(p,16.5,8,1360,640)});await p.evaluate(()=>document.querySelectorAll('body *').forEach(e=>e.style.visibility=''));
  // the Bulwark route: three Petal Gates and one Maw Gate in a sealed box, three of each ant sent together; tracks drawn over the canvas
  await p.evaluate(()=>{const {G,X,Y,put}=__F(26,20);const gates=[['door',2],['door',6],['doorL',10],['door',15]];const skip=new Set([2,6,10,11,15]);
    for(let x=0;x<18;x++){if(skip.has(x))continue;put('wall',x,6);put('wall',x,7);}for(const [t,gx] of gates)put(t,gx,6);for(let y=-1;y<16;y++){put('wall',-1,y);put('wall',18,y);}for(let x=-1;x<19;x++){put('wall',x,-1);put('wall',x,15);}
    for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
    const us=['mite','tank','htank','mite','tank','htank','mite','tank','htank'].map((t,i)=>spawnUnit(t,X+8+((i%3)-1)*1.2,Y+2.5-Math.floor(i/3)));sendAnts(us,X+8.5,Y+11.5);
    window.__us=us;window.__tr=us.map(u=>[[u.x,u.y]]);cam.z=2.6;centerOn(X+9,Y+7);document.querySelectorAll('body *').forEach(e=>e.style.visibility='hidden');cv.style.visibility='visible';});
  const cl=await clip(p,9,7,1240,860);
  for(let k=0,shot=0;k<1500;k++){const take=k%90===0||k===1499;await p.evaluate(take=>{step(1/30);__us.forEach((u,i)=>{const t=__tr[i],l=t[t.length-1];if(Math.hypot(u.x-l[0],u.y-l[1])>.15)t.push([u.x,u.y]);});
     if(take){render();const z=cam.z;ctx.save();ctx.setTransform(DPR*z,0,0,DPR*z,-cam.x*DPR*z,-cam.y*DPR*z);
       __us.forEach((u,i)=>{const t=__tr[i];ctx.strokeStyle={mite:'rgba(120,230,255,.85)',tank:'rgba(255,220,90,.85)',htank:'rgba(255,90,120,.95)'}[u.t];ctx.lineWidth=u.t==='htank'?2.4:1.4;ctx.setLineDash(u.t==='htank'?[]:[4,3]);ctx.beginPath();t.forEach(([x,y],j)=>j?ctx.lineTo(x*T,y*T):ctx.moveTo(x*T,y*T));ctx.stroke();});ctx.restore();}},take);
   if(take){await p.screenshot({path:`${D}route_${String(shot).padStart(2,'0')}.png`,clip:cl});shot++;}}
  await p.evaluate(()=>document.querySelectorAll('body *').forEach(e=>e.style.visibility=''));
  // 100 of each in view (zoom 0.78)
  for(const t of ['scatter','hail','lancer','factory']){await p.evaluate(t=>{const {G,X,Y}=__F(64,36);let n=0;const s=B[t].size;for(let y=0;y<32&&n<100;y+=s)for(let x=0;x<60&&n<100;x+=s)if(tryPlace(t,X+x,Y+y,0,true))n++;
     for(const b of G.blocks.values()){b.built=1;if(b.ammo)for(const k in B[b.t].tur.ammo)b.ammo[k]=50;}G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();cam.z=.78;centerOn(X+30,Y+16);},t);
   await settle(p,10);await p.screenshot({path:`${D}crowd_${t}.png`});}
  await p.close();
  for(const q of ['low','medium','high','epic']){const pq=await page(q);await pq.evaluate(()=>__four({z:2.2,cx:10,cy:4.5}));await settle(pq,10);await pq.screenshot({path:`${D}preset_${q}.png`,clip:await clip(pq,10,4.5,1100,360)});await pq.close();}
  const pf=await page('epic',async q=>{await q.route(/(spore-flak|seed-mortar|sunlance|brood-chamber)\/[a-zA-Z0-9]+\.png/,r=>r.abort());});
  await pf.evaluate(()=>__four({z:2.2,cx:10,cy:4.5}));await settle(pf,10);await pf.screenshot({path:`${D}fallback.png`,clip:await clip(pf,10,4.5,1100,360)});await pf.close();}
 else await p.close();
 console.log(TAG,'done, page errors:',errs.length?errs:'none');await br.close();})();
