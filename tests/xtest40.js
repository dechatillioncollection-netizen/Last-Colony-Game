// v40 checks for the painted Bark Wall, Great Bark and Ironbark, in the Test Range and in Survival. Each check prints PASS or FAIL.
// Simulation results are compared with the v38 build (OLD) run the same way; the art is checked from the game's own state and from
// pixels drawn with drawArt at chosen moments.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const OLD=process.env.OLD||'previous/index.html',NEW=process.env.NEW||'index.html';
let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('PASS',m);}else{fail++;console.log('FAIL',m);}};
const KINDS=['wall','wallL','twall'];
// o.range: the Test Range, with HDF ground units let loose in Arena 1 (its Great Bark, Ironbark and Petal Gate are ours) for secs,
// drawn every step with the arena in view. Otherwise Survival: a wall line with a gate, a Great Bark pair, an Ironbark run, a block,
// an HDF wall beside ours, a Healing Pod powered by Sunleaves, and walls hurt on a fixed schedule (o.hurt) so the pod mends them.
const BUILD=async(p,o)=>p.evaluate(async o=>{let s=5;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;
  const L={};let X=0,Y=0;
  if(o.range){startTestRange();const G=window.__game();const gr=Object.keys(E).filter(k=>!E[k].air&&!E[k].boss).slice(0,3);
    for(let k=0;k<9;k++)testSpawnEnemy(gr[k%gr.length],86-(k%3),12+k*2);
    for(const b of G.blocks.values())if(b.team===0&&!b.arenaWall&&arenaAt(b.x,b.y)===0&&(b.t==='wallL'||b.t==='twall'||b.t==='door'))L[b.t+'@'+b.x+','+b.y]=b;
    cam.z=1;centerOn(72,20);}
  else{startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
    X=G.core.x+7;Y=G.core.y-9;
    for(let y=Y-1;y<Y+14;y++)for(let x=X-1;x<X+26;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
    const put=(t,x,y,l,team)=>{if(!team)tryPlace(t,X+x,Y+y,0,true);let b=team?addBlock(t,X+x,Y+y,0,1):blockAt(X+x,Y+y);if(b&&b.t===t){b.built=1;if(l)L[l]=b;}return b;};
    for(let k=0;k<7;k++)put(k===3?'door':'wall',1+k,1,k===1?'line mid':k===2?'by gate':k===0?'line end':null);
    put('wallL',9,0,'great a');put('wallL',11,0,'great b');for(let k=0;k<4;k++)put('twall',13+k,1,k===1?'iron mid':null);
    put('wall',1,4,'lone');put('solar',2,4);put('wall',4,4,'by hdf');put('wall',5,4,'hdf',1);
    put('mender',8,6,'pod');for(let k=0;k<4;k++)put('solar',10+k,6);
    for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();cam.z=1.6;centerOn(X+9,Y+3);}
  const G=window.__game();
  // the simulation's own record: for every wall of ours in L, how many steps its health went down, and up
  const drops={},rises={};const walls=Object.entries(L).filter(([l,b])=>!b.team&&(b.t==='wall'||b.t==='wallL'||b.t==='twall'));
  for(let k=0;k<o.secs*30;k++){
    const before=walls.map(([l,b])=>b.hp);
    if(o.hurt&&k%90===10){for(const l of o.hurt)if(L[l]&&G.blocks.has(L[l].id))hurtBlock(L[l],L[l].max*.06);}
    step(1/30);render();
    walls.forEach(([l,b],i)=>{if(b.hp<before[i]-.01)drops[l]=(drops[l]||0)+1;else if(b.hp>before[i]+.01)rises[l]=(rises[l]||0)+1;});}
  const out={};for(const [l,b] of Object.entries(L)){const s=OST.get(b)||{};out[l]={t:b.t,team:b.team,x:b.x,y:b.y,hp:+b.hp.toFixed(4),max:b.max,alive:G.blocks.has(b.id),n:s.n||0,m:s.m||0,mask:s.lm};}
  const en=G.enemies.filter(e=>!e.dead).map(e=>[e.t,+e.x.toFixed(3),+e.y.toFixed(3),+e.hp.toFixed(3)]);
  let h=0;const all=[...G.blocks.values()].map(b=>b.t+b.x+','+b.y+':'+b.hp.toFixed(4)).join('|');for(let i=0;i<all.length;i++)h=(h*31+all.charCodeAt(i))|0;
  window.__L=L;window.__X=[X,Y];
  return {out,drops,rises,en,blocks:h,nb:G.blocks.size,items:G.items,powSat:G.powSat,time:G.time};},o);
(async()=>{const br=await chromium.launch();
 const page=async(file,init)=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
  await p.addInitScript(q=>{try{localStorage.setItem('lc_quality',q||'medium');localStorage.setItem('lc_fog','0');}catch(e){}},init||'medium');
  await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(900);return p;};
 const sim=x=>JSON.stringify([x.blocks,x.nb,x.items,x.powSat,x.en,x.drops,x.rises,Object.fromEntries(Object.entries(x.out).map(([l,v])=>[l,[v.hp,v.alive]]))]);
 // ---- combat in the Test Range arena ----
 {const pa=await page(OLD),pb=await page(NEW);const A=await BUILD(pa,{range:true,secs:40}),Bn=await BUILD(pb,{range:true,secs:40});
  ok(sim(A)===sim(Bn),`Test Range arena: every building's health, every enemy's position and health, and stores identical to v38 after 40 s of fighting (${Bn.en.length} enemies left)`);
  const O=Bn.out,ls=Object.keys(O).filter(l=>O[l].t!=='door'),hit=ls.filter(l=>Bn.drops[l]);
  ok(hit.length>0&&ls.every(l=>O[l].n===(Bn.drops[l]||0)),`Test Range arena: each painted wall flinched once for every step its health really dropped (${ls.map(l=>O[l].t+' '+O[l].n+'/'+(Bn.drops[l]||0)).join(', ')})`);
  ok(ls.filter(l=>O[l].alive).every(l=>O[l].m===(Bn.rises[l]||0)),`Test Range arena: the mend light showed once for every step a Healing Pod really raised a wall's health (${ls.map(l=>O[l].m+'/'+(Bn.rises[l]||0)).join(', ')})`);
  ok(!pa.errs.length&&!pb.errs.length,'Test Range arena: no page errors '+pb.errs.slice(0,2));await pa.close();await pb.close();}
 // ---- Survival: walls hurt on a schedule, mended by a powered Healing Pod ----
 const HURT=['line mid','great a','iron mid','lone'];
 {const pa=await page(OLD),pb=await page(NEW);const A=await BUILD(pa,{secs:30,hurt:HURT}),Bn=await BUILD(pb,{secs:30,hurt:HURT});
  ok(sim(A)===sim(Bn),`Survival: placement, costs, health, damage and Healing Pod repair identical to v38 (vigor ${Bn.powSat}, ${Bn.nb} buildings)`);
  const O=Bn.out;
  ok(HURT.every(l=>O[l].n===(Bn.drops[l]||0)&&O[l].n>=9),`Survival: every scheduled hit made its wall flinch, and nothing else did (${HURT.map(l=>l+' '+O[l].n+'/'+(Bn.drops[l]||0)).join(', ')})`);
  ok(HURT.every(l=>O[l].m===(Bn.rises[l]||0))&&O['great a'].m>0&&HURT.every(l=>O[l].alive),`Survival: every Healing Pod repair showed the mend light, once each, and the walls in reach were kept alive (${HURT.map(l=>l+' '+O[l].m+'/'+(Bn.rises[l]||0)).join(', ')})`);
  ok(['line end','by gate','by hdf','great b'].every(l=>O[l].n===0&&O[l].m===0),'Survival: walls that were never hit never flinch or glow');
  // joins: which sides knit into a neighbour
  ok(O['line mid'].mask===5&&O['line end'].mask===1&&O['by gate'].mask===5,`Joins: a wall in a line knits to both neighbours, the end one to one, and walls knit to a Petal Gate (masks ${O['line mid'].mask}, ${O['line end'].mask}, ${O['by gate'].mask})`);
  ok(O.lone.mask===0&&O['by hdf'].mask===0,`Joins: no root bundle to a Sunleaf or to an HDF wall (masks ${O.lone.mask}, ${O['by hdf'].mask})`);
  ok((O['great a'].mask&(1|2))===3&&(O['great a'].mask&(16|32))===0,`Joins: a Great Bark knits to the Great Bark on its right along both its tiles, and to nothing on its left (mask ${O['great a'].mask.toString(2)})`);
  ok(!pa.errs.length&&!pb.errs.length,'Survival: no page errors '+pb.errs.slice(0,2));await pa.close();await pb.close();}
 // ---- drawn reactions, measured on pixels with drawArt at chosen moments ----
 const p=await page(NEW);await BUILD(p,{secs:2});
 const px=await p.evaluate(()=>{const L=window.__L,R={};const cv=document.createElement('canvas');cv.width=cv.height=240;const c=cv.getContext('2d');
  const shot=(b,tt)=>{c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,240,240);c.setTransform(2.5,0,0,2.5,0,0);const n=b.size;drawArt(c,b.t,48-n*12,48-n*12,0,b,tt,0);return c.getImageData(0,0,240,240).data;};
  const diff=(a,b)=>{let d=0;for(let i=0;i<a.length;i++)d+=Math.abs(a[i]-b[i]);return d/(a.length/4)/255;};
  const rm=window.ART_RM;
  for(const [l,b] of [['bark',L.lone],['great',L['great b']],['iron',L['iron mid']]]){b.hp=b.max;const r={};const t0=50;
    shot(b,t0-1);const a0=shot(b,t0),idle=shot(b,t0+.15);r.idle=diff(a0,idle);
    // a hit worth almost nothing (so its wound look does not change): only the flinch and the sap show, and they pass
    b.hp-=b.max*.01;shot(b,t0+.2);const h1=shot(b,t0+.35);r.hit=diff(idle,h1);shot(b,t0+.55);shot(b,t0+.8);shot(b,t0+1.05);shot(b,t0+1.3);const h2=shot(b,t0+1.5),ref=shot(b,t0+1.65);r.after=diff(h2,ref);
    // the white flash alone (b.hit) without health going down is not a hit
    const n0=OST.get(b).n;b.hit=.12;shot(b,t0+1.8);r.flashOnly=OST.get(b).n-n0;b.hit=0;
    // health tiers: how far from healthy it looks at 80%, 50% and 20% (each drawn after the reactions have passed)
    let tt=t0+10;const tier=f=>{b.hp=b.max*f;shot(b,tt);tt+=3;return shot(b,tt);};
    const full=tier(1);r.tiers=[.8,.5,.2].map(f=>diff(full,tier(f)));
    // mended: the light shows, then fades
    b.hp=b.max*.5;shot(b,tt);tt+=3;const m0=shot(b,tt);const m0b=shot(b,tt+.15);b.hp=b.max*.62;shot(b,tt+.2);const m1=shot(b,tt+.45);r.mend=diff(m0b,m1);for(let q=1;q<=5;q++)shot(b,tt+.45+q*.25);const m2=shot(b,tt+1.8),m3=shot(b,tt+1.95);r.mendGone=diff(m2,m3);
    // out of view for a while, then hurt: no reaction for a hit that happened while it was not drawn
    const n1=OST.get(b).n;b.hp=b.max*.3;shot(b,tt+9);r.offscreen=OST.get(b).n-n1;
    b.hp=b.max;R[l]=r;}
  return R;});
 for(const [l,r] of Object.entries(px)){
  ok(r.hit>r.idle*4&&r.hit>.004,`${l}: a real hit visibly moves it (change ${r.hit.toFixed(4)} against ${r.idle.toFixed(4)} from idle motion alone in the same time)`);
  ok(r.after<r.idle*2+.001,`${l}: a second and a half later the flinch and the sap have passed (${r.after.toFixed(4)})`);
  ok(r.flashOnly===0&&r.offscreen===0,`${l}: the white flash on its own, or a drop in health while it was out of view, starts no reaction`);
  ok(r.tiers[0]>r.idle&&r.tiers[1]>r.tiers[0]&&r.tiers[2]>r.tiers[1],`${l}: the lower its health, the more torn it looks (80% ${r.tiers[0].toFixed(3)}, 50% ${r.tiers[1].toFixed(3)}, 20% ${r.tiers[2].toFixed(3)})`);
  ok(r.mend>r.idle*3&&r.mendGone<r.idle*2+.001,`${l}: a Healing Pod repair lights it (${r.mend.toFixed(4)}) and the light fades (${r.mendGone.toFixed(4)})`);}
 const pi=await p.evaluate(()=>{const R={};R.idleAmp={};const L=window.__L;const cv=document.createElement('canvas');cv.width=cv.height=240;const c=cv.getContext('2d');
  const shot=(b,tt)=>{c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,240,240);c.setTransform(2.5,0,0,2.5,0,0);drawArt(c,b.t,48-b.size*12,48-b.size*12,0,b,tt,0);return c.getImageData(0,0,240,240).data;};
  for(const [l,b] of [['bark',L.lone],['iron',L['iron mid']]]){b.hp=b.max;let mx=0;const a=shot(b,100);for(let k=1;k<=14;k++){const d=shot(b,100+k*.5);let s=0;for(let i=0;i<a.length;i++)s+=Math.abs(a[i]-d[i]);mx=Math.max(mx,s/(a.length/4)/255);}R.idleAmp[l]=mx;}
  return R;});
 ok(pi.idleAmp.bark<.03&&pi.idleAmp.iron<.03&&pi.idleAmp.iron<pi.idleAmp.bark,`Idle motion is restrained (largest change over 7 s: Bark Wall ${pi.idleAmp.bark.toFixed(4)}, Ironbark ${pi.idleAmp.iron.toFixed(4)}, which does not breathe)`);
 // ---- HDF walls, zoom, crowds, art off ----
 const r=await p.evaluate(()=>{const L=window.__L,R={};const [X,Y]=window.__X;
  R.hdf=!artFor('wall',1)&&!artFor('twall',1)&&!artFor('wallL',1)&&!!artFor('wall',0);
  hurtBlock(L.lone,40);render();R.hit=L.lone.hit>0;hurtBlock(L['great b'],1e6);for(let k=0;k<5;k++){step(1/30);render();}R.gone=!G.blocks.has(L['great b'].id);
  const zl={};for(const z of [.5,.74,1,1.6,2.5]){cam.z=z;centerOn(X+9,Y+3);render();zl[z]=['wall','wallL','twall'].map(t=>organLite(t)?1:0).join('');}R.zoom=zl;
  cam.z=1;centerOn(X+12,Y+10);render();R.few=[ORGAN_N.wall,organLite('wall')];
  for(let k=0;k<150;k++){const x=X+(k%25),y=Y+8+Math.floor(k/25);tryPlace('wall',x,y,0,true);const b=blockAt(x,y);if(b)b.built=1;}
  render();R.many=[ORGAN_N.wall,organLite('wall')];
  SET.art=false;render();R.off=!artFor('wall',0)&&!artFor('wallL',0)&&!artFor('twall',0);SET.art=true;render();R.on=!!artFor('wall',0)&&!!artFor('wallL',0)&&!!artFor('twall',0);
  return R;});
 ok(r.hdf,'HDF walls keep their own look; only the hive\'s walls are painted');
 ok(r.hit&&r.gone,'Damage flashes and health bars stay; a destroyed Great Bark disappears cleanly');
 ok(r.zoom[.5]==='111'&&r.zoom[.74]==='111'&&r.zoom[1]==='000'&&r.zoom[2.5]==='000',`Zoomed out (below 0.75) the cached look, at normal zoom and closer the full art ${JSON.stringify(r.zoom)}`);
 ok(!r.few[1]&&r.many[1]&&r.many[0]>140,`Crowds: ${r.few[0]} Bark Walls in view are drawn in full, ${r.many[0]} use the cached look`);
 ok(r.off&&r.on,'Painted art off: the procedural look; on again: painted');
 ok(!p.errs.length,'No page errors through reactions, zoom, crowds and art off/on '+p.errs.slice(0,2));
 // save and load: the same saved fields as v38, and a v38 save with hurt walls plays on here
 const sv=await p.evaluate(()=>{const L=window.__L;L.lone.hp=L.lone.max*.3;L['iron mid'].hp=L['iron mid'].max*.6;return JSON.stringify(snapGame());});
 const keys=JSON.parse(sv).blocks.filter(b=>KINDS.includes(b.t)).map(b=>b.t+':'+Object.keys(b).sort().join(','));
 const po=await page(OLD);await po.evaluate(s=>applySave(JSON.parse(s)),sv);const ko=await po.evaluate(k=>snapGame().blocks.filter(b=>k.includes(b.t)).map(b=>b.t+':'+Object.keys(b).sort().join(',')),KINDS);
 ok(keys.length>20&&JSON.stringify(keys)===JSON.stringify(ko),`Saved Bark Wall, Great Bark and Ironbark fields are the same set v38 saves (${keys.length} walls)`);
 const sv2=await po.evaluate(()=>{for(let k=0;k<60;k++)step(1/30);return JSON.stringify(snapGame());});
 const ld=await p.evaluate(s=>{applySave(JSON.parse(s));for(let k=0;k<90;k++){step(1/30);render();}
  const w=[...G.blocks.values()].filter(b=>b.t==='wall'||b.t==='twall'||b.t==='wallL');const hurt=w.filter(b=>b.hp<b.max);
  return {n:w.length,hurt:hurt.length,flinched:hurt.filter(b=>(OST.get(b)||{}).n>0).length,drawn:hurt.filter(b=>OST.has(b)).length};},sv2);
 ok(ld.n>20&&ld.hurt>=2&&ld.drawn>=2&&ld.flinched===0&&!p.errs.length&&!po.errs.length,`A v38 save loads in v40: ${ld.n} walls, the ${ld.hurt} hurt ones drawn torn by their saved health without a false flinch `+p.errs.slice(0,2));
 await po.close();await p.close();
 // missing PNG: one layer of each fails to load; those three use the procedural look and nothing breaks
 const pm=await br.newPage({viewport:{width:1280,height:800}});pm.errs=[];pm.on('pageerror',e=>pm.errs.push(String(e)));const warns=[];pm.on('console',m=>{if(/Art missing/.test(m.text()))warns.push(m.text());});
 await pm.route(/(bark-wall\/base|great-bark\/join|ironbark\/seep)\.png/,rt=>rt.abort());
 await pm.goto('http://localhost:8123/'+NEW);await pm.waitForTimeout(1200);await BUILD(pm,{secs:3,hurt:HURT});
 const fb=await pm.evaluate(()=>({s:['wall','wallL','twall'].map(t=>ART.plant[t].state),a:['wall','wallL','twall'].map(t=>!!artFor(t,0)),burner:ART.plant.combustion.state}));
 ok(fb.s.every(x=>x==='failed')&&fb.a.every(x=>!x)&&fb.burner==='ready',`Missing PNGs: all three fall back to the procedural look, the other organs stay painted ${JSON.stringify(fb)}`);
 ok(!pm.errs.length&&warns.length===3,`Missing PNGs: no page errors, one warning each (${warns.length})`);
 fs.mkdirSync('shots40',{recursive:true});await pm.evaluate(()=>{const [X,Y]=window.__X;cam.z=2;centerOn(X+9,Y+3);msgEl.style.display='none';render();});await pm.screenshot({path:'shots40/fallback.png'});await pm.close();
 // presets: Low to Epic, each drawn with the walls in view
 for(const q of ['low','medium','high','epic']){const pq=await page(NEW,q);await pq.evaluate(q=>applyQuality(q),q);await BUILD(pq,{secs:4,hurt:HURT});
  const pr=await pq.evaluate(()=>({q:SET.q,drawn:['wall','wallL','twall'].every(t=>!!artFor(t,0))}));
  await pq.evaluate(()=>{const [X,Y]=window.__X;cam.z=2;centerOn(X+9,Y+3);msgEl.style.display='none';render();});await pq.waitForTimeout(300);await pq.screenshot({path:'shots40/preset_'+q+'.png'});
  ok(pr.q===q&&(q==='low'?!pr.drawn:pr.drawn)&&!pq.errs.length,`Preset ${q}: ${pr.drawn?'painted':'procedural (art off on Low)'}, no page errors ${pq.errs.slice(0,1)}`);await pq.close();}
 console.log(`\n${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);})();
