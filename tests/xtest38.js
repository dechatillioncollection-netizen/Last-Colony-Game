// v38 checks for the painted Sap Burner, Sunleaf and Spore Bellows, in the Test Range and in Survival. Each check prints PASS or FAIL.
// Simulation results are compared with the v37 build (OLD) run the same way; the art is checked from the game's own state.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const OLD=process.env.OLD||'previous/index.html',NEW=process.env.NEW||'index.html';
const COAL=3;let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('PASS',m);}else{fail++;console.log('FAIL',m);}};
// a small colony, placed where the Bloom's own Rootweb never reaches (so a Rootweb Node there really spreads), run for secs, drawn as it runs.
// o.vigor: a coal tap feeding a Sap Burner, a stocked burner, three burners round a Splitter Bulb and six Sunleaves; without it, none of them
const BUILD=async(p,o)=>p.evaluate(async o=>{let s=5;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;
  if(o.range){startTestRange();}else{startGame('survival');}
  const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
  const cl=new Set(G.core?webList(G.core):[]);let X=-1,Y=-1;
  for(let y=4;y<MH-22&&X<0;y+=2)for(let x=4;x<MW-32;x+=2){let f=true;for(let yy=y-2;yy<y+19&&f;yy++)for(let xx=x-2;xx<x+30;xx++)if(cl.has(yy*MW+xx)){f=false;break;}if(f){X=x;Y=y;break;}}
  for(let y=Y-2;y<Y+19;y++)for(let x=X-2;x<X+30;x++){const i=y*MW+x;const b=blockAt(x,y);if(b)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,y<Y+5?1:0);}
  const ore=(x,y,it)=>{for(let yy=Y+y;yy<Y+y+2;yy++)for(let xx=X+x;xx<X+x+2;xx++)G.ore[yy*MW+xx]=it;};
  const L={};const put=(t,x,y,r,l)=>{tryPlace(t,X+x,Y+y,r||0,true);const b=blockAt(X+x,Y+y);if(b&&b.t===t){b.built=1;if(l)L[l]=b;}return b;};
  if(o.vigor){ore(0,0,COAL);put('drill',0,0,0,'coal tap');put('conveyor',2,1,0);}
  put('combustion',3,1,0,'burner fed');put('combustion',6,1,0,'burner idle');
  if(o.vigor){put('combustion',8,1,0,'burner stocked');ore(11,0,COAL);put('drill',11,0,0);put('conveyor',13,1,0);put('router',14,1);
    put('combustion',15,1,0,'burner group');put('combustion',14,0,0);put('combustion',14,2,0);for(let k=0;k<6;k++)put('solar',18+k,1,0,k?null:'leaf');}
  put('bellows',2,8,0,'bel');setWeb((Y+9)*MW+X+7,1);put('node',7,9,0,'node');put('bellows',24,10,0,'bel far');
  for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();
  cam.z=1.2;centerOn(X+12,Y+8);G.paused=true;
  const st=b=>OST.get(b)||{};const eats={};const grow=[];let ex=0,lastEx=-9;
  for(let k=0;k<o.secs*30;k++){
    if(L['burner stocked'])L['burner stocked'].inv[COAL]=5;
    const before={};for(const [l,b] of Object.entries(L))if(b.t==='combustion')before[l]=b.burn;
    step(1/30);if(k%2===0)render();
    for(const [l,b] of Object.entries(L))if(b.t==='combustion'&&b.burn>before[l]+.5)eats[l]=(eats[l]||0)+1;   // the simulation's own count of coal taken in
    const sb=st(L.bel);if(sb.ex!==undefined&&sb.ex!==lastEx){if(sb.ex>0)ex++;lastEx=sb.ex;}
    if(k===8*30)grow.push(L.node.wi||0);}
  const out={};for(const [l,b] of Object.entries(L)){const s=st(b);out[l]={t:b.t,burn:b.burn!=null?+b.burn.toFixed(5):null,inv:b.inv.slice(),hp:b.hp,wi:b.wi||0,n:s.n||0,gl:s.gl,mask:s.lm||0,ph:s.ph,ex:s.ex,grow:s.grow,src:s.src?s.src.length:null};}
  let h=0;for(let i=0;i<G.web.length;i++)h=(h*31+G.web[i])|0;
  window.__L=L;window.__X=[X,Y];
  return {out,eats,ex,grow,powSat:G.powSat,powGen:G.powGen,powUse:G.powUse,webCount:G.webCount,webHash:h,time:G.time};},o);
