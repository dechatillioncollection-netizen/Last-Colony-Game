// v48 in the Windows app (Electron, loaded from file://): a new campaign plays the intro from the app folder with no network, its sounds decode
// and play through the mixer, Skip starts Landfall's Root-Link opening once, and Replay intro returns to the planet with the campaign unchanged
const {_electron}=require('/opt/node22/lib/node_modules/playwright');
const launch=()=>_electron.launch({executablePath:__dirname+'/elx/electron',args:['--no-sandbox',__dirname+'/exe/out/Last Colony-win32-x64/resources/app']});
const rms=w=>w.evaluate(async()=>{const a=__snd.bus.meter,b=new Float32Array(a.fftSize);let s=0,n=0,pk=0;for(let i=0;i<20;i++){a.getFloatTimeDomainData(b);for(const v of b){s+=v*v;n++;pk=Math.max(pk,Math.abs(v));}await new Promise(r=>setTimeout(r,50));}return {rms:+Math.sqrt(s/n).toFixed(4),peak:+pk.toFixed(3)};});
(async()=>{const app=await launch();const w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));await w.waitForTimeout(2500);
 await w.mouse.click(8,8);
 // a brand-new campaign, as on first install
 await w.evaluate(async()=>{if(DLG.open){DLG.done=null;closeDlg();}G=null;CAMP=freshCamp();await saveCamp();window.__plays=[];const ps=playStory;playStory=function(k){__plays.push(k.join('+'));return ps.apply(this,arguments);};});
 await w.evaluate(()=>{openPlanet();});await w.waitForTimeout(600);await w.click('#launch');await w.waitForTimeout(400);
 const start=await w.evaluate(()=>({url:location.protocol,on:INTRO.on,mode:INTRO.mode,s:G.story.s,dlg:DLG.open}));
 await w.evaluate(()=>{introSeek(12.5);INTRO.hold=false;});await w.waitForTimeout(2500);
 const snd=await w.evaluate(()=>({beds:Object.keys(INTRO.beds),buf:Object.keys(__snd.buf).filter(k=>k.startsWith('intro_')).length,state:__snd.ctx.state}));const lvl=await rms(w);
 await w.screenshot({path:'el_v48_intro.png'});
 await w.keyboard.press('Escape');await w.waitForTimeout(900);
 const after=await w.evaluate(()=>({on:INTRO.on,dlg:DLG.open,chan:DLG.seq&&DLG.seq.chan,plays:__plays.slice(),time:+G.time.toFixed(3),cd:G.countdown,flag:CAMP.flags.intro}));
 await w.screenshot({path:'el_v48_handoff.png'});
 // Replay intro from the planet screen: the campaign is not changed
 await w.evaluate(()=>{while(DLG.open)skipDlg();G=null;openPlanet();});await w.waitForTimeout(500);const before=await w.evaluate(()=>{const j=JSON.parse(campToJSON(CAMP));delete j.last;return JSON.stringify(j);});
 await w.click('#pIntro');await w.waitForTimeout(500);const rep=await w.evaluate(()=>({on:INTRO.on,mode:INTRO.mode}));await w.keyboard.press('Escape');await w.waitForTimeout(900);
 const back=await w.evaluate(()=>{const j=JSON.parse(campToJSON(CAMP));delete j.last;return {planet:!$('planet').hidden,G:!!G,on:INTRO.on,camp:JSON.stringify(j)};});
 await app.close();
 const res={start,snd,lvl,after,rep,back:{...back,camp:back.camp===before},errs};console.log(JSON.stringify(res));
 const ok=start.url==='file:'&&start.on&&start.mode==='first'&&start.s==='intro'&&!start.dlg&&snd.buf>=7&&snd.beds.length>0&&snd.state==='running'&&lvl.rms>.002&&
   !after.on&&after.dlg&&/ROOT-LINK/.test(after.chan)&&after.plays.join()==='l_intro'&&after.time<.05&&after.cd===150&&after.flag===1&&rep.on&&rep.mode==='replay'&&back.planet&&!back.G&&!back.on&&back.camp===before&&errs.length===0;
 console.log(ok?'PASS the Windows app plays the intro offline with its sound, skips into Landfall once and replays without changing the campaign':'FAIL Windows app intro');process.exit(ok?0:1);})();
