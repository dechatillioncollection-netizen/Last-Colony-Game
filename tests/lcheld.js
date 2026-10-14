const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];
 p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.addInitScript(()=>{try{localStorage.setItem('lc_hd','0');localStorage.setItem('lc_fog','0')}catch(e){}});
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(400);
 const W=process.argv[2]||'landfall';
 const r1=await p.evaluate(async(W)=>{await loadCamp();CAMP.researched=new Set(BASE_TECH);for(const m of MISSIONS)for(const t of m.need)CAMP.researched.add(t);startMission(W);skipDlg();const G=window.__game();
   G.webFree=true;const cx=G.core.x,cy=G.core.y;let placed=0;
   for(const [x,y] of [[cx-4,cy-4],[cx-4,cy+5],[cx+6,cy-3]]){if(tryPlace('wall',x,y,0,true))placed++;}
   for(let k=0;k<30*60;k++)step(1/30);
   if(G.mode==='siege'){for(const c of [...G.ecores])destroyBlock(c);}else{G.wave=G.winWave;G.enemies.length=0;G.spawnQ.length=0;step(1/30);}
   skipDlg();const eb=[...G.blocks.values()].filter(b=>b.team===1).length;
   await new Promise(r=>setTimeout(r,800));
   return {placed,over:G.over,held:G.held,mode:G.mode,ebAtEnd:eb,ebAfter:[...G.blocks.values()].filter(b=>b.team===1).length,own:[...G.blocks.values()].filter(b=>b.team===0).length,
     saved:(localStorage.getItem('lc_sector-'+W)||'').length,items:G.items.map(Math.floor).join('/'),global:CAMP.global.map(Math.floor).join('/')};},W);
 console.log('capture',JSON.stringify(r1));
 await p.screenshot({path:'h_captured.png'});
 await p.click('#stay');await p.waitForTimeout(300);
 const r2=await p.evaluate(()=>{const G=window.__game();const w=G.wave;for(let k=0;k<30*200;k++)step(1/30);return {over:G.over,wave0:w,wave:G.wave,en:G.enemies.length,skip:$('skip').textContent,lbl:$('w-lbl').textContent+' '+$('w-t').textContent};});
 console.log('stay',JSON.stringify(r2));
 // put a Deep Root on titanium and feed the heart
 const r3=await p.evaluate(()=>{const G=window.__game();G.webFree=true;G.items[5]+=200;G.items[0]+=500;let d=null,best=-1;
   for(const [vx,vy,vi] of G.veins){if(vi!==TI)continue;for(let y=Math.floor(vy)-3;y<=vy+2;y++)for(let x=Math.floor(vx)-3;x<=vx+2;x++){if(placeCheck('pdrill',x,y))continue;const o=drillOre('pdrill',x,y);if(o.item===TI&&o.count>best){best=o.count;d=[x,y];}}}
   const tier1=d?placeCheck('drill',d[0],d[1]):'no spot';
   if(!d)return {err:'no TI spot'};tryPlace('pdrill',d[0],d[1],0,true);const db=G.blocks.get(G.bgrid[d[1]*MW+d[0]]);const ok=routeBelt(db,G.core,0);
   for(let k=0;k<30*150;k++)step(1/30);return {tier1,spot:d,count:best,belt:ok,ti:Math.floor(G.items[TI]),incTI:G.incRate[TI].toFixed(1),own:[...G.blocks.values()].filter(b=>b.team===0).length};});
 console.log('titanium',JSON.stringify(r3));
 await p.screenshot({path:'h_held.png'});
 await p.click('#skip');await p.waitForTimeout(1200);
 const r4=await p.evaluate((W)=>({planet:!$('planet').hidden,G:!!window.__game(),rates:CAMP.captured[W].rates.join('/'),global:CAMP.global.map(Math.floor).join('/'),btn:$('launch').textContent,note:JSON.stringify(PL.note)}),W);
 console.log('leave',JSON.stringify(r4));
 await p.screenshot({path:'h_planet.png'});
 await p.reload();await p.waitForTimeout(600);await p.click('#m-campaign');await p.waitForTimeout(1000);
 await p.evaluate((W)=>focusSector(W),W);await p.waitForTimeout(300);await p.click('#launch');await p.waitForTimeout(1500);
 const r5=await p.evaluate(()=>{const G=window.__game();const t=G.time;for(let k=0;k<30*30;k++)step(1/30);return {held:G.held,mode:G.mode,own:[...G.blocks.values()].filter(b=>b.team===0).length,pdrills:[...G.blocks.values()].filter(b=>b.t==='pdrill').length,ti:Math.floor(G.items[TI]),time:Math.round(t),wave:G.wave,quit:(renderSlots(),$('quitBtn').textContent)};});
 console.log('return after reload',JSON.stringify(r5));
 await p.screenshot({path:'h_return.png'});
 console.log('errors',errs.slice(0,6));await b.close();})();