(async()=>{const br=await chromium.launch();
 const page=async(file,init)=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
  await p.addInitScript(q=>{try{localStorage.setItem('lc_quality',q||'medium');localStorage.setItem('lc_fog','0');}catch(e){}},init||'medium');
  await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(900);return p;};
 // ---- vigor, coal and Rootweb spread in the Test Range and Survival, with and without vigor, both builds ----
 for(const [name,o] of [['Test Range',{range:true,secs:30,vigor:true}],['Survival with vigor',{secs:30,vigor:true}],['Survival without vigor',{secs:20}]]){
  const pa=await page(OLD),pb=await page(NEW);const A=await BUILD(pa,o),Bn=await BUILD(pb,o);
  const sim=x=>JSON.stringify([x.powSat,x.powGen,x.powUse,x.webCount,x.webHash,x.eats,x.grow,Object.fromEntries(Object.entries(x.out).map(([l,v])=>[l,[v.burn,v.inv,v.hp,v.wi]]))]);
  ok(sim(A)===sim(Bn),`${name}: vigor made and used, coal burned, Rootweb spread and every store identical to v37 (vigor ${Bn.powGen}/${Bn.powUse}, Rootweb ${Bn.webCount} tiles)`);
  const O=Bn.out,E=Bn.eats;
  ok(['burner fed','burner idle','burner stocked','burner group'].filter(l=>O[l]).every(l=>Math.abs(O[l].n-(E[l]||0))<=1),`${name}: each Sap Burner's chamber flared once per piece of coal it really took in (${['burner fed','burner stocked','burner group'].filter(l=>O[l]).map(l=>l+' '+O[l].n+'/'+(E[l]||0)).join(', ')})`);
  ok(O['burner idle'].n===0&&!(O['burner idle'].gl>.01)&&O['burner idle'].burn<=0,`${name}: the Sap Burner with no coal never flares and its chamber stays dark (glow ${O['burner idle'].gl})`);
  if(o.vigor){
   ok(E['burner stocked']>=14&&O['burner stocked'].gl>.4,`${name}: the stocked Sap Burner burns steadily (${E['burner stocked']} pieces, glow ${(+O['burner stocked'].gl).toFixed(2)})`);
   ok(O['burner fed'].mask===1<<2,`${name}: the burner fed by vine opens a vessel only on the side the vine comes in from (mask ${O['burner fed'].mask.toString(2)})`);
   ok(O['burner group'].mask===1<<2&&O['burner idle'].mask===0,`${name}: a burner beside a Splitter Bulb opens towards it; the lone burner opens nothing`);
   ok(Bn.powSat>=.25&&O.bel.src===1&&Bn.ex>=2&&Bn.grow[0]>0,`${name}: the Spore Bellows breathed out ${Bn.ex} times while the Rootweb Node it boosts was spreading (node at ${Bn.grow[0]} after 8 s)`);
   ok(O['bel far'].ex===-9&&O['bel far'].ph===0,`${name}: the Spore Bellows with nothing to boost never breathes out (it only rests)`);
   ok(O.node.wi>=(O.node.wi)&&Bn.time-O.bel.grow>3&&O.bel.ph===0,`${name}: once the node has covered its ground the Bellows rests (last growth ${(Bn.time-O.bel.grow).toFixed(1)} s ago)`);
  }else{
   ok(Bn.powSat===0&&Bn.ex===0&&O.bel.ph===0,`${name}: no vigor: the node still spreads at its normal rate (${O.node.wi}), but the Bellows boosts nothing and never breathes out`);}
  ok(!pa.errs.length&&!pb.errs.length,`${name}: no page errors ${pb.errs.slice(0,2)}`);await pa.close();await pb.close();}
 // ---- damage, zoom, groups, art off ----
 const p=await page(NEW);await BUILD(p,{secs:6,vigor:true});
 const r=await p.evaluate(()=>{const L=window.__L,R={};const [X,Y]=window.__X;
  hurtBlock(L['burner fed'],40);render();R.hit=L['burner fed'].hit>0;hurtBlock(L.leaf,1e6);hurtBlock(L['bel far'],1e6);for(let k=0;k<5;k++){step(1/30);render();}
  R.gone=!G.blocks.has(L.leaf.id)&&!G.blocks.has(L['bel far'].id);hurtBlock(L.bel,120);render();R.belHurt=L.bel.hp<L.bel.max;
  const zl={};for(const z of [.5,.74,1,1.6,2.5]){cam.z=z;render();zl[z]=['combustion','solar','bellows'].map(t=>organLite(t)?1:0).join('');}R.zoom=zl;
  // a crowd of Sunleaves and Sap Burners in view: past 40 of a kind it draws the baked look
  cam.z=1;centerOn(X+12,Y+8);render();R.few=[ORGAN_N.solar,organLite('solar')];
  for(let k=0;k<44;k++){tryPlace('solar',X+(k%11)*2,Y+12+Math.floor(k/11)*2,0,true);const b=blockAt(X+(k%11)*2,Y+12+Math.floor(k/11)*2);if(b)b.built=1;}
  render();R.many=[ORGAN_N.solar,organLite('solar')];
  SET.art=false;render();R.off=!artFor('combustion',0)&&!artFor('solar',0)&&!artFor('bellows',0);SET.art=true;render();R.on=!!artFor('combustion',0)&&!!artFor('solar',0)&&!!artFor('bellows',0);
  return R;});
 ok(r.hit&&r.gone&&r.belHurt,'Damage flashes and health bars stay; a destroyed Sunleaf and Spore Bellows disappear cleanly');
 ok(r.zoom[.5]==='111'&&r.zoom[.74]==='111'&&r.zoom[1]==='000'&&r.zoom[2.5]==='000',`Zoomed out (below 0.75) the baked look, at normal zoom and closer the full art ${JSON.stringify(r.zoom)}`);
 ok(!r.few[1]&&r.many[1]&&r.many[0]>40,`Crowds: ${r.few[0]} Sunleaves in view are drawn in full, ${r.many[0]} use the baked look`);
 ok(r.off&&r.on,'Painted art off: the procedural look; on again: painted');
 ok(!p.errs.length,'No page errors through damage, zoom, crowds and art off/on '+p.errs.slice(0,2));
 // save and load: the same saved fields as v37, and a v37 save plays on here
 const kinds=['combustion','solar','bellows'];
 const sv=await p.evaluate(()=>JSON.stringify(snapGame()));const keys=JSON.parse(sv).blocks.filter(b=>kinds.includes(b.t)).map(b=>b.t+':'+Object.keys(b).sort().join(','));
 const po=await page(OLD);await po.evaluate(s=>applySave(JSON.parse(s)),sv);const ko=await po.evaluate(k=>snapGame().blocks.filter(b=>k.includes(b.t)).map(b=>b.t+':'+Object.keys(b).sort().join(',')),kinds);
 ok(keys.length>10&&JSON.stringify(keys)===JSON.stringify(ko),`Saved Sap Burner, Sunleaf and Spore Bellows fields are the same set v37 saves (${keys.length} growths)`);
 const sv2=await po.evaluate(()=>{for(let k=0;k<60;k++)step(1/30);return JSON.stringify(snapGame());});
 await p.evaluate(s=>{applySave(JSON.parse(s));for(let k=0;k<90;k++){step(1/30);render();}},sv2);
 const after=await p.evaluate(k=>[...G.blocks.values()].filter(b=>k.includes(b.t)).length,kinds);
 ok(after>10&&!p.errs.length&&!po.errs.length,`A v37 save loads in v38 and plays on with the painted growths (${after} of them) `+p.errs.slice(0,2));
 await po.close();await p.close();
 // missing PNG: one layer of each fails to load; those three use the procedural look and nothing breaks
 const pm=await br.newPage({viewport:{width:1280,height:800}});pm.errs=[];pm.on('pageerror',e=>pm.errs.push(String(e)));const warns=[];pm.on('console',m=>{if(/Art missing/.test(m.text()))warns.push(m.text());});
 await pm.route(/(sap-burner\/chamber|sunleaf\/leaves|spore-bellows\/sac)\.png/,rt=>rt.abort());
 await pm.goto('http://localhost:8123/'+NEW);await pm.waitForTimeout(1200);await BUILD(pm,{range:true,secs:4,vigor:true});
 const fb=await pm.evaluate(()=>({s:['combustion','solar','bellows'].map(t=>ART.plant[t].state),a:['combustion','solar','bellows'].map(t=>!!artFor(t,0)),tap:ART.plant.drill.state}));
 ok(fb.s.every(x=>x==='failed')&&fb.a.every(x=>!x)&&fb.tap==='ready',`Missing PNGs: all three fall back to the procedural look, the other organs stay painted ${JSON.stringify(fb)}`);
 ok(!pm.errs.length&&warns.length===3,`Missing PNGs: no page errors, one warning each (${warns.length})`);
 fs.mkdirSync('shots38',{recursive:true});await pm.evaluate(()=>{const [X,Y]=window.__X;cam.z=1.6;centerOn(X+12,Y+6);msgEl.style.display='none';render();});await pm.screenshot({path:'shots38/fallback.png'});await pm.close();
 // presets: Low to Epic, each drawn with the colony in view
 for(const q of ['low','medium','high','epic']){const pq=await page(NEW,q);await pq.evaluate(q=>applyQuality(q),q);await BUILD(pq,{range:true,secs:6,vigor:true});
  const pr=await pq.evaluate(()=>({q:SET.q,drawn:['combustion','solar','bellows'].every(t=>!!artFor(t,0))}));
  await pq.evaluate(()=>{const [X,Y]=window.__X;cam.z=1.6;centerOn(X+12,Y+6);msgEl.style.display='none';render();});await pq.waitForTimeout(300);await pq.screenshot({path:'shots38/preset_'+q+'.png'});
  ok(pr.q===q&&(q==='low'?!pr.drawn:pr.drawn)&&!pq.errs.length,`Preset ${q}: ${pr.drawn?'painted':'procedural (art off on Low)'}, no page errors ${pq.errs.slice(0,1)}`);await pq.close();}
 console.log(`\n${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);})();
