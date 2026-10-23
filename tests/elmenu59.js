// v59 in the packaged Linux desktop app under a virtual display: the title beats (the Bloom contracts, with the lub and dub decoded from
// the app's files), a key runs the two-second tendril transition onto the menu, the menu runs a live scene stepping 30 times a second
// and drawing at most 30 frames, the version shows at the foot, Quit is there, scenes change, and a game lets the scene go. Then the
// app's own figures for processor and memory: a calm live scene, the battle scene, the menu with the background still, and a Survival
// battle. With OLD=1 it only measures the menu of an older build (LC_APP) that played recorded clips. Writes OUT (JSON) when set.
const {_electron}=require(process.env.PW||'playwright');const path=require('path'),os=require('os'),fs=require('fs');
const APP=process.env.LC_APP||path.join(__dirname,'../electron/out/Last Colony-linux-x64/Last Colony'),OLD=!!process.env.OLD,SECS=+(process.env.SECS||10);
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
(async()=>{const cfg=fs.mkdtempSync(path.join(os.tmpdir(),'lccfg-'));
 const app=await _electron.launch({executablePath:APP,args:['--no-sandbox'],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',XDG_CONFIG_HOME:cfg}});
 const w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));
 await w.waitForFunction(()=>{try{return !!MMB&&!!SPL&&typeof $==='function';}catch(e){return false;}});
 const metrics=async(secs)=>{await app.evaluate(({app})=>app.getAppMetrics());await w.waitForTimeout(secs*1000);const M=await app.evaluate(({app})=>app.getAppMetrics());
   let cpu=0,mem=0;const by={};for(const m of M){cpu+=m.cpu.percentCPUUsage;mem+=m.memory.workingSetSize;by[m.type]=+((by[m.type]||0)+m.cpu.percentCPUUsage).toFixed(1);}return {cpuPercent:+cpu.toFixed(1),memoryMB:Math.round(mem/1024),byProcess:by};};
 await w.evaluate(async()=>{for(let i=0;i<100&&!$('splash').classList.contains('ready');i++)await new Promise(r=>setTimeout(r,100));});
 const perf={};
 if(OLD){await w.keyboard.press('Enter');await w.waitForFunction(()=>!SPL.on,null,{timeout:15000}).catch(()=>{});await w.waitForTimeout(3000);
   const v=await w.evaluate(()=>({top:MMB.el&&MMB.el.tagName,id:MMB.el&&MMB.el.dataset.id,ver:$('mmVer').textContent}));perf.menuClip={...v,...await metrics(SECS)};
   console.log('older build, menu with its recorded clip',JSON.stringify(perf));if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(perf,null,1));await app.close();process.exit(0);}
 // ---- the title's heartbeat, from the app's files
 const hb=await w.evaluate(async()=>{for(let i=0;i<60&&!(SND.ready&&SND.buf.title_lub_0);i++)await new Promise(r=>setTimeout(r,100));const b0=SPL.beats||0;SPL.nextPulse=.1;let most=0;
   for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,25));most=Math.max(most,SPL.hbA||0);}
   return {beats:(SPL.beats||0)-b0,most:+most.toFixed(3),lub:!!SND.buf.title_lub_0,dub:!!SND.buf.title_dub_0,open:!!SND.buf.title_open,proto:location.protocol,held:mmState(),live:!!MD.G};});
 ok('the title beats: the Bloom contracts 3 to 5%, with the lub, dub and transition sounds decoded from the app\'s files; the menu\'s scene waits underneath',
   hb.beats>=1&&hb.most>=.025&&hb.most<=.051&&hb.lub&&hb.dub&&hb.open&&hb.proto==='file:'&&hb.held==='hold'&&hb.live,JSON.stringify(hb));
 // ---- the transition
 await w.keyboard.press('Enter');const t0=Date.now();
 const tr=await w.evaluate(async()=>{let n=0;for(let i=0;i<100&&!SPL.vine;i++)await new Promise(r=>setTimeout(r,10));n=SPL.vine?SPL.vine.T.length:0;const snd=!!(SPL.vine&&SPL.vine.snd);
   while(SPL.on)await new Promise(r=>setTimeout(r,20));const fr=SPL.vfr||[],before=fr.filter(t=>t<SPL.swapT-.002);return {n,snd,swap:SPL.swapT&&+SPL.swapT.toFixed(2),frameBefore:before.length?before[before.length-1]:0,frames:fr.length,last:fr[fr.length-1]};});
 const dt=(Date.now()-t0)/1000;
 ok('a key grows the tendrils (heard), puts the menu underneath on the first frame after full cover, and finishes on the wall clock by about 2.2 seconds',tr.n>=5&&tr.snd&&tr.swap>=.9&&tr.frameBefore<.9&&tr.last>=2.05&&tr.last<=2.6&&dt<=2.8,JSON.stringify({...tr,seconds:dt}));
 await w.waitForTimeout(2500);
 const m=await w.evaluate(async()=>{const a=[MD.steps,MD.frames];await new Promise(r=>setTimeout(r,3000));
   return {live:!!MD.G,id:MD.G&&MMS[MD.i].id,map:MW+'x'+MH,sps:+((MD.steps-a[0])/3).toFixed(1),fps:+((MD.frames-a[1])/3).toFixed(1),ver:$('mmVer').textContent,quit:!$('m-quit').hidden,game:!!window.__game(),focus:document.activeElement.id};});
 ok('the menu runs a live 36×22 scene at 30 steps and at most 30 frames a second, the version and Quit show, and nothing of it is the game',
   m.live&&m.map==='36x22'&&Math.abs(m.sps-30)<=2.5&&m.fps<=31&&m.fps>=20&&m.ver==='v'+require('../electron/package.json').version&&m.quit&&!m.game&&m.focus==='m-campaign',JSON.stringify(m));
 await w.screenshot({path:process.env.SHOT||'elmenu59.png'});
 // ---- figures: a calm scene, the battle, still, and a real battle
 perf.liveFactory={scene:m.id,...await metrics(SECS)};
 await w.evaluate(()=>mmShow(2));await w.waitForTimeout(2500);perf.liveAssault={scene:await w.evaluate(()=>MD.G&&MMS[MD.i].id),...await metrics(SECS)};
 const r=await w.evaluate(async()=>{MMB.secs=3;await new Promise(r=>setTimeout(r,7500));const s=MMB.shown.slice();MMB.secs=45;return s;});
 ok('scenes change in the desktop app too',r.length>=3,r.join());
 await w.evaluate(()=>mmSetMoving(false));await w.waitForTimeout(1500);const st=await w.evaluate(()=>({live:!!MD.G,steps:MD.steps}));perf.menuStill=await metrics(SECS);
 const st2=await w.evaluate(()=>MD.steps);ok('Moving menu background off: no world and nothing stepping',!st.live&&st2===st.steps,JSON.stringify({...st,after:st2}));
 await w.evaluate(()=>mmSetMoving(true));await w.waitForTimeout(1500);
 await w.evaluate(()=>{let q=3;Math.random=()=>(q=(q*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();const cx=G.core.x,cy=G.core.y;
   for(let k=0;k<60;k++){const e=spawnEnemy(['dagger','mace','fortress','crawler'][k%4]);e.x=cx+14+(k%8);e.y=cy-6+(k>>3)*1.6;}});
 await w.waitForTimeout(1500);const g=await w.evaluate(()=>({md:!!MD.G,game:!!window.__game(),map:MW+'x'+MH,demo:!!window.__game().demo}));perf.battle=await metrics(SECS);
 ok('a game lets the scene go and is a normal full-size game',!g.md&&g.game&&g.map==='96x96'&&!g.demo,JSON.stringify(g));
 ok('no errors',!errs.length,errs[0]);
 console.log('desktop app processor and memory',JSON.stringify(perf));
 if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(perf,null,1));
 console.log(fails?fails+' FAILED':'ALL PASS');await app.close();process.exit(fails?1:0);})();
