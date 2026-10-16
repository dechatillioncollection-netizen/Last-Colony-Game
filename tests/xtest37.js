// v37 checks for the painted Root Tap, Deep Root and Chitin Vat, in the Test Range and in Survival. Each check prints PASS or FAIL.
// Simulation results are compared with the v36 build (OLD) run the same way; the art is checked from the game's own state.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const OLD=process.env.OLD||'previous/index.html',NEW=process.env.NEW||'index.html';
const CU=0,PB=1,SAND=2,COAL=3,TI=4,SI=6;let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('PASS',m);}else{fail++;console.log('FAIL',m);}};
// a small colony in the Test Range (vigor is always full there) or Survival (vigor from Sap Burners), run for secs, drawn as it runs
const BUILD=async(p,o)=>p.evaluate(async o=>{let s=5;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;
  if(o.range){startTestRange();}else{startGame('survival');}
  const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
  const X=o.range?60:G.core.x+7,Y=o.range?80:G.core.y-9;
  for(let y=Y-2;y<Y+16;y++)for(let x=X-2;x<X+30;x++){const i=y*MW+x;const b=blockAt(x,y);if(b)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
  const ore=(x,y,it)=>{for(let yy=Y+y;yy<Y+y+2;yy++)for(let xx=X+x;xx<X+x+2;xx++){const i=yy*MW+xx;if(it===SAND)G.terrain[i]=SANDF;else G.ore[i]=it;}};
  const L={};const put=(t,x,y,r,l)=>{tryPlace(t,X+x,Y+y,r||0,true);const b=blockAt(X+x,Y+y);if(b&&b.t===t){b.built=1;if(l)L[l]=b;}return b;};
  const ends={};const line=(t,x,y,r,n,l)=>{let b;for(let k=0;k<n;k++)b=put(t,x+D4X[r]*k,y+D4Y[r]*k,r);ends[l]=b;};
  [[CU,'cu'],[PB,'pb'],[COAL,'coal'],[SAND,'sand']].forEach(([it,l],k)=>{const x=k*6;ore(x,0,it);put('drill',x,0,0,'tap '+l);line(k%2?'tconveyor':'conveyor',x+2,1,0,3,'tap '+l);});
  ore(0,5,TI);put('pdrill',0,5,0,'deep ti');line('tconveyor',2,6,0,3,'deep ti');
  ore(6,5,CU);put('pdrill',6,5,0,'deep cu');line('conveyor',6,7,1,3,'deep cu');
  ore(12,5,PB);put('drill',12,5,0,'tap full');put('conveyor',14,6,0);put('wall',15,6);
  put('smelter',0,11,0,'vat');put('conveyor',-1,11,0,'vat in a');put('conveyor',0,10,1,'vat in b');line('conveyor',2,12,0,3,'vat');
  put('smelter',8,11,0,'vat nosand');line('conveyor',10,12,0,3,'vat nosand');
  if(o.burners)for(let k=0;k<2;k++)put('combustion',20+k,11,0,'burner'+k);
  for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();
  cam.z=1.6;centerOn(X+10,Y+7);G.paused=true;
  const got={},fed={coal:0,sand:0},ev={};for(const l in ends)got[l]={};
  const st=b=>OST.get(b)||{};
  for(let k=0;k<o.secs*30;k++){
    for(const b of [L.burner0,L.burner1])if(b)b.inv[COAL]=5;
    const v=L.vat;if(v.inv[COAL]<2){v.inv[COAL]++;fed.coal++;}if(v.inv[SAND]<4){v.inv[SAND]++;fed.sand++;}
    const n=L['vat nosand'];if(n.inv[COAL]<3)n.inv[COAL]=3;n.inv[SAND]=Math.min(n.inv[SAND],1);
    step(1/30);if(k%2===0)render();
    for(const [l,e] of Object.entries(ends)){if(!e)continue;for(const it of e.belt)if(it.p>.9)got[l][it.i]=(got[l][it.i]||0)+1;e.belt=e.belt.filter(it=>it.p<=.9);}}
  const out={};for(const [l,b] of Object.entries(L)){const s=st(b);out[l]={t:b.t,ore:b.oreItem,out:b.out,prog:+(+b.prog).toFixed(5),inv:b.inv.slice(),wants:b.wants,n:s.n||0,mask:s.lm||0,cyc:s.cyc,act:s.act,mine:s.mine};}
  window.__L=L;window.__X=[X,Y];
  return {got,fed,out,powSat:G.powSat,time:G.time};},o);
(async()=>{const br=await chromium.launch();
 const page=async(file,init)=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
  await p.addInitScript(q=>{try{localStorage.setItem('lc_quality',q||'medium');localStorage.setItem('lc_fog','0');}catch(e){}},init||'medium');
  await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(900);return p;};
 // ---- 1-4: mining, chitin and vigor, Test Range and Survival, both builds ----
 for(const [name,o] of [['Test Range',{range:true,secs:40}],['Survival with vigor',{secs:40,burners:true}],['Survival without vigor',{secs:25}]]){
  const pa=await page(OLD),pb=await page(NEW);const A=await BUILD(pa,o),Bn=await BUILD(pb,o);
  ok(JSON.stringify(A.got)===JSON.stringify(Bn.got)&&JSON.stringify(A.fed)===JSON.stringify(Bn.fed),`${name}: every structure shipped exactly what it did in v36 ${JSON.stringify(Bn.got)}`);
  const sim=x=>JSON.stringify(Object.fromEntries(Object.entries(x.out).map(([l,v])=>[l,[v.ore,v.out,v.prog,v.inv,v.wants]])));
  ok(sim(A)===sim(Bn),`${name}: stores, progress and inventories identical to v36`);
  const g=Bn.got,O=Bn.out;
  if(o.range||o.burners){
   ok(g['tap cu'][CU]>0&&g['tap pb'][PB]>0&&g['tap coal'][COAL]>0&&g['tap sand'][SAND]>0&&Object.keys(g['tap cu']).length===1,`${name}: Root Taps ship copper, lead, coal and sand, each only its own ore`);
   ok(g['deep ti'][TI]>0&&g['deep cu'][CU]>0,`${name}: Deep Roots ship titanium (${g['deep ti'][TI]}) and copper (${g['deep cu'][CU]})`);
   // painted events: one mining event per piece mined (taps that ship everything at once), none for the backed-up tap
   const mined=l=>Object.values(g[l]).reduce((a,b)=>a+b,0);
   ok(['tap cu','tap pb','tap coal','tap sand','deep ti','deep cu'].every(l=>Math.abs(O[l].n-(mined(l)+O[l].out))<=2),`${name}: the tendril pulse fired once per piece mined (${['tap cu','deep ti'].map(l=>O[l].n+' events / '+(mined(l)+O[l].out)+' pieces').join(', ')})`);
   ok(O['tap full'].out===10&&O['tap full'].n===14&&Bn.time-O['tap full'].mine>5,`${name}: the backed-up Root Tap (4 pieces in its vine, 10 stored) shows 14 pulses, then rests (last pulse ${(Bn.time-O['tap full'].mine).toFixed(1)} s ago)`);
   const made=g['vat'][SI]||0;const used={coal:Bn.fed.coal-O.vat.inv[COAL],sand:Bn.fed.sand-O.vat.inv[SAND]};
   ok(made>0&&used.coal===made+0&&used.sand===2*made||Math.abs(used.coal-made)<=1&&Math.abs(used.sand-2*made)<=2,`${name}: Chitin Vat made ${made} chitin from ${used.coal} coal and ${used.sand} sand (1:2)`);
   ok(!g['vat nosand'][SI]&&O['vat nosand'].inv[SAND]<2&&Bn.time-(O['vat nosand'].act??-9)>1,`${name}: the Chitin Vat short of sand makes nothing and its fluid stays slow`);
   ok(O.vat.mask&&(O.vat.mask&O.vat.mask-1),`${name}: the working vat opens vessels to its inlets and outlet (mask ${O.vat.mask.toString(2)})`);
  }else{
   ok(Bn.powSat===0&&!g["vat"][SI]&&O.vat.prog<.1,`${name}: no vigor, no chitin and its progress stays put at ${O.vat.prog} (vigor ${Bn.powSat})`);
   ok(Bn.time-(O.vat.act??-9)>1,`${name}: with no vigor the vat's art reads it as resting`);}
  ok(!pa.errs.length&&!pb.errs.length,`${name}: no page errors ${pb.errs.slice(0,2)}`);await pa.close();await pb.close();}
 // ---- 6, 8, 9, 11, 12, 13: connections, damage, zoom, art off, missing art, presets ----
 const p=await page(NEW);await BUILD(p,{secs:8,burners:true});
 const r=await p.evaluate(()=>{const L=window.__L,R={};const st=b=>OST.get(b);
  // connections: a vine leaving the tap's right side, a Swift Vine, a vine pointing into a tap, a Resin Gland beside a copper tap
  R.capR=(st(L['tap cu']).lm>>0&3)!==0;R.swift=(st(L['tap pb']).lm>>0&3)!==0;
  const [X,Y]=window.__X;tryPlace('conveyor',X-1,Y,0,true);blockAt(X-1,Y).built=1;tryPlace('press',X,Y+2,0,true);blockAt(X,Y+2).built=1;
  G.dirty=true;recompute();G.time+=1;render();const m=st(L['tap cu']).lm;R.intoTap=!(m>>4&1);R.press=!(m>>2&3);
  // damage: hurt, then destroyed; zoom levels
  hurtBlock(L['tap coal'],50);render();R.hit=L['tap coal'].hit>0;hurtBlock(L['deep cu'],1e6);for(let k=0;k<5;k++){step(1/30);render();}R.gone=!G.blocks.has(L['deep cu'].id);
  hurtBlock(L.vat,150);render();R.vatHurt=L.vat.hp<L.vat.max;R.hp=[L['tap coal'].hp,L.vat.hp];
  const zl={};for(const z of [.5,.74,1,1.6,2.5]){cam.z=z;render();zl[z]=organLite('drill');}R.zoom=zl;cam.z=1.6;
  // art off
  SET.art=false;render();R.offDrawn=!artFor('drill',0);SET.art=true;render();R.onAgain=!!artFor('drill',0)&&!!artFor('smelter',0)&&!!artFor('pdrill',0);
  return R;});
 ok(r.capR&&r.swift,'Vine and Swift Vine leaving a tap: the tap opens a vessel on that edge');
 ok(r.intoTap,'A vine pointing into a Root Tap: no opening (nothing can pass)');
 ok(r.press,'A Resin Gland beside a copper Root Tap: no opening (it never takes copper)');
 ok(r.hit&&r.gone&&r.vatHurt,JSON.stringify(r.hp)+' Damage flashes and health bars stay; a destroyed Deep Root disappears cleanly');
 ok(r.zoom[.5]&&r.zoom[.74]&&!r.zoom[1]&&!r.zoom[2.5],`Zoomed out (below 0.75) the baked look is used, at normal zoom and closer the full art ${JSON.stringify(r.zoom)}`);
 ok(r.offDrawn&&r.onAgain,'Painted art off: the procedural look; on again: painted');
 ok(!p.errs.length,'No page errors through connections, damage, zoom and art off/on '+p.errs.slice(0,2));
 // Save and load: v37 saves load in v36 and the other way round, and carry nothing new
 const sv=await p.evaluate(()=>{const S=snapGame();return JSON.stringify(S);});
 const keys=JSON.parse(sv).blocks.filter(b=>b.t==='drill'||b.t==='pdrill'||b.t==='smelter').map(b=>Object.keys(b).sort().join(','));
 const po=await page(OLD);await po.evaluate(s=>applySave(JSON.parse(s)),sv);const ko=await po.evaluate(()=>{const S=snapGame();return S.blocks.filter(b=>b.t==='drill'||b.t==='pdrill'||b.t==='smelter').map(b=>Object.keys(b).sort().join(','));});
 ok(JSON.stringify(keys)===JSON.stringify(ko),'Saved Root Tap, Deep Root and Chitin Vat fields are the same set v36 saves');
 const sv2=await po.evaluate(()=>{for(let k=0;k<60;k++)step(1/30);return JSON.stringify(snapGame());});
 await p.evaluate(s=>{applySave(JSON.parse(s));for(let k=0;k<90;k++){step(1/30);render();}},sv2);
 const after=await p.evaluate(()=>[...G.blocks.values()].filter(b=>b.t==='drill'||b.t==='smelter'||b.t==='pdrill').length);
 ok(after>0&&!p.errs.length&&!po.errs.length,`A v36 save loads in v37 and plays on with the painted growths (${after} of them) `+p.errs.slice(0,2));
 await po.close();await p.close();
 // missing PNG: one layer of each fails to load, the procedural look is used and nothing breaks
 const pm=await br.newPage({viewport:{width:1280,height:800}});pm.errs=[];pm.on('pageerror',e=>pm.errs.push(String(e)));const warns=[];pm.on('console',m=>{if(/Art missing/.test(m.text()))warns.push(m.text());});
 await pm.route(/(root-tap\/sac|deep-root\/base|chitin-vat\/plate)\.png/,rt=>rt.abort());
 await pm.goto('http://localhost:8123/'+NEW);await pm.waitForTimeout(1200);await BUILD(pm,{range:true,secs:4});
 const fb=await pm.evaluate(()=>({s:['drill','pdrill','smelter'].map(t=>ART.plant[t].state),a:['drill','pdrill','smelter'].map(t=>!!artFor(t,0)),bulb:ART.plant.router.state}));
 ok(fb.s.every(x=>x==='failed')&&fb.a.every(x=>!x)&&fb.bulb==='ready',`Missing PNGs: all three fall back to the procedural look, the other organs stay painted ${JSON.stringify(fb)}`);
 ok(!pm.errs.length&&warns.length===3,`Missing PNGs: no page errors, one warning each (${warns.length})`);
 fs.mkdirSync('shots37',{recursive:true});await pm.evaluate(()=>{const [X,Y]=window.__X;cam.z=1.6;centerOn(X+9,Y+7);msgEl.style.display='none';render();});await pm.screenshot({path:'shots37/fallback.png'});await pm.close();
 // presets: Low to Epic, each drawn with the colony in view
 for(const q of ['low','medium','high','epic']){const pq=await page(NEW,q);await pq.evaluate(q=>applyQuality(q),q);await BUILD(pq,{range:true,secs:6});
  const pr=await pq.evaluate(()=>({q:SET.q,art:SET.art,drawn:!!artFor('drill',0)}));
  await pq.evaluate(()=>{const [X,Y]=window.__X;cam.z=1.6;centerOn(X+9,Y+7);msgEl.style.display='none';render();});await pq.waitForTimeout(300);await pq.screenshot({path:'shots37/preset_'+q+'.png'});
  ok(pr.q===q&&(q==='low'?!pr.drawn:pr.drawn)&&!pq.errs.length,`Preset ${q}: ${pr.drawn?'painted':'procedural (art off on Low)'}, no page errors ${pq.errs.slice(0,1)}`);await pq.close();}
 console.log(`\n${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);})();
