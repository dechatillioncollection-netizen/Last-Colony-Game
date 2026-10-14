const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.addInitScript(()=>{try{localStorage.setItem('lc_hd','1');localStorage.setItem('lc_fog','1');localStorage.setItem('lc_art','1')}catch(e){}});
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
 const r0=await p.evaluate(()=>{startTestRange();const G=window.__game();return {blocks:G.blocks.size,units:G.units.length,en:G.enemies.length,arenas:G.test.arenas.length,core:!!G.core};});
 console.log('built',JSON.stringify(r0));await p.waitForTimeout(500);await p.screenshot({path:'tr_swarm.png'});
 await p.evaluate(()=>testGo('hdf'));await p.waitForTimeout(300);await p.screenshot({path:'tr_hdf.png'});
 await p.evaluate(()=>testGo('gal'));await p.waitForTimeout(300);await p.screenshot({path:'tr_gal.png'});
 await p.evaluate(()=>{cam.z=.42;centerOn(48,48);});await p.waitForTimeout(300);await p.screenshot({path:'tr_overview.png'});
 // frozen check: run 20s with nothing spawned
 const snap=()=>p.evaluate(()=>{const G=window.__game();return JSON.stringify({u:G.units.map(u=>[u.x.toFixed(2),u.y.toFixed(2),u.hp]),e:G.enemies.map(e=>[e.x.toFixed(2),e.y.toFixed(2),e.hp]),hp:[...G.blocks.values()].reduce((a,b)=>a+b.hp,0),n:G.blocks.size});});
 const s0=await snap();await p.evaluate(()=>{for(let k=0;k<30*20;k++)step(1/30);});const s1=await snap();console.log('frozen showcase unchanged:',s0===s1);
 // export the save file
 const file=await p.evaluate(async()=>JSON.stringify({game:'Last Colony',v:1,when:Date.now(),label:'Test range',save:await encodeSave(),campaign:null,sectors:{}}));
 fs.writeFileSync('last-colony-test-range.json',file);console.log('save bytes',file.length);
 // arena 1: turrets vs HDF units, with ants
 await p.click('#testPanel [data-arena="0"]');await p.click('#testPanel [data-n="5"]');
 for(const t of ['dagger','crawler','mace','flare','horizon','fortress'])await p.click(`#testPanel [data-e="${t}"]`);
 await p.click('#testPanel [data-u="tank"]');
 await p.waitForTimeout(4000);await p.screenshot({path:'tr_arena1.png'});
 const r1=await p.evaluate(()=>{const G=window.__game();for(let k=0;k<30*40;k++)step(1/30);const A=G.test.arenas[0];
   return {enemiesLeftInArena:G.enemies.filter(e=>arenaAt(e.x,e.y)===0).length,kills:G.kills,unitsInArena:G.units.filter(u=>arenaAt(u.x,u.y)===0).length,
     turrets:[...G.blocks.values()].filter(b=>arenaAt(b.x,b.y)===0&&B[b.t].tur).map(b=>b.t+':'+Math.round(b.hp)).join(' '),walls:[...G.blocks.values()].filter(b=>b.arenaWall&&b.hp<b.max).length,over:G.over};});
 console.log('arena1',JSON.stringify(r1));
 // arena 2: ants vs HDF turrets
 await p.click('#testPanel [data-arena="1"]');await p.click('#testPanel [data-n="10"]');await p.click('#testPanel [data-u="tank"]');await p.click('#testPanel [data-u="htank"]');await p.click('#testPanel [data-n="3"]');await p.click('#testPanel [data-e="dagger"]');
 await p.waitForTimeout(5000);await p.screenshot({path:'tr_arena2.png'});
 const r2=await p.evaluate(()=>{const G=window.__game();const before=[...G.blocks.values()].filter(b=>arenaAt(b.x,b.y)===1&&b.team===1).length;for(let k=0;k<30*60;k++)step(1/30);
   return {hdfBlocksBefore:before,hdfBlocksAfter:[...G.blocks.values()].filter(b=>arenaAt(b.x,b.y)===1&&b.team===1).length,ants:G.units.filter(u=>arenaAt(u.x,u.y)===1).length,en:G.enemies.filter(e=>arenaAt(e.x,e.y)===1).length,walls:[...G.blocks.values()].filter(b=>b.arenaWall&&b.hp<b.max).length};});
 console.log('arena2',JSON.stringify(r2));
 await p.click('#testPanel #trReset');const r3=await p.evaluate(()=>({hdf:[...window.__game().blocks.values()].filter(b=>arenaAt(b.x,b.y)===1&&b.team===1).length,ants:window.__game().units.filter(u=>arenaAt(u.x,u.y)===1).length}));console.log('reset',JSON.stringify(r3));
 const s2=await snap();const a=JSON.parse(s0),c=JSON.parse(s2);console.log('showcase units still frozen:',JSON.stringify(a.u.slice(0,3))===JSON.stringify(c.u.slice(0,3)),'showcase enemies frozen:',JSON.stringify(a.e.slice(0,6))===JSON.stringify(c.e.slice(0,6)));
 // reload the exported file into a fresh page
 const p2=await b.newPage({viewport:{width:1280,height:800}});p2.on('pageerror',e=>errs.push('p2 '+e.message));
 await p2.goto('file://'+process.cwd()+'/index.html');await p2.waitForTimeout(800);
 await p2.setInputFiles('#impFile','last-colony-test-range.json');await p2.waitForTimeout(1500);
 console.log('imported',JSON.stringify(await p2.evaluate(()=>{const G=window.__game();return G?{test:!!G.test,blocks:G.blocks.size,units:G.units.length,en:G.enemies.length,panel:!document.getElementById('testPanel').hidden,label:saveLabel()}:null;})));
 await p2.screenshot({path:'tr_import.png'});
 console.log('errs',errs);await b.close();})();
