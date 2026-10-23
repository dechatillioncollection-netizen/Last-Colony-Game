// v59: the main menu left alone for 30 minutes (MINS) with its live scenes rotating every 45 seconds as usual. Every minute: the page's
// script heap after a garbage collection, DOM nodes, the scene's entities, the renderer's leftover lists, Rootweb chunks, and the steps
// and frames run in that minute. Passes when the heap and node count settle (the last ten minutes no higher than the first ten by more
// than a few MB), the entities stay within their caps and the pace holds. Writes idle59.json (OUT).
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html',MINS=+(process.env.MINS||30),OUT=process.env.OUT||'idle59.json';
(async()=>{const br=await chromium.launch({args:['--js-flags=--expose-gc','--enable-precise-memory-info']});const p=await br.newPage({viewport:{width:1920,height:1080}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(()=>{localStorage.clear();localStorage.setItem('lc_quality','high');localStorage.setItem('lc_menuScene','-1');});
 await p.goto(URL+NEW);await p.waitForTimeout(3000);const cs=await p.context().newCDPSession(p);await cs.send('Performance.enable');
 const rows=[];let last=await p.evaluate(()=>({s:MD.steps,f:MD.frames}));
 for(let m=1;m<=MINS;m++){await p.waitForTimeout(60000);
  const r=await p.evaluate(()=>{if(window.gc)gc();const G=MD.G;return {scene:G?MMS[MD.i].id:null,builds:MD.builds,disposed:MD.disposed,heapMB:+(performance.memory.usedJSHeapSize/1048576).toFixed(2),
    units:G?G.units.length:0,enemies:G?G.enemies.length:0,bullets:G?G.bullets.length:0,fx:G?G.fx.length:0,decals:G?G.decals.length:0,blocks:G?G.blocks.size:0,
    leftovers:VEHW.length+ANTDIE.length+PODFX.length+PINGS.length+WFX.length,webChunks:webCk.filter(Boolean).length,map:MW+'x'+MH,s:MD.steps,f:MD.frames,live:!!G,noVideo:MMB.noVideo,why:MD.why};});
  const M=await cs.send('Performance.getMetrics');r.nodes=(M.metrics.find(x=>x.name==='Nodes')||{}).value;r.stepsPerSec=+((r.s-last.s)/60).toFixed(1);r.framesPerSec=+((r.f-last.f)/60).toFixed(1);last={s:r.s,f:r.f};r.min=m;
  delete r.s;delete r.f;rows.push(r);console.log(JSON.stringify(r));}
 const first=rows.slice(0,Math.min(10,rows.length)),lastR=rows.slice(-Math.min(10,rows.length)),avg=(a,k)=>a.reduce((s,r)=>s+r[k],0)/a.length,mx=(a,k)=>Math.max(...a.map(r=>r[k]));
 const res={minutes:MINS,heapFirst10:+avg(first,'heapMB').toFixed(2),heapLast10:+avg(lastR,'heapMB').toFixed(2),heapMax:mx(rows,'heapMB'),nodesFirst:rows[0].nodes,nodesLast:rows[rows.length-1].nodes,
   maxUnits:mx(rows,'units'),maxBullets:mx(rows,'bullets'),maxFx:mx(rows,'fx'),maxLeftovers:mx(rows,'leftovers'),maxWebChunks:mx(rows,'webChunks'),scenesBuilt:rows[rows.length-1].builds,
   minStepsPerSec:Math.min(...rows.map(r=>r.stepsPerSec)),minFramesPerSec:Math.min(...rows.map(r=>r.framesPerSec)),stillLive:rows[rows.length-1].live,errors:errs.length,rows};
 const pass=res.heapLast10-res.heapFirst10<4&&Math.abs(res.nodesLast-res.nodesFirst)<60&&res.maxUnits<=10&&res.maxBullets<=70&&res.maxFx<=90&&res.stillLive&&!errs.length&&res.minStepsPerSec>=27;
 res.pass=pass;fs.writeFileSync(OUT,JSON.stringify(res,null,1));console.log(pass?'ALL PASS':'FAIL',JSON.stringify({...res,rows:undefined}));await br.close();process.exit(pass?0:1);})();
