// v59 cost of the main menu: processor time and memory over a quiet stretch on the menu for the v58 menu with its recorded clips (OLD),
// each v59 live scene, the v59 menu with the background still, and a Survival battle for comparison. Processor time is summed over every
// Chromium process (page, GPU) from SystemInfo.getProcessInfo; 100% is one core. Headless Chromium draws in software here, so these
// figures are an upper bound for a computer with a graphics card. Writes perf59.json (OUT).
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html',OLD=process.env.OLD||'_v58.html',SECS=+(process.env.SECS||12),OUT=process.env.OUT||'perf59.json';
(async()=>{const br=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const bs=await br.newBrowserCDPSession();const res={};
 const cpu=async()=>{const r=await bs.send('SystemInfo.getProcessInfo');const by={};let all=0;for(const p of r.processInfo){by[p.type]=(by[p.type]||0)+p.cpuTime;all+=p.cpuTime;}return {all,by};};
 const run=async(tag,page,o={})=>{const ctx=await br.newContext({viewport:{width:1920,height:1080}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(([still,o])=>{try{localStorage.clear();localStorage.setItem('lc_quality','high');if(still)localStorage.setItem('lc_menubg','0');localStorage.setItem('lc_menuScene',String(o.scene==null?3:o.scene-1));}catch(e){}
    window.__t0=performance.now();addEventListener('playing',()=>{if(!window.__tplay)window.__tplay=performance.now();},true);},[!!o.still,o]);
  const t0=Date.now();await p.goto(URL+page);
  const ttm=await p.evaluate(async()=>{for(let i=0;i<200&&($('overlay').hidden||!$('m-campaign').onclick);i++)await new Promise(r=>setTimeout(r,25));return performance.now();});
  await p.waitForTimeout(4000);
  if(o.battle)await p.evaluate(()=>{let q=3;Math.random=()=>(q=(q*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.speed=1;
    const cx=G.core.x,cy=G.core.y;for(const t of ['duo','duo','duo','hail','lancer'])for(let k=0;k<4;k++){tryPlace(t,cx-6+k*3,cy+(['duo','hail','lancer'].indexOf(t)+1)*3-9,0,true);}
    for(const b of G.blocks.values())b.built=1;G.items=G.items.map(v=>v+9999);for(let k=0;k<60;k++){const e=spawnEnemy(['dagger','mace','fortress','crawler'][k%4]);e.x=cx+14+(k%8);e.y=cy-6+(k>>3)*1.6;}
    $('msg')&&($('msg').style.display='none');});
  if(o.battle)await p.waitForTimeout(1500);
  const cs=await p.context().newCDPSession(p);await cs.send('Performance.enable');
  const m0=await cs.send('Performance.getMetrics'),c0=await cpu(),w0=Date.now();await p.waitForTimeout(SECS*1000);const m1=await cs.send('Performance.getMetrics'),c1=await cpu(),wall=(Date.now()-w0)/1000;
  const M=(m,k)=>(m.metrics.find(x=>x.name===k)||{}).value||0;
  const live=await p.evaluate(()=>window.MD?{scene:MD.G?MMS[MD.i].id:null,steps:MD.steps,frames:MD.frames,workMs:+MD.work.toFixed(2),buildMs:MD.buildMs,map:MW+'x'+MH,units:MD.G?MD.G.units.length:0,enemies:MD.G?MD.G.enemies.length:0,blocks:MD.G?MD.G.blocks.size:0}:null);
  const info=await p.evaluate(()=>({tplay:window.__tplay||null,videos:document.querySelectorAll('video').length,frames:(()=>{const v=document.querySelector('#mmBg video');return v&&v.getVideoPlaybackQuality?v.getVideoPlaybackQuality():null;})()}));
  const by={};for(const k of Object.keys(c1.by))by[k]=+(100*(c1.by[k]-(c0.by[k]||0))/wall).toFixed(1);
  res[tag]={timeToMenuMs:Math.round(ttm),firstClipMs:info.tplay&&Math.round(info.tplay),cpuPercentAllProcesses:+(100*(c1.all-c0.all)/wall).toFixed(1),cpuPercentByProcess:by,
    pageTaskPercent:+(100*(M(m1,'TaskDuration')-M(m0,'TaskDuration'))/wall).toFixed(1),jsHeapMB:+(M(m1,'JSHeapUsedSize')/1048576).toFixed(1),domNodes:M(m1,'Nodes'),
    videos:info.videos,droppedFrames:info.frames&&info.frames.droppedVideoFrames,totalFrames:info.frames&&info.frames.totalVideoFrames,errors:errs.length,live};
  console.log(tag,JSON.stringify(res[tag]));await ctx.close();};
 if(fs.existsSync(OLD))await run('v58 menu, recorded clip (Human Frontier)',OLD);
 for(const [i,n] of [[0,'Living Factory'],[1,'First Contact'],[2,'Fortress Assault'],[3,'Human Frontier']])await run('v59 live scene: '+n,NEW,{scene:i});
 await run('v59 menu, still background',NEW,{still:true});
 await run('Survival battle, 60 machines and 20 guns',NEW,{battle:true});
 fs.writeFileSync(OUT,JSON.stringify(res,null,1));await br.close();})();
