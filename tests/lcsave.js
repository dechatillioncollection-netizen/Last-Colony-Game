const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:800},acceptDownloads:true});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(400);
 // 1. skirmish save round trip
 const r1=await p.evaluate(async()=>{startGame('siege');const G0=window.__game();for(let k=0;k<30*200;k++)step(1/30);
   const sig=g=>({blocks:g.blocks.size,units:g.units.length,en:g.enemies.length,items:g.items.map(Math.floor).join('/'),wave:g.wave,web:g.webCount,time:Math.round(g.time),eitems:g.eitems.map(Math.floor).join('/'),core:g.core.hp,ec:g.ecores.length});
   const a=sig(G0);const s=await encodeSave();const S=await decodeSave(s);applySave(S);const G1=window.__game();const bb=sig(G1);
   for(let k=0;k<30*30;k++)step(1/30);return {a,b:bb,len:s.length,after:sig(window.__game())};});
 console.log('roundtrip',JSON.stringify(r1));
 // 2. slot save + load via UI
 await p.click('#saveBtn');await p.waitForTimeout(300);await p.click('[data-save="slot1"]');await p.waitForTimeout(800);
 await p.screenshot({path:'c_saves.png'});
 const t1=await p.evaluate(()=>window.__game().time);
 await p.evaluate(()=>{for(let k=0;k<30*20;k++)step(1/30);});
 await p.click('[data-load="slot1"]');await p.waitForTimeout(800);
 console.log('slot load time',t1.toFixed(1),'->',(await p.evaluate(()=>window.__game().time)).toFixed(1),'saves hidden',await p.evaluate(()=>$('saves').hidden));
 // 3. export + import file
 await p.click('#saveBtn');await p.waitForTimeout(300);
 const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#expBtn')]);const path='exported_save.json';await dl.saveAs(path);
 console.log('exported',require('fs').statSync(path).size,'bytes');await p.click('#savesClose');
 await p.evaluate(()=>{startGame('survival');});
 await p.click('#saveBtn');await p.waitForTimeout(300);await p.setInputFiles('#impFile',path);await p.waitForTimeout(1500);
 console.log('imported mode',await p.evaluate(()=>window.__game().mode+' MW '+MW+' t '+window.__game().time.toFixed(1)));
 // 4. campaign: win landfall instantly, check capture, global stock, research from the planet
 const r4=await p.evaluate(async()=>{await loadCamp();startMission('landfall');skipDlg();const G=window.__game();G.story=null;for(let k=0;k<30*120;k++)step(1/30);G.wave=G.winWave;G.enemies.length=0;G.spawnQ.length=0;step(1/30);skipDlg();await new Promise(r=>setTimeout(r,800));
   return {over:G.over,cap:CAMP.captured.landfall,global:CAMP.global.map(Math.floor)};});
 console.log('capture',JSON.stringify(r4));
 await p.screenshot({path:'c_captured.png'});
 await p.click('#toPlanet');await p.waitForTimeout(1200);await p.evaluate(()=>focusSector('ember'));await p.waitForTimeout(1500);await p.screenshot({path:'c_planet2.png'});
 await p.click('#pTech');await p.waitForTimeout(500);await p.screenshot({path:'c_tech.png'});
 const r5=await p.evaluate(()=>{const before=CAMP.global.slice(0,2).map(Math.floor);const el=[...document.querySelectorAll('.tnode.ready')].find(e=>e.textContent.includes('Vine Knot'));if(el)el.click();return {before,after:CAMP.global.slice(0,2).map(Math.floor),has:CAMP.researched.has('junction'),saved:localStorage.getItem('lc_campaign')?.length};});
 console.log('research',JSON.stringify(r5));
 await p.click('#techClose');await p.waitForTimeout(300);
 // reload page: campaign persists
 await p.reload();await p.waitForTimeout(600);await p.click('#m-campaign');await p.waitForTimeout(1000);
 console.log('after reload',await p.evaluate(()=>JSON.stringify({cap:Object.keys(CAMP.captured),j:CAMP.researched.has('junction')})));
 await p.screenshot({path:'c_planet3.png'});
 console.log('errors',errs.slice(0,6));await b.close();})();
