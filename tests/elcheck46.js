// v46 in the Windows app (Electron, loaded from file://): the sounds load from the app folder with no network, play after the first click,
// a fight is audible through the mixer, the audio settings apply and are still there when the app is opened again
const {_electron}=require('/opt/node22/lib/node_modules/playwright');
const launch=()=>_electron.launch({executablePath:__dirname+'/elx/electron',args:['--no-sandbox',__dirname+'/exe/out/Last Colony-win32-x64/resources/app']});
const rms=w=>w.evaluate(async()=>{const a=__snd.bus.meter,b=new Float32Array(a.fftSize);let s=0,n=0,pk=0;for(let i=0;i<20;i++){a.getFloatTimeDomainData(b);for(const v of b){s+=v*v;n++;pk=Math.max(pk,Math.abs(v));}await new Promise(r=>setTimeout(r,50));}return {rms:+Math.sqrt(s/n).toFixed(4),peak:+pk.toFixed(3)};});
(async()=>{let app=await launch();let w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));await w.waitForTimeout(2500);
 const before=await w.evaluate(()=>({url:location.protocol,ready:!!(window.__snd&&__snd.ready),ctx:!!(window.__snd&&__snd.ctx)}));
 await w.mouse.click(8,8);for(let i=0;i<80;i++){if(await w.evaluate(()=>__snd.ready))break;await w.waitForTimeout(200);}
 const load=await w.evaluate(()=>({ready:__snd.ready,n:Object.keys(__snd.buf||{}).length,state:__snd.ctx.state,ua:navigator.userAgent.match(/Electron\/[\d.]+/)[0]}));
 await w.evaluate(()=>{if(DLG.open){DLG.done=null;closeDlg();}startGame('survival');const G=window.__game();G.countdown=1e9;const cx=G.core.x+1.5,cy=G.core.y+1.5;
   for(let k=0;k<18;k++)spawnUnit(['mite','tank','htank'][k%3],cx+3+(k%6)*.8,cy-2+Math.floor(k/6)*.9);for(let k=0;k<5;k++){const e=spawnEnemy('dagger');e.x=cx+9;e.y=cy-2+k;}setCommand('attack');centerOn(cx+4,cy);});
 await w.waitForTimeout(3000);const fight=await rms(w);const played=await w.evaluate(()=>__snd.stats.played);
 await w.evaluate(()=>{openSettings();const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input'));e.dispatchEvent(new Event('change'));};set('vol_m',55);set('vol_s',40);set('vol_a',75);});
 await w.waitForTimeout(400);const eff=await w.evaluate(()=>({vol:{...__snd.vol},gm:+__snd.bus.master.gain.value.toFixed(3)}));
 await w.evaluate(()=>{const e=document.getElementById('optMute');e.checked=true;e.dispatchEvent(new Event('change'));});await w.waitForTimeout(400);const muted=await rms(w);
 await w.evaluate(()=>{const e=document.getElementById('optMute');e.checked=false;e.dispatchEvent(new Event('change'));});await w.waitForTimeout(300);
 await w.screenshot({path:'el_v46.png'});await app.close();
 app=await launch();w=await app.firstWindow();w.on('pageerror',e=>errs.push(e.message));await w.waitForTimeout(2500);
 const again=await w.evaluate(()=>{openSettings();return {vol:{...__snd.vol},ui:['vol_m','vol_s','vol_a'].map(i=>[+document.getElementById(i).value,document.getElementById('volv_'+i.slice(4)).textContent])};});
 await w.screenshot({path:'el_v46_settings.png'});await app.close();
 const res={before,load,fight,played,eff,muted,again,errs};console.log(JSON.stringify(res));
 const ok=before.url==='file:'&&load.ready&&load.n>=145&&load.state==='running'&&fight.rms>.01&&played>5&&Math.abs(eff.gm-.55)<.01&&muted.peak===0&&again.vol.m===.55&&again.vol.s===.4&&again.vol.a===.75&&!again.vol.mute&&errs.length===0;
 console.log(ok?'PASS the Windows app loads, plays, mixes and remembers the audio settings':'FAIL Windows app audio');process.exit(ok?0:1);})();
