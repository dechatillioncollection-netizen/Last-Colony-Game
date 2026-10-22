// v52 in the packaged Linux desktop app under a virtual display: the painted vehicles load from the app's files, draw and fire with no errors
const {_electron}=require(process.env.PW||'playwright');const path=require('path'),os=require('os'),fs=require('fs');
const APP=process.env.LC_APP||path.join(__dirname,'../electron/out/Last Colony-linux-x64/Last Colony');
(async()=>{const cfg=fs.mkdtempSync(path.join(os.tmpdir(),'lccfg-'));
 const app=await _electron.launch({executablePath:APP,args:['--no-sandbox'],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',XDG_CONFIG_HOME:cfg}});
 const w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));await w.waitForTimeout(3500);
 const r=await w.evaluate(()=>{startGame('survival');const G=window.__game();G.countdown=1e9;G.paused=true;
   ['dagger','crawler','mace','fortress'].forEach((t,i)=>{const e=spawnEnemy(t,i===3);e.x=G.core.x+10+i*2.6;e.y=G.core.y;});
   cam.z=2.2;centerOn(G.core.x+14,G.core.y);for(let i=0;i<20;i++){step(1/30);render();}
   const e=G.enemies.find(e=>e.t==='dagger');enemyFireAt(e,e.x-4,e.y,null,null);render();
   return {proto:location.protocol,states:Object.fromEntries(Object.entries(ART.hdfv).map(([k,a])=>[k,a.state])),on:G.enemies.every(e=>!!vehOn(e)),ver:lcDesktop.version};});
 await w.screenshot({path:process.env.SHOT||'elveh52.png'});
 const ok=r.proto==='file:'&&Object.values(r.states).every(s=>s==='ready')&&r.on&&!errs.length;
 console.log(ok?'PASS':'FAIL','painted vehicles in the desktop app',JSON.stringify(r),errs.slice(0,2));await app.close();process.exit(ok?0:1);})();
