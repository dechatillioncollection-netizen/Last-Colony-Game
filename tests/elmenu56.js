// v56 in the packaged Linux desktop app under a virtual display: the menu clips load from the app's own files and play behind the title
// screen's fade; the version shows at the foot of the menu; Quit is there; the clips change; a game lets them go. Then the app's own
// figures for processor and memory: on the menu with the moving background, with it still, and in a Survival battle.
const {_electron}=require(process.env.PW||'playwright');const path=require('path'),os=require('os'),fs=require('fs');
const APP=process.env.LC_APP||path.join(__dirname,'../electron/out/Last Colony-linux-x64/Last Colony');
(async()=>{const cfg=fs.mkdtempSync(path.join(os.tmpdir(),'lccfg-'));
 const app=await _electron.launch({executablePath:APP,args:['--no-sandbox'],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',XDG_CONFIG_HOME:cfg}});
 const w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));const t0=Date.now();
 await w.waitForFunction(()=>{try{return !!MMB&&!!SPL&&typeof $==='function';}catch(e){return false;}});
 const a=await w.evaluate(async()=>{for(let i=0;i<80&&!$('splash').classList.contains('ready');i++)await new Promise(r=>setTimeout(r,100));
   const v=MMB.el;return {ready:$('splash').classList.contains('ready'),proto:location.protocol,top:v&&v.tagName,src:v&&v.currentSrc,paused:v&&v.paused};});
 const tReady=Date.now()-t0;
 await w.keyboard.press('Enter');await w.waitForTimeout(2500);
 const b=await w.evaluate(()=>{const v=MMB.el;return {splash:!$('splash').hidden,top:v&&v.tagName,playing:!!v&&!v.paused&&v.readyState>=2,src:v&&v.currentSrc,ver:$('mmVer').textContent,quit:!$('m-quit').hidden,mm:$('overlay').classList.contains('mm')};});
 await w.screenshot({path:process.env.SHOT||'elmenu56.png'});
 const metrics=async(secs)=>{await app.evaluate(({app})=>app.getAppMetrics());await w.waitForTimeout(secs*1000);const M=await app.evaluate(({app})=>app.getAppMetrics());
   let cpu=0,mem=0;const by={};for(const m of M){cpu+=m.cpu.percentCPUUsage;mem+=m.memory.workingSetSize;by[m.type]=+((by[m.type]||0)+m.cpu.percentCPUUsage).toFixed(1);}return {cpuPercent:+cpu.toFixed(1),memoryMB:Math.round(mem/1024),byProcess:by};};
 const perf={};perf.menuMoving=await metrics(8);
 const r=await w.evaluate(async()=>{MMB.secs=3;await new Promise(r=>setTimeout(r,4500));const s=MMB.shown.slice();MMB.secs=30;return s;});
 await w.evaluate(()=>mmSetMoving(false));await w.waitForTimeout(1500);perf.menuStill=await metrics(8);await w.evaluate(()=>mmSetMoving(true));
 await w.evaluate(()=>{let q=3;Math.random=()=>(q=(q*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();const cx=G.core.x,cy=G.core.y;
   for(let k=0;k<60;k++){const e=spawnEnemy(['dagger','mace','fortress','crawler'][k%4]);e.x=cx+14+(k%8);e.y=cy-6+(k>>3)*1.6;}});
 await w.waitForTimeout(1500);const g=await w.evaluate(()=>({videos:document.querySelectorAll('video').length,game:!!window.__game()}));perf.battle=await metrics(8);
 const ok=a.ready&&a.proto==='file:'&&a.top==='VIDEO'&&a.paused&&/art\/menu\/\w+\.webm$/.test(a.src)&&!b.splash&&b.playing&&/^v\d/.test(b.ver)&&b.quit&&b.mm&&r.length>=2&&g.game&&g.videos===0&&!errs.length;
 console.log(ok?'PASS':'FAIL','the menu background in the desktop app',JSON.stringify({a,tReadyMs:tReady,b,rotation:r,g}),errs.slice(0,2));
 console.log('desktop app processor and memory',JSON.stringify(perf));
 if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify({tReadyMs:tReady,...perf},null,1));
 await app.close();process.exit(ok?0:1);})();
