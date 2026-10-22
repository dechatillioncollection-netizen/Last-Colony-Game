// v54 in the packaged Linux desktop app under a virtual display: the painted HDF turrets load from the app's files, draw and fire with no errors
const {_electron}=require(process.env.PW||'playwright');const path=require('path'),os=require('os'),fs=require('fs');
const APP=process.env.LC_APP||path.join(__dirname,'../electron/out/Last Colony-linux-x64/Last Colony');
(async()=>{const cfg=fs.mkdtempSync(path.join(os.tmpdir(),'lccfg-'));
 const app=await _electron.launch({executablePath:APP,args:['--no-sandbox'],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',XDG_CONFIG_HOME:cfg}});
 const w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));await w.waitForTimeout(3500);
 const r=await w.evaluate(()=>{let s=11;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;if(typeof introSkip==='function')try{introSkip();}catch(e){}while(DLG.open)skipDlg();startTestRange();const G=window.__game();G.paused=true;G.test.cur=1;document.getElementById('testPanel').classList.add('min');
   const L=[...G.blocks.values()].filter(b=>b.team===1&&TUR[b.t]&&arenaAt(b.x,b.y)===1),on=L.every(b=>!!turOn(b.t)),F=new Set();
   G.test.count=10;testSpawn('u','htank');testSpawn('u','tank');for(let i=0;i<750;i++){step(1/30);for(const b of L)if(b.shot!=null||b.charge>0)F.add(b.t);if(i%10===0)render();}
   cam.z=1.6;cam.x=72*T-innerWidth/2/cam.z;cam.y=56*T-innerHeight/2/cam.z;render();
   return {proto:location.protocol,states:Object.fromEntries(Object.entries(ART.hdft).map(([k,a])=>[k,a.state])),on,
     fired:[...F].sort().join(),n:L.length,ver:lcDesktop.version};});
 await w.screenshot({path:process.env.SHOT||'elturret54.png'});
 const ok=r.proto==='file:'&&Object.values(r.states).every(s=>s==='ready')&&r.on&&r.n===5&&/duo/.test(r.fired)&&/hail/.test(r.fired)&&/lancer/.test(r.fired)&&!errs.length;
 console.log(ok?'PASS':'FAIL','painted turrets in the desktop app',JSON.stringify(r),errs.slice(0,2));await app.close();process.exit(ok?0:1);})();
